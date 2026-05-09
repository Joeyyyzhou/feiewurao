/**
 * Data API layer — Supabase online / localStorage offline dual-mode
 * When VITE_SUPABASE_URL is set, uses real DB; otherwise falls back to localStorage.
 */
import { supabase, isOnline } from '../lib/supabase';

// ============ Email Verification (via Vercel Serverless + Resend) ============
export async function sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
  if (isOnline()) {
    try {
      const res = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || '发送失败' };
      return { success: true };
    } catch {
      return { success: false, error: '网络错误，请重试' };
    }
  }
  // offline — auto-pass
  return { success: true };
}

export async function verifyOtpCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  if (isOnline()) {
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || '验证失败' };
      return { success: true };
    } catch {
      return { success: false, error: '网络错误，请重试' };
    }
  }
  // offline — any code passes
  return { success: true };
}

// ============ PV ============
export async function recordPV(): Promise<number> {
  if (isOnline() && supabase) {
    await supabase.from('page_views').insert({});
    const { count } = await supabase.from('page_views').select('*', { count: 'exact', head: true });
    return count ?? 0;
  }
  // offline
  const n = parseInt(localStorage.getItem('feierwurao_pv') || '0', 10) + 1;
  localStorage.setItem('feierwurao_pv', String(n));
  const today = new Date().toISOString().split('T')[0];
  const daily: Record<string, number> = JSON.parse(localStorage.getItem('feierwurao_daily_pv') || '{}');
  daily[today] = (daily[today] || 0) + 1;
  localStorage.setItem('feierwurao_daily_pv', JSON.stringify(daily));
  return n;
}

export async function getPVCount(): Promise<number> {
  if (isOnline() && supabase) {
    const { count } = await supabase.from('page_views').select('*', { count: 'exact', head: true });
    return count ?? 0;
  }
  return parseInt(localStorage.getItem('feierwurao_pv') || '0', 10);
}

// ============ User Registration ============
export interface UserRow {
  id?: string;
  email: string;
  nickname: string;
  gender: 'male' | 'female';
  base_city: string;
  wechat_id: string;
  avatar_color: string;
  pref_gender: 'male' | 'female';
  pref_base_cities: string[];
  order_num?: number;
  day_count?: number;
  created_at?: string;
}

export async function registerUser(u: Omit<UserRow, 'id' | 'order_num' | 'day_count' | 'created_at'>): Promise<{ id: string; orderNum: number }> {
  // 通过 API route 注册（服务端加密微信号）
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || '注册失败');
    return { id: data.id, orderNum: data.orderNum };
  } catch (e) {
    // 兜底：直接用 Supabase（微信号不加密）
    if (isOnline() && supabase) {
      const { data, error } = await supabase.from('users').insert(u).select('id, order_num').single();
      if (error) throw error;
      return { id: data.id, orderNum: data.order_num };
    }
    throw e;
  }
}

// 通过后端 API 更新资料（wechat_id 走加密）
export async function updateUserProfile(
  userId: string,
  fields: { nickname?: string; baseCity?: string; wechatId?: string }
): Promise<boolean> {
  try {
    const res = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...fields }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || '更新资料失败');
    return true;
  } catch (e) {
    // 兜底：直接走 supabase（wechat_id 不加密）。仅在 API 路由不可用时触发。
    if (isOnline() && supabase) {
      const dbFields: Record<string, string> = {};
      if (fields.nickname) dbFields.nickname = fields.nickname;
      if (fields.baseCity) dbFields.base_city = fields.baseCity;
      if (fields.wechatId) dbFields.wechat_id = fields.wechatId;
      if (Object.keys(dbFields).length === 0) return false;
      const { error } = await supabase.from('users').update(dbFields).eq('id', userId);
      if (error) throw error;
      return true;
    }
    throw e;
  }
}

// ============ Answers ============
export async function submitAnswer(userId: string, questionId: number, content: string): Promise<void> {
  if (isOnline() && supabase) {
    await supabase.from('answers').insert({ user_id: userId, question_id: questionId, content });
    return;
  }
  const answers = JSON.parse(localStorage.getItem('feierwurao_answers') || '[]');
  answers.push({ user_id: userId, question_id: questionId, content, answered_date: new Date().toISOString().split('T')[0] });
  localStorage.setItem('feierwurao_answers', JSON.stringify(answers));
}

export async function getAnsweredQuestionIds(userId: string): Promise<number[]> {
  if (isOnline() && supabase) {
    const { data } = await supabase.from('answers').select('question_id').eq('user_id', userId);
    return (data || []).map((r: { question_id: number }) => r.question_id);
  }
  const answers = JSON.parse(localStorage.getItem('feierwurao_answers') || '[]');
  return answers.filter((a: { user_id: string }) => a.user_id === userId).map((a: { question_id: number }) => a.question_id);
}

// ============ Light Actions ============
export async function recordLightAction(fromUserId: string, toUserId: string, action: 'on' | 'off', questionId?: number): Promise<void> {
  if (isOnline() && supabase) {
    await supabase.from('light_actions').insert({ from_user_id: fromUserId, to_user_id: toUserId, action, question_id: questionId });
    return;
  }
  const lights = JSON.parse(localStorage.getItem('feierwurao_lights') || '[]');
  lights.push({ from_user_id: fromUserId, to_user_id: toUserId, action, question_id: questionId, created_at: new Date().toISOString() });
  localStorage.setItem('feierwurao_lights', JSON.stringify(lights));
}

// ============ Final Light (留灯通知) ============
// 注意：sendLightNotification/createMatch 已废弃——所有留灯/匹配必须走后端 /api/match
// （否则会绕过邮件发送）。如需直接写库请通过 finalizeLightAction / respondToLightNotification。

export async function getMyLightNotifications(userId: string): Promise<unknown[]> {
  if (isOnline() && supabase) {
    const { data } = await supabase
      .from('light_notifications')
      .select('*, from_user:users!from_user_id(nickname, avatar_color)')
      .eq('to_user_id', userId)
      .eq('status', 'pending');
    return data || [];
  }
  return [];
}

// ============ Matches ============
// 注意：createMatch 已废弃——matches 写库统一在后端 /api/match 中完成（finalize/respond 路径）
// 这样能保证发邮件链路同时触发。前端不再直接 INSERT。

// ============ Guest Matching (get eligible guests) ============
export async function getEligibleGuests(userId: string, prefGender: string, prefCities: string[], questionIds: number[]): Promise<unknown[]> {
  if (isOnline() && supabase) {
    let query = supabase.from('users').select('*').neq('id', userId).eq('gender', prefGender);
    if (prefCities.length > 0) {
      query = query.in('base_city', prefCities);
    }
    const { data: candidates } = await query.limit(20);
    if (!candidates || candidates.length === 0) return [];

    // Get answers for these candidates for the given questions
    const candidateIds = candidates.map((c: { id: string }) => c.id);
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .in('user_id', candidateIds)
      .in('question_id', questionIds);

    // Assemble guest cards
    return candidates.slice(0, 5).map((c: { id: string; nickname: string; avatar_color: string }) => ({
      id: c.id,
      nickname: c.nickname,
      avatarColor: c.avatar_color,
      answers: (answers || [])
        .filter((a: { user_id: string }) => a.user_id === c.id)
        .map((a: { question_id: number; content: string }) => ({ questionId: a.question_id, content: a.content })),
      lightStatus: 'on',
    }));
  }
  return []; // offline uses mockData
}

// ============ Admin API ============
export async function getAdminStats() {
  if (isOnline() && supabase) {
    const [pvRes, usersRes, lightsRes, matchesRes] = await Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*'),
      supabase.from('light_actions').select('*'),
      supabase.from('matches').select('*'),
    ]);

    const users = usersRes.data || [];
    const dailyPVRes = await supabase.from('daily_pv_summary').select('*').limit(30);

    return {
      pv: pvRes.count ?? 0,
      userCount: users.length,
      users: users.map((u: UserRow & { order_num: number; created_at: string }) => ({
        id: u.id,
        nickname: u.nickname,
        gender: u.gender,
        baseCity: u.base_city,
        avatarColor: u.avatar_color,
        registeredAt: u.created_at,
        orderNum: u.order_num,
      })),
      lights: (lightsRes.data || []).map((l: { from_user_id: string; to_user_id: string; action: string; created_at: string }) => ({
        fromUser: l.from_user_id,
        toUser: l.to_user_id,
        action: l.action,
        timestamp: l.created_at,
      })),
      matches: (matchesRes.data || []).map((m: { user1_id: string; user2_id: string; matched_at: string }) => ({
        user1: m.user1_id,
        user2: m.user2_id,
        matchedAt: m.matched_at,
      })),
      dailyPV: Object.fromEntries((dailyPVRes.data || []).map((d: { date: string; pv_count: number }) => [d.date, d.pv_count])),
      genderStats: {
        male: users.filter((u: { gender: string }) => u.gender === 'male').length,
        female: users.filter((u: { gender: string }) => u.gender === 'female').length,
        total: users.length,
      },
      cityStats: Object.entries(
        users.reduce((acc: Record<string, number>, u: { base_city: string }) => {
          acc[u.base_city] = (acc[u.base_city] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => (b[1] as number) - (a[1] as number)),
    };
  }

  // offline fallback
  const users = JSON.parse(localStorage.getItem('feierwurao_users') || '[]');
  const lights = JSON.parse(localStorage.getItem('feierwurao_lights') || '[]');
  const matches = JSON.parse(localStorage.getItem('feierwurao_matches') || '[]');
  const dailyPV = JSON.parse(localStorage.getItem('feierwurao_daily_pv') || '{}');
  const pv = parseInt(localStorage.getItem('feierwurao_pv') || '0', 10);

  return {
    pv,
    userCount: users.length,
    users,
    lights,
    matches,
    dailyPV,
    genderStats: {
      male: users.filter((u: { gender: string }) => u.gender === 'male').length,
      female: users.filter((u: { gender: string }) => u.gender === 'female').length,
      total: users.length,
    },
    cityStats: Object.entries(
      users.reduce((acc: Record<string, number>, u: { base_city?: string; baseCity?: string }) => {
        const city = u.base_city || u.baseCity || '未知';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => (b[1] as number) - (a[1] as number)),
  };
}

// ============ Real Guest Matching ============
// 核心逻辑：
// 1. 性别偏好硬筛
// 2. 嘉宾必须和你有共同回答过的题（不限当天）
// 3. 展示给你看的是共同题目的回答（对比才有意义）
// 4. 按共同回答数量排序（重叠越多越优先）+ 同城优先
// 5. 已留灯的嘉宾不再出现
export async function fetchRealGuests(userId: string, prefGender: string, userCity: string, _questionIds: number[]) {
  if (isOnline() && supabase) {
    // 1. 获取当前用户回答过的所有题目 ID
    const { data: myAnswers } = await supabase
      .from('answers')
      .select('question_id')
      .eq('user_id', userId);
    
    const myAnsweredIds = new Set((myAnswers || []).map((a: { question_id: number }) => a.question_id));
    if (myAnsweredIds.size === 0) return [];

    // 2. 获取符合性别偏好的候选人（排除自己）
    const { data: candidates } = await supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .eq('gender', prefGender)
      .limit(100);

    if (!candidates || candidates.length === 0) return [];

    // 3. 获取所有候选人的回答
    const candidateIds = candidates.map((c: { id: string }) => c.id);
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('user_id, question_id, content')
      .in('user_id', candidateIds);

    // 4. 计算每个候选人和我的共同回答题目数
    const candidateAnswerMap = new Map<string, { question_id: number; content: string }[]>();
    (allAnswers || []).forEach((a: { user_id: string; question_id: number; content: string }) => {
      if (!candidateAnswerMap.has(a.user_id)) candidateAnswerMap.set(a.user_id, []);
      candidateAnswerMap.get(a.user_id)!.push({ question_id: a.question_id, content: a.content });
    });

    // 5. 排除已留灯的嘉宾 + 被拉黑的用户
    const { data: sentLights } = await supabase
      .from('light_notifications')
      .select('to_user_id')
      .eq('from_user_id', userId);
    const confirmedIds = new Set((sentLights || []).map((r: { to_user_id: string }) => r.to_user_id));

    const blockedIds = new Set(await getBlockedUserIds(userId));

    // 6. 筛选 + 排序
    const eligible = candidates
      .filter((c: { id: string }) => {
        if (confirmedIds.has(c.id)) return false;
        if (blockedIds.has(c.id)) return false; // 排除被拉黑的用户
        const answers = candidateAnswerMap.get(c.id) || [];
        // 必须有至少1道共同回答的题
        return answers.some(a => myAnsweredIds.has(a.question_id));
      })
      .map((c: { id: string; nickname: string; avatar_color: string; base_city: string }) => {
        const answers = candidateAnswerMap.get(c.id) || [];
        const commonAnswers = answers.filter(a => myAnsweredIds.has(a.question_id));
        return {
          ...c,
          commonCount: commonAnswers.length,
          commonAnswers,
        };
      })
      // 排序：共同回答数多的优先，同城优先
      .sort((a: { commonCount: number; base_city: string }, b: { commonCount: number; base_city: string }) => {
        const cityA = a.base_city === userCity ? 1 : 0;
        const cityB = b.base_city === userCity ? 1 : 0;
        if (cityB !== cityA) return cityB - cityA;
        return b.commonCount - a.commonCount;
      })
      .slice(0, 5);

    // 7. 构建嘉宾卡片——只展示共同题目的回答（最多4题）
    return eligible.map((c: { id: string; nickname: string; avatar_color: string; commonAnswers: { question_id: number; content: string }[] }) => ({
      id: c.id,
      nickname: c.nickname,
      avatarColor: c.avatar_color,
      answers: c.commonAnswers.slice(0, 4).map(a => ({
        questionId: a.question_id,
        content: a.content,
      })),
      lightStatus: 'on' as const,
    }));
  }
  return [];
}

// ============ Real Light Notifications ============
export async function fetchMyNotifications(userId: string) {
  if (isOnline() && supabase) {
    const { data } = await supabase
      .from('light_notifications')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return [];

    // Get from_user details
    const fromIds = data.map((n: { from_user_id: string }) => n.from_user_id);
    const { data: users } = await supabase.from('users').select('id, nickname, avatar_color').in('id', fromIds);
    const { data: answers } = await supabase.from('answers').select('*').in('user_id', fromIds);

    return data.map((n: { id: string; from_user_id: string; status: string; created_at: string; expires_at: string }) => {
      const u = (users || []).find((x: { id: string }) => x.id === n.from_user_id);
      return {
        id: n.id,
        fromUser: {
          id: n.from_user_id,
          nickname: u?.nickname || '匿名',
          avatarColor: u?.avatar_color || '#7C6DD8',
          answers: (answers || [])
            .filter((a: { user_id: string }) => a.user_id === n.from_user_id)
            .slice(0, 4)
            .map((a: { question_id: number; content: string }) => ({ questionId: a.question_id, content: a.content })),
        },
        status: n.status,
        createdAt: n.created_at,
        expiresAt: n.expires_at,
      };
    });
  }
  return [];
}

// ============ Real Matches ============
export async function fetchMyMatches(userId: string) {
  if (isOnline() && supabase) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('matched_at', { ascending: false });

    if (!data || data.length === 0) return [];

    const otherIds = data.map((m: { user1_id: string; user2_id: string }) =>
      m.user1_id === userId ? m.user2_id : m.user1_id
    );
    const { data: users } = await supabase.from('users').select('id, nickname, avatar_color').in('id', otherIds);

    // 解密每个匹配对象的微信号
    const wechatMap = new Map<string, string>();
    for (const otherId of otherIds) {
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-match-wechat', matchedUserId: otherId }),
        });
        const result = await res.json();
        if (result.success) wechatMap.set(otherId, result.wechatId);
      } catch { /* ignore */ }
    }

    return data.map((m: { id: string; user1_id: string; user2_id: string; matched_at: string }) => {
      const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
      const u = (users || []).find((x: { id: string }) => x.id === otherId);
      return {
        id: m.id,
        userId: otherId,
        user: { nickname: u?.nickname || '匿名', avatarColor: u?.avatar_color || '#7C6DD8' },
        wechatId: wechatMap.get(otherId) || '',
        matchedAt: m.matched_at,
      };
    });
  }
  return [];
}

// ============ Finalize Light (send notification + check mutual) ============
export async function finalizeLightAction(fromUserId: string, toUserId: string): Promise<{ matched: boolean; wechatId?: string }> {
  try {
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finalize', fromUserId, toUserId }),
    });
    const data = await res.json();
    return { matched: data.matched || false, wechatId: data.wechatId || '' };
  } catch {
    return { matched: false };
  }
}

// ============ Respond to Light ============
export async function respondToLightNotification(notificationId: string, fromUserId: string, toUserId: string, accept: boolean): Promise<{ matched: boolean; wechatId?: string }> {
  try {
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'respond', notificationId, fromUserId, toUserId, accept }),
    });
    const data = await res.json();
    return { matched: data.matched || false, wechatId: data.wechatId || '' };
  } catch {
    return { matched: false };
  }
}

// ============ Delete User Account ============
export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (isOnline() && supabase) {
    try {
      // 级联删除会自动处理 answers, light_actions, light_notifications, matches（因为数据库 schema 用了 ON DELETE CASCADE）
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) { console.error('删除用户失败:', error); return false; }
      return true;
    } catch (e) {
      console.error('删除用户异常:', e);
      return false;
    }
  }
  return false;
}

// ============ Email Notification ============
export async function sendNotifyEmail(toEmail: string, type: 'light' | 'match', fromNickname?: string): Promise<void> {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toEmail, type, fromNickname }),
    });
  } catch (e) {
    console.error('发送通知邮件失败:', e);
  }
}

// ============ Get User Answers by ID ============
export async function getUserAnswers(userId: string): Promise<{ questionId: number; content: string }[]> {
  if (isOnline() && supabase) {
    const { data } = await supabase
      .from('answers')
      .select('question_id, content')
      .eq('user_id', userId)
      .order('question_id');
    return (data || []).map((a: { question_id: number; content: string }) => ({
      questionId: a.question_id,
      content: a.content,
    }));
  }
  return [];
}

// ============ Report & Block ============
export async function reportUser(
  fromUserId: string,
  toUserId: string,
  reason: string,
  questionId?: number,
  answerContent?: string,
): Promise<void> {
  if (isOnline() && supabase) {
    await supabase.from('reports').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      reason,
      question_id: questionId || null,
      answer_content: answerContent || null,
    });
  }
}

export async function blockUser(fromUserId: string, toUserId: string): Promise<void> {
  if (isOnline() && supabase) {
    // Upsert to avoid duplicate block entries
    await supabase.from('blocks').upsert({
      blocker_id: fromUserId,
      blocked_id: toUserId,
    }, { onConflict: 'blocker_id,blocked_id' });
  }
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  if (isOnline() && supabase) {
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);
    return (data || []).map((r: { blocked_id: string }) => r.blocked_id);
  }
  return [];
}
// 通过 Vercel API route 获取（使用 service key，绕过 RLS）
export async function syncUserState(_userId: string, email?: string): Promise<{
  dbUserId: string;
  dayCount: number;
  streak: number;
  todayAnsweredCount: number;
  createdAt: string;
  answeredQuestionIds: number[];
} | null> {
  if (!email) return null;
  try {
    const res = await fetch('/api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.success) return null;
    return {
      dbUserId: data.userId,
      dayCount: data.dayCount,
      streak: data.streak || 0,
      todayAnsweredCount: data.todayAnswerCount,
      createdAt: data.createdAt,
      answeredQuestionIds: data.answeredQuestionIds || [],
    };
  } catch (e) {
    console.error('syncUserState fetch error:', e);
    return null;
  }
}
