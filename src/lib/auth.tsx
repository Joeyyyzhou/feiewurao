import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { UserRow } from './database.types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserRow | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string): Promise<UserRow | null> {
    // 双路径：优先用 SELECT（最简单、RLS 允许查自己）；如果 SELECT 拿不到再用 RPC 尝试建/取 profile
    // 每个调用 3 秒超时，避免 hang 死
    const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
      Promise.race<T>([
        Promise.resolve(p),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout ' + ms + 'ms')), ms)),
      ]);

    // 路径 1: 直接查 users 表（profile 已存在的 99% 情况）
    try {
      const res: any = await withTimeout(
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        3000
      );
      if (!res.error && res.data) {
        return res.data as UserRow;
      }
      if (res.error) {
        console.warn('[auth] select profile error:', res.error.message);
      }
    } catch (e: any) {
      console.warn('[auth] select profile timeout/threw:', e.message);
    }

    // 路径 2: SELECT 没拿到 → 调 RPC（首次注册/profile 缺失的情况）
    try {
      const res: any = await withTimeout(
        supabase.rpc('create_profile' as any),
        3000
      );
      if (res.error) {
        console.warn('[auth] create_profile rpc error:', res.error.message);
        return null;
      }
      return res.data as UserRow;
    } catch (e: any) {
      console.warn('[auth] create_profile rpc timeout/threw:', e.message);
      return null;
    }
  }

  async function refreshProfile() {
    if (!session?.user.id) return;
    const p = await loadProfile(session.user.id);
    setProfile(p);
  }

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };
    // 5 秒兜底：无论如何都释放 loading
    const timer = setTimeout(finish, 5000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session?.user.id) {
          const p = await loadProfile(data.session.user.id);
          setProfile(p);
        }
      } catch (e) {
        console.warn('[auth] init failed:', e);
      } finally {
        clearTimeout(timer);
        finish();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: any, s: any) => {
      setSession(s);
      if (s?.user.id) {
        try {
          const p = await loadProfile(s.user.id);
          setProfile(p);
        } catch (e) {
          console.warn('[auth] reload profile failed:', e);
        }
      } else {
        setProfile(null);
      }
    });
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
