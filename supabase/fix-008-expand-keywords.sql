-- ============================================
-- fix-008 · 扩充敏感词库（覆盖更多联系方式表达）
-- ============================================
-- 在 fix-007 基础上增量补，不动 RPC

-- 清理 fix-007 的精确词（覆盖面太窄）→ 改用更宽的模糊词
DELETE FROM public.sensitive_keywords WHERE keyword IN ('微信号','vx','wx','qq:','qq：','手机号','加微');

INSERT INTO public.sensitive_keywords (keyword, category) VALUES
  -- 联系方式（覆盖几种常见说法）
  ('加微信', 'contact'),
  ('加vx', 'contact'),
  ('加v', 'contact'),
  ('加wx', 'contact'),
  ('加qq', 'contact'),
  ('加扣扣', 'contact'),
  ('加企微', 'contact'),
  ('vx：', 'contact'),
  ('vx:', 'contact'),
  ('微信：', 'contact'),
  ('微信:', 'contact'),
  ('wx：', 'contact'),
  ('wx:', 'contact'),
  ('qq号', 'contact'),
  ('扣扣号', 'contact'),
  ('企业微信号', 'contact'),
  ('企微号', 'contact'),
  ('手机号', 'contact'),
  ('我的微信', 'contact'),
  ('我微信', 'contact'),
  ('私聊微信', 'contact'),
  ('加好友', 'contact'),
  ('加我好友', 'contact'),
  ('telegram', 'contact'),
  ('tg：', 'contact'),
  ('tg:', 'contact'),
  -- 手机号格式（13/14/15/16/17/18/19 开头 11 位）后端正则触发，这里加几个示例触发字
  ('+86 ', 'contact'),
  ('+86-', 'contact')
ON CONFLICT (keyword) DO NOTHING;

-- 同时让 check_sensitive 支持手机号正则
CREATE OR REPLACE FUNCTION public.check_sensitive(p_text text)
RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE
  hit text;
BEGIN
  -- 1) 关键词表
  SELECT keyword INTO hit
  FROM public.sensitive_keywords
  WHERE p_text ILIKE '%' || keyword || '%'
  LIMIT 1;
  IF hit IS NOT NULL THEN RETURN hit; END IF;

  -- 2) 手机号（连续 11 位 1 开头数字）
  IF p_text ~ '(?<![0-9])1[3-9][0-9]{9}(?![0-9])' THEN
    RETURN '手机号';
  END IF;

  -- 3) QQ 号（连续 5-12 位数字 + 上下文）
  IF p_text ~ '(qq|扣扣|企鹅|加我).{0,8}[0-9]{5,12}' THEN
    RETURN 'QQ号';
  END IF;

  RETURN NULL;
END;
$$;

SELECT
  '✓ fix-008 ok' AS status,
  (SELECT count(*) FROM public.sensitive_keywords) AS total_keywords;
