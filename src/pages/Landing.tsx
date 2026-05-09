import { Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';

export default function Landing() {
  return (
    <>
      <BgVideo />
      <AppNav />
      <main className="relative z-10">
        <section style={{ height: '100vh', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '120px 56px 0', textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: 6,
              marginBottom: 22, textTransform: 'lowercase',
              textShadow: '0 1px 12px rgba(0,0,0,0.5)',
            }}>
              a quiet sea inside tencent
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 300, lineHeight: 1.4,
              color: 'rgba(255,255,255,0.97)', letterSpacing: 4,
              textShadow: '0 2px 30px rgba(0,0,0,0.55)',
              margin: 0,
            }}>
              在鹅厂扔一个漂流瓶，可能有人懂你。
            </h1>
          </div>
          <div style={{
            position: 'absolute', left: '50%', bottom: '22%',
            transform: 'translateX(-50%)', display: 'flex', gap: 18,
          }}>
            <Link to="/register" className="btn btn-primary">开始扔瓶子</Link>
            <Link to="/sea" className="btn btn-ghost">已有账号</Link>
          </div>
          <a href="#about" style={{
            position: 'absolute', bottom: 44, left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)', letterSpacing: 6,
            fontSize: 14, textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            textDecoration: 'none',
          }}>
            关于这片海 <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, margin: '0 8px', opacity: 0.7 }}>about</em>
          </a>
        </section>

        <section id="about" style={{ padding: '80px 56px 60px', maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Card num="01" en="why this sea exists" title="为什么会有这片海">
            <p>鹅厂的人，都是说话的高手。</p>
            <p>周会上能讲明白复杂项目，PRD 评审能 hold 住十个角色，绩效面谈能滴水不漏。</p>
            <p>可有时候，想发一句"今天有点累"——</p>
            <Verse>发朋友圈不合适，<br/>跟谁讲又觉得太矫情，<br/>想了想，又删了。</Verse>
            <p><strong>非鹅勿扰</strong>，是一个不用想这些的地方。</p>
            <p>它的灵感，来自很多人记忆里的 <strong>QQ 邮箱漂流瓶</strong>——是它在 2026 年的一次<strong>文艺复兴</strong>。</p>
          </Card>

          <Card num="02" en="how to play" title="怎么玩漂流瓶">
            <p>每天 3 次扔瓶机会，3 次捞瓶机会。</p>
            <Steps />
          </Card>

          <Card num="03" en="principles & safety" title="我们想守护的边界">
            <Principles />
          </Card>

          <FinalCta />
        </section>
      </main>
    </>
  );
}

function Card({ num, en, title, children }: { num: string; en: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      WebkitBackdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      border: '0.5px solid rgba(255,255,255,0.28)',
      borderRadius: 16,
      padding: '40px 48px',
      marginBottom: 24,
      boxShadow: '0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, paddingBottom: 16, marginBottom: 22, borderBottom: '0.5px solid rgba(255,255,255,0.25)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 32, color: 'rgba(255,255,255,0.85)' }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: 4, textTransform: 'lowercase', marginBottom: 4 }}>{en}</div>
          <div style={{ fontSize: 21, color: '#fff', letterSpacing: 4, textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>{title}</div>
        </div>
      </div>
      <div style={{ fontSize: 15.5, lineHeight: 2.0, color: '#fff', letterSpacing: 1.5, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
        {children}
      </div>
    </div>
  );
}
function Verse({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'block', margin: '6px 0 16px', paddingLeft: 14, borderLeft: '1px solid rgba(255,255,255,0.45)', color: '#fff', lineHeight: 2.0 }}>
      {children}
    </span>
  );
}
function Steps() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'stretch', marginTop: 18 }}>
      <Step num="i" name="扔瓶" desc={<>写一段话<br/>匿名扔进海里</>} />
      <Arrow />
      <Step num="ii" name="捞瓶" desc={<>随机捞起<br/>一位同事的瓶子</>} />
      <Arrow />
      <Step num="iii" name="回信" desc={<>回信即成瓶友<br/>不回则放回海里</>} />
    </div>
  );
}
function Step({ num, name, desc }: { num: string; name: string; desc: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 14px', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 10, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22, color: 'rgba(255,255,255,0.95)' }}>{num}</div>
      <div style={{ fontSize: 16, color: '#fff', letterSpacing: 3, margin: '4px 0 6px', fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.95)' }}>{desc}</div>
    </div>
  );
}
function Arrow() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', fontFamily: "'Cormorant Garamond', serif", fontSize: 26, padding: '0 10px' }}>→</div>;
}
function Principles() {
  const items = [
    ['同温层', '仅限鹅厂员工，企业邮箱认证。'],
    ['绝对匿名', '无昵称、无照片，每人一个随机编号和颜色。'],
    ['平台克制', '不算法、不推荐、不打扰你们的对话。'],
    ['体面告别', '可随时结束漂流，记录双方保留。'],
  ];
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 18 }}>
        {items.map(([n, d]) => (
          <div key={n} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.12)', borderLeft: '2px solid rgba(255,255,255,0.7)', borderRadius: 4 }}>
            <div style={{ fontSize: 14, color: '#fff', letterSpacing: 3, marginBottom: 4, fontWeight: 500 }}>{n}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.75, color: '#fff' }}>{d}</div>
          </div>
        ))}
      </div>
    </>
  );
}
function FinalCta() {
  return (
    <div style={{
      marginTop: 56, marginBottom: 24, padding: '64px 40px', textAlign: 'center',
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      border: '0.5px solid rgba(255,255,255,0.28)',
      borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.35)',
    }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 5, marginBottom: 18, textTransform: 'lowercase' }}>your turn</div>
      <div style={{ fontSize: 22, color: '#fff', letterSpacing: 4, marginBottom: 36, lineHeight: 1.5 }}>
        说了这么多，<br/>不如<strong>先扔一个瓶子</strong>。
      </div>
      <Link to="/register" className="btn btn-primary" style={{ fontSize: 17, letterSpacing: 6 }}>扔一个瓶子</Link>
    </div>
  );
}
