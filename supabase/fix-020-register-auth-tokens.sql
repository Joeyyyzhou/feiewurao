-- fix-020-register-auth-tokens.sql
-- ============================================================
-- P0：邀请码注册成功后无法登录（signInWithPassword 失败）
-- 根因：register_with_invite 手动插 auth.users 时，未给 GoTrue 登录必需的
--       token 字段赋值 → 它们为 NULL。Supabase GoTrue(Go) 校验登录时读这些字段，
--       遇到 NULL 报 "converting NULL to string is unsupported" → 登录失败。
--   对比：能正常登录的老账号这些字段都是空字符串 ''（非 NULL）。
-- 修复：
--   1) 重建 register_with_invite，INSERT 时把 token 字段全部显式设为 ''
--   2) 回填存量账号：把这些字段为 NULL 的 auth.users 改为 ''（救回已注册登不上的用户）
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_with_invite(p_invite_code text, p_email text, p_password text)
RETURNS TABLE(user_id uuid, bottle_no text, invite_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $function$
DECLARE
  inviter RECORD;
  sys_code RECORD;
  used_count int;
  new_uid uuid := gen_random_uuid();
  no_val text;
  color_val text;
  new_code text;
  used_system_code boolean := false;
  code_upper text;
BEGIN
  IF p_invite_code IS NULL OR length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION '请输入邀请码';
  END IF;
  IF p_email IS NULL OR p_email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION '请使用 @tencent.com 邮箱';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION '密码至少 6 位';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION '该邮箱已注册，请直接登录';
  END IF;

  code_upper := upper(trim(p_invite_code));

  SELECT * INTO sys_code FROM public.system_invite_codes WHERE code = code_upper AND used = false;
  IF sys_code.code IS NOT NULL THEN
    IF lower(sys_code.for_email) != lower(p_email) THEN
      RAISE EXCEPTION '该邀请码绑定的邮箱与你填写的不一致';
    END IF;
    used_system_code := true;
  ELSE
    SELECT * INTO inviter FROM public.users u WHERE u.invite_code = code_upper;
    IF inviter IS NULL THEN RAISE EXCEPTION '邀请码无效'; END IF;
    SELECT count(*)::int INTO used_count FROM public.users u WHERE u.invited_by = inviter.id;
    IF used_count >= inviter.invite_quota THEN
      RAISE EXCEPTION '该邀请码邀请名额已用完';
    END IF;
  END IF;

  -- 分配 bottle_no
  FOR i IN 1..5 LOOP
    no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users u WHERE u.bottle_no = no_val);
    no_val := NULL;
  END LOOP;
  IF no_val IS NULL THEN
    no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
  END IF;

  color_val := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];
  new_code := public.gen_invite_code();

  -- ★ 关键修复：token 字段显式设为 ''（不能留 NULL，否则 GoTrue 登录报错）
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    new_uid, '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated', p_email, extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers',ARRAY['email']),
    '{}'::jsonb, now(), now(),
    '', '', '', '', '', '', '', ''
  );

  INSERT INTO public.users (id, email, bottle_no, avatar_color, invite_code, invited_by)
  VALUES (new_uid, p_email, no_val, color_val, new_code,
    CASE WHEN used_system_code THEN NULL ELSE inviter.id END)
  ON CONFLICT (id) DO UPDATE SET
    bottle_no = COALESCE(public.users.bottle_no, EXCLUDED.bottle_no),
    avatar_color = COALESCE(public.users.avatar_color, EXCLUDED.avatar_color),
    invite_code = COALESCE(public.users.invite_code, EXCLUDED.invite_code),
    invited_by = EXCLUDED.invited_by;

  IF used_system_code THEN
    UPDATE public.system_invite_codes SET used = true, used_by = new_uid, used_at = now() WHERE code = code_upper;
  END IF;

  RETURN QUERY SELECT new_uid, no_val, new_code;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_with_invite(text, text, text) TO anon, authenticated;

-- 回填：救回已注册但因 NULL token 登不上的存量账号
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR reauthentication_token IS NULL;

SELECT '✓ fix-020 applied: register token 字段修复 + 存量回填' AS status;
