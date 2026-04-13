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
  if (isOnline() && supabase) {
    const { data, error } = await supabase.from('users').insert(u).select('id, order_num').single();
    if (error) throw error;
    return { id: data.id, orderNum: data.order_num };
  }
  // offline
  const count = parseInt(localStorage.getItem('feierwurao_user_count') || '0', 10) + 1;
  localStorage.setItem('feierwurao_user_count', String(count));
  const id = `user-${Date.now()}`;
  const users = JSON.parse(localStorage.getItem('feierwurao_users') || '[]');
  users.push({ ...u, id, order_num: count, created_at: new Date().toISOString() });
  localStorage.setItem('feierwurao_users', JSON.stringify(users));
  return { id, orderNum: count };
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
export async function sendLightNotification(fromUserId: string, toUserId: string): Promise<void> {
  if (isOnline() && supabase) {
    await supabase.from('light_notifications').insert({ from_user_id: fromUserId, to_user_id: toUserId });
    return;
  }
  // offline — skip
}

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
export async function createMatch(user1Id: string, user2Id: string): Promise<void> {
  if (isOnline() && supabase) {
    await supabase.from('matches').insert({ user1_id: user1Id, user2_id: user2Id });
    return;
  }
  const matches = JSON.parse(localStorage.getItem('feierwurao_matches') || '[]');
  matches.push({ user1_id: user1Id, user2_id: user2Id, matched_at: new Date().toISOString() });
  localStorage.setItem('feierwurao_matches', JSON.stringify(matches));
}

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
// Hard filter: gender preference only
// Soft sort: same city first
// Guests CAN reappear, but shown with different questions each time
// Only exclude: guests you already sent a light notification to (confirmed interest)
// Require: must have answered at least 1 question
export async function fetchRealGuests(userId: string, prefGender: string, userCity: string, questionIds: number[]) {
  if (isOnline() && supabase) {
    // 1. Get all users matching gender preference (exclude self)
    const { data: candidates } = await supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .eq('gender', prefGender)
      .limit(100);

    if (!candidates || candidates.length === 0) return [];

    // 2. Get all answered user IDs to filter out those with no answers
    const candidateIds = candidates.map((c: { id: string }) => c.id);
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('user_id, question_id, content')
      .in('user_id', candidateIds);

    const answeredUserIds = new Set((allAnswers || []).map((a: { user_id: string }) => a.user_id));

    // 3. Only exclude guests you already CONFIRMED interest in (sent light notification)
    // Guests you previously saw and dismissed CAN reappear with different questions
    const { data: sentLights } = await supabase
      .from('light_notifications')
      .select('to_user_id')
      .eq('from_user_id', userId);
    const confirmedIds = new Set((sentLights || []).map((r: { to_user_id: string }) => r.to_user_id));

    // 4. Filter: must have answers, not already confirmed
    const eligible = candidates.filter((c: { id: string }) =>
      answeredUserIds.has(c.id) && !confirmedIds.has(c.id)
    );

    if (eligible.length === 0) return [];

    // 5. Soft sort: same city first, then shuffle within each group
    const sameCity = eligible.filter((c: { base_city: string }) => c.base_city === userCity);
    const otherCity = eligible.filter((c: { base_city: string }) => c.base_city !== userCity);
    const sorted = [
      ...sameCity.sort(() => Math.random() - 0.5),
      ...otherCity.sort(() => Math.random() - 0.5),
    ].slice(0, 5);

    // 6. For each guest, get answers but EXCLUDE questions already shown to this user
    // Get previously shown question-guest pairs
    const { data: seenPairs } = await supabase
      .from('light_actions')
      .select('to_user_id, question_id')
      .eq('from_user_id', userId);

    const seenMap = new Map<string, Set<number>>();
    (seenPairs || []).forEach((r: { to_user_id: string; question_id: number }) => {
      if (!seenMap.has(r.to_user_id)) seenMap.set(r.to_user_id, new Set());
      seenMap.get(r.to_user_id)!.add(r.question_id);
    });

    const selectedIds = sorted.map((c: { id: string }) => c.id);
    const { data: guestAnswers } = await supabase
      .from('answers')
      .select('user_id, question_id, content')
      .in('user_id', selectedIds);

    return sorted.map((c: { id: string; nickname: string; avatar_color: string }) => {
      const seenQs = seenMap.get(c.id) || new Set();
      // Prefer today's questions, but filter out already-seen ones
      let answers = (guestAnswers || [])
        .filter((a: { user_id: string; question_id: number }) =>
          a.user_id === c.id && !seenQs.has(a.question_id)
        );
      // Prioritize today's question IDs
      const todayAnswers = answers.filter((a: { question_id: number }) => questionIds.includes(a.question_id));
      const otherAnswers = answers.filter((a: { question_id: number }) => !questionIds.includes(a.question_id));
      const finalAnswers = [...todayAnswers, ...otherAnswers].slice(0, 4);

      return {
        id: c.id,
        nickname: c.nickname,
        avatarColor: c.avatar_color,
        answers: finalAnswers.map((a: { question_id: number; content: string }) => ({
          questionId: a.question_id,
          content: a.content,
        })),
        lightStatus: 'on' as const,
      };
    });
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
    const { data: users } = await supabase.from('users').select('id, nickname, avatar_color, wechat_id').in('id', otherIds);

    return data.map((m: { id: string; user1_id: string; user2_id: string; matched_at: string }) => {
      const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
      const u = (users || []).find((x: { id: string }) => x.id === otherId);
      return {
        id: m.id,
        user: { nickname: u?.nickname || '匿名', avatarColor: u?.avatar_color || '#7C6DD8' },
        wechatId: u?.wechat_id || '',
        matchedAt: m.matched_at,
      };
    });
  }
  return [];
}

// ============ Finalize Light (send notification + check mutual) ============
export async function finalizeLightAction(fromUserId: string, toUserId: string): Promise<{ matched: boolean; wechatId?: string }> {
  if (isOnline() && supabase) {
    // Send light notification
    await supabase.from('light_notifications').insert({ from_user_id: fromUserId, to_user_id: toUserId });

    // Check if the other person already lit for me (mutual match)
    const { data: mutual } = await supabase
      .from('light_notifications')
      .select('id')
      .eq('from_user_id', toUserId)
      .eq('to_user_id', fromUserId)
      .eq('status', 'pending')
      .limit(1);

    if (mutual && mutual.length > 0) {
      // Mutual match! Create match record
      await supabase.from('matches').insert({ user1_id: fromUserId, user2_id: toUserId });
      // Update both notifications to matched
      await supabase.from('light_notifications').update({ status: 'matched' }).eq('from_user_id', toUserId).eq('to_user_id', fromUserId);
      await supabase.from('light_notifications').update({ status: 'matched' }).eq('from_user_id', fromUserId).eq('to_user_id', toUserId);
      // Get matched user's wechat
      const { data: matchedUser } = await supabase.from('users').select('wechat_id').eq('id', toUserId).single();
      return { matched: true, wechatId: matchedUser?.wechat_id || '' };
    }
    return { matched: false };
  }
  return { matched: false };
}

// ============ Respond to Light ============
export async function respondToLightNotification(notificationId: string, fromUserId: string, toUserId: string, accept: boolean): Promise<{ matched: boolean; wechatId?: string }> {
  if (isOnline() && supabase) {
    if (accept) {
      await supabase.from('light_notifications').update({ status: 'matched' }).eq('id', notificationId);
      await supabase.from('matches').insert({ user1_id: fromUserId, user2_id: toUserId });
      const { data: matchedUser } = await supabase.from('users').select('wechat_id').eq('id', fromUserId).single();
      return { matched: true, wechatId: matchedUser?.wechat_id || '' };
    } else {
      await supabase.from('light_notifications').update({ status: 'ignored' }).eq('id', notificationId);
      return { matched: false };
    }
  }
  return { matched: false };
}
