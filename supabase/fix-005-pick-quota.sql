-- 非鹅勿扰漂流瓶 · schema 修复 fix-005
-- 修两个 bug：
-- 1) pick_bottle 在海里没瓶子可捞时也扣配额（应该不扣）
-- 2) pick_bottle 的 picked +1 写在 RETURN QUERY 之后是不可达代码

CREATE OR REPLACE FUNCTION public.pick_bottle()
RETURNS TABLE (id uuid, content text, mood text, author_no text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
  picked_id uuid;
  picked_content text;
  picked_mood text;
  picked_author_no text;
  picked_created_at timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- 额度检查
  INSERT INTO quotas (user_id, date, thrown, picked) VALUES (uid, today, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  IF (SELECT q.picked FROM quotas q WHERE q.user_id = uid AND q.date = today) >= 3 THEN
    RAISE EXCEPTION 'daily pick quota exceeded';
  END IF;

  -- 选一个候选瓶（排除自己/已成瓶友/拉黑双向）
  SELECT b.id, b.content, b.mood, u.bottle_no, b.created_at
    INTO picked_id, picked_content, picked_mood, picked_author_no, picked_created_at
  FROM bottles b
  JOIN users u ON u.id = b.user_id
  WHERE b.status = 'active'
    AND b.user_id != uid
    AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker = uid AND blocked = b.user_id)
    AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker = b.user_id AND blocked = uid)
    AND NOT EXISTS (SELECT 1 FROM conversations c WHERE
          (c.user_a = uid AND c.user_b = b.user_id) OR
          (c.user_b = uid AND c.user_a = b.user_id))
  ORDER BY random()
  LIMIT 1;

  -- 海里没瓶子：不扣配额，直接返回空
  IF picked_id IS NULL THEN
    RETURN;
  END IF;

  -- 锁定这个瓶子
  UPDATE bottles SET status = 'taken', picked_by = uid, picked_at = now()
  WHERE bottles.id = picked_id;

  -- 扣配额
  UPDATE quotas SET picked = picked + 1 WHERE user_id = uid AND date = today;

  -- 返回
  id := picked_id;
  content := picked_content;
  mood := picked_mood;
  author_no := picked_author_no;
  created_at := picked_created_at;
  RETURN NEXT;
END;
$$;

SELECT '✓ fix-005 applied · pick_bottle 海里空时不扣配额' AS status;
