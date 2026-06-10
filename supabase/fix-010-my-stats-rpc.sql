-- fix-010-my-stats-rpc.sql
-- 问题：Me 页统计「捞起的瓶子」数始终为 0
-- 根因：bottles 表 RLS policy `bottles_self` 只允许 user_id = auth.uid()（看自己扔的）
--       Me.tsx 用 select count + eq('picked_by', profile.id) 被 RLS 先过滤掉「别人扔的」
--       所以 picked count 永远 0
-- 修复：新建一个 SECURITY DEFINER RPC `get_my_stats()`，绕过 RLS 直接 count
--       前端 Me.tsx 改调 supabase.rpc('get_my_stats')

CREATE OR REPLACE FUNCTION public.get_my_stats()
RETURNS TABLE (thrown bigint, picked bigint, friends bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM bottles WHERE user_id = uid)::bigint AS thrown,
    (SELECT COUNT(*) FROM bottles WHERE picked_by = uid)::bigint AS picked,
    (SELECT COUNT(*) FROM conversations WHERE user_a = uid OR user_b = uid)::bigint AS friends;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_stats() TO authenticated;

SELECT '✓ fix-010 applied: get_my_stats RPC' AS status;
