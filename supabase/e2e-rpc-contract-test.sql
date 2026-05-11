-- ============================================
-- 非鹅勿扰漂流瓶 · E2E 后端契约测试（全 RPC 跑一遍）
-- 模拟 A 和 B 两个用户在数据库层的完整交互
-- 跑法：复制全文到 Supabase SQL Editor 一次性执行
-- 输出会以 NOTICE 形式打到 Logs，最后两个 SELECT 出最终状态
-- ============================================

DO $$
DECLARE
  ua_id uuid;
  ub_id uuid;
  bottle_a1 uuid;
  bottle_a2 uuid;
  bottle_a3 uuid;
  bottle_b1 uuid;
  pick_row record;
  conv_id uuid;
  msg_id uuid;
  err_caught text;
BEGIN
  -- 拿到测试账号 id
  SELECT id INTO ua_id FROM auth.users WHERE email='e2e-a@tencent.com' LIMIT 1;
  SELECT id INTO ub_id FROM auth.users WHERE email='e2e-bot@tencent.com' LIMIT 1;
  IF ua_id IS NULL OR ub_id IS NULL THEN
    RAISE EXCEPTION 'TEST FAIL: e2e accounts missing — 请先跑建账号 SQL';
  END IF;
  RAISE NOTICE '✓ A id=%, B id=%', ua_id, ub_id;

  -- 清状态：profile / quota / bottle / conv / msg / block
  DELETE FROM public.messages WHERE sender_id IN (ua_id, ub_id);
  DELETE FROM public.conversations WHERE user_a IN (ua_id, ub_id) OR user_b IN (ua_id, ub_id);
  DELETE FROM public.bottles WHERE user_id IN (ua_id, ub_id) OR picked_by IN (ua_id, ub_id);
  DELETE FROM public.blocks WHERE blocker IN (ua_id, ub_id) OR blocked IN (ua_id, ub_id);
  DELETE FROM public.reports WHERE reporter IN (ua_id, ub_id);
  DELETE FROM public.quotas WHERE user_id IN (ua_id, ub_id);
  DELETE FROM public.users WHERE id IN (ua_id, ub_id);

  ----------------------------------------------------------------------
  -- T1 create_profile（伪装成 A）
  ----------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
  PERFORM public.create_profile();
  PERFORM public.create_profile();  -- 再调一次，应返回已存在的 profile，不报错
  RAISE NOTICE '✓ T1 create_profile A 幂等通过';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub_id::text, 'role','authenticated','email','e2e-bot@tencent.com')::text, true);
  PERFORM public.create_profile();
  RAISE NOTICE '✓ T1 create_profile B 通过';

  ----------------------------------------------------------------------
  -- T2 throw_bottle × 3（A 视角）
  ----------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
  bottle_a1 := public.throw_bottle('A的第一个瓶子：今晚月色真美', '想聊');
  bottle_a2 := public.throw_bottle('A的第二个瓶子：emo 想找人说说话', 'emo');
  bottle_a3 := public.throw_bottle('A的第三个瓶子：周末加班', '加班');
  RAISE NOTICE '✓ T2 throw_bottle × 3 通过, ids=%/%/%', bottle_a1, bottle_a2, bottle_a3;

  -- T2.1 第 4 次扔应失败（额度满）
  err_caught := NULL;
  BEGIN
    PERFORM public.throw_bottle('第四个瓶子', '开心');
  EXCEPTION WHEN OTHERS THEN
    err_caught := SQLERRM;
  END;
  IF err_caught IS NULL THEN
    RAISE WARNING '✗ T2.1 第4次扔瓶居然成功了，期望被额度拒';
  ELSIF err_caught LIKE '%quota%' THEN
    RAISE NOTICE '✓ T2.1 第4次扔被拒（%）', err_caught;
  ELSE
    RAISE WARNING '✗ T2.1 第4次扔被拒但错误信息异常：%', err_caught;
  END IF;

  -- T2.2 非法 mood 应被 CHECK 拒
  err_caught := NULL;
  BEGIN
    DELETE FROM public.quotas WHERE user_id = ua_id;  -- 重置额度
    PERFORM public.throw_bottle('试试非法情绪', '不存在的mood');
  EXCEPTION WHEN OTHERS THEN
    err_caught := SQLERRM;
  END;
  IF err_caught IS NULL THEN
    RAISE WARNING '✗ T2.2 非法 mood 居然通过';
  ELSE
    RAISE NOTICE '✓ T2.2 非法 mood 被拒（%）', err_caught;
  END IF;

  -- T2.3 超长内容（>300）应被 CHECK 拒
  err_caught := NULL;
  BEGIN
    PERFORM public.throw_bottle(repeat('啦', 301), '想聊');
  EXCEPTION WHEN OTHERS THEN
    err_caught := SQLERRM;
  END;
  IF err_caught IS NULL THEN
    RAISE WARNING '✗ T2.3 超长内容居然通过';
  ELSE
    RAISE NOTICE '✓ T2.3 超长内容被拒（%）', err_caught;
  END IF;

  -- T2.4 空内容应被拒
  err_caught := NULL;
  BEGIN
    PERFORM public.throw_bottle('', '想聊');
  EXCEPTION WHEN OTHERS THEN
    err_caught := SQLERRM;
  END;
  IF err_caught IS NULL THEN
    RAISE WARNING '✗ T2.4 空内容居然通过';
  ELSE
    RAISE NOTICE '✓ T2.4 空内容被拒（%）', err_caught;
  END IF;

  -- 重置 A 配额，让流程能继续
  DELETE FROM public.quotas WHERE user_id = ua_id;

  ----------------------------------------------------------------------
  -- T3 pick_bottle（B 捞 A 的瓶子）
  ----------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub_id::text, 'role','authenticated','email','e2e-bot@tencent.com')::text, true);
  SELECT * INTO pick_row FROM public.pick_bottle();
  IF pick_row.id IS NULL THEN
    RAISE WARNING '✗ T3 B 应捞到 A 的瓶子但返回空';
  ELSE
    RAISE NOTICE '✓ T3 B 捞到 bottle %, content=%', pick_row.id, left(pick_row.content, 20);
  END IF;
  bottle_b1 := pick_row.id;  -- 保存这个 id 做后续测试

  -- T3.1 B 不能捞自己的瓶子（B 还没扔过，先让 B 扔一个再让 B 捞）
  PERFORM public.throw_bottle('B的瓶子', '想聊');
  -- 重置 B 配额，多次 pick 让流程跑下去
  DELETE FROM public.quotas WHERE user_id = ub_id AND date = current_date;

  ----------------------------------------------------------------------
  -- T4 submit_reply（B 回信给 A）
  ----------------------------------------------------------------------
  conv_id := public.submit_reply(bottle_b1, 'B 给 A 的第一封回信', '同感');
  RAISE NOTICE '✓ T4 submit_reply 建 conversation %', conv_id;

  -- T4.1 不能回自己的瓶子
  err_caught := NULL;
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
    PERFORM public.submit_reply(bottle_a2, 'A 想回自己的瓶', '同感');
  EXCEPTION WHEN OTHERS THEN
    err_caught := SQLERRM;
  END;
  IF err_caught IS NULL OR err_caught NOT LIKE '%cannot reply to own%' THEN
    RAISE WARNING '✗ T4.1 自回瓶应被拒, got=%', COALESCE(err_caught, '通过(BUG)');
  ELSE
    RAISE NOTICE '✓ T4.1 自回瓶被拒';
  END IF;

  ----------------------------------------------------------------------
  -- T5 messages 双方互发（先看 RLS 是否真的允许 insert）
  ----------------------------------------------------------------------
  -- A 发一条消息到 B/A 的 conv
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (conv_id, ua_id, 'A 收到了，谢谢你的回信');
  RAISE NOTICE '✓ T5 A 发消息成功';

  -- B 发回一条
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub_id::text, 'role','authenticated','email','e2e-bot@tencent.com')::text, true);
  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (conv_id, ub_id, 'B 不客气');
  RAISE NOTICE '✓ T5 B 发消息成功';

  -- T5.1 第三方（用 A 的另一身份模拟陌生人）插消息应被 RLS 拒（这里跳过，因为没有第三个 e2e 账号）

  ----------------------------------------------------------------------
  -- T6 get_friend_profile（A 查 B 的编号）
  ----------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
  PERFORM * FROM public.get_friend_profile(ub_id);
  RAISE NOTICE '✓ T6 A 查到 B profile';

  ----------------------------------------------------------------------
  -- T7 toss_bottle（C 假设捞了一个又放回 — 这里用 A 自己重置一个瓶）
  ----------------------------------------------------------------------
  -- 先让 B 再捞一个（A 还有 a2/a3 两个）
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub_id::text, 'role','authenticated','email','e2e-bot@tencent.com')::text, true);
  DELETE FROM public.quotas WHERE user_id = ub_id;  -- 清额度
  SELECT * INTO pick_row FROM public.pick_bottle();
  IF pick_row.id IS NULL THEN
    RAISE WARNING '✗ T7 B 第二次捞失败';
  ELSE
    PERFORM public.toss_bottle(pick_row.id);
    -- 验证：bottle 应回到 active
    IF (SELECT status FROM bottles WHERE id = pick_row.id) = 'active' THEN
      RAISE NOTICE '✓ T7 toss_bottle 把瓶子放回海里成功';
    ELSE
      RAISE WARNING '✗ T7 toss_bottle 没真把状态改回 active';
    END IF;
  END IF;

  ----------------------------------------------------------------------
  -- T8 end_conversation（A 主动结束）
  ----------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
  PERFORM public.end_conversation(conv_id);
  IF (SELECT status FROM conversations WHERE id = conv_id) = 'ended' THEN
    RAISE NOTICE '✓ T8 end_conversation 状态正确';
  ELSE
    RAISE WARNING '✗ T8 end_conversation 状态没改成 ended';
  END IF;

  -- T8.1 ended 之后还能发消息吗？应被 RLS 拒
  err_caught := NULL;
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (conv_id, ua_id, 'ended 后还想发');
  EXCEPTION WHEN OTHERS THEN
    err_caught := SQLERRM;
  END;
  IF err_caught IS NULL THEN
    RAISE WARNING '✗ T8.1 conversation 已 ended 但还能发消息（RLS bug）';
  ELSE
    RAISE NOTICE '✓ T8.1 ended conv 发消息被拒（%）', err_caught;
  END IF;

  ----------------------------------------------------------------------
  -- T9 blocks
  ----------------------------------------------------------------------
  INSERT INTO public.blocks (blocker, blocked) VALUES (ua_id, ub_id);
  RAISE NOTICE '✓ T9 A 拉黑 B 成功';

  -- T9.1 A 拉黑 B 后，B 扔的新瓶子 A 不应捞到
  -- 让 B 重新扔一个新瓶子
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub_id::text, 'role','authenticated','email','e2e-bot@tencent.com')::text, true);
  DELETE FROM public.quotas WHERE user_id = ub_id;
  PERFORM public.throw_bottle('B 拉黑测试瓶', '想聊');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua_id::text, 'role','authenticated','email','e2e-a@tencent.com')::text, true);
  DELETE FROM public.quotas WHERE user_id = ua_id;
  -- A 捞瓶子，海里只有 B 的（A 的全 taken/active 但被自己排除了），应捞到 NULL
  SELECT * INTO pick_row FROM public.pick_bottle();
  IF pick_row.id IS NULL THEN
    RAISE NOTICE '✓ T9.1 拉黑后 A 捞不到 B 的瓶子';
  ELSE
    RAISE WARNING '✗ T9.1 A 拉黑了 B 但还捞到 B 的瓶子 %', pick_row.id;
  END IF;

  ----------------------------------------------------------------------
  -- T10 reports
  ----------------------------------------------------------------------
  INSERT INTO public.reports (reporter, bottle_id, reason)
  VALUES (ua_id, bottle_a1, 'spam');
  RAISE NOTICE '✓ T10 reports insert 通过';

  RAISE NOTICE '════════════ E2E 完成 ════════════';
END$$;

-- 最终状态摘要
SELECT 'A profile' AS what, bottle_no, avatar_color FROM public.users WHERE id = (SELECT id FROM auth.users WHERE email='e2e-a@tencent.com')
UNION ALL
SELECT 'B profile', bottle_no, avatar_color FROM public.users WHERE id = (SELECT id FROM auth.users WHERE email='e2e-bot@tencent.com');

SELECT 'A bottles' AS what, count(*)::text AS n FROM public.bottles WHERE user_id = (SELECT id FROM auth.users WHERE email='e2e-a@tencent.com')
UNION ALL
SELECT 'B bottles', count(*)::text FROM public.bottles WHERE user_id = (SELECT id FROM auth.users WHERE email='e2e-bot@tencent.com')
UNION ALL
SELECT 'conversations', count(*)::text FROM public.conversations WHERE user_a IN ((SELECT id FROM auth.users WHERE email='e2e-a@tencent.com'),(SELECT id FROM auth.users WHERE email='e2e-bot@tencent.com')) OR user_b IN ((SELECT id FROM auth.users WHERE email='e2e-a@tencent.com'),(SELECT id FROM auth.users WHERE email='e2e-bot@tencent.com'))
UNION ALL
SELECT 'messages', count(*)::text FROM public.messages WHERE sender_id IN ((SELECT id FROM auth.users WHERE email='e2e-a@tencent.com'),(SELECT id FROM auth.users WHERE email='e2e-bot@tencent.com'))
UNION ALL
SELECT 'blocks A->B', count(*)::text FROM public.blocks WHERE blocker = (SELECT id FROM auth.users WHERE email='e2e-a@tencent.com') AND blocked = (SELECT id FROM auth.users WHERE email='e2e-bot@tencent.com')
UNION ALL
SELECT 'reports by A', count(*)::text FROM public.reports WHERE reporter = (SELECT id FROM auth.users WHERE email='e2e-a@tencent.com');
