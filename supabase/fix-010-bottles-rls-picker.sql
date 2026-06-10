-- fix-010-bottles-rls-picker.sql
-- 问题：Me 页统计「捞起的瓶子」数始终为 0
-- 根因：bottles 表 RLS policy `bottles_self` 只允许 user_id = auth.uid()（看自己扔的）
--       Me.tsx 用 select count + eq('picked_by', profile.id) 时，被 RLS 先过滤掉所有「别人扔的」瓶子
--       所以 count 永远是 0（除非你捞了自己扔的，但这不存在）
-- 修复：新增 policy 允许 picked_by = auth.uid() 也能 SELECT
--       这样捞瓶人也能看到自己捞过的瓶子，符合产品语义（聊天/我的页都要用）

DROP POLICY IF EXISTS bottles_picker ON public.bottles;
CREATE POLICY bottles_picker ON public.bottles
  FOR SELECT
  USING (picked_by = auth.uid());

-- 验证：以匿名身份执行查询，应能返回所有自己 picked 或扔出的瓶子
SELECT '✓ fix-010 applied: bottles_picker policy added' AS status;
