import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import AboutDrawer from '../components/AboutDrawer';

type Mode = 'register' | 'login';

export default function Register() {
  const { session, loading, banError, clearBanError } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && session?.user) {
      nav('/', { replace: true });
    }
  }, [loading, session, nav]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startCountdown() {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function sendCode() {
    setErr(null); setInfo(null);
    if (!email.endsWith('@tencent.com')) {
      setErr('请使用 @tencent.com 企业邮箱');
      return;
    }
    setSending(true);
    try {
      const resp = await fetch('https://feiewurao.cn/api/send-register-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await resp.json();
      if (!resp.ok) { setErr(j.error || '发送失败，请稍后重试'); setSending(false); return; }
      setCodeSent(true);
      setInfo('验证码已发送，请查收企业邮箱（10 分钟内有效）');
      startCountdown();
    } catch (e: any) {
      setErr('网络异常，请稍后重试');
    }
    setSending(false);
  }

  async function submit() {
    setErr(null);
    if (mode === 'login') {
      if (!email.endsWith('@tencent.com')) { setErr('请使用 @tencent.com 企业邮箱'); return; }
      if (password.length < 6) { setErr('密码至少 6 位'); return; }
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setSubmitting(false);
      if (error) {
        setErr(error.message.toLowerCase().includes('invalid') ? '邮箱或密码错误' : error.message);
        return;
      }
      return;
    }

    // mode === 'register'
    if (!email.endsWith('@tencent.com')) { setErr('请使用 @tencent.com 企业邮箱'); return; }
    if (!codeSent) { setErr('请先获取验证码'); return; }
    if (code.trim().length !== 6) { setErr('请输入 6 位验证码'); return; }
    if (password.length < 6) { setErr('密码至少 6 位'); return; }

    setSubmitting(true);
    const { error: rpcErr } = await supabase.rpc('register_with_code' as any, {
      p_email: email.trim(),
      p_code: code.trim(),
      p_password: password,
    });
    if (rpcErr) {
      setSubmitting(false);
      setErr(rpcErr.message.replace(/^.*?:\s*/, ''));
      return;
    }
    // 注册成功后用密码登录
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (signInErr) {
      setErr('注册成功，但自动登录失败，请用「老用户登录」进入');
      setMode('login');
      return;
    }
  }

  return (
    <>
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
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '0.5px solid rgba(255,255,255,0.18)' }}>
            <ModeTab active={mode === 'register'} onClick={() => { setMode('register'); setErr(null); setInfo(null); clearBanError(); }}>新人注册</ModeTab>
            <ModeTab active={mode === 'login'} onClick={() => { setMode('login'); setErr(null); setInfo(null); clearBanError(); }}>老用户登录</ModeTab>
          </div>

          <FormRow label="企业邮箱">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearBanError(); }}
              placeholder="yourname@tencent.com"
              style={inputStyle}
            />
          </FormRow>

          {mode === 'register' && (
            <FormRow label="邮箱验证码">
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); clearBanError(); }}
                  placeholder="6 位验证码"
                  style={{ ...inputStyle, flex: 1, letterSpacing: 4, textAlign: 'center' }}
                  maxLength={6}
                />
                <button
                  onClick={sendCode}
                  disabled={sending || countdown > 0 || !email}
                  style={{
                    flexShrink: 0, padding: '0 16px', borderRadius: 10,
                    border: '0.5px solid rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.12)', color: '#fff',
                    fontSize: 13, letterSpacing: 1, cursor: (sending || countdown > 0 || !email) ? 'default' : 'pointer',
                    opacity: (sending || countdown > 0 || !email) ? 0.5 : 1, whiteSpace: 'nowrap',
                  }}
                >
                  {sending ? '发送中…' : countdown > 0 ? `${countdown}s` : (codeSent ? '重新发送' : '获取验证码')}
                </button>
              </div>
            </FormRow>
          )}

          <FormRow label="密码">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearBanError(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="至少 6 位"
              style={inputStyle}
            />
          </FormRow>

          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 8 }}>
            {mode === 'register' ? '仅限 @tencent.com 企业邮箱 · 验证后即可进站' : '使用注册时的邮箱 + 密码登录'}
          </div>

          {info && <div style={{ color: 'rgba(180,230,200,0.95)', fontSize: 13, marginTop: 4, marginBottom: 6 }}>{info}</div>}
          {(err || banError) && (
            <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginTop: 4, marginBottom: 10 }}>
              ⚠ {err || (banError === 'banned' ? '该账号已被封禁，如有疑问请联系管理员。' : '')}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
            onClick={submit}
            disabled={submitting || !email || !password || (mode === 'register' && code.length < 6)}
          >
            {submitting ? '处理中…' : (mode === 'register' ? '进入海面' : '登录')}
          </button>

          {mode === 'login' && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <a
                onClick={() => nav('/forgot-password')}
                style={{ cursor: 'pointer', fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.25)', textUnderlineOffset: 4 }}
              >
                忘记密码？
              </a>
            </div>
          )}
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
