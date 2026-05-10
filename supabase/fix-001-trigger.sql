-- 非鹅勿扰漂流瓶 · schema 修复 fix-001
-- 问题：handle_new_user 触发器里 floor() 返回 double precision，
--       PostgreSQL 数组下标必须是 int，导致注册时报 "Database error saving new user"
-- 修复：把 floor() 显式转 int

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  no text;
  color text;
BEGIN
  -- 强制 @tencent.com
  IF NEW.email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION 'only tencent.com email allowed';
  END IF;

  -- 生成 4 位随机编号（最多重试 5 次）
  FOR i IN 1..5 LOOP
    no := lpad(floor(random() * 10000)::int::text, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no) THEN
      EXIT;
    END IF;
    no := NULL;
  END LOOP;
  IF no IS NULL THEN
    RAISE EXCEPTION 'failed to allocate bottle_no';
  END IF;

  -- 修复：显式转 int
  color := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];

  INSERT INTO public.users (id, email, bottle_no, avatar_color)
  VALUES (NEW.id, NEW.email, no, color);
  RETURN NEW;
END;
$$;

SELECT '✓ handle_new_user fixed' AS status;
