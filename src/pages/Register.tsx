import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BgVideo from '../components/BgVideo';

export default function Register() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'register' | 'login'>('register');

  return (
    <>
      <BgVideo />
      <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '110px 32px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 5, marginBottom: 14 }}>welcome aboard</div>
          <div style={{ fontSize: 24, fontWeight: 300, letterSpacing: 4 }}>在鹅厂扔一个漂流瓶，<em style={{ fontStyle: 'normal' }}>可能有人懂你</em></div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          border: '0.5px solid rgba(255,255,255,0.32)',
          borderRadius: 16,
          padding: '40px 44px',
          color: '#fff',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <Tab active={mode === 'register'} onClick={() => setMode('register')}>注册 / 登录</Tab>
          </div>

          {mode === 'register' && <RegisterForm onSuccess={() => nav('/sea')} />}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, lineHeight: 1.8 }}>
          密码加密存储 · 聊天加密保存 ·<br/>
          邮箱仅用于登录，不与瓶子关联
        </div>
      </main>
    </>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, textAlign: 'center', padding: '12px 0',
      fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: 3,
      cursor: 'pointer',
      borderBottom: active ? '1px solid rgba(255,255,255,0.85)' : '0.5px solid rgba(255,255,255,0.18)',
      fontFamily: active ? '"Source Han Serif CN VF Medium", serif' : '"Source Han Serif CN VF Light", serif',
    }}>{children}</div>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'email' | 'otp'>('email');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  async function sendOtp() {
    setErr(null);
    if (!email.endsWith('@tencent.com')) {
      setErr('请使用 @tencent.com 企业邮箱');
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setStage('otp');
    setCountdown(60);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function verifyOtp() {
    setErr(null);
    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    if (error) { setVerifying(false); setErr(error.message); return; }
    if (data.user) {
      // OTP 验证成功后，前端调 RPC 建 profile（已存在则返回现有）
      const { error: profErr } = await supabase.rpc('create_profile');
      setVerifying(false);
      if (profErr) {
        setErr('建账号失败：' + profErr.message);
        return;
      }
      onSuccess();
    } else {
      setVerifying(false);
    }
  }

  return (
    <>
      <FormRow label="企业邮箱">
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@tencent.com"
          disabled={stage === 'otp'}
          style={inputStyle}
        />
      </FormRow>

      {stage === 'otp' && (
        <FormRow label="邮箱验证码">
          <input
            className="form-input"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6 位数字"
            maxLength={6}
            style={{ ...inputStyle, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 24, letterSpacing: 12 }}
          />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            验证码已发送到 {email}，5 分钟内有效
          </div>
        </FormRow>
      )}

      {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginTop: 4, marginBottom: 10 }}>⚠ {err}</div>}

      {stage === 'email' ? (
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} onClick={sendOtp} disabled={sending || !email}>
          {sending ? '发送中…' : '发送验证码'}
        </button>
      ) : (
        <>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} onClick={verifyOtp} disabled={verifying || otp.length !== 6}>
            {verifying ? '验证中…' : '进入海面'}
          </button>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {countdown > 0 ? <>{countdown}s 后可重发</> : <a onClick={() => setStage('email')} style={{ color: 'rgba(255,255,255,0.85)', cursor: 'pointer', borderBottom: '0.5px solid rgba(255,255,255,0.4)' }}>重新发送</a>}
          </div>
        </>
      )}
    </>
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
