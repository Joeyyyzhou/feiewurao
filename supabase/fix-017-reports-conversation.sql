-- fix-017-reports-conversation.sql
-- ============================================================
-- Chat 页「举报」按钮此前是死按钮。让它可用：举报当前对话。
-- reports 表原本只有 bottle_id / message_id，缺 conversation_id。
-- 新增 conversation_id 列（可空），Chat 举报时写入。
-- ============================================================

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reports_conversation
  ON public.reports(conversation_id);

SELECT '✓ fix-017 applied: reports.conversation_id' AS status;
