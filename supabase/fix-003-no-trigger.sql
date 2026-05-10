-- 非鹅勿扰漂流瓶 · schema 修复 fix-003
-- 改用前端调 RPC create_profile 建 profile，弃用 PG 触发器
-- 这样错误能直接在浏览器 console 看到，调试简单

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

DROP POLICY IF EXISTS users_self_insert ON public.users;
CREATE POLICY users_self_insert ON public.users FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  bottle_no_val text;
  color_val text;
  attempt int := 0;
  result public.users;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO result FROM public.users WHERE id = uid;
  IF FOUND THEN
    RETURN result;
  END IF;

  SELECT email INTO uemail FROM auth.users WHERE id = uid;
  IF uemail IS NULL OR uemail NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION 'only @tencent.com email allowed';
  END IF;

  LOOP
    attempt := attempt + 1;
    bottle_no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = bottle_no_val);
    IF attempt >= 10 THEN RAISE EXCEPTION 'bottle_no allocation failed'; END IF;
  END LOOP;

  color_val := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];

  INSERT INTO public.users (id, email, bottle_no, avatar_color)
  VALUES (uid, uemail, bottle_no_val, color_val)
  RETURNING * INTO result;

  RETURN result;
END;
$$;

SELECT '✓ fix-003 applied' AS status;
