-- =============================================
-- dashboard-001 · 数据观察 Dashboard 增强 RPC
-- =============================================
-- 提供给管理后台 Dashboard 用的多指标 RPC
-- =============================================

-- 1) admin_dashboard_v2：核心数字 + 14 天趋势 + 漏斗 + 心情分布 + 种子占比
CREATE OR REPLACE FUNCTION public.admin_dashboard_v2()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  result jsonb;
  total_users int;
  banned_users int;
  today_new_users int;
  total_bottles int;
  today_new_bottles int;
  active_bottles int;
  total_convs int;
  today_new_convs int;
  pending_reports int;
  seed_bottles int;
  real_bottles int;
  picked_bottles int;
  replied_bottles int;
  friends_bottles int;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;

  SELECT count(*) INTO total_users FROM public.users WHERE banned_at IS NULL;
  SELECT count(*) INTO banned_users FROM public.users WHERE banned_at IS NOT NULL;
  SELECT count(*) INTO today_new_users FROM public.users WHERE created_at::date = current_date;
  SELECT count(*) INTO total_bottles FROM public.bottles;
  SELECT count(*) INTO today_new_bottles FROM public.bottles WHERE created_at::date = current_date;
  SELECT count(*) INTO active_bottles FROM public.bottles WHERE status = 'active';
  SELECT count(*) INTO total_convs FROM public.conversations;
  SELECT count(*) INTO today_new_convs FROM public.conversations WHERE created_at::date = current_date;
  SELECT count(*) INTO pending_reports FROM public.reports WHERE status = 'pending';

  -- 漏斗：扔出 → 被捞 → 形成对话（即被回信变成瓶友）
  SELECT count(*) INTO picked_bottles FROM public.bottles WHERE picked_at IS NOT NULL;
  SELECT count(*) INTO friends_bottles FROM public.bottles b
    WHERE EXISTS (SELECT 1 FROM public.conversations c WHERE c.bottle_id = b.id);

  -- 种子瓶 vs 真用户
  SELECT count(*) INTO seed_bottles FROM public.bottles b
    WHERE EXISTS (SELECT 1 FROM public.seed_accounts s WHERE s.user_id = b.user_id);
  real_bottles := total_bottles - seed_bottles;

  result := jsonb_build_object(
    'core', jsonb_build_object(
      'total_users', total_users,
      'banned_users', banned_users,
      'today_new_users', today_new_users,
      'total_bottles', total_bottles,
      'today_new_bottles', today_new_bottles,
      'active_bottles', active_bottles,
      'total_convs', total_convs,
      'today_new_convs', today_new_convs,
      'pending_reports', pending_reports
    ),
    'funnel', jsonb_build_object(
      'thrown', total_bottles,
      'picked', picked_bottles,
      'friends', friends_bottles
    ),
    'seed_vs_real', jsonb_build_object(
      'seed', seed_bottles,
      'real', real_bottles
    ),
    -- 近 14 天每日新增瓶子
    'trend_14d_bottles', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d::date, 'count', cnt) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT generate_series(current_date - INTERVAL '13 days', current_date, INTERVAL '1 day') AS d
      ) days
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS cnt FROM public.bottles
        WHERE created_at::date = days.d::date
      ) c ON TRUE
    ),
    -- 近 14 天每日新增用户
    'trend_14d_users', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d::date, 'count', cnt) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT generate_series(current_date - INTERVAL '13 days', current_date, INTERVAL '1 day') AS d
      ) days
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS cnt FROM public.users
        WHERE created_at::date = days.d::date
      ) c ON TRUE
    ),
    -- 近 14 天每日新增瓶友
    'trend_14d_friends', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d::date, 'count', cnt) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT generate_series(current_date - INTERVAL '13 days', current_date, INTERVAL '1 day') AS d
      ) days
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS cnt FROM public.conversations
        WHERE created_at::date = days.d::date
      ) c ON TRUE
    ),
    -- 今日心情分布
    'mood_today', (
      SELECT COALESCE(jsonb_object_agg(mood, cnt), '{}'::jsonb)
      FROM (
        SELECT mood, count(*)::int AS cnt FROM public.bottles
        WHERE created_at::date = current_date
        GROUP BY mood
      ) m
    )
  );

  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_v2() TO authenticated;

-- 2) get_ocean_weather：主站 Sea 顶部用 — 近 24h top3 mood + 总瓶数
CREATE OR REPLACE FUNCTION public.get_ocean_weather()
RETURNS TABLE (
  total_bottles int,
  top_moods jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT mood FROM public.bottles
    WHERE created_at >= now() - INTERVAL '24 hours' AND status != 'deleted'
  ),
  agg AS (
    SELECT mood, count(*)::int AS cnt FROM recent GROUP BY mood ORDER BY cnt DESC LIMIT 3
  )
  SELECT
    (SELECT count(*)::int FROM recent),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('mood', mood, 'count', cnt)) FROM agg), '[]'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_ocean_weather() TO authenticated, anon;

SELECT '✅ dashboard-001 applied' AS status;
