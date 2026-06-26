-- fix-013-bottle-events.sql
-- 漂流轨迹功能：新建 bottle_events 表 + 修改 4 个 RPC 写入事件
-- 在 Supabase Dashboard → SQL Editor 粘贴执行
-- ============================================================

-- 1) bottle_events 表
CREATE TABLE IF NOT EXISTS public.bottle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id uuid NOT NULL REFERENCES public.bottles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('throw','pick','toss','reply')),
  actor_id uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bottle_events_bottle
  ON public.bottle_events(bottle_id, created_at);

ALTER TABLE public.bottle_events ENABLE ROW LEVEL SECURITY;
-- 只有瓶主能看自己瓶子的事件
DROP POLICY IF EXISTS bottle_events_owner ON public.bottle_events;
CREATE POLICY bottle_events_owner
  ON public.bottle_events FOR SELECT
  USING (bottle_id IN (SELECT id FROM public.bottles WHERE user_id = auth.uid()));

-- 2) 修改 throw_bottle：写入 throw 事件
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
  -- ★ 写入漂流事件
  INSERT INTO bottle_events (bottle_id, event_type, actor_id) VALUES (bottle_id, 'throw', uid);
  UPDATE quotas SET thrown = thrown + 1 WHERE user_id = uid AND date = today;
  RETURN bottle_id;
END;
$$;

-- 3) 修改 pick_bottle：写入 pick 事件
CREATE OR REPLACE FUNCTION public.pick_bottle()
RETURNS TABLE (id uuid, content text, mood text, author_no text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
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

  -- ★ 写入漂流事件（必须在 UPDATE 之后拿 bottle id）
  INSERT INTO bottle_events (bottle_id, event_type, actor_id)
    SELECT id, 'pick', uid FROM chosen WHERE id IS NOT NULL;

  UPDATE quotas SET picked = picked + 1 WHERE user_id = uid AND date = today;
END;
$$;

-- 4) 修改 toss_bottle：写入 toss 事件
CREATE OR REPLACE FUNCTION public.toss_bottle(p_bottle_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE bottles SET status = 'active', picked_by = NULL, picked_at = NULL
  WHERE id = p_bottle_id AND picked_by = uid AND status = 'taken';

  IF FOUND THEN
    -- ★ 写入漂流事件
    INSERT INTO bottle_events (bottle_id, event_type, actor_id)
    VALUES (p_bottle_id, 'toss', uid);
  END IF;
END;
$$;

-- 5) 修改 submit_reply：写入 reply 事件
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

  -- ★ 写入漂流事件
  INSERT INTO bottle_events (bottle_id, event_type, actor_id)
  VALUES (p_bottle_id, 'reply', uid);

  RETURN conv_id;
END;
$$;

SELECT '✓ fix-013 applied: bottle_events table + 4 RPCs updated' AS status;
