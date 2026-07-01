-- fix-018-pick-bottle-ambiguous.sql
-- ============================================================
-- 上线前 E2E 模拟测试发现 P0：pick_bottle() 存在 "column reference id is ambiguous"
-- 根因：CTE chosen 里 SELECT b.id AS id，RETURNING 中 (SELECT id FROM chosen)
--       与 RETURNING 的表列 / plpgsql 解析产生歧义。
-- 修复：chosen 列显式改名 chosen_id / chosen_author_no，消除歧义。
-- ============================================================

CREATE OR REPLACE FUNCTION public.pick_bottle()
RETURNS TABLE (id uuid, content text, mood text, author_no text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
  v_bottle_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO quotas (user_id, date, thrown, picked) VALUES (uid, today, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  IF (SELECT q.picked FROM quotas q WHERE q.user_id = uid AND q.date = today) >= 3 THEN
    RAISE EXCEPTION 'daily pick quota exceeded';
  END IF;

  -- 先选中一个瓶子 id（单独一步，避免 CTE + RETURNING 的列歧义）
  SELECT b.id INTO v_bottle_id
  FROM bottles b
  WHERE b.status = 'active'
    AND b.user_id <> uid
    AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker = uid AND blocked = b.user_id)
    AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker = b.user_id AND blocked = uid)
    AND NOT EXISTS (SELECT 1 FROM conversations c WHERE
          (c.user_a = uid AND c.user_b = b.user_id) OR
          (c.user_b = uid AND c.user_a = b.user_id))
    AND b.id NOT IN (SELECT bottle_id FROM conversations WHERE user_b = uid)
  ORDER BY random()
  LIMIT 1;

  -- 没有可捞的瓶子：直接返回空
  IF v_bottle_id IS NULL THEN
    RETURN;
  END IF;

  -- 标记为已捞
  UPDATE bottles SET status = 'taken', picked_by = uid, picked_at = now()
  WHERE bottles.id = v_bottle_id;

  -- 写入 pick 事件
  INSERT INTO bottle_events (bottle_id, event_type, actor_id)
  VALUES (v_bottle_id, 'pick', uid);

  UPDATE quotas SET picked = picked + 1 WHERE user_id = uid AND date = today;

  -- 返回瓶子信息
  RETURN QUERY
  SELECT b.id, b.content, b.mood, u.bottle_no AS author_no, b.created_at
  FROM bottles b
  JOIN users u ON u.id = b.user_id
  WHERE b.id = v_bottle_id;
END;
$$;

SELECT '✓ fix-018 applied: pick_bottle 消除列歧义 + 逻辑更清晰' AS status;
