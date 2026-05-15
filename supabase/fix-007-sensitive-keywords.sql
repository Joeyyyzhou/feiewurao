-- ============================================
-- 非鹅勿扰 · fix-007 · 敏感词后端兜底
-- ============================================
-- 不依赖 Edge Function，在 throw_bottle / submit_reply / messages 三处加关键词黑名单
-- 命中敏感词 → 抛 RAISE EXCEPTION 'sensitive content blocked'
-- 前端捕获后给用户友好提示

-- 1) 关键词表（可后续在管理后台增删）
CREATE TABLE IF NOT EXISTS public.sensitive_keywords (
  id bigserial PRIMARY KEY,
  keyword text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('politics','porn','contact','harass','spam','general')),
  created_at timestamptz DEFAULT now()
);

-- 2) 预设最小黑名单（PM 视角：员工社交最敏感的是联系方式泄露 + 攻击性言论）
INSERT INTO public.sensitive_keywords (keyword, category) VALUES
  -- 联系方式（漂流瓶应保持匿名）
  ('微信号', 'contact'), ('微信号', 'contact'), ('+加微', 'contact'),
  ('vx', 'contact'), ('wx', 'contact'),
  ('qq:', 'contact'), ('qq：', 'contact'),
  ('手机号', 'contact'),
  -- 直白色情（极简，避免误伤）
  ('约炮', 'porn'), ('援交', 'porn'), ('裸聊', 'porn'),
  -- 高频攻击词
  ('傻逼', 'harass'), ('煞笔', 'harass'), ('sb', 'harass'),
  ('滚蛋', 'harass'),
  -- 黑产
  ('代刷', 'spam'), ('刷单', 'spam'), ('赌博', 'spam'),
  ('博彩', 'spam')
ON CONFLICT (keyword) DO NOTHING;

-- 3) 敏感词检查函数
CREATE OR REPLACE FUNCTION public.check_sensitive(p_text text)
RETURNS text  -- 命中的关键词；NULL 表示没命中
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  hit text;
BEGIN
  SELECT keyword INTO hit
  FROM public.sensitive_keywords
  WHERE p_text ILIKE '%' || keyword || '%'
  LIMIT 1;
  RETURN hit;
END;
$$;

-- 4) 改 throw_bottle 加敏感词检查
CREATE OR REPLACE FUNCTION public.throw_bottle(p_content text, p_mood text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
  bottle_id uuid;
  hit text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- 敏感词检查
  hit := check_sensitive(p_content);
  IF hit IS NOT NULL THEN
    RAISE EXCEPTION 'sensitive content blocked: %', hit;
  END IF;

  INSERT INTO quotas (user_id, date, thrown, picked) VALUES (uid, today, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  IF (SELECT thrown FROM quotas WHERE user_id = uid AND date = today) >= 3 THEN
    RAISE EXCEPTION 'daily throw quota exceeded';
  END IF;

  INSERT INTO bottles (user_id, content, mood) VALUES (uid, p_content, p_mood)
  RETURNING id INTO bottle_id;
  UPDATE quotas SET thrown = thrown + 1 WHERE user_id = uid AND date = today;
  RETURN bottle_id;
END;
$$;

-- 5) 改 submit_reply 加敏感词检查
CREATE OR REPLACE FUNCTION public.submit_reply(p_bottle_id uuid, p_content text, p_reply_mood text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  bottle_owner uuid;
  conv_id uuid;
  hit text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  hit := check_sensitive(p_content);
  IF hit IS NOT NULL THEN
    RAISE EXCEPTION 'sensitive content blocked: %', hit;
  END IF;

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

-- 6) messages 表加 trigger 拦截直插
CREATE OR REPLACE FUNCTION public.messages_sensitive_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  hit text;
BEGIN
  hit := check_sensitive(NEW.content);
  IF hit IS NOT NULL THEN
    RAISE EXCEPTION 'sensitive content blocked: %', hit;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_sensitive ON public.messages;
CREATE TRIGGER trg_messages_sensitive
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_sensitive_check();

SELECT '✓ fix-007 applied · 敏感词后端兜底' AS status,
  (SELECT count(*) FROM public.sensitive_keywords) AS keyword_count;
