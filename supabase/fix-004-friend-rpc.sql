-- 非鹅勿扰漂流瓶 · schema 修复 fix-004
-- 修两个问题：
-- 1) 邮箱必须验证后才能进站（前端做硬控）
-- 2) users 表 RLS 太严：已经是瓶友（同 conversation 双方）的用户应能互查 bottle_no / avatar_color
--    否则 Friends.tsx / Chat.tsx 显示「----」

-- 1) 加 SECURITY DEFINER 的查询函数，让前端用它替代直接 select users
CREATE OR REPLACE FUNCTION public.get_friend_profile(p_other_id uuid)
RETURNS TABLE (id uuid, bottle_no text, avatar_color text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE (user_a = uid AND user_b = p_other_id)
       OR (user_b = uid AND user_a = p_other_id)
  ) THEN
    RAISE EXCEPTION 'not friends';
  END IF;

  RETURN QUERY
    SELECT u.id, u.bottle_no, u.avatar_color
    FROM public.users u
    WHERE u.id = p_other_id;
END;
$$;

-- 2) 批量版本：传一组 ids 一次返回（Friends 列表用）
CREATE OR REPLACE FUNCTION public.get_friend_profiles(p_other_ids uuid[])
RETURNS TABLE (id uuid, bottle_no text, avatar_color text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  RETURN QUERY
    SELECT u.id, u.bottle_no, u.avatar_color
    FROM public.users u
    WHERE u.id = ANY(p_other_ids)
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE (c.user_a = uid AND c.user_b = u.id)
           OR (c.user_b = uid AND c.user_a = u.id)
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_profiles(uuid[]) TO authenticated;

-- 3) 查「我拉黑的人」的 bottle_no（必须是我已经拉黑了的）
CREATE OR REPLACE FUNCTION public.get_blocked_profiles()
RETURNS TABLE (id uuid, bottle_no text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  RETURN QUERY
    SELECT u.id, u.bottle_no
    FROM public.users u
    JOIN public.blocks b ON b.blocked = u.id
    WHERE b.blocker = uid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_blocked_profiles() TO authenticated;

SELECT '✓ fix-004 applied · 加瓶友互查 RPC' AS status;
