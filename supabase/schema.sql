-- 非鹅勿扰漂流瓶 · Supabase Schema v1
-- 醒来后到 Supabase Dashboard → SQL Editor 粘贴执行
-- Project: feiewurao (xarpwuvsbmytbbauktlm)
--
-- 这个脚本是幂等的：可重复执行，老表会被 DROP（确认你不在乎旧 dating 数据后再跑）

------------------------------------------------------------
-- 0. 老 36 问 dating 数据（如果存在）改名归档
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='answers') THEN
    ALTER TABLE public.answers RENAME TO _legacy_answers;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='guests') THEN
    ALTER TABLE public.guests RENAME TO _legacy_guests;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='light_records') THEN
    ALTER TABLE public.light_records RENAME TO _legacy_light_records;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='light_actions') THEN
    ALTER TABLE public.light_actions RENAME TO _legacy_light_actions;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='light_notifications') THEN
    ALTER TABLE public.light_notifications RENAME TO _legacy_light_notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='matches') THEN
    ALTER TABLE public.matches RENAME TO _legacy_matches;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_question_assignments') THEN
    ALTER TABLE public.daily_question_assignments RENAME TO _legacy_daily_question_assignments;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='page_views') THEN
    ALTER TABLE public.page_views RENAME TO _legacy_page_views;
  END IF;
  -- 老 users 表如果列结构不对（没有 bottle_no），归档
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='bottle_no'
  ) THEN
    ALTER TABLE public.users RENAME TO _legacy_users;
  END IF;
END$$;

------------------------------------------------------------
-- 1. users（沿用 Supabase auth.users，public.users 存 profile）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  bottle_no text UNIQUE NOT NULL,
  avatar_color text NOT NULL CHECK (avatar_color IN ('c1','c2','c3','c4','c5','c6','c7','c8')),
  created_at timestamptz DEFAULT now(),
  banned_at timestamptz
);

------------------------------------------------------------
-- 2. bottles
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bottles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  mood text NOT NULL CHECK (mood IN ('开心','兴奋','有灵感','被治愈','想聊','摸鱼','发呆','emo','加班','想吐槽')),
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','taken','reported','deleted')),
  picked_by uuid REFERENCES public.users(id),
  picked_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_bottles_status ON public.bottles(status) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_bottles_user ON public.bottles(user_id);

------------------------------------------------------------
-- 3. conversations（捞瓶后回信成立 conversation）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id uuid NOT NULL REFERENCES public.bottles(id),
  user_a uuid NOT NULL REFERENCES public.users(id), -- 扔瓶人
  user_b uuid NOT NULL REFERENCES public.users(id), -- 捞瓶并回信的人
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  ended_by uuid REFERENCES public.users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conv_bottle ON public.conversations(bottle_id);
CREATE INDEX IF NOT EXISTS idx_conv_user_a ON public.conversations(user_a);
CREATE INDEX IF NOT EXISTS idx_conv_user_b ON public.conversations(user_b);

------------------------------------------------------------
-- 4. messages
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  reply_mood text CHECK (reply_mood IS NULL OR reply_mood IN ('同感','抱抱','陪你','听着','打气','路过','冒泡','辛苦')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON public.messages(conversation_id, created_at);

------------------------------------------------------------
-- 5. blocks
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker, blocked)
);

------------------------------------------------------------
-- 6. reports
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter uuid NOT NULL REFERENCES public.users(id),
  bottle_id uuid REFERENCES public.bottles(id),
  message_id uuid REFERENCES public.messages(id),
  reason text NOT NULL CHECK (reason IN ('harass','sensitive','porn','spam','leak','other')),
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed'))
);

------------------------------------------------------------
-- 7. quotas（每日扔/捞额度）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotas (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  thrown int NOT NULL DEFAULT 0 CHECK (thrown BETWEEN 0 AND 3),
  picked int NOT NULL DEFAULT 0 CHECK (picked BETWEEN 0 AND 3),
  PRIMARY KEY (user_id, date)
);

------------------------------------------------------------
-- 8. 触发器：用户注册时自动建 profile
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  no text;
  color text;
BEGIN
  -- 强制 @tencent.com
  IF NEW.email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION 'only tencent.com email allowed';
  END IF;
  -- 生成 4 位随机编号（最多重试 5 次）
  FOR i IN 1..5 LOOP
    no := lpad(floor(random() * 10000)::int::text, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no) THEN
      EXIT;
    END IF;
    no := NULL;
  END LOOP;
  IF no IS NULL THEN
    RAISE EXCEPTION 'failed to allocate bottle_no';
  END IF;

  color := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];

  INSERT INTO public.users (id, email, bottle_no, avatar_color)
  VALUES (NEW.id, NEW.email, no, color);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

------------------------------------------------------------
-- 9. 业务 RPC
------------------------------------------------------------
-- 9.1 throw_bottle：扔瓶（带额度检查 + 敏感词检查放后端 Edge Function）
CREATE OR REPLACE FUNCTION public.throw_bottle(p_content text, p_mood text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
  bottle_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  -- 额度检查
  INSERT INTO quotas (user_id, date, thrown, picked) VALUES (uid, today, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  IF (SELECT thrown FROM quotas WHERE user_id = uid AND date = today) >= 3 THEN
    RAISE EXCEPTION 'daily throw quota exceeded';
  END IF;
  -- 写瓶子
  INSERT INTO bottles (user_id, content, mood) VALUES (uid, p_content, p_mood)
  RETURNING id INTO bottle_id;
  UPDATE quotas SET thrown = thrown + 1 WHERE user_id = uid AND date = today;
  RETURN bottle_id;
END;
$$;

-- 9.2 pick_bottle：随机捞瓶（排除自己/已被自己捞过/已成瓶友/已拉黑/被举报）
CREATE OR REPLACE FUNCTION public.pick_bottle()
RETURNS TABLE (id uuid, content text, mood text, author_no text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  -- 额度检查
  INSERT INTO quotas (user_id, date, thrown, picked) VALUES (uid, today, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  IF (SELECT picked FROM quotas WHERE user_id = uid AND date = today) >= 3 THEN
    RAISE EXCEPTION 'daily pick quota exceeded';
  END IF;

  RETURN QUERY
  WITH chosen AS (
    SELECT b.id, b.content, b.mood, u.bottle_no AS author_no, b.created_at
    FROM bottles b
    JOIN users u ON u.id = b.user_id
    WHERE b.status = 'active'
      AND b.user_id != uid
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker = uid AND blocked = b.user_id)
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker = b.user_id AND blocked = uid)
      AND NOT EXISTS (SELECT 1 FROM conversations c WHERE
            (c.user_a = uid AND c.user_b = b.user_id) OR
            (c.user_b = uid AND c.user_a = b.user_id))
      AND b.id NOT IN (SELECT bottle_id FROM conversations WHERE user_b = uid)
    ORDER BY random()
    LIMIT 1
  )
  UPDATE bottles SET status = 'taken', picked_by = uid, picked_at = now()
  WHERE bottles.id = (SELECT id FROM chosen)
  RETURNING bottles.id, bottles.content, bottles.mood, (SELECT author_no FROM chosen), bottles.created_at;

  -- 增加额度
  UPDATE quotas SET picked = picked + 1 WHERE user_id = uid AND date = today;
END;
$$;

-- 9.3 submit_reply：回信 → 建 conversation + 发首条消息
CREATE OR REPLACE FUNCTION public.submit_reply(p_bottle_id uuid, p_content text, p_reply_mood text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  bottle_owner uuid;
  conv_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT user_id INTO bottle_owner FROM bottles WHERE id = p_bottle_id;
  IF bottle_owner IS NULL THEN RAISE EXCEPTION 'bottle not found'; END IF;
  IF bottle_owner = uid THEN RAISE EXCEPTION 'cannot reply to own bottle'; END IF;

  INSERT INTO conversations (bottle_id, user_a, user_b)
  VALUES (p_bottle_id, bottle_owner, uid)
  RETURNING id INTO conv_id;

  INSERT INTO messages (conversation_id, sender_id, content, reply_mood)
  VALUES (conv_id, uid, p_content, p_reply_mood);

  RETURN conv_id;
END;
$$;

-- 9.4 toss_bottle：放回海里（重置 status active，picked_by 归零）
CREATE OR REPLACE FUNCTION public.toss_bottle(p_bottle_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE bottles SET status = 'active', picked_by = NULL, picked_at = NULL
  WHERE id = p_bottle_id AND picked_by = uid AND status = 'taken';
END;
$$;

-- 9.5 end_conversation
CREATE OR REPLACE FUNCTION public.end_conversation(p_conv_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE conversations SET status = 'ended', ended_at = now(), ended_by = uid
  WHERE id = p_conv_id AND (user_a = uid OR user_b = uid);
END;
$$;

------------------------------------------------------------
-- 10. RLS 行级安全
------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;

-- users: 只能看自己（profile 详情）+ 别人只能看 bottle_no/avatar_color（通过 view）
DROP POLICY IF EXISTS users_self ON public.users;
CREATE POLICY users_self ON public.users FOR SELECT USING (id = auth.uid());

-- bottles: 自己的瓶子可见；其他活跃瓶子由 RPC 控制（不开 select）
DROP POLICY IF EXISTS bottles_self ON public.bottles;
CREATE POLICY bottles_self ON public.bottles FOR SELECT USING (user_id = auth.uid());
-- 不允许直接 INSERT，必须走 throw_bottle RPC
-- 不允许直接 UPDATE/DELETE

-- conversations: 仅参与方可见
DROP POLICY IF EXISTS conv_participant ON public.conversations;
CREATE POLICY conv_participant ON public.conversations FOR SELECT USING (user_a = auth.uid() OR user_b = auth.uid());

-- messages: 仅 conversation 参与方可见 + 发
DROP POLICY IF EXISTS msg_select ON public.messages;
CREATE POLICY msg_select ON public.messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE user_a = auth.uid() OR user_b = auth.uid())
);
DROP POLICY IF EXISTS msg_insert ON public.messages;
CREATE POLICY msg_insert ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (SELECT id FROM conversations WHERE (user_a = auth.uid() OR user_b = auth.uid()) AND status = 'active')
);

-- blocks: 仅自己的可见
DROP POLICY IF EXISTS blocks_self_select ON public.blocks;
CREATE POLICY blocks_self_select ON public.blocks FOR SELECT USING (blocker = auth.uid());
DROP POLICY IF EXISTS blocks_self_insert ON public.blocks;
CREATE POLICY blocks_self_insert ON public.blocks FOR INSERT WITH CHECK (blocker = auth.uid());
DROP POLICY IF EXISTS blocks_self_delete ON public.blocks;
CREATE POLICY blocks_self_delete ON public.blocks FOR DELETE USING (blocker = auth.uid());

-- reports: 仅自己提交的可见
DROP POLICY IF EXISTS reports_self_select ON public.reports;
CREATE POLICY reports_self_select ON public.reports FOR SELECT USING (reporter = auth.uid());
DROP POLICY IF EXISTS reports_self_insert ON public.reports;
CREATE POLICY reports_self_insert ON public.reports FOR INSERT WITH CHECK (reporter = auth.uid());

-- quotas: 仅自己
DROP POLICY IF EXISTS quotas_self ON public.quotas;
CREATE POLICY quotas_self ON public.quotas FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

------------------------------------------------------------
-- 11. Realtime（聊天）
------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END$$;

-- 完成
SELECT '✓ schema deployed' AS status;
