-- ============================================
-- seed-001 · 种子账号 & 代发 RPC（冷启动用）
-- ============================================
-- 设计原则：
-- 1. 种子账号 = 真实 public.users 行 + 真实 bottle_no + 真实 avatar_color
-- 2. 跟普通用户的唯一区别：邮箱后缀 @seed.feiewurao.internal（绝不存在的域）
--    + seed_accounts 表登记（便于后台识别 & 切换身份）
-- 3. 所有代发动作（扔瓶/回信/聊天消息）都必须由 admin 调用，
--    后端会临时"伪装"成种子账号身份做 INSERT，不留任何"是种子瓶"的痕迹
-- 4. 跟正常的 throw_bottle / submit_reply 流程一致地用 quotas、bottles、
--    conversations、messages 等表（这样捞瓶随机算法天然把它们一视同仁）
--
-- 依赖：admins 表 + is_admin() 已存在（admin-001-rpc.sql）

------------------------------------------------------------
-- 0. seed_accounts 登记表
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seed_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  label text NOT NULL,                 -- 后台显示用，如 "主语气 / 偏感性"
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE public.seed_accounts ENABLE ROW LEVEL SECURITY;
-- 只允许 admin 看到这张表（普通用户对它存在性也不可知）
DROP POLICY IF EXISTS seed_accounts_admin_only ON public.seed_accounts;
CREATE POLICY seed_accounts_admin_only ON public.seed_accounts
  FOR SELECT USING (public.is_admin());

------------------------------------------------------------
-- 1. admin_create_seed_account
--    创建一个完整的种子账号（auth.users + public.users + seed_accounts）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_seed_account(
  p_label text,
  p_color text DEFAULT NULL,  -- 可选指定颜色，不传则随机
  p_notes text DEFAULT NULL
)
RETURNS TABLE (user_id uuid, email text, bottle_no text, avatar_color text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  new_uid uuid := gen_random_uuid();
  new_email text;
  bottle_no_val text;
  color_val text;
  attempt int := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  IF p_label IS NULL OR length(trim(p_label)) = 0 THEN
    RAISE EXCEPTION 'label required';
  END IF;

  -- 生成不冲突的伪邮箱：seed-<8 位随机>@seed.feiewurao.internal
  LOOP
    attempt := attempt + 1;
    new_email := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@seed.feiewurao.internal';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = new_email);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email allocation failed'; END IF;
  END LOOP;

  -- 分配 bottle_no（4 位）
  attempt := 0;
  LOOP
    attempt := attempt + 1;
    bottle_no_val := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = bottle_no_val);
    IF attempt >= 20 THEN RAISE EXCEPTION 'bottle_no allocation failed'; END IF;
  END LOOP;

  -- 颜色
  IF p_color IS NULL OR p_color NOT IN ('c1','c2','c3','c4','c5','c6','c7','c8') THEN
    color_val := (ARRAY['c1','c2','c3','c4','c5','c6','c7','c8'])[floor(random() * 8 + 1)::int];
  ELSE
    color_val := p_color;
  END IF;

  -- 1) 写 auth.users（绕过 GoTrue，但保证字段完整）
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
    new_email,
    -- 一个永远登录不进去的占位密码（bcrypt 格式的随机串，没人能反推）
    crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    now(),
    jsonb_build_object('provider','seed','providers',ARRAY['seed']),
    jsonb_build_object('seed', true, 'label', p_label),
    now(), now()
  );

  -- 2) 写 public.users
  INSERT INTO public.users (id, email, bottle_no, avatar_color)
  VALUES (new_uid, new_email, bottle_no_val, color_val);

  -- 3) 登记到 seed_accounts
  INSERT INTO public.seed_accounts (user_id, label, created_by, notes)
  VALUES (new_uid, p_label, caller, p_notes);

  RETURN QUERY SELECT new_uid, new_email, bottle_no_val, color_val;
END;
$$;

------------------------------------------------------------
-- 2. admin_list_seed_accounts
------------------------------------------------------------
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
    COALESCE((SELECT thrown FROM quotas WHERE user_id = s.user_id AND date = current_date), 0)::int AS today_thrown,
    COALESCE((SELECT picked FROM quotas WHERE user_id = s.user_id AND date = current_date), 0)::int AS today_picked,
    (SELECT count(*)::int FROM bottles WHERE user_id = s.user_id) AS bottle_count,
    (SELECT count(*)::int FROM conversations WHERE user_a = s.user_id OR user_b = s.user_id) AS conv_count
  FROM seed_accounts s
  JOIN users u ON u.id = s.user_id
  ORDER BY s.created_at DESC;
END;
$$;

------------------------------------------------------------
-- 3. admin_seed_throw_bottle
--    以种子账号身份扔瓶（沿用业务约束：每日 3 条上限）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_seed_throw_bottle(
  p_seed_user_id uuid,
  p_content text,
  p_mood text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  today date := current_date;
  bottle_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  -- 必须是登记的种子账号
  IF NOT EXISTS (SELECT 1 FROM seed_accounts WHERE user_id = p_seed_user_id) THEN
    RAISE EXCEPTION 'not a seed account';
  END IF;

  -- 走和正常扔瓶一样的约束
  INSERT INTO quotas (user_id, date, thrown, picked)
  VALUES (p_seed_user_id, today, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  IF (SELECT thrown FROM quotas WHERE user_id = p_seed_user_id AND date = today) >= 3 THEN
    RAISE EXCEPTION 'seed account daily throw quota exceeded';
  END IF;

  INSERT INTO bottles (user_id, content, mood)
  VALUES (p_seed_user_id, p_content, p_mood)
  RETURNING id INTO bottle_id;

  UPDATE quotas SET thrown = thrown + 1
  WHERE user_id = p_seed_user_id AND date = today;

  RETURN bottle_id;
END;
$$;

------------------------------------------------------------
-- 4. admin_seed_send_message
--    以种子账号身份在某个会话里发消息（用于回复瓶友）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_seed_send_message(
  p_seed_user_id uuid,
  p_conversation_id uuid,
  p_content text,
  p_reply_mood text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  msg_id uuid;
  conv_status text;
  is_participant boolean;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  IF NOT EXISTS (SELECT 1 FROM seed_accounts WHERE user_id = p_seed_user_id) THEN
    RAISE EXCEPTION 'not a seed account';
  END IF;

  SELECT status, (user_a = p_seed_user_id OR user_b = p_seed_user_id)
  INTO conv_status, is_participant
  FROM conversations WHERE id = p_conversation_id;

  IF conv_status IS NULL THEN RAISE EXCEPTION 'conversation not found'; END IF;
  IF conv_status != 'active' THEN RAISE EXCEPTION 'conversation ended'; END IF;
  IF NOT is_participant THEN RAISE EXCEPTION 'seed account not in this conversation'; END IF;

  INSERT INTO messages (conversation_id, sender_id, content, reply_mood)
  VALUES (p_conversation_id, p_seed_user_id, p_content, p_reply_mood)
  RETURNING id INTO msg_id;

  RETURN msg_id;
END;
$$;

------------------------------------------------------------
-- 5. admin_seed_inbox
--    聚合所有种子账号的"对话清单"+ 最近一条消息（统一收件箱）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_seed_inbox()
RETURNS TABLE (
  conversation_id uuid,
  seed_user_id uuid,
  seed_label text,
  seed_bottle_no text,
  partner_user_id uuid,
  partner_bottle_no text,
  partner_avatar_color text,
  bottle_id uuid,
  bottle_content text,
  bottle_mood text,
  last_message_content text,
  last_message_sender uuid,
  last_message_at timestamptz,
  unread_from_partner int,
  conv_status text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  RETURN QUERY
  WITH seed_convs AS (
    SELECT
      c.id AS conv_id,
      c.status,
      c.bottle_id,
      CASE WHEN c.user_a IN (SELECT user_id FROM seed_accounts) THEN c.user_a ELSE c.user_b END AS seed_uid,
      CASE WHEN c.user_a IN (SELECT user_id FROM seed_accounts) THEN c.user_b ELSE c.user_a END AS partner_uid
    FROM conversations c
    WHERE c.user_a IN (SELECT user_id FROM seed_accounts)
       OR c.user_b IN (SELECT user_id FROM seed_accounts)
  ),
  last_msg AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id, m.content, m.sender_id, m.created_at
    FROM messages m
    WHERE m.conversation_id IN (SELECT conv_id FROM seed_convs)
    ORDER BY m.conversation_id, m.created_at DESC
  )
  SELECT
    sc.conv_id,
    sc.seed_uid,
    sa.label,
    su.bottle_no,
    sc.partner_uid,
    pu.bottle_no,
    pu.avatar_color,
    sc.bottle_id,
    b.content,
    b.mood,
    lm.content,
    lm.sender_id,
    lm.created_at,
    (SELECT count(*)::int FROM messages m
     WHERE m.conversation_id = sc.conv_id
       AND m.sender_id = sc.partner_uid) AS unread_from_partner,
    sc.status
  FROM seed_convs sc
  JOIN seed_accounts sa ON sa.user_id = sc.seed_uid
  JOIN users su ON su.id = sc.seed_uid
  JOIN users pu ON pu.id = sc.partner_uid
  JOIN bottles b ON b.id = sc.bottle_id
  LEFT JOIN last_msg lm ON lm.conversation_id = sc.conv_id
  ORDER BY COALESCE(lm.created_at, sc.conv_id::text::timestamptz) DESC NULLS LAST;
END;
$$;

------------------------------------------------------------
-- 6. admin_seed_conversation_messages
--    读取某个 conversation 的全部消息（用于聊天面板）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_seed_conversation_messages(p_conv_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  content text,
  reply_mood text,
  created_at timestamptz,
  sender_is_seed boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  -- 必须是有种子账号参与的会话
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = p_conv_id
      AND (c.user_a IN (SELECT user_id FROM seed_accounts)
           OR c.user_b IN (SELECT user_id FROM seed_accounts))
  ) THEN
    RAISE EXCEPTION 'not a seed conversation';
  END IF;

  RETURN QUERY
  SELECT
    m.id, m.sender_id, m.content, m.reply_mood, m.created_at,
    EXISTS(SELECT 1 FROM seed_accounts WHERE user_id = m.sender_id) AS sender_is_seed
  FROM messages m
  WHERE m.conversation_id = p_conv_id
  ORDER BY m.created_at ASC;
END;
$$;

------------------------------------------------------------
-- 7. admin_seed_delete_account（软删除：保留瓶子/对话，只是不再可用）
--    谨慎用：这只是从 seed_accounts 移除，bottles/conversations 都保留
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_seed_archive_account(p_seed_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden: admin only'; END IF;
  DELETE FROM seed_accounts WHERE user_id = p_seed_user_id;
  -- 不删 auth.users 也不删 public.users，瓶子和对话历史保留
END;
$$;

SELECT '✓ seed-001 applied' AS status;
