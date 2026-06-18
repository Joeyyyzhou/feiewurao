-- =============================================
-- invite-001 · 邀请码注册系统
-- =============================================
-- 规则：
--   1) 每个用户固定一个 6 位邀请码（大写字母+数字）
--   2) 普通用户最多邀请 10 个人
--   3) 创始人（joeyyyzhou@tencent.com）无上限
--   4) 注册需要：邀请码 + @tencent.com 邮箱 + 密码（不发邮件，立即通过）
-- =============================================

------------------------------------------------------------
-- 1. users 表加邀请码字段
------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS invite_quota int NOT NULL DEFAULT 10;

CREATE INDEX IF NOT EXISTS idx_users_invite_code ON public.users (invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON public.users (invited_by);

------------------------------------------------------------
-- 2. 邀请码生成函数（6 位，大写字母+数字，去掉容易混淆的 0/O/1/I）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- 去掉 I O 0 1
  code text;
  attempt int := 0;
BEGIN
  LOOP
    attempt := attempt + 1;
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE invite_code = code);
    IF attempt >= 20 THEN RAISE EXCEPTION 'invite code allocation failed'; END IF;
  END LOOP;
  RETURN code;
END;
$$;

------------------------------------------------------------
-- 3. 给所有现有用户回填邀请码（已有的不动）
------------------------------------------------------------
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM public.users WHERE invite_code IS NULL LOOP
    UPDATE public.users SET invite_code = public.gen_invite_code() WHERE id = u.id;
  END LOOP;
END $$;

------------------------------------------------------------
-- 4. 把创始人 quota 设成 99999（无限）
------------------------------------------------------------
UPDATE public.users SET invite_quota = 99999
WHERE email = 'joeyyyzhou@tencent.com';

------------------------------------------------------------
-- 5. handle_new_user trigger 增强：自动分配邀请码
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  no text;
  color text;
  code text;
BEGIN
  -- 强制 @tencent.com
  IF NEW.email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION 'only tencent.com email allowed';
  END IF;

  -- 生成 4 位 bottle_no
  FOR i IN 1..5 LOOP
    no := lpad(floor(random() * 10000)::int::text, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no) THEN
      EXIT;
    END IF;
    no := NULL;
  END LOOP;
  IF no IS NULL THEN
    no := lpad(floor(random() * 10000)::int::text, 4, '0');
  END IF;

  -- 随机头像色
  color := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];

  -- 生成邀请码
  code := public.gen_invite_code();

  INSERT INTO public.users (id, email, bottle_no, avatar_color, invite_code)
  VALUES (NEW.id, NEW.email, no, color, code)
  ON CONFLICT (id) DO UPDATE SET
    bottle_no = COALESCE(public.users.bottle_no, EXCLUDED.bottle_no),
    avatar_color = COALESCE(public.users.avatar_color, EXCLUDED.avatar_color),
    invite_code = COALESCE(public.users.invite_code, EXCLUDED.invite_code);

  RETURN NEW;
END;
$$;

------------------------------------------------------------
-- 6. register_with_invite：核心注册 RPC
--    校验邀请码 + 创建 auth.users + 写 public.users + 扣邀请人配额
--    返回 user_id（前端拿到后立即用 password 登录）
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
  used_count int;
  new_uid uuid := gen_random_uuid();
  no_val text;
  color_val text;
  new_code text;
BEGIN
  -- 基础校验
  IF p_invite_code IS NULL OR length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION '请输入邀请码';
  END IF;
  IF p_email IS NULL OR p_email NOT LIKE '%@tencent.com' THEN
    RAISE EXCEPTION '请使用 @tencent.com 邮箱';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION '密码至少 6 位';
  END IF;

  -- 邮箱不能重复
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION '该邮箱已注册，请直接登录';
  END IF;

  -- 查邀请人
  SELECT * INTO inviter FROM public.users WHERE invite_code = upper(trim(p_invite_code));
  IF inviter IS NULL THEN
    RAISE EXCEPTION '邀请码无效';
  END IF;

  -- 检查邀请人配额
  SELECT count(*)::int INTO used_count FROM public.users WHERE invited_by = inviter.id;
  IF used_count >= inviter.invite_quota THEN
    RAISE EXCEPTION '该邀请码邀请名额已用完';
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

  -- 1) 写 auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    new_uid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers',ARRAY['email']),
    '{}'::jsonb,
    now(), now()
  );

  -- 2) 写 public.users（trigger 也会写，用 ON CONFLICT 兼容）
  INSERT INTO public.users (id, email, bottle_no, avatar_color, invite_code, invited_by)
  VALUES (new_uid, p_email, no_val, color_val, new_code, inviter.id)
  ON CONFLICT (id) DO UPDATE SET
    bottle_no = COALESCE(public.users.bottle_no, EXCLUDED.bottle_no),
    avatar_color = COALESCE(public.users.avatar_color, EXCLUDED.avatar_color),
    invite_code = COALESCE(public.users.invite_code, EXCLUDED.invite_code),
    invited_by = EXCLUDED.invited_by;

  RETURN QUERY SELECT new_uid, no_val, new_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_with_invite(text, text, text) TO anon, authenticated;

------------------------------------------------------------
-- 7. get_my_invite_info：我的邀请信息（Me 页用）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_invite_info()
RETURNS TABLE (
  my_code text,
  quota int,
  used int,
  remaining int,
  invitees jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  u RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO u FROM public.users WHERE id = uid;
  IF u IS NULL THEN RAISE EXCEPTION 'user not found'; END IF;

  RETURN QUERY
  SELECT
    u.invite_code,
    u.invite_quota,
    (SELECT count(*)::int FROM public.users WHERE invited_by = uid),
    GREATEST(0, u.invite_quota - (SELECT count(*)::int FROM public.users WHERE invited_by = uid)),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'bottle_no', i.bottle_no,
        'avatar_color', i.avatar_color,
        'created_at', i.created_at
      ) ORDER BY i.created_at DESC), '[]'::jsonb)
     FROM public.users i WHERE i.invited_by = uid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_invite_info() TO authenticated;

SELECT '✅ invite-001 applied: 邀请码注册系统已就绪' AS status;
