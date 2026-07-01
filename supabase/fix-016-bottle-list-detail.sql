-- fix-016-bottle-list-detail.sql
-- ============================================================
-- 修复上线前审计发现的 P0：
--   1) Sea「我的瓶子」列表用了不存在的列 thrower_id / bottle_no → 恒空/报错
--   2) BottleDetail 用 bottle.thrower_id 判断瓶主 → 恒显示「这是别人的瓶子」
--   真实 bottles 表列：id/user_id/content/mood/created_at/status/picked_by/picked_at
--   瓶子编号不在 bottles 表，而是瓶主 users.bottle_no
-- 方案：两个 SECURITY DEFINER RPC，绕 RLS 一次性带出编号 + 对话状态 + 轨迹。
-- ============================================================

-- 1) 我的瓶子列表（带瓶主编号 + 是否已有对话）
CREATE OR REPLACE FUNCTION public.list_my_bottles()
RETURNS TABLE (
  id uuid,
  owner_no text,
  mood text,
  content text,
  status text,
  created_at timestamptz,
  has_conversation boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  RETURN QUERY
  SELECT
    b.id,
    u.bottle_no AS owner_no,
    b.mood,
    b.content,
    b.status,
    b.created_at,
    EXISTS (SELECT 1 FROM conversations c WHERE c.bottle_id = b.id) AS has_conversation
  FROM bottles b
  JOIN users u ON u.id = b.user_id
  WHERE b.user_id = uid
    AND b.status <> 'deleted'
  ORDER BY b.created_at DESC
  LIMIT 30;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_bottles() TO authenticated;

-- 2) 单个瓶子详情 + 漂流轨迹（校验瓶主；轨迹带 actor 编号）
--    返回 JSON：{ bottle: {...}, events: [...] }，一次拿全
CREATE OR REPLACE FUNCTION public.get_bottle_detail(p_bottle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  uid uuid := auth.uid();
  b RECORD;
  owner_no text;
  result jsonb;
  events_json jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO b FROM bottles WHERE id = p_bottle_id;
  IF b IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  -- 只有瓶主能看
  IF b.user_id <> uid THEN
    RETURN jsonb_build_object('error', 'not_owner');
  END IF;

  SELECT bottle_no INTO owner_no FROM users WHERE id = b.user_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'event_type', e.event_type,
      'actor_no', au.bottle_no,
      'created_at', e.created_at
    ) ORDER BY e.created_at ASC
  ), '[]'::jsonb)
  INTO events_json
  FROM bottle_events e
  LEFT JOIN users au ON au.id = e.actor_id
  WHERE e.bottle_id = p_bottle_id;

  result := jsonb_build_object(
    'bottle', jsonb_build_object(
      'id', b.id,
      'owner_no', owner_no,
      'content', b.content,
      'mood', b.mood,
      'status', b.status,
      'created_at', b.created_at
    ),
    'events', events_json
  );
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_bottle_detail(uuid) TO authenticated;

SELECT '✓ fix-016 applied: list_my_bottles + get_bottle_detail' AS status;
