import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import BgVideo from '../components/BgVideo';
import AboutDrawer from '../components/AboutDrawer';

type Mode = 'register' | 'login';

export default function Register() {
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('register');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session?.user) {
      nav('/', { replace: true });
    }
  }, [loading, session, nav]);

  async function submit() {
    setErr(null);
    if (!email.endsWith('@tencent.com')) {
      setErr('请使用 @tencent.com 企业邮箱');
      return;
    }
    if (password.length < 6) {
      setErr('密码至少 6 位');
      return;
    }
    if (mode === 'register' && inviteCode.trim().length === 0) {
      setErr('请输入邀请码');
      return;
    }

    setSubmitting(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) {
        setErr(error.message.toLowerCase().includes('invalid') ? '邮箱或密码错误' : error.message);
        return;
      }
      // useEffect 会 nav('/')
      return;
    }

    // mode === 'register'
    const { error: rpcErr } = await supabase.rpc('register_with_invite' as any, {
      p_invite_code: inviteCode.trim().toUpperCase(),
      p_email: email.trim(),
      p_password: password,
    });
    if (rpcErr) {
      setSubmitting(false);
      setErr(rpcErr.message.replace(/^.*?:\s*/, ''));
      return;
    }

    // 注册成功后用密码登录拿 session
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (signInErr) {
      setErr('注册成功，但自动登录失败，请手动用「老用户登录」进入');
      setMode('login');
      return;
    }
    // useEffect 会 nav('/')
  }

  return (
    <>
      <BgVideo />
      <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: 'clamp(70px, 14vw, 110px) clamp(18px, 5vw, 32px) 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 7vw, 56px)', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 5, marginBottom: 14 }}>welcome aboard</div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 300, letterSpacing: 3, lineHeight: 1.5 }}>在鹅厂扔一个漂流瓶，<em style={{ fontStyle: 'normal' }}>可能有人懂你</em></div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          border: '0.5px solid rgba(255,255,255,0.32)',
          borderRadius: 16,
          padding: 'clamp(28px, 6vw, 40px) clamp(22px, 6vw, 44px)',
          color: '#fff',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}>
          {/* 模式切换 */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '0.5px solid rgba(255,255,255,0.18)' }}>
            <ModeTab active={mode === 'register'} onClick={() => { setMode('register'); setErr(null); }}>新人注册</ModeTab>
            <ModeTab active={mode === 'login'} onClick={() => { setMode('login'); setErr(null); }}>老用户登录</ModeTab>
          </div>

          {mode === 'register' && (
            <FormRow label="邀请码">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="问已在用的鹅厂同事要 6 位码"
                style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center', fontSize: 17 }}
                maxLength={6}
              />
            </FormRow>
          )}

          <FormRow label="企业邮箱">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@tencent.com" style={inputStyle} />
          </FormRow>

          <FormRow label="密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="至少 6 位"
              style={inputStyle}
            />
          </FormRow>

          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 8 }}>
            {mode === 'register' ? '注册不发邮件，立即进站' : '使用注册时的邮箱+密码登录'}
          </div>

          {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginTop: 4, marginBottom: 10 }}>⚠ {err}</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
            onClick={submit}
            disabled={submitting || !email || !password || (mode === 'register' && inviteCode.length < 6)}
          >
            {submitting ? '处理中…' : (mode === 'register' ? '进入海面' : '登录')}
          </button>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, lineHeight: 1.8 }}>
          密码加密存储 · 聊天加密保存 ·<br/>
          邮箱仅用于登录，不与瓶子关联
        </div>
      </main>
      <AboutDrawer />
    </>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 0',
        background: 'transparent',
        border: 'none',
        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
        fontSize: 14,
        letterSpacing: 3,
        cursor: 'pointer',
        borderBottom: active ? '1.5px solid #fff' : '1.5px solid transparent',
        marginBottom: -1,
        fontFamily: 'inherit',
      }}
    >{children}</button>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.65)', letterSpacing: 3, marginBottom: 10 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  background: 'rgba(255,255,255,0.08)',
  border: '0.5px solid rgba(255,255,255,0.25)',
  borderRadius: 10,
  fontFamily: '"Source Han Serif CN VF Light", serif',
  fontSize: 15,
  color: '#fff',
  letterSpacing: 1.5,
  outline: 'none',
};
