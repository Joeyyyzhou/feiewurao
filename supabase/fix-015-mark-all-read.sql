-- fix-015-mark-all-read.sql
-- ============================================================
-- 问题：进入「瓶友」tab 后，列表里的对话红点点击进去再返回仍然存在。
-- 根因：前端 markAllRead 对每个对话单独发一个 mark_conversation_read RPC
--       (Promise.all N 个请求)，对话多/网络慢时很慢，导致：
--         1) 「加载中」卡住（load 被 await 阻塞）
--         2) 为解卡把 markAllRead 改成后台跑，又导致 load 读到未提交的旧未读数，红点不消失
-- 方案：提供单次批量 RPC，一条 UPDATE 把当前用户参与的所有对话 last_read 设为 now()。
--       前端进入瓶友 tab 只调这一个快 RPC，可安全 await 后再 load，红点可靠清零。
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_all_conversations_read()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- 我是 user_a 的对话：更新 last_read_a
  UPDATE conversations SET last_read_a = now()
  WHERE user_a = uid;

  -- 我是 user_b 的对话：更新 last_read_b
  UPDATE conversations SET last_read_b = now()
  WHERE user_b = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_conversations_read() TO authenticated;

SELECT '✓ fix-015 applied: mark_all_conversations_read RPC' AS status;
