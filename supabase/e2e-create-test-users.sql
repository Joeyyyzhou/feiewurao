-- 非鹅勿扰漂流瓶 · 创建 2 个 e2e 测试账号（已确认邮箱）
-- 跑完会输出两个 access_token 供后续 API 测试
-- 跑完后这两个账号会留在数据库，不影响真实用户（编号是随机的）

DO $$
DECLARE
  u1_id uuid;
  u2_id uuid;
  ts text := to_char(now(), 'YYYYMMDDHH24MISS');
BEGIN
  -- 直接插入 auth.users（绕过邮件验证）
  -- 注意：encrypted_password 必须是 bcrypt 哈希，密码 'Test123456'
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'e2e-a-' || ts || '@tencent.com',
    crypt('Test123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated'
  ) RETURNING id INTO u1_id;

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'e2e-b-' || ts || '@tencent.com',
    crypt('Test123456', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated'
  ) RETURNING id INTO u2_id;

  -- 同步 identities（auth 必需）
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), u1_id::text, u1_id, jsonb_build_object('sub', u1_id::text, 'email', 'e2e-a-' || ts || '@tencent.com'), 'email', now(), now(), now()),
    (gen_random_uuid(), u2_id::text, u2_id, jsonb_build_object('sub', u2_id::text, 'email', 'e2e-b-' || ts || '@tencent.com'), 'email', now(), now(), now());

  RAISE NOTICE 'A id=%, email=e2e-a-%@tencent.com', u1_id, ts;
  RAISE NOTICE 'B id=%, email=e2e-b-%@tencent.com', u2_id, ts;
END$$;

-- 输出账号供测试
SELECT
  email,
  'Test123456' AS password,
  email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
WHERE email LIKE 'e2e-%@tencent.com'
ORDER BY created_at DESC
LIMIT 2;
