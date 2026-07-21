-- fix-021-register-with-code.sql
-- ============================================================
-- 新注册流程：去掉邀请码，改为「邮箱验证码 + 密码」
--   1) register_codes 表：存注册验证码（sha256 hash，10分钟过期）
--   2) request_register_code(email)：校验@tencent.com + 未注册 + 防刷，生成6位码
--   3) register_with_code(email, code, password)：校验码 → 建 auth 账号 + profile
-- 沿用已验证的建号逻辑：token字段全设'' + extensions.crypt bcrypt
-- ============================================================

-- 1) 注册验证码表
CREATE TABLE IF NOT EXISTS public.register_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_register_codes_email ON public.register_codes(email, created_at);
ALTER TABLE public.register_codes ENABLE ROW LEVEL SECURITY;
-- 仅 SECURITY DEFINER 函数访问，前端无直接权限（不建 policy = 默认拒绝）

-- 2) 请求注册验证码
CREATE OR REPLACE FUNCTION public.request_register_code(p_email text)
RETURNS TABLE(plain_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  code text;
  recent_count int;
BEGIN
  IF p_email IS NULL OR p_email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION '请使用 @tencent.com 企业邮箱';
  END IF;
  -- 邮箱必须未注册
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
    RAISE EXCEPTION '该邮箱已注册，请直接登录';
  END IF;
  -- 防刷：60 秒内同邮箱最多 1 次
  SELECT count(*) INTO recent_count FROM public.register_codes
    WHERE email = lower(trim(p_email)) AND created_at > now() - INTERVAL '60 seconds';
  IF recent_count >= 1 THEN
    RAISE EXCEPTION '发送太频繁，请 60 秒后再试';
  END IF;

  code := lpad(floor(random() * 1000000)::int::text, 6, '0');

  INSERT INTO public.register_codes (email, code_hash, expires_at)
  VALUES (
    lower(trim(p_email)),
    encode(digest(code, 'sha256'), 'hex'),
    now() + INTERVAL '10 minutes'
  );

  RETURN QUERY SELECT code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_register_code(text) TO anon, authenticated;

-- 3) 用验证码完成注册
CREATE OR REPLACE FUNCTION public.register_with_code(p_email text, p_code text, p_password text)
RETURNS TABLE(user_id uuid, bottle_no text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  new_uid uuid := gen_random_uuid();
  no_val text;
  color_val text;
  new_code text;
  rec RECORD;
  email_norm text := lower(trim(p_email));
BEGIN
  IF p_email IS NULL OR p_email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION '请使用 @tencent.com 企业邮箱';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION '密码至少 6 位';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = email_norm) THEN
    RAISE EXCEPTION '该邮箱已注册，请直接登录';
  END IF;

  -- 校验验证码：最近一条未用且未过期的
  SELECT * INTO rec FROM public.register_codes
    WHERE email = email_norm AND used = false AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;
  IF rec.id IS NULL THEN
    RAISE EXCEPTION '验证码无效或已过期，请重新获取';
  END IF;
  IF rec.code_hash <> encode(digest(trim(p_code), 'sha256'), 'hex') THEN
    RAISE EXCEPTION '验证码错误';
  END IF;

  -- 分配 bottle_no（唯一）
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

  -- 建 auth 账号（token 字段全 ''，bcrypt 密码）
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    new_uid, '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated', email_norm, extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers',ARRAY['email']),
    '{}'::jsonb, now(), now(),
    '', '', '', '', '', '', '', ''
  );

  -- 建 profile
  INSERT INTO public.users (id, email, bottle_no, avatar_color, invite_code, invited_by)
  VALUES (new_uid, email_norm, no_val, color_val, new_code, NULL)
  ON CONFLICT (id) DO UPDATE SET
    bottle_no = COALESCE(public.users.bottle_no, EXCLUDED.bottle_no),
    avatar_color = COALESCE(public.users.avatar_color, EXCLUDED.avatar_color),
    invite_code = COALESCE(public.users.invite_code, EXCLUDED.invite_code);

  -- 标记验证码已用
  UPDATE public.register_codes SET used = true WHERE id = rec.id;

  RETURN QUERY SELECT new_uid, no_val;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_with_code(text, text, text) TO anon, authenticated;

SELECT '✓ fix-021 applied: register_codes + request_register_code + register_with_code' AS status;
