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

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('[auth] load profile failed:', error.message);
      return null;
    }
    return data as UserRow;
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
