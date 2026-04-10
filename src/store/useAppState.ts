import { useState, useCallback, useEffect } from 'react';
import type { UserProfile, Answer, GuestCard, LightRecord, MatchRecord, AppPhase } from './mockData';
import { generateMockGuests, generateMockLightNotifications, generateMockMatches, getTodayQuestions } from './mockData';
import { registerUser as apiRegisterUser, submitAnswer as apiSubmitAnswer, recordLightAction } from '../lib/api';
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
  answers: Answer[];
  todayQuestions: Question[];
  todayAnswers: Map<number, string>;
  guests: GuestCard[];
  lightNotifications: LightRecord[];
  matches: MatchRecord[];
  lastMatchedGuest: GuestCard | null;
  selectedNotification: LightRecord | null;
}

function getInitialState(): AppState {
  const session = loadSession();
  if (session) {
    const answeredIds = session.answers.map(a => a.questionId);
    const todayQuestions = getTodayQuestions(answeredIds);
    return {
      phase: 'daily-questions',
      user: session.user,
      userOrderNum: 0,
      answers: session.answers,
      todayQuestions,
      todayAnswers: new Map(),
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
    answers: [],
    todayQuestions: [],
    todayAnswers: new Map(),
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

  const setPhase = useCallback((phase: AppPhase) => {
    setState(prev => ({ ...prev, phase }));
  }, []);

  const verifyEmail = useCallback((_email: string) => {
    setState(prev => ({ ...prev, phase: 'verify-sent' }));
    setTimeout(() => {
      setState(prev => ({ ...prev, phase: 'register-info' }));
    }, 2000);
  }, []);

  const registerUser = useCallback((profile: Omit<UserProfile, 'id' | 'createdAt' | 'dayCount' | 'prefGender' | 'prefBaseCities'>) => {
    const user: UserProfile = {
      ...profile,
      id: `user-${Date.now()}`,
      prefGender: profile.gender === 'male' ? 'female' : 'male',
      prefBaseCities: [],
      createdAt: new Date().toISOString(),
      dayCount: 1,
    };
    setState(prev => ({ ...prev, user, phase: 'register-pref' }));
  }, []);

  const login = useCallback((nickname: string, password: string): boolean => {
    const session = loadSession();
    if (session && session.user.nickname === nickname && session.user.password === password) {
      const answeredIds = session.answers.map(a => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds);
      setState({
        phase: 'daily-questions',
        user: session.user,
        userOrderNum: 0,
        answers: session.answers,
        todayQuestions,
        todayAnswers: new Map(),
        guests: [],
        lightNotifications: [],
        matches: [],
        lastMatchedGuest: null,
        selectedNotification: null,
      });
      return true;
    }
    return false;
  }, []);

  const setPreferences = useCallback((prefs: { prefGender: 'male' | 'female'; prefBaseCities: string[] }) => {
    setState(prev => {
      if (!prev.user) return prev;
      apiRegisterUser({
        email: prev.user.email,
        nickname: prev.user.nickname,
        gender: prev.user.gender,
        base_city: prev.user.baseCity,
        wechat_id: prev.user.wechatId,
        avatar_color: prev.user.avatarColor,
        pref_gender: prefs.prefGender,
        pref_base_cities: prefs.prefBaseCities,
      }).then(({ orderNum }) => {
        setState(p => ({ ...p, userOrderNum: orderNum }));
      }).catch(console.error);

      return {
        ...prev,
        user: { ...prev.user, ...prefs },
        userOrderNum: 0,
        phase: 'welcome' as AppPhase,
      };
    });
  }, []);

  const submitAnswer = useCallback((questionId: number, content: string) => {
    setState(prev => {
      const newTodayAnswers = new Map(prev.todayAnswers);
      newTodayAnswers.set(questionId, content);
      const newAnswer: Answer = { questionId, content, answeredDate: new Date().toISOString().split('T')[0] };
      if (prev.user) apiSubmitAnswer(prev.user.id, questionId, content).catch(console.error);
      return { ...prev, answers: [...prev.answers, newAnswer], todayAnswers: newTodayAnswers };
    });
  }, []);

  const finishAnswering = useCallback(() => {
    setState(prev => {
      const questionIds = prev.todayQuestions.map(q => q.id);
      const guests = generateMockGuests(questionIds, 5);
      return { ...prev, guests, phase: 'daily-guests' };
    });
  }, []);

  const updateGuestLight = useCallback((guestId: string, status: 'on' | 'off') => {
    setState(prev => {
      if (prev.user) recordLightAction(prev.user.id, guestId, status).catch(console.error);
      return { ...prev, guests: prev.guests.map(g => g.id === guestId ? { ...g, lightStatus: status } : g) };
    });
  }, []);

  const finalizeLight = useCallback((guestId: string) => {
    setState(prev => {
      const guest = prev.guests.find(g => g.id === guestId);
      return { ...prev, lastMatchedGuest: guest || null, phase: 'match-success' };
    });
  }, []);

  const goToProfile = useCallback(() => {
    setState(prev => ({ ...prev, lightNotifications: generateMockLightNotifications(), matches: generateMockMatches(), phase: 'profile' }));
  }, []);

  const goToNotifications = useCallback(() => {
    setState(prev => ({ ...prev, lightNotifications: generateMockLightNotifications(), phase: 'notifications' }));
  }, []);

  const viewNotification = useCallback((notification: LightRecord) => {
    setState(prev => ({ ...prev, selectedNotification: notification, phase: 'notification-detail' }));
  }, []);

  const respondToLight = useCallback((notificationId: string, accept: boolean) => {
    setState(prev => {
      const notification = prev.lightNotifications.find(n => n.id === notificationId);
      if (!notification) return prev;
      if (accept) {
        const newMatch: MatchRecord = {
          id: `match-${Date.now()}`,
          user: { nickname: notification.fromUser.nickname, avatarColor: notification.fromUser.avatarColor },
          wechatId: 'soul_mate_' + Math.floor(Math.random() * 9999),
          matchedAt: new Date().toISOString(),
        };
        return {
          ...prev,
          lightNotifications: prev.lightNotifications.map(n => n.id === notificationId ? { ...n, status: 'matched' as const } : n),
          matches: [...prev.matches, newMatch],
          lastMatchedGuest: {
            id: notification.fromUser.nickname,
            nickname: notification.fromUser.nickname,
            avatarColor: notification.fromUser.avatarColor,
            answers: notification.fromUser.answers,
            lightStatus: 'on',
          },
          phase: 'match-success',
        };
      } else {
        return {
          ...prev,
          lightNotifications: prev.lightNotifications.map(n => n.id === notificationId ? { ...n, status: 'ignored' as const } : n),
          phase: 'notifications',
        };
      }
    });
  }, []);

  const welcomeDone = useCallback(() => {
    setState(prev => {
      const answeredIds = prev.answers.map(a => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds);
      return { ...prev, todayQuestions, phase: 'daily-questions' as AppPhase };
    });
  }, []);

  const startNewDay = useCallback(() => {
    setState(prev => {
      const answeredIds = prev.answers.map(a => a.questionId);
      const todayQuestions = getTodayQuestions(answeredIds);
      const dayCount = prev.user ? prev.user.dayCount + 1 : 1;
      return {
        ...prev,
        user: prev.user ? { ...prev.user, dayCount } : null,
        todayQuestions,
        todayAnswers: new Map(),
        guests: [],
        lastMatchedGuest: null,
        phase: 'daily-questions',
      };
    });
  }, []);

  const goToDailyComplete = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'daily-complete' as AppPhase }));
  }, []);

  const deleteAccount = useCallback(() => {
    clearSession();
    setState(getInitialState());
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setState({
      ...getInitialState(),
      phase: 'landing',
    });
  }, []);

  return {
    state, setPhase, verifyEmail, registerUser, login, setPreferences,
    submitAnswer, finishAnswering, updateGuestLight, finalizeLight,
    goToProfile, goToNotifications, viewNotification, respondToLight,
    welcomeDone, startNewDay, goToDailyComplete, deleteAccount, logout,
  };
}
