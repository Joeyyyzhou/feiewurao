-- =============================================
-- seed-003 · 扩 4 个新种子账号 + 修复 ambiguous 错误
-- =============================================
-- 跑前提：seed-001 / seed-002 已应用
-- 用途：把种子账号从 4 个扩到 8 个，覆盖全部 8 种头像渐变
-- =============================================

-- (1) 修复 admin_list_seed_accounts 的 column ambiguous 错误
CREATE OR REPLACE FUNCTION public.admin_list_seed_accounts()
RETURNS TABLE (
  user_id uuid,
  label text,
  bottle_no text,
  avatar_color text,
  notes text,
  created_at timestamptz,
  today_thrown int,
  today_picked int,
  bottle_count int,
  conv_count int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  RETURN QUERY
  SELECT
    s.user_id,
    s.label,
    u.bottle_no,
    u.avatar_color,
    s.notes,
    s.created_at,
    COALESCE((SELECT q.thrown FROM quotas q WHERE q.user_id = s.user_id AND q.date = current_date), 0)::int,
    COALESCE((SELECT q.picked FROM quotas q WHERE q.user_id = s.user_id AND q.date = current_date), 0)::int,
    (SELECT count(*)::int FROM bottles b WHERE b.user_id = s.user_id),
    (SELECT count(*)::int FROM conversations c WHERE c.user_a = s.user_id OR c.user_b = s.user_id)
  FROM seed_accounts s
  JOIN users u ON u.id = s.user_id
  ORDER BY s.created_at DESC;
END;
$$;

-- (2) is_admin 增加 service_role 直连放行（管理后台用 service key 直连）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'service_role'
    OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

-- (3) 创建 4 个新种子账号
DO $$
DECLARE
  uid5 uuid; uid6 uuid; uid7 uuid; uid8 uuid;
  no5 text; no6 text; no7 text; no8 text;
  e5 text; e6 text; e7 text; e8 text;
  attempt int;
BEGIN
  -- 伪邮箱（用 @tencent.com 通过 trigger 校验）
  attempt := 0; LOOP attempt := attempt + 1;
    e5 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@tencent.com';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e5);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;
  attempt := 0; LOOP attempt := attempt + 1;
    e6 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@tencent.com';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e6);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;
  attempt := 0; LOOP attempt := attempt + 1;
    e7 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@tencent.com';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e7);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;
  attempt := 0; LOOP attempt := attempt + 1;
    e8 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@tencent.com';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e8);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;

  -- 编号
  attempt := 0; LOOP attempt := attempt + 1;
    no5 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no5);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;
  attempt := 0; LOOP attempt := attempt + 1;
    no6 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no6);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;
  attempt := 0; LOOP attempt := attempt + 1;
    no7 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no7);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;
  attempt := 0; LOOP attempt := attempt + 1;
    no8 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no8);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;

  uid5 := gen_random_uuid(); uid6 := gen_random_uuid();
  uid7 := gen_random_uuid(); uid8 := gen_random_uuid();

  -- auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (uid5, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e5, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"文艺派"}', now(), now()),
    (uid6, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e6, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"焦虑党"}', now(), now()),
    (uid7, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e7, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"旁观者"}', now(), now()),
    (uid8, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e8, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"浪漫派"}', now(), now());

  -- public.users（指定颜色 c3/c4/c6/c7，trigger 已自动写入则覆盖）
  INSERT INTO public.users (id, email, bottle_no, avatar_color) VALUES
    (uid5, e5, no5, 'c3'),
    (uid6, e6, no6, 'c4'),
    (uid7, e7, no7, 'c6'),
    (uid8, e8, no8, 'c7')
  ON CONFLICT (id) DO UPDATE SET bottle_no = EXCLUDED.bottle_no, avatar_color = EXCLUDED.avatar_color;

  -- seed_accounts 登记
  INSERT INTO public.seed_accounts (user_id, label, notes) VALUES
    (uid5, '文艺派', '偏阅读/电影/文字/慢节奏'),
    (uid6, '焦虑党', '偏纠结/失眠/选择困难'),
    (uid7, '旁观者', '偏观察/记录/冷静'),
    (uid8, '浪漫派', '偏天气/季节/小确幸');

  -- 重新读 bottle_no（trigger 也会写，以最终为准）
  SELECT bottle_no INTO no5 FROM public.users WHERE id = uid5;
  SELECT bottle_no INTO no6 FROM public.users WHERE id = uid6;
  SELECT bottle_no INTO no7 FROM public.users WHERE id = uid7;
  SELECT bottle_no INTO no8 FROM public.users WHERE id = uid8;

  RAISE NOTICE '✅ 4 个新种子账号已创建（共 8 个）';
  RAISE NOTICE '  文艺派 No.% (c3 暮紫)', no5;
  RAISE NOTICE '  焦虑党 No.% (c4 暖红)', no6;
  RAISE NOTICE '  旁观者 No.% (c6 暖橄榄)', no7;
  RAISE NOTICE '  浪漫派 No.% (c7 雾蓝紫)', no8;
END $$;

SELECT '✅ seed-003 applied: ambiguous 修复 + service_role 放行 + 4 个新种子账号' AS status;
