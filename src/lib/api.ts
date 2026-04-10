/**
 * Data API layer — Supabase online / localStorage offline dual-mode
 * When VITE_SUPABASE_URL is set, uses real DB; otherwise falls back to localStorage.
 */
import { supabase, isOnline } from '../lib/supabase';

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
