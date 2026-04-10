// Lightweight localStorage-based stats (replace with Supabase later)

const KEYS = {
  pv: 'feierwurao_pv',
  userCount: 'feierwurao_user_count',
  users: 'feierwurao_users',
  lights: 'feierwurao_lights',
  matches: 'feierwurao_matches',
};

// ---- PV ----
export function incrementPV(): number {
  const n = getPV() + 1;
  localStorage.setItem(KEYS.pv, String(n));
  return n;
}

export function getPV(): number {
  return parseInt(localStorage.getItem(KEYS.pv) || '0', 10);
}

// ---- User count ----
export function incrementUserCount(): number {
  const n = getUserCount() + 1;
  localStorage.setItem(KEYS.userCount, String(n));
  return n;
}

export function getUserCount(): number {
  return parseInt(localStorage.getItem(KEYS.userCount) || '0', 10);
}

// ---- User registry (for admin) ----
export interface RegisteredUser {
  id: string;
  nickname: string;
  gender: 'male' | 'female';
  baseCity: string;
  avatarColor: string;
  registeredAt: string;
  orderNum: number;
}

export function saveUser(u: RegisteredUser) {
  const list = getUsers();
  list.push(u);
  localStorage.setItem(KEYS.users, JSON.stringify(list));
}

export function getUsers(): RegisteredUser[] {
  try { return JSON.parse(localStorage.getItem(KEYS.users) || '[]'); }
  catch { return []; }
}

// ---- Light records (for admin) ----
export interface LightStat {
  fromUser: string;
  toUser: string;
  action: 'on' | 'off';
  timestamp: string;
}

export function saveLightAction(l: LightStat) {
  const list = getLightActions();
  list.push(l);
  localStorage.setItem(KEYS.lights, JSON.stringify(list));
}

export function getLightActions(): LightStat[] {
  try { return JSON.parse(localStorage.getItem(KEYS.lights) || '[]'); }
  catch { return []; }
}

// ---- Match records (for admin) ----
export interface MatchStat {
  user1: string;
  user2: string;
  matchedAt: string;
}

export function saveMatch(m: MatchStat) {
  const list = getMatches();
  list.push(m);
  localStorage.setItem(KEYS.matches, JSON.stringify(list));
}

export function getMatches(): MatchStat[] {
  try { return JSON.parse(localStorage.getItem(KEYS.matches) || '[]'); }
  catch { return []; }
}

// ---- Daily PV history (for chart) ----
export function recordDailyPV() {
  const today = new Date().toISOString().split('T')[0];
  const key = 'feierwurao_daily_pv';
  const data: Record<string, number> = JSON.parse(localStorage.getItem(key) || '{}');
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getDailyPV(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('feierwurao_daily_pv') || '{}'); }
  catch { return {}; }
}
