-- ============================================
-- fix-009 · 回退 fix-007/008 的敏感词后端兜底
-- ============================================
-- 决策：改用 Supabase Edge Function + sensitive-word-tool 库（DFA）
-- 后端兜底删掉，敏感词由前端调 Edge Function 拦截
-- 删 messages trigger / sensitive_keywords 表 / check_sensitive 函数
-- 同时还原 throw_bottle / submit_reply 到 fix-005/006 状态（去掉 sensitive check）

DROP TRIGGER IF EXISTS trg_messages_sensitive ON public.messages;
DROP FUNCTION IF EXISTS public.messages_sensitive_check();
DROP FUNCTION IF EXISTS public.check_sensitive(text);
DROP TABLE IF EXISTS public.sensitive_keywords;

-- 还原 throw_bottle（去掉 sensitive check，保留 fix-005 配额逻辑）
CREATE OR REPLACE FUNCTION public.throw_bottle(p_content text, p_mood text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); today date := current_date; bottle_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
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

-- 还原 submit_reply
CREATE OR REPLACE FUNCTION public.submit_reply(p_bottle_id uuid, p_content text, p_reply_mood text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); bottle_owner uuid; conv_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT user_id INTO bottle_owner FROM bottles WHERE id = p_bottle_id;
  IF bottle_owner IS NULL THEN RAISE EXCEPTION 'bottle not found'; END IF;
  IF bottle_owner = uid THEN RAISE EXCEPTION 'cannot reply to own bottle'; END IF;
  INSERT INTO conversations (bottle_id, user_a, user_b) VALUES (p_bottle_id, bottle_owner, uid) RETURNING id INTO conv_id;
  INSERT INTO messages (conversation_id, sender_id, content, reply_mood) VALUES (conv_id, uid, p_content, p_reply_mood);
  RETURN conv_id;
END;
$$;

SELECT '✓ fix-009 applied · 已回退后端敏感词，等待 Edge Function 接管' AS status;
