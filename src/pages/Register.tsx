import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BgVideo from '../components/BgVideo';

type Stage = 'form' | 'wait-email' | 'verifying';

export default function Register() {
  const nav = useNavigate();
  const [stage, setStage] = useState<Stage>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // session 监听：用户从邮件回来后，session 会建立 → 调 create_profile → 进站
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event: any, s: any) => {
      if (s?.user?.email_confirmed_at || s?.user?.confirmed_at) {
        setStage('verifying');
        const { error } = await supabase.rpc('create_profile');
        if (error) {
          setErr('建账号失败：' + error.message);
          setStage('form');
          return;
        }
        nav('/');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

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

    // 1) 先尝试登录（老用户）
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error && signIn.data.user) {
      // 老用户：检查邮箱是否已确认
      if (!signIn.data.user.email_confirmed_at && !(signIn.data.user as any).confirmed_at) {
        setSubmitting(false);
        setStage('wait-email');
        return;
      }
      // 已确认 → 建/取 profile 后进站
      const { error: profErr } = await supabase.rpc('create_profile');
      setSubmitting(false);
      if (profErr) { setErr(profErr.message); return; }
      nav('/');
      return;
    }

    // 2) 登录失败且是凭证错误 → 走注册
    if (signIn.error && /invalid login credentials/i.test(signIn.error.message)) {
      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      setSubmitting(false);
      if (signUp.error) { setErr(signUp.error.message); return; }
      // 注册成功后 Supabase 已发邮件，停在 wait-email
      setStage('wait-email');
      return;
    }

    // 3) 其他错误（密码错等）
    setSubmitting(false);
    setErr(signIn.error?.message ?? '登录失败');
  }

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
          {stage === 'form' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 32, fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 3, paddingBottom: 14, borderBottom: '0.5px solid rgba(255,255,255,0.18)' }}>
                注册 / 登录
              </div>

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
                新用户首次注册需邮箱验证 · 老用户直接登录
              </div>

              {err && <div style={{ color: 'rgba(255,180,180,0.95)', fontSize: 13, marginTop: 4, marginBottom: 10 }}>⚠ {err}</div>}

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={submit} disabled={submitting || !email || !password}>
                {submitting ? '处理中…' : '进入海面'}
              </button>
            </>
          )}

          {stage === 'wait-email' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.55)', letterSpacing: 4, marginBottom: 18 }}>check your inbox</div>
              <div style={{ fontSize: 16, lineHeight: 1.9, letterSpacing: 1.5, marginBottom: 24 }}>
                我们给 <em style={{ fontStyle: 'normal', color: '#fff' }}>{email}</em> 发了一封确认邮件。<br/>
                点击邮件中的链接完成验证，<br/>
                然后回到这里就能进站了。
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 28, letterSpacing: 1 }}>
                没收到？检查垃圾邮件夹，<br/>
                或确认邮箱真实存在且为 @tencent.com 工作邮箱
              </div>
              <button className="btn btn-ghost" onClick={() => { setStage('form'); setErr(null); }} style={{ marginRight: 12 }}>换个邮箱</button>
              <button className="btn btn-primary" onClick={async () => {
                await supabase.auth.resend({ type: 'signup', email });
                alert('已重新发送，请稍等几秒查看邮箱');
              }}>重发邮件</button>
            </div>
          )}

          {stage === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.7)' }}>
              邮箱验证通过，正在为你分配编号…
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, lineHeight: 1.8 }}>
          密码加密存储 · 聊天加密保存 ·<br/>
          邮箱仅用于登录，不与瓶子关联
        </div>
      </main>
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
