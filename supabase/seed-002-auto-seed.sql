-- ============================================
-- seed-002 · 自动创建 4 个种子账号 + 投放种子瓶
-- 在 Supabase SQL Editor 里一键运行即可
-- ============================================

-- 临时存储
DO $$
DECLARE
  uid1 uuid; uid2 uuid; uid3 uuid; uid4 uuid;
  no1 text; no2 text; no3 text; no4 text;
  c1 text; c2 text; c3 text; c4 text;
  e1 text; e2 text; e3 text; e4 text;
  attempt int;
BEGIN
  -- 生成不冲突的伪邮箱
  attempt := 0;
  LOOP
    attempt := attempt + 1;
    e1 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@seed.feiewurao.internal';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e1);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;
  attempt := 0;
  LOOP
    attempt := attempt + 1;
    e2 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@seed.feiewurao.internal';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e2);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;
  attempt := 0;
  LOOP
    attempt := attempt + 1;
    e3 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@seed.feiewurao.internal';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e3);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;
  attempt := 0;
  LOOP
    attempt := attempt + 1;
    e4 := 'seed-' || encode(gen_random_bytes(4), 'hex') || '@seed.feiewurao.internal';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = e4);
    IF attempt >= 10 THEN RAISE EXCEPTION 'email alloc failed'; END IF;
  END LOOP;

  -- 分配编号
  attempt := 0;
  LOOP attempt := attempt + 1;
    no1 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no1);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;
  attempt := 0;
  LOOP attempt := attempt + 1;
    no2 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no2);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;
  attempt := 0;
  LOOP attempt := attempt + 1;
    no3 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no3);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;
  attempt := 0;
  LOOP attempt := attempt + 1;
    no4 := lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE bottle_no = no4);
    IF attempt >= 20 THEN RAISE EXCEPTION 'no alloc failed'; END IF;
  END LOOP;

  -- 分配头像色（4 个不重复）
  uid1 := gen_random_uuid(); uid2 := gen_random_uuid(); uid3 := gen_random_uuid(); uid4 := gen_random_uuid();
  c1 := 'c1'; c2 := 'c2'; c3 := 'c5'; c4 := 'c8';

  -- 1) auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (uid1, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e1, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"随想者"}', now(), now()),
    (uid2, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e2, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"职场人"}', now(), now()),
    (uid3, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e3, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"感性派"}', now(), now()),
    (uid4, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', e4, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), now(), '{"provider":"seed","providers":["seed"]}', '{"seed":true,"label":"乐天派"}', now(), now());

  -- 2) public.users
  INSERT INTO public.users (id, email, bottle_no, avatar_color) VALUES
    (uid1, e1, no1, c1),
    (uid2, e2, no2, c2),
    (uid3, e3, no3, c3),
    (uid4, e4, no4, c4);

  -- 3) seed_accounts
  INSERT INTO public.seed_accounts (user_id, label, notes) VALUES
    (uid1, '随想者', '偏日常随想，语气随意'),
    (uid2, '职场人', '偏职场吐槽/感悟'),
    (uid3, '感性派', '偏情感/夜晚心绪'),
    (uid4, '乐天派', '偏轻松/搞笑/正能量');

  -- 4) quotas（今日各扔 2 瓶）
  INSERT INTO public.quotas (user_id, date, thrown, picked) VALUES
    (uid1, current_date, 2, 0),
    (uid2, current_date, 2, 0),
    (uid3, current_date, 2, 0),
    (uid4, current_date, 2, 0);

  -- 5) 种子瓶内容（8 条，每人 2 条）
  INSERT INTO public.bottles (id, user_id, content, mood, status, created_at) VALUES
    -- 随想者 (c1 暖咖)
    (gen_random_uuid(), uid1, '刚在食堂吃饭，旁边两个人在聊竞品方案，突然觉得自己是不是也该想想这些', '有灵感', 'drifting', now() - interval '2 hours'),
    (gen_random_uuid(), uid1, '下雨天最适合发呆了，你们呢', '发呆', 'drifting', now() - interval '45 minutes'),

    -- 职场人 (c2 海蓝)
    (gen_random_uuid(), uid2, '周会完了一身疲惫，谁来聊聊怎么搞需求优先级', '想吐槽', 'drifting', now() - interval '3 hours'),
    (gen_random_uuid(), uid2, '今天被拉了三个对齐会，一个结论都没对齐', '加班', 'drifting', now() - interval '1 hour'),

    -- 感性派 (c5 苔绿)
    (gen_random_uuid(), uid3, '深夜听歌总会想起一些事，不知道是不是只有我这样', 'emo', 'drifting', now() - interval '5 hours'),
    (gen_random_uuid(), uid3, '有时候觉得在这个城市待了这么久，还是有点孤单', '想聊', 'drifting', now() - interval '30 minutes'),

    -- 乐天派 (c8 暖琥珀)
    (gen_random_uuid(), uid4, '今天食堂居然有糖醋排骨！快乐就是这么简单', '开心', 'drifting', now() - interval '4 hours'),
    (gen_random_uuid(), uid4, '摸鱼刷到这条的你，今天辛苦了，奖励自己一杯咖啡吧', '摸鱼', 'drifting', now() - interval '15 minutes');

  RAISE NOTICE '✅ 4 个种子账号已创建，8 个瓶子已投放';
  RAISE NOTICE '  随想者 No.% (c1 暖咖) — 2 瓶', no1;
  RAISE NOTICE '  职场人 No.% (c2 海蓝) — 2 瓶', no2;
  RAISE NOTICE '  感性派 No.% (c5 苔绿) — 2 瓶', no3;
  RAISE NOTICE '  乐天派 No.% (c8 暖琥珀) — 2 瓶', no4;
END $$;
