import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useIsNarrow } from '../lib/useIsNarrow';

export default function ApplyInvite() {
  const nav = useNavigate();
  const isNarrow = useIsNarrow();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!email.endsWith('@tencent.com')) {
      setErr('请使用 @tencent.com 企业邮箱');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc('submit_invite_application' as any, {
      p_email: email.trim(),
      p_message: message.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setErr(error.message.replace(/^.*?:\s*/, ''));
      return;
    }
    setDone(true);
  }

  return (
    <>
      <main style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        padding: 'clamp(70px, 14vw, 110px) clamp(18px, 5vw, 32px) 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 7vw, 56px)' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 5, marginBottom: 14 }}>request an invite</div>
          <div style={{ fontSize: isNarrow ? 20 : 24, fontWeight: 300, letterSpacing: 3, lineHeight: 1.5 }}>申请一个邀请码</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          border: '0.5px solid rgba(255,255,255,0.32)',
          borderRadius: 16,
          padding: 'clamp(28px, 6vw, 40px) clamp(22px, 6vw, 44px)',
          color: '#fff',
          width: '100%',
          maxWidth: 460,
        }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 38, marginBottom: 16 }}>✶</div>
              <div style={{ fontSize: 16, lineHeight: 1.9, letterSpacing: 2, marginBottom: 14 }}>
                申请已收到
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 28, letterSpacing: 1 }}>
                审核通过后，邀请码会发到<br/>
                <em style={{ fontStyle: 'normal', color: '#fff' }}>{email}</em>
              </div>
              <button className="btn btn-ghost" onClick={() => nav('/')}>回首页</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>企业邮箱</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@tencent.com" style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>说一句话（可选）</label>
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                  placeholder="是谁推荐你来的？想用它做什么？"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none', fontFamily: '"Source Han Serif CN VF Light", serif' }}
                />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, textAlign: 'right' }}>{message.length} / 100</div>
              </div>

              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                通过后邀请码会发到你的企业邮箱
              </div>

              {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginBottom: 10 }}>⚠ {err}</div>}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                onClick={submit}
                disabled={submitting || !email}
              >
                {submitting ? '提交中…' : '提交申请'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                onClick={() => nav('/register')}
              >
                我有邀请码 / 已注册
              </button>
            </>
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
