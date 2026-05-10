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
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    setSubmitting(true);

    // 先尝试登录；失败再注册（这样同一表单同时支持新老用户）
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error && /invalid login credentials/i.test(error.message)) {
      // 该邮箱可能不存在 → 注册
      const signUp = await supabase.auth.signUp({ email, password });
      data = signUp.data;
      error = signUp.error;
    }

    if (error) {
      setSubmitting(false);
      setErr(error.message);
      return;
    }

    if (data.user) {
      // OTP / signUp 成功后，调 RPC 建 profile（已存在则返回现有）
      const { error: profErr } = await supabase.rpc('create_profile');
      setSubmitting(false);
      if (profErr) {
        setErr('建账号失败：' + profErr.message);
        return;
      }
      onSuccess();
    } else {
      setSubmitting(false);
    }
  }

  return (
    <>
      <FormRow label="企业邮箱">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@tencent.com"
          style={inputStyle}
        />
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
        新用户自动注册 · 老用户自动登录
      </div>

      {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginTop: 4, marginBottom: 10 }}>⚠ {err}</div>}

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={submit} disabled={submitting || !email || !password}>
        {submitting ? '处理中…' : '进入海面'}
      </button>
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
