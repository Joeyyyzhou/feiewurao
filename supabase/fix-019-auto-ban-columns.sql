-- fix-019-auto-ban-columns.sql
-- ============================================================
-- 上线前 E2E 模拟测试发现最严重 P0：
--   check_auto_ban() 触发器引用了不存在的列 target_type / target_id / reporter_id
--   （reports 真实列：reporter / bottle_id / message_id / conversation_id / reason）
--   后果：任何举报 INSERT 都会触发 "record new has no field target_type" 报错回滚
--         → 举报功能 100% 不可用，且自动封禁从未真正生效
-- 修复：用真实列名重写。被举报目标用户从 bottle_id/message_id/conversation_id 反查。
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_auto_ban()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  target_user uuid;
  report_count int;
BEGIN
  -- 反查被举报的目标用户
  IF NEW.bottle_id IS NOT NULL THEN
    SELECT user_id INTO target_user FROM bottles WHERE id = NEW.bottle_id;
  ELSIF NEW.message_id IS NOT NULL THEN
    SELECT sender_id INTO target_user FROM messages WHERE id = NEW.message_id;
  ELSIF NEW.conversation_id IS NOT NULL THEN
    -- 举报对话：目标是对话里"非举报人"的另一方
    SELECT CASE WHEN c.user_a = NEW.reporter THEN c.user_b ELSE c.user_a END
      INTO target_user
    FROM conversations c WHERE c.id = NEW.conversation_id;
  ELSE
    RETURN NEW;
  END IF;

  IF target_user IS NULL THEN
    RETURN NEW;
  END IF;

  -- 统计该目标用户被多少个不同的人举报过（去重举报人）
  -- 覆盖三种举报入口：瓶子 / 消息 / 对话
  SELECT COUNT(DISTINCT r.reporter) INTO report_count
  FROM reports r
  WHERE
    (r.bottle_id IN (SELECT id FROM bottles WHERE user_id = target_user))
    OR
    (r.message_id IN (SELECT id FROM messages WHERE sender_id = target_user))
    OR
    (r.conversation_id IN (
      SELECT id FROM conversations
      WHERE (user_a = target_user OR user_b = target_user)
    ) AND r.reporter <> target_user);

  -- 达到 3 个不同举报人 → 自动封禁
  IF report_count >= 3 THEN
    UPDATE users SET banned_at = now() WHERE id = target_user AND banned_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

SELECT '✓ fix-019 applied: check_auto_ban 用真实列名重写' AS status;
