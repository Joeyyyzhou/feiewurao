-- ============================================
-- admin-001 · 管理后台后端基础
-- ============================================
-- 1. admins 白名单表
-- 2. is_admin() 工具函数（auth.uid() 是否在 admins 里）
-- 3. admin_dashboard_stats / admin_list_users / admin_list_bottles /
--    admin_list_reports / admin_list_blocks 一组只读 RPC
-- 4. admin_ban_user / admin_unban_user / admin_delete_bottle /
--    admin_resolve_report / admin_unblock 一组写 RPC
-- 5. admin_keyword_list / admin_keyword_add / admin_keyword_remove（暂留接口，
--    敏感词最终落在 Edge Function 里，但保留 DB 词库给以后扩展用）

------------------------------------------------------------
-- 1. admins 白名单
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  note text
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 任何已登录用户都能查自己是不是 admin（前端用来判断要不要让进后台）
DROP POLICY IF EXISTS admins_self_select ON public.admins;
CREATE POLICY admins_self_select ON public.admins
  FOR SELECT USING (user_id = auth.uid());

-- 初始管理员：joeyyyzhou
INSERT INTO public.admins (user_id, note)
SELECT id, 'creator'
FROM public.users
WHERE email = 'joeyyyzhou@tencent.com'
ON CONFLICT (user_id) DO NOTHING;

------------------------------------------------------------
-- 2. is_admin() 工具
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

------------------------------------------------------------
-- 3. 只读 RPC
------------------------------------------------------------
-- 3.1 dashboard 关键指标
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.users WHERE banned_at IS NULL),
    'banned_users', (SELECT count(*) FROM public.users WHERE banned_at IS NOT NULL),
    'today_new_users', (SELECT count(*) FROM public.users WHERE created_at::date = current_date),
    'total_bottles', (SELECT count(*) FROM public.bottles),
    'today_new_bottles', (SELECT count(*) FROM public.bottles WHERE created_at::date = current_date),
    'active_bottles', (SELECT count(*) FROM public.bottles WHERE status = 'active'),
    'active_conversations', (SELECT count(*) FROM public.conversations WHERE status = 'active'),
    'pending_reports', (SELECT count(*) FROM public.reports WHERE status = 'pending'),
    'total_blocks', (SELECT count(*) FROM public.blocks),
    'mood_today', (
      SELECT json_object_agg(mood, c) FROM (
        SELECT mood, count(*) c FROM public.bottles
        WHERE created_at::date = current_date GROUP BY mood
      ) m
    ),
    'recent_7d_bottles', (
      SELECT json_agg(json_build_object('date', d, 'count', c) ORDER BY d) FROM (
        SELECT created_at::date d, count(*) c FROM public.bottles
        WHERE created_at >= current_date - interval '6 days'
        GROUP BY created_at::date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

-- 3.2 用户列表（分页 + 搜索）
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search text DEFAULT NULL,
  p_only_banned boolean DEFAULT false,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, email text, bottle_no text, avatar_color text,
  created_at timestamptz, banned_at timestamptz,
  bottles_count bigint, conversations_count bigint, reports_against bigint,
  total bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  WITH base AS (
    SELECT u.* FROM public.users u
    WHERE (p_search IS NULL OR u.email ILIKE '%'||p_search||'%' OR u.bottle_no ILIKE '%'||p_search||'%')
      AND (NOT p_only_banned OR u.banned_at IS NOT NULL)
  ),
  total_cte AS (SELECT count(*) AS t FROM base)
  SELECT
    b.id, b.email, b.bottle_no, b.avatar_color, b.created_at, b.banned_at,
    (SELECT count(*) FROM public.bottles WHERE user_id = b.id),
    (SELECT count(*) FROM public.conversations WHERE user_a = b.id OR user_b = b.id),
    (SELECT count(*) FROM public.reports r JOIN public.bottles bb ON bb.id = r.bottle_id WHERE bb.user_id = b.id),
    (SELECT t FROM total_cte)
  FROM base b
  ORDER BY b.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, boolean, int, int) TO authenticated;

-- 3.3 瓶子列表
CREATE OR REPLACE FUNCTION public.admin_list_bottles(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, content text, mood text, status text,
  created_at timestamptz, picked_at timestamptz,
  author_id uuid, author_no text, author_email text,
  picker_no text,
  reports_count bigint,
  total bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  WITH base AS (
    SELECT b.* FROM public.bottles b
    WHERE (p_search IS NULL OR b.content ILIKE '%'||p_search||'%')
      AND (p_status IS NULL OR b.status = p_status)
  ),
  total_cte AS (SELECT count(*) AS t FROM base)
  SELECT
    b.id, b.content, b.mood, b.status, b.created_at, b.picked_at,
    b.user_id,
    u.bottle_no, u.email,
    (SELECT pu.bottle_no FROM public.users pu WHERE pu.id = b.picked_by),
    (SELECT count(*) FROM public.reports WHERE bottle_id = b.id),
    (SELECT t FROM total_cte)
  FROM base b
  JOIN public.users u ON u.id = b.user_id
  ORDER BY b.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_bottles(text, text, int, int) TO authenticated;

-- 3.4 举报列表
CREATE OR REPLACE FUNCTION public.admin_list_reports(
  p_status text DEFAULT 'pending',
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, reason text, status text, created_at timestamptz,
  reporter_no text, reporter_email text,
  bottle_id uuid, bottle_content text, bottle_status text,
  bottle_author_no text, bottle_author_email text,
  total bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  WITH base AS (
    SELECT r.* FROM public.reports r
    WHERE (p_status IS NULL OR r.status = p_status)
  ),
  total_cte AS (SELECT count(*) AS t FROM base)
  SELECT
    r.id, r.reason, r.status, r.created_at,
    ru.bottle_no, ru.email,
    b.id, b.content, b.status,
    bu.bottle_no, bu.email,
    (SELECT t FROM total_cte)
  FROM base r
  JOIN public.users ru ON ru.id = r.reporter
  LEFT JOIN public.bottles b ON b.id = r.bottle_id
  LEFT JOIN public.users bu ON bu.id = b.user_id
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_reports(text, int, int) TO authenticated;

------------------------------------------------------------
-- 4. 写 RPC
------------------------------------------------------------
-- 4.1 封号
CREATE OR REPLACE FUNCTION public.admin_ban_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.users SET banned_at = now() WHERE id = p_user_id AND banned_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid) TO authenticated;

-- 4.2 解封
CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.users SET banned_at = NULL WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_unban_user(uuid) TO authenticated;

-- 4.3 删瓶子（软删，标记 deleted）
CREATE OR REPLACE FUNCTION public.admin_delete_bottle(p_bottle_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.bottles SET status = 'deleted' WHERE id = p_bottle_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_bottle(uuid) TO authenticated;

-- 4.4 处理举报
CREATE OR REPLACE FUNCTION public.admin_resolve_report(p_report_id uuid, p_action text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rep_bottle uuid;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_action NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'invalid action; must be resolved/dismissed';
  END IF;
  UPDATE public.reports SET status = p_action WHERE id = p_report_id;

  -- 如果是 resolved 且是瓶子的举报 → 顺手把瓶子标 reported
  IF p_action = 'resolved' THEN
    SELECT bottle_id INTO rep_bottle FROM public.reports WHERE id = p_report_id;
    IF rep_bottle IS NOT NULL THEN
      UPDATE public.bottles SET status = 'reported' WHERE id = rep_bottle AND status != 'deleted';
    END IF;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text) TO authenticated;

SELECT
  '✓ admin-001 ok' AS status,
  (SELECT count(*) FROM public.admins) AS admin_count;
