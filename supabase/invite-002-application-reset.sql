-- =============================================
-- invite-002 · 邀请码申请 + 忘记密码
-- =============================================

------------------------------------------------------------
-- 1. invite_applications：邀请码申请记录
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invite_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  message text,                       -- 申请者留言（可选）
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  generated_code text,                -- 审批通过后生成的邀请码（一次性）
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invite_applications_status ON public.invite_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invite_applications_email ON public.invite_applications (email);

ALTER TABLE public.invite_applications ENABLE ROW LEVEL SECURITY;
-- 只有 admin 能读
DROP POLICY IF EXISTS invite_applications_admin_only ON public.invite_applications;
CREATE POLICY invite_applications_admin_only ON public.invite_applications
  FOR SELECT USING (public.is_admin());

------------------------------------------------------------
-- 2. password_reset_codes：忘记密码一次性验证码
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,            -- 验证码的 hash（不存明文）
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  ip text                             -- 可选：记录请求 IP 防刷
);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON public.password_reset_codes (email, created_at DESC);

------------------------------------------------------------
-- 3. submit_invite_application：用户提交邀请码申请
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_invite_application(
  p_email text,
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_id uuid;
  recent_count int;
BEGIN
  IF p_email IS NULL OR p_email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION '请使用 @tencent.com 邮箱';
  END IF;
  -- 该邮箱已注册 → 拒绝（直接登录就行）
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION '该邮箱已经注册过了，请直接登录';
  END IF;
  -- 防刷：1 小时内同邮箱不超过 3 次
  SELECT count(*) INTO recent_count FROM public.invite_applications
    WHERE email = p_email AND created_at > now() - INTERVAL '1 hour';
  IF recent_count >= 3 THEN
    RAISE EXCEPTION '提交太频繁了，请稍后再试';
  END IF;
  -- 已 pending 的不重复创建
  IF EXISTS (SELECT 1 FROM public.invite_applications WHERE email = p_email AND status = 'pending') THEN
    RAISE EXCEPTION '你已经申请过了，请等待审核（一般 24 小时内）';
  END IF;

  INSERT INTO public.invite_applications (email, message)
  VALUES (lower(trim(p_email)), nullif(trim(p_message), ''))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_invite_application(text, text) TO anon, authenticated;

------------------------------------------------------------
-- 4. admin_list_applications：管理员看申请列表
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_applications(p_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid, email text, message text, status text,
  generated_code text, approved_at timestamptz,
  rejected_reason text, created_at timestamptz,
  pending_count int, approved_count int, rejected_count int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  RETURN QUERY
  SELECT a.id, a.email, a.message, a.status,
    a.generated_code, a.approved_at, a.rejected_reason, a.created_at,
    (SELECT count(*)::int FROM public.invite_applications WHERE status = 'pending'),
    (SELECT count(*)::int FROM public.invite_applications WHERE status = 'approved'),
    (SELECT count(*)::int FROM public.invite_applications WHERE status = 'rejected')
  FROM public.invite_applications a
  WHERE (p_status IS NULL OR a.status = p_status)
  ORDER BY (a.status = 'pending') DESC, a.created_at DESC
  LIMIT 200;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_applications(text) TO authenticated;

------------------------------------------------------------
-- 5. admin_approve_application：审批通过 + 生成邀请码
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_approve_application(p_id uuid)
RETURNS TABLE (email text, code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  app RECORD;
  new_code text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  SELECT * INTO app FROM public.invite_applications WHERE id = p_id;
  IF app IS NULL THEN RAISE EXCEPTION 'application not found'; END IF;
  IF app.status != 'pending' THEN RAISE EXCEPTION '该申请已处理'; END IF;

  -- 生成新邀请码（独立的，跟用户码区分；这里就是一次性专用码）
  new_code := public.gen_invite_code();

  UPDATE public.invite_applications SET
    status = 'approved',
    generated_code = new_code,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = p_id;

  -- 把这个码也写到 users 表里？不，这个码不属于任何用户。
  -- 我们用一个特殊「系统邀请码」表来记，让 register_with_invite 也认得它。
  RETURN QUERY SELECT app.email, new_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_approve_application(uuid) TO authenticated;

------------------------------------------------------------
-- 6. system_invite_codes：系统签发的一次性邀请码
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_invite_codes (
  code text PRIMARY KEY,
  for_email text NOT NULL,             -- 申请时填的邮箱（注册必须用相同邮箱）
  application_id uuid REFERENCES public.invite_applications(id),
  used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- 重写审批 RPC，把码也写到 system_invite_codes
CREATE OR REPLACE FUNCTION public.admin_approve_application(p_id uuid)
RETURNS TABLE (email text, code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  app RECORD;
  new_code text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  SELECT * INTO app FROM public.invite_applications WHERE id = p_id;
  IF app IS NULL THEN RAISE EXCEPTION 'application not found'; END IF;
  IF app.status != 'pending' THEN RAISE EXCEPTION '该申请已处理'; END IF;

  new_code := public.gen_invite_code();

  UPDATE public.invite_applications SET
    status = 'approved',
    generated_code = new_code,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = p_id;

  INSERT INTO public.system_invite_codes (code, for_email, application_id)
  VALUES (new_code, app.email, app.id);

  RETURN QUERY SELECT app.email, new_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_approve_application(uuid) TO authenticated;

------------------------------------------------------------
-- 7. admin_reject_application
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reject_application(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  UPDATE public.invite_applications SET
    status = 'rejected',
    rejected_reason = p_reason,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = p_id AND status = 'pending';
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reject_application(uuid, text) TO authenticated;

------------------------------------------------------------
-- 8. 扩展 register_with_invite：让它认识 system_invite_codes
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_with_invite(
  p_invite_code text,
  p_email text,
  p_password text
)
RETURNS TABLE (user_id uuid, bottle_no text, invite_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  -- 1) 先查是不是「系统签发码」（申请来的，一次性）
  SELECT * INTO sys_code FROM public.system_invite_codes WHERE code = code_upper AND used = false;
  IF sys_code.code IS NOT NULL THEN
    -- 系统码必须用申请时的邮箱
    IF lower(sys_code.for_email) != lower(p_email) THEN
      RAISE EXCEPTION '该邀请码绑定的邮箱与你填写的不一致';
    END IF;
    used_system_code := true;
  ELSE
    -- 2) 不是系统码 → 查是不是普通用户的邀请码
    SELECT * INTO inviter FROM public.users WHERE invite_code = code_upper;
    IF inviter IS NULL THEN RAISE EXCEPTION '邀请码无效'; END IF;
    SELECT count(*)::int INTO used_count FROM public.users WHERE invited_by = inviter.id;
    IF used_count >= inviter.invite_quota THEN
      RAISE EXCEPTION '该邀请码邀请名额已用完';
    END IF;
  END IF;

  -- 分配 bottle_no
  FOR i IN 1..5 LOOP
    no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no_val);
    no_val := NULL;
  END LOOP;
  IF no_val IS NULL THEN
    no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
  END IF;

  color_val := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];
  new_code := public.gen_invite_code();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    new_uid, '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated', p_email, crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers',ARRAY['email']),
    '{}'::jsonb, now(), now()
  );

  INSERT INTO public.users (id, email, bottle_no, avatar_color, invite_code, invited_by)
  VALUES (new_uid, p_email, no_val, color_val, new_code,
    CASE WHEN used_system_code THEN NULL ELSE inviter.id END)
  ON CONFLICT (id) DO UPDATE SET
    bottle_no = COALESCE(public.users.bottle_no, EXCLUDED.bottle_no),
    avatar_color = COALESCE(public.users.avatar_color, EXCLUDED.avatar_color),
    invite_code = COALESCE(public.users.invite_code, EXCLUDED.invite_code),
    invited_by = EXCLUDED.invited_by;

  -- 标记系统码已使用
  IF used_system_code THEN
    UPDATE public.system_invite_codes SET used = true, used_by = new_uid, used_at = now() WHERE code = code_upper;
  END IF;

  RETURN QUERY SELECT new_uid, no_val, new_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_with_invite(text, text, text) TO anon, authenticated;

------------------------------------------------------------
-- 9. 忘记密码：request_password_reset
--    生成 6 位验证码 + 存 hash + 返回明文（让 Vercel API 拿去发邮件）
--    注意：API 必须用 service_role 调，普通用户不能直接拿明文
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_password_reset(p_email text)
RETURNS TABLE (plain_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  code text;
  recent_count int;
BEGIN
  IF p_email IS NULL OR p_email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION '请使用 @tencent.com 邮箱';
  END IF;
  -- 邮箱必须存在
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION '该邮箱未注册';
  END IF;
  -- 防刷：5 分钟内同邮箱最多 1 次
  SELECT count(*) INTO recent_count FROM public.password_reset_codes
    WHERE email = p_email AND created_at > now() - INTERVAL '5 minutes';
  IF recent_count >= 1 THEN
    RAISE EXCEPTION '请稍后再试，5 分钟内只能发起一次';
  END IF;

  -- 生成 6 位数字验证码
  code := lpad(floor(random() * 1000000)::int::text, 6, '0');

  INSERT INTO public.password_reset_codes (email, code_hash, expires_at)
  VALUES (
    lower(trim(p_email)),
    encode(digest(code, 'sha256'), 'hex'),
    now() + INTERVAL '15 minutes'
  );

  RETURN QUERY SELECT code;
END;
$$;
-- 不给 anon 直接调（只给 Vercel API 用 service_role 调）
REVOKE EXECUTE ON FUNCTION public.request_password_reset(text) FROM PUBLIC, anon, authenticated;

------------------------------------------------------------
-- 10. reset_password_with_code：用验证码 + 邮箱 + 新密码完成重置
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_password_with_code(
  p_email text, p_code text, p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rec RECORD;
  uid uuid;
BEGIN
  IF p_email IS NULL OR p_code IS NULL OR p_new_password IS NULL THEN
    RAISE EXCEPTION '参数不能为空';
  END IF;
  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION '新密码至少 6 位';
  END IF;

  -- 查最近一条未使用的码
  SELECT * INTO rec FROM public.password_reset_codes
    WHERE email = lower(trim(p_email))
      AND code_hash = encode(digest(p_code, 'sha256'), 'hex')
      AND used = false
      AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;

  IF rec IS NULL THEN
    RAISE EXCEPTION '验证码错误或已过期';
  END IF;

  -- 找用户
  SELECT id INTO uid FROM auth.users WHERE email = lower(trim(p_email));
  IF uid IS NULL THEN RAISE EXCEPTION '用户不存在'; END IF;

  -- 更新密码
  UPDATE auth.users SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = uid;

  -- 标记验证码已使用
  UPDATE public.password_reset_codes SET used = true WHERE id = rec.id;

  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.reset_password_with_code(text, text, text) FROM PUBLIC, anon, authenticated;

------------------------------------------------------------
-- 11. admin_invite_tree：邀请关系树（用于管理端可视化）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_invite_tree()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  -- 返回所有 user 的 id/bottle_no/invited_by/邀请数/活跃度，前端自己组装树
  SELECT jsonb_agg(jsonb_build_object(
    'id', u.id,
    'bottle_no', u.bottle_no,
    'email', u.email,
    'invite_code', u.invite_code,
    'invited_by', u.invited_by,
    'invited_count', (SELECT count(*) FROM public.users WHERE invited_by = u.id),
    'bottle_count', (SELECT count(*) FROM public.bottles WHERE user_id = u.id),
    'conv_count', (SELECT count(*) FROM public.conversations WHERE user_a = u.id OR user_b = u.id),
    'is_seed', EXISTS (SELECT 1 FROM public.seed_accounts WHERE user_id = u.id),
    'created_at', u.created_at
  ) ORDER BY u.created_at) INTO result
  FROM public.users u
  WHERE u.banned_at IS NULL;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_invite_tree() TO authenticated;

-- 启用 pgcrypto 的 digest（如果未启用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT '✅ invite-002 applied: 申请系统 + 忘记密码 + 邀请图谱' AS status;
