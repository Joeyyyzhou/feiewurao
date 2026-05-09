import { useState, useCallback, useEffect } from 'react';
import type { UserProfile, Answer, GuestCard, LightRecord, MatchRecord, AppPhase } from './mockData';
import { getTodayQuestions } from './mockData';
import { registerUser as apiRegisterUser, submitAnswer as apiSubmitAnswer, recordLightAction, sendVerificationCode, verifyOtpCode, fetchRealGuests, fetchMyNotifications, fetchMyMatches, finalizeLightAction, respondToLightNotification, deleteUserAccount, syncUserState, updateUserProfile } from '../lib/api';
import { supabase, isOnline } from '../lib/supabase';
import type { Question } from '../data/questions';

// ===== Session persistence =====
const SESSION_KEY = 'fewr_session';

interface SavedSession {
  user: UserProfile;
  answers: Answer[];
  expiresAt: number; // timestamp
}

function saveSession(user: UserProfile, answers: Answer[], days: number = 30) {
  const session: SavedSession = {
    user,
    answers,
    expiresAt: Date.now() + days * 86400000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: SavedSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) { localStorage.removeItem(SESSION_KEY); return null; }
    return session;
  } catch { return null; }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ===== State =====
interface AppState {
  phase: AppPhase;
  user: UserProfile | null;
  userOrderNum: number;
  verifiedEmail: string; // 邮箱验证通过后存储的真实邮箱
  answers: Answer[];
  todayQuestions: Question[];
  todayAnswers: Map<number, string>;
  todayCompleted: boolean; // 今天是否已完成答题
  guests: GuestCard[];
  lightNotifications: LightRecord[];
  matches: MatchRecord[];
  lastMatchedGuest: GuestCard | null;
  selectedNotification: LightRecord | null;
}

function getInitialState(): AppState {
  const session = loadSession();
  if (session) {
    const today = new Date().toISOString().split('T')[0];

    // 先算 dayCount
    let dayCount = session.user.dayCount || 1;
    if (session.user.createdAt) {
      const createdDate = session.user.createdAt.split('T')[0];
      const created = new Date(createdDate + 'T00:00:00');
      const now = new Date(today + 'T00:00:00');
      const calculated = Math.floor((now.getTime() - created.getTime()) / 86400000) + 1;
      if (calculated >= 1 && calculated <= 365) {
        dayCount = calculated;
      }
    }
    session.user.dayCount = dayCount;

    // 用 dayCount 算今天的题目（所有人的第N天题目一样）
    const answeredIds = session.answers.map(a => a.questionId);
    const todayQuestions = getTodayQuestions(answeredIds, dayCount);

    // 兼容旧数据
    if (!session.user.lastCheckInDate) {
      session.user.lastCheckInDate = today;
    }

    // 今日是否已答完：检查 localStorage 中今天的答题数
    const localTodayAnswers = session.answers.filter(a => a.answeredDate === today);
    const todayCompleted = localTodayAnswers.length >= 4 || session.user.lastCompletedDate === today;

    return {
      phase: 'check-in',
      user: session.user,
      userOrderNum: 0,
      verifiedEmail: session.user.email || '',
      answers: session.answers,
      todayQuestions,
      todayAnswers: new Map(),
      todayCompleted,
      guests: [],
      lightNotifications: [],
      matches: [],
      lastMatchedGuest: null,
      selectedNotification: null,
    };
  }
  return {
    phase: 'landing',
    user: null,
    userOrderNum: 0,
    verifiedEmail: '',
    answers: [],
    todayQuestions: [],
    todayAnswers: new Map(),
    todayCompleted: false,
    guests: [],
    lightNotifications: [],
    matches: [],
    lastMatchedGuest: null,
    selectedNotification: null,
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState>(getInitialState);

  // Persist session whenever user or answers change
  useEffect(() => {
    if (state.user) {
      saveSession(state.user, state.answers);
    }
  }, [state.user, state.answers]);

  // Load notifications when entering check-in (so pending lights count is accurate)
  useEffect(() => {
    if (state.phase === 'check-in' && state.user?.id) {
      fetchMyNotifications(state.user.id).then(notifications => {
        setState(prev => ({ ...prev, lightNotifications: notifications as LightRecord[] }));
      }).catch(console.error);
    }
  }, [state.phase, state.user?.id]);

  // Sync dayCount and todayCompleted from database when entering check-in
  useEffect(() => {
    if (state.phase === 'check-in' && state.user) {
      syncUserState(state.user.id, state.user.email).then(async (result) => {
        if (!result) return;
        const today = new Date().toISOString().split('T')[0];
        const dbUserId = result.dbUserId;

        // 以数据库为真实来源：
        // 如果数据库今天答题数为 0，说明数据被清了或今天没答，清空本地旧答题
        const todayCompleted = result.todayAnsweredCount >= 4;

        // 从数据库获取用户实际回答过的所有题目ID，用于正确生成 todayQuestions
        const dbAnsweredIds: number[] = result.answeredQuestionIds || [];

        // 刷新 todayQuestions（基于 dayCount，所有人第N天一样）
        const freshQuestions = getTodayQuestions(dbAnsweredIds, result.dayCount);

        // 同步本地 answers：如果数据库的回答和本地不一致，以数据库为准
        // 只保留数据库中确实存在的回答
        const localTodayAnswers = state.answers.filter(a => a.answeredDate === today);

        // 如果本地有今天的答题但数据库没有，说明数据库已清空，不补写，清掉本地
        let syncedAnswers = state.answers;
        if (localTodayAnswers.length > 0 && result.todayAnsweredCount === 0) {
          // 清掉本地今天的回答（数据库已清空）
          syncedAnswers = state.answers.filter(a => a.answeredDate !== today);
        } else if (localTodayAnswers.length > 0 && result.todayAnsweredCount < localTodayAnswers.length) {
          // 本地比数据库多，补写到数据库
          for (const a of localTodayAnswers) {
            await apiSubmitAnswer(dbUserId, a.questionId, a.content).catch(() => {});
          }
        }

        setState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            id: dbUserId,
            dayCount: result.dayCount,
            createdAt: result.createdAt,
            lastCheckInDate: today,
          } : null,
          answers: syncedAnswers,
          todayQuestions: freshQuestions,
          todayCompleted,
          todayAnswers: todayCompleted ? prev.todayAnswers : new Map(),
        }));
      }).catch(console.error);
    }
  }, [state.phase, state.user?.email]);

  const setPhase = useCallback((phase: AppPhase) => {
    setState(prev => ({ ...prev, phase }));
  }, []);

  const sendCode = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    const res = await sendVerificationCode(email);
    if (res.success) {
      setState(prev => ({ ...prev, phase: 'verify-sent' as AppPhase }));
    }
    return res;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    const res = await verifyOtpCode(email, code);
    if (res.success) {
      // 检查邮箱是否已注册
      if (isOnline() && supabase) {
        const { data } = await supabase.from('users').select('id').eq('email', email).limit(1);
        if (data && data.length > 0) {
          return { success: false, error: '该邮箱已注册，请直接登录' };
        }
      }
      setState(prev => ({ ...prev, verifiedEmail: email, phase: 'register-info' as AppPhase }));
    }
    return res;
  }, []);

  const registerUser = useCallback(async (profile: Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'dayCount' | 'prefGender' | 'prefBaseCities'>) => {
    const today = new Date().toISOString().split('T')[0];
    // Try to write to Supabase immediately to get real UUID
    let realId = `user-${Date.now()}`;
    const currentEmail = state.verifiedEmail || 'demo@tencent.com';
    try {
      const { id } = await apiRegisterUser({
        email: currentEmail,
        nickname: profile.nickname,
        gender: profile.gender,
        base_city: profile.baseCity,
        wechat_id: profile.wechatId,
        avatar_color: profile.avatarColor,
        pref_gender: profile.gender === 'male' ? 'female' : 'male',
        pref_base_cities: [],
      });
      realId = id;
    } catch (err) {
      console.error('注册写入数据库失败，使用本地ID:', err);
    }
    const user: UserProfile = {
      ...profile,
      email: currentEmail,
      id: realId,
      prefGender: profile.gender === 'male' ? 'female' : 'male',
      prefBaseCities: [],
      createdAt: new Date().toISOString(),
      dayCount: 1,
      lastCheckInDate: today,
    };
    setState(prev => ({ ...prev, user, phase: 'register-pref' }));
  }, [state.verifiedEmail]);

  const login = useCallback(async (nickname: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!data.success) return false;

      const u = data.user;
      const user: UserProfile = {
        id: u.id,
        email: u.email,
        nickname: u.nickname,
        password: password,
        gender: u.gender,
        baseCity: u.baseCity,
        wechatId: u.wechatId,
        avatarColor: u.avatarColor,
        prefGender: u.prefGender,
        prefBaseCities: u.prefBaseCities,
        createdAt: u.createdAt,
        dayCount: u.dayCount,
        lastCheckInDate: new Date().toISOString().split('T')[0],
      };

      const answers: Answer[] = data.answers || [];
      const answeredIds = answers.map((a: Answer) => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds, user.dayCount || 1);
      const today = new Date().toISOString().split('T')[0];
      const localTodayAnswers = answers.filter((a: Answer) => a.answeredDate === today);

      setState({
        phase: 'check-in',
        user,
        userOrderNum: u.orderNum || 0,
        verifiedEmail: u.email,
        answers,
        todayQuestions,
        todayAnswers: new Map(),
        todayCompleted: localTodayAnswers.length >= 4,
        guests: [],
        lightNotifications: [],
        matches: [],
        lastMatchedGuest: null,
        selectedNotification: null,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const setPreferences = useCallback(async (prefs: { prefGender: 'male' | 'female'; prefBaseCities: string[] }) => {
    const currentState = state;
    if (!currentState.user) return;
    // Update preferences in Supabase
    if (isOnline() && supabase) {
      try {
        await supabase.from('users').update({
          pref_gender: prefs.prefGender,
          pref_base_cities: prefs.prefBaseCities,
        }).eq('id', currentState.user.id);
      } catch (err) {
        console.error('更新偏好失败:', err);
      }
    }
    // Count user order
    let orderNum = 0;
    if (isOnline() && supabase) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      orderNum = count ?? 0;
    }
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...prefs } : null,
      userOrderNum: orderNum,
      phase: 'welcome' as AppPhase,
    }));
  }, [state]);

  const submitAnswer = useCallback((questionId: number, content: string) => {
    setState(prev => {
      const newTodayAnswers = new Map(prev.todayAnswers);
      newTodayAnswers.set(questionId, content);
      const newAnswer: Answer = { questionId, content, answeredDate: new Date().toISOString().split('T')[0] };
      if (prev.user) apiSubmitAnswer(prev.user.id, questionId, content).catch(console.error);
      return { ...prev, answers: [...prev.answers, newAnswer], todayAnswers: newTodayAnswers };
    });
  }, []);

  const finishAnswering = useCallback(async () => {
    const prev = state;
    if (!prev.user) return;

    let guests: GuestCard[] = [];

    // 通过 API route 获取嘉宾（使用 email 查询，最可靠）
    if (prev.user.email) {
      try {
        const res = await fetch('/api/fetch-guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: prev.user.email }),
        });
        const data = await res.json();
        if (data.success && data.guests) {
          guests = data.guests as GuestCard[];
        }
      } catch (e) {
        console.error('fetch-guests API error:', e);
      }
    }

    // 兜底：如果 API 失败，用前端逻辑
    if (guests.length === 0) {
      const syncResult = await syncUserState(prev.user.id, prev.user.email);
      const dbUserId = syncResult?.dbUserId || prev.user.id;
      const questionIds = prev.todayQuestions.map(q => q.id);
      guests = await fetchRealGuests(dbUserId, prev.user.prefGender, prev.user.baseCity, questionIds) as GuestCard[];
    }

    const today = new Date().toISOString().split('T')[0];
    setState(p => ({
      ...p,
      guests,
      todayCompleted: true,
      user: p.user ? { ...p.user, lastCompletedDate: today } : null,
      phase: 'daily-guests',
    }));
  }, [state]);

  const updateGuestLight = useCallback((guestId: string, status: 'on' | 'off') => {
    setState(prev => {
      if (prev.user) recordLightAction(prev.user.id, guestId, status).catch(console.error);
      return { ...prev, guests: prev.guests.map(g => g.id === guestId ? { ...g, lightStatus: status } : g) };
    });
  }, []);

  const finalizeLight = useCallback(async (guestId: string) => {
    const guest = state.guests.find(g => g.id === guestId);
    if (!state.user || !guest) return;
    const result = await finalizeLightAction(state.user.id, guestId);
    if (result.matched && result.wechatId) {
      // Mutual match! Show match success with real wechat
      setState(prev => ({
        ...prev,
        lastMatchedGuest: { ...guest, wechatId: result.wechatId } as GuestCard & { wechatId?: string },
        phase: 'match-success',
      }));
    } else {
      // Just sent notification — show "light sent, waiting" then go to daily complete
      setState(prev => ({ ...prev, lastMatchedGuest: guest, phase: 'light-sent' as AppPhase }));
    }
  }, [state.user, state.guests]);

  const goToProfile = useCallback(async () => {
    if (!state.user) return;
    const [notifications, matches] = await Promise.all([
      fetchMyNotifications(state.user.id),
      fetchMyMatches(state.user.id),
    ]);
    setState(prev => ({
      ...prev,
      lightNotifications: notifications as LightRecord[],
      matches: matches as MatchRecord[],
      phase: 'profile',
    }));
  }, [state.user]);

  const goToNotifications = useCallback(async () => {
    if (!state.user) return;
    const notifications = await fetchMyNotifications(state.user.id);
    setState(prev => ({ ...prev, lightNotifications: notifications as LightRecord[], phase: 'notifications' }));
  }, [state.user]);

  const viewNotification = useCallback((notification: LightRecord) => {
    setState(prev => ({ ...prev, selectedNotification: notification, phase: 'notification-detail' }));
  }, []);

  const respondToLight = useCallback(async (notificationId: string, accept: boolean) => {
    const notification = state.lightNotifications.find(n => n.id === notificationId);
    if (!notification || !state.user) return;

    const result = await respondToLightNotification(
      notificationId,
      notification.fromUser.id, // 使用正确的用户 ID
      state.user.id,
      accept
    );

    if (accept && result.matched) {
      setState(prev => ({
        ...prev,
        lightNotifications: prev.lightNotifications.map(n => n.id === notificationId ? { ...n, status: 'matched' as const } : n),
        matches: [...prev.matches, {
          id: `match-${Date.now()}`,
          user: { nickname: notification.fromUser.nickname, avatarColor: notification.fromUser.avatarColor },
          wechatId: result.wechatId || '',
          matchedAt: new Date().toISOString(),
        }],
        lastMatchedGuest: {
          id: notification.fromUser.id,
          nickname: notification.fromUser.nickname,
          avatarColor: notification.fromUser.avatarColor,
          answers: notification.fromUser.answers,
          lightStatus: 'on',
          wechatId: result.wechatId || '',
        } as GuestCard & { wechatId?: string },
        phase: 'match-success',
      }));
    } else {
      setState(prev => ({
        ...prev,
        lightNotifications: prev.lightNotifications.map(n => n.id === notificationId ? { ...n, status: 'ignored' as const } : n),
        phase: 'profile',
      }));
    }
  }, [state.lightNotifications, state.user]);

  const checkInDone = useCallback(() => {
    setState(prev => {
      const answeredIds = prev.answers.map(a => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds, prev.user?.dayCount || 1);
      const today = new Date().toISOString().split('T')[0];

      // dayCount 已在 check-in 阶段从数据库同步，这里直接使用
      // todayCompleted 也已从数据库同步（答题数 >= 4）

      // 如果今天已完成答题，直接跳到 daily-complete
      if (prev.todayCompleted) {
        return {
          ...prev,
          user: prev.user ? { ...prev.user, lastCheckInDate: today } : null,
          todayQuestions,
          phase: 'daily-complete' as AppPhase,
        };
      }

      return {
        ...prev,
        user: prev.user ? { ...prev.user, lastCheckInDate: today } : null,
        todayQuestions,
        todayAnswers: new Map(),
        guests: [],
        lastMatchedGuest: null,
        phase: 'daily-questions' as AppPhase,
      };
    });
  }, []);

  const welcomeDone = useCallback(() => {
    setState(prev => {
      const answeredIds = prev.answers.map(a => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds, prev.user?.dayCount || 1);
      return { ...prev, todayQuestions, phase: 'daily-questions' as AppPhase };
    });
  }, []);

  const startNewDay = useCallback(() => {
    setState(prev => {
      // todayCompleted 已从数据库同步
      if (prev.todayCompleted) {
        return { ...prev, phase: 'daily-complete' };
      }
      
      const answeredIds = prev.answers.map(a => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds, prev.user?.dayCount || 1);
      return {
        ...prev,
        todayQuestions,
        todayAnswers: new Map(),
        todayCompleted: false,
        guests: [],
        lastMatchedGuest: null,
        phase: 'daily-questions',
      };
    });
  }, []);

  const goToDailyComplete = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'daily-complete' as AppPhase }));
  }, []);

  const updateProfile = useCallback(async (fields: { nickname?: string; baseCity?: string; wechatId?: string }) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...fields } : null,
    }));
    // 走后端 API（wechat_id 加密入库）
    if (isOnline() && state.user?.id) {
      try {
        await updateUserProfile(state.user.id, fields);
      } catch (e) {
        console.error('updateProfile failed:', e);
      }
    }
  }, [state.user?.id]);

  const deleteAccount = useCallback(async () => {
    // 1. 先清本地——不管数据库删没删成功
    clearSession();
    // 2. 尝试删数据库（可能被 RLS 挡，但无所谓）
    if (state.user?.id) {
      deleteUserAccount(state.user.id).catch(() => {});
    }
    // 3. 强制重置为全新空状态（不调 getInitialState，因为它会读 localStorage）
    setState({
      phase: 'landing',
      user: null,
      userOrderNum: 0,
      verifiedEmail: '',
      answers: [],
      todayQuestions: [],
      todayAnswers: new Map(),
      todayCompleted: false,
      guests: [],
      lightNotifications: [],
      matches: [],
      lastMatchedGuest: null,
      selectedNotification: null,
    });
  }, [state.user]);

  const logout = useCallback(() => {
    clearSession();
    setState({
      ...getInitialState(),
      phase: 'landing',
    });
  }, []);

  // 临时存储「进入关于页之前的 phase」，便于返回
  const [previousPhase, setPreviousPhase] = useState<AppPhase | null>(null);

  const goToAbout = useCallback(() => {
    setState(prev => {
      setPreviousPhase(prev.phase);
      return { ...prev, phase: 'about' as AppPhase };
    });
  }, []);

  const backFromAbout = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: (previousPhase || (prev.user ? 'profile' : 'landing')) as AppPhase,
    }));
  }, [previousPhase]);

  return {
    state, setPhase, sendCode, verifyCode, registerUser, login, setPreferences,
    submitAnswer, finishAnswering, updateGuestLight, finalizeLight,
    goToProfile, goToNotifications, viewNotification, respondToLight,
    checkInDone, welcomeDone, startNewDay, goToDailyComplete, updateProfile, deleteAccount, logout,
    goToAbout, backFromAbout,
  };
}
