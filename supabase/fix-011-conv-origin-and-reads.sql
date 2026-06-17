-- fix-011-conv-origin-and-reads.sql
-- ============================================================
-- 修复 1：聊天页拿不到「我扔的瓶子原文」作为对话起点
--   根因：bottles RLS 只让 user_id = self 可见。所以
--         - 朋友捞到我的瓶子并回信 → 朋友在聊天页看不到瓶子原文（user_id 是我不是他）
--         - 即使我自己进聊天页，messages 表也只存了"朋友的回信"，没有原瓶
--   方案：新增 RPC `get_conversation_origin(p_conv_id)`，SECURITY DEFINER 绕过 RLS，
--         先校验调用者是 conv 参与方，再返回该 conv 起源 bottle 的内容+心情+作者 No.+ 时间。
--
-- 修复 2：瓶友 tab 没有未读提示（新瓶友 / 新消息）
--   方案：在 conversations 表加两列 last_read_a / last_read_b（默认 epoch 0），
--         新增 RPC `mark_conversation_read(p_conv_id)` 在 Chat 打开时调用，
--         前端用 last_read_* 和 max(messages.created_at) + conv.created_at 比对判未读。
--         对话刚成立但用户没看过 → conv.created_at > last_read → 也算未读（红点新瓶友）。
-- ============================================================

-- 1) conversations 表新增 last_read 列
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_read_a timestamptz NOT NULL DEFAULT 'epoch',
  ADD COLUMN IF NOT EXISTS last_read_b timestamptz NOT NULL DEFAULT 'epoch';

-- 2) 起源 bottle 查询（SECURITY DEFINER 绕 RLS；先校验调用者是参与方）
CREATE OR REPLACE FUNCTION public.get_conversation_origin(p_conv_id uuid)
RETURNS TABLE (
  bottle_id uuid,
  content text,
  mood text,
  created_at timestamptz,
  author_id uuid,
  author_no text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  c RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO c FROM conversations WHERE id = p_conv_id;
  IF c IS NULL THEN RAISE EXCEPTION 'conversation not found'; END IF;
  IF c.user_a <> uid AND c.user_b <> uid THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  RETURN QUERY
  SELECT b.id, b.content, b.mood, b.created_at, b.user_id, u.bottle_no
  FROM bottles b
  JOIN users u ON u.id = b.user_id
  WHERE b.id = c.bottle_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_conversation_origin(uuid) TO authenticated;

-- 3) 标记已读
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conv_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  c RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO c FROM conversations WHERE id = p_conv_id;
  IF c IS NULL THEN RAISE EXCEPTION 'conversation not found'; END IF;

  IF c.user_a = uid THEN
    UPDATE conversations SET last_read_a = now() WHERE id = p_conv_id;
  ELSIF c.user_b = uid THEN
    UPDATE conversations SET last_read_b = now() WHERE id = p_conv_id;
  ELSE
    RAISE EXCEPTION 'not a participant';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- 4) 列出"我的所有 conv + 未读数 + 最后一条消息预览"（一次性减少前端 N+1 查询）
CREATE OR REPLACE FUNCTION public.list_my_conversations()
RETURNS TABLE (
  conversation_id uuid,
  bottle_id uuid,
  other_id uuid,
  other_no text,
  other_avatar_color text,
  status text,
  conv_created_at timestamptz,
  ended_at timestamptz,
  last_msg_content text,
  last_msg_sender uuid,
  last_msg_at timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  RETURN QUERY
  WITH my_convs AS (
    SELECT c.*,
      CASE WHEN c.user_a = uid THEN c.user_b ELSE c.user_a END AS other_uid,
      CASE WHEN c.user_a = uid THEN c.last_read_a ELSE c.last_read_b END AS my_last_read
    FROM conversations c
    WHERE c.user_a = uid OR c.user_b = uid
  ),
  last_msgs AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id, m.content, m.sender_id, m.created_at
    FROM messages m
    WHERE m.conversation_id IN (SELECT id FROM my_convs)
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread AS (
    SELECT m.conversation_id, COUNT(*)::bigint AS cnt
    FROM messages m
    JOIN my_convs mc ON mc.id = m.conversation_id
    WHERE m.sender_id <> uid          -- 自己发的不算未读
      AND m.created_at > mc.my_last_read
    GROUP BY m.conversation_id
  )
  SELECT
    mc.id,
    mc.bottle_id,
    mc.other_uid,
    u.bottle_no,
    u.avatar_color,
    mc.status,
    mc.created_at,
    mc.ended_at,
    lm.content,
    lm.sender_id,
    lm.created_at,
    COALESCE(ur.cnt, 0) + CASE
      -- 对话刚成立、还没人发消息时也算 1 条未读（"新瓶友"红点）
      WHEN lm.content IS NULL AND mc.created_at > mc.my_last_read THEN 1
      ELSE 0
    END
  FROM my_convs mc
  JOIN users u ON u.id = mc.other_uid
  LEFT JOIN last_msgs lm ON lm.conversation_id = mc.id
  LEFT JOIN unread ur ON ur.conversation_id = mc.id
  ORDER BY COALESCE(lm.created_at, mc.created_at) DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_conversations() TO authenticated;

-- 5) 总未读数（导航小红点用）
CREATE OR REPLACE FUNCTION public.count_unread_conversations()
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  uid uuid := auth.uid();
  n bigint;
BEGIN
  IF uid IS NULL THEN RETURN 0; END IF;

  WITH my_convs AS (
    SELECT c.id, c.created_at,
      CASE WHEN c.user_a = uid THEN c.last_read_a ELSE c.last_read_b END AS my_last_read
    FROM conversations c
    WHERE c.user_a = uid OR c.user_b = uid
  )
  SELECT COUNT(DISTINCT mc.id) INTO n
  FROM my_convs mc
  LEFT JOIN messages m ON m.conversation_id = mc.id
    AND m.sender_id <> uid
    AND m.created_at > mc.my_last_read
  WHERE m.id IS NOT NULL
     OR mc.created_at > mc.my_last_read;

  RETURN COALESCE(n, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.count_unread_conversations() TO authenticated;

SELECT '✓ fix-011 applied: conv origin + reads' AS status;
