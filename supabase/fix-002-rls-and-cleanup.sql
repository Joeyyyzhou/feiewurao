-- 非鹅勿扰漂流瓶 · schema 修复 fix-002
-- 问题：之前注册失败留下了 auth.users 残骸，且 users 表 RLS 缺 INSERT 策略
-- 修复：清理残骸 + 加 INSERT 策略 + 让触发器更宽容

-- 1) 清理之前所有失败的 auth 残骸（这些用户没在 public.users 建过 profile）
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- 2) 给 public.users 加 INSERT/UPDATE 策略（触发器跑 SECURITY DEFINER 应能绕过，但稳妥起见加上）
DROP POLICY IF EXISTS users_self_insert ON public.users;
CREATE POLICY users_self_insert ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (id = auth.uid());

-- 3) 重写触发器：用更明确的 EXCEPTION 让我们能看到真错误
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  bottle_no_val text;
  color_val text;
  attempt int := 0;
BEGIN
  -- 域名检查
  IF NEW.email IS NULL OR NEW.email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION 'only @tencent.com email allowed (got: %)', NEW.email;
  END IF;

  -- 编号生成（最多重试 10 次）
  LOOP
    attempt := attempt + 1;
    bottle_no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = bottle_no_val);
    IF attempt >= 10 THEN
      RAISE EXCEPTION 'failed to allocate unique bottle_no after 10 attempts';
    END IF;
  END LOOP;

  -- 颜色随机
  color_val := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];

  -- 写入 profile
  INSERT INTO public.users (id, email, bottle_no, avatar_color)
  VALUES (NEW.id, NEW.email, bottle_no_val, color_val);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 把真错误抛出来，方便定位
  RAISE EXCEPTION 'handle_new_user failed: % (sqlstate %)', SQLERRM, SQLSTATE;
END;
$$;

-- 4) 确保触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✓ fix-002 applied · 清理残骸 + INSERT 策略 + 触发器加详细错误' AS status;
