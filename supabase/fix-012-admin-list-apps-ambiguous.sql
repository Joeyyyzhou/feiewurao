-- fix-012-admin-list-apps-ambiguous.sql (v2)
-- 修复 admin_list_applications 的 "column reference status is ambiguous" 错误
-- 根因：RETURNS TABLE 的 status 列和 invite_applications.status 列同名冲突
-- 方案：改用 CTE 预算计数，避免子查询中的列名歧义

CREATE OR REPLACE FUNCTION public.admin_list_applications(p_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid, email text, message text, app_status text,
  generated_code text, approved_at timestamptz,
  rejected_reason text, created_at timestamptz,
  pending_count int, approved_count int, rejected_count int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      count(*) FILTER (WHERE ia.status = 'pending')::int AS pending_cnt,
      count(*) FILTER (WHERE ia.status = 'approved')::int AS approved_cnt,
      count(*) FILTER (WHERE ia.status = 'rejected')::int AS rejected_cnt
    FROM public.invite_applications ia
  )
  SELECT
    a.id, a.email, a.message,
    a.status AS app_status,
    a.generated_code, a.approved_at, a.rejected_reason, a.created_at,
    s.pending_cnt, s.approved_cnt, s.rejected_cnt
  FROM public.invite_applications a
  CROSS JOIN stats s
  WHERE (p_status IS NULL OR a.status = p_status)
  ORDER BY (a.status = 'pending') DESC, a.created_at DESC
  LIMIT 200;
END;
$$;

SELECT '✓ fix-012 v2 applied: admin_list_applications rewritten with CTE + renamed out col' AS status;
