import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import { useIsNarrow } from '../lib/useIsNarrow';

type Stage = 'request' | 'verify' | 'done';

export default function ForgotPassword() {
  const nav = useNavigate();
  const isNarrow = useIsNarrow();
  const [stage, setStage] = useState<Stage>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode() {
    setErr(null);
    if (!email.endsWith('@tencent.com')) {
      setErr('请使用 @tencent.com 邮箱');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/request-password-reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await r.json();
      setSubmitting(false);
      if (!r.ok) { setErr(j.error || '发送失败'); return; }
      setStage('verify');
    } catch (e: any) {
      setSubmitting(false);
      setErr('网络异常，请重试');
    }
  }

  async function doReset() {
    setErr(null);
    if (code.length !== 6) { setErr('验证码是 6 位'); return; }
    if (newPwd.length < 6) { setErr('新密码至少 6 位'); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword: newPwd }),
      });
      const j = await r.json();
      setSubmitting(false);
      if (!r.ok) { setErr(j.error || '重置失败'); return; }
      setStage('done');
    } catch (e: any) {
      setSubmitting(false);
      setErr('网络异常，请重试');
    }
  }

  return (
    <>
      <BgVideo />
      <main style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        padding: 'clamp(70px, 14vw, 110px) clamp(18px, 5vw, 32px) 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 7vw, 56px)' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 5, marginBottom: 14 }}>reset your password</div>
          <div style={{ fontSize: isNarrow ? 20 : 24, fontWeight: 300, letterSpacing: 3, lineHeight: 1.5, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>忘记密码</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          border: '0.5px solid rgba(255,255,255,0.32)',
          borderRadius: 16,
          padding: 'clamp(28px, 6vw, 40px) clamp(22px, 6vw, 44px)',
          color: '#fff', width: '100%', maxWidth: 460,
        }}>
          {stage === 'request' && (
            <>
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>企业邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@tencent.com" style={inputStyle} />
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                我们会发一个 6 位验证码到你的邮箱
              </div>
              {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginBottom: 10 }}>⚠ {err}</div>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={sendCode} disabled={submitting || !email}>
                {submitting ? '发送中…' : '发送验证码'}
              </button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => nav('/register')}>
                回到登录
              </button>
            </>
          )}

          {stage === 'verify' && (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.7, letterSpacing: 1 }}>
                验证码已发到 <em style={{ fontStyle: 'normal', color: '#fff' }}>{email}</em>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>6 位验证码</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ ...inputStyle, letterSpacing: 12, textAlign: 'center', fontSize: 18 }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>新密码</label>
                <input
                  type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="至少 6 位" style={inputStyle}
                />
              </div>
              {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginBottom: 10 }}>⚠ {err}</div>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={doReset} disabled={submitting || code.length !== 6 || newPwd.length < 6}>
                {submitting ? '重置中…' : '确认重置'}
              </button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => { setStage('request'); setCode(''); setErr(null); }}>
                换个邮箱
              </button>
            </>
          )}

          {stage === 'done' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 38, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 16, lineHeight: 1.9, letterSpacing: 2, marginBottom: 24 }}>密码已重置</div>
              <button className="btn btn-primary" onClick={() => nav('/register')}>去登录</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.65)', letterSpacing: 3, marginBottom: 10 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 18px',
  background: 'rgba(255,255,255,0.08)',
  border: '0.5px solid rgba(255,255,255,0.25)',
  borderRadius: 10,
  fontFamily: '"Source Han Serif CN VF Light", serif',
  fontSize: 15, color: '#fff', letterSpacing: 1.5, outline: 'none',
};
