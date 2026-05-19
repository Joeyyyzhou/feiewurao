import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function Sea() {
  const { profile } = useAuth();
  const loc = useLocation();
  const fromReply = loc.search.includes('fromReply');
  const [thrown, setThrown] = useState(0);
  const [picked, setPicked] = useState(0);
  const [toastShow, setToastShow] = useState(fromReply);
  const [countdown, setCountdown] = useState({ h: '--', m: '--' });

  useEffect(() => {
    if (fromReply) {
      const t = setTimeout(() => setToastShow(false), 3500);
      return () => clearTimeout(t);
    }
  }, [fromReply]);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const diff = +next - +now;
      setCountdown({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      });
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from('quotas')
      .select('thrown, picked')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setThrown(data.thrown);
          setPicked(data.picked);
        }
      });
  }, [profile]);

  return (
    <>
      <BgVideo />
      <AppNav />

      {toastShow && (
        <div style={{
          position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'rgba(0,30,50,0.85)',
          backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,0.25)',
          borderRadius: 999, padding: '12px 26px', color: '#fff',
          fontSize: 13, letterSpacing: 3,
        }}>
          回信已送出 · <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: '0 4px', color: '#ffb84d' }}>瓶友</em> 多了一位
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero 区：保留原有的扔瓶 / 捞瓶入口 */}
        <section style={{ height: '100vh', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '160px 56px 0', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: 6, marginBottom: 22, textTransform: 'lowercase', textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}>
              a quiet sea inside tencent
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 300, lineHeight: 1.4, color: 'rgba(255,255,255,0.97)', textShadow: '0 2px 30px rgba(0,0,0,0.55)', letterSpacing: 4, margin: 0 }}>
              在鹅厂扔一个漂流瓶，可能有人懂你。
            </h1>
          </div>

          <div style={{ position: 'absolute', left: '50%', bottom: '18%', transform: 'translateX(-50%)', display: 'flex', gap: 18 }}>
            {thrown >= 3 ? (
              <button className="btn btn-primary" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                今日扔瓶已满
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: 0.55 }}>0 / 3</span>
              </button>
            ) : (
              <Link to="/throw" className="btn btn-primary">
                扔一个瓶子
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: 0.55 }}>{3 - thrown} / 3</span>
              </Link>
            )}
            {picked >= 3 ? (
              <button className="btn btn-ghost" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                今日捞瓶已满
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: 0.55 }}>0 / 3</span>
              </button>
            ) : (
              <Link to="/pick" className="btn btn-ghost">
                捞一个瓶子
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: 0.55 }}>{3 - picked} / 3</span>
              </Link>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: 86, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: 'rgba(255,255,255,0.6)', letterSpacing: 6, fontSize: 12, fontFamily: "'Source Han Serif CN VF Light', serif" }}>
            每日 <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>0</em>:<em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>00</em> 重置 · 还有 <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>{countdown.h}</em>:<em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>{countdown.m}</em> 刷新
          </div>

          <a href="#about" style={{
            position: 'absolute', bottom: 36, left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.55)', letterSpacing: 4,
            fontSize: 13, textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            textDecoration: 'none',
          }}>
            关于这片海 <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, margin: '0 6px', opacity: 0.7 }}>about ↓</em>
          </a>
        </section>

        {/* About 区：从 Landing 搬过来的 3 张卡 + Final CTA，间距拉大 */}
        <section id="about" style={{ padding: '80px 56px 100px', maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 2 }}>
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

const CARD_GAP = 64;

function Card({ num, en, title, children }: { num: string; en: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      WebkitBackdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      border: '0.5px solid rgba(255,255,255,0.28)',
      borderRadius: 16,
      padding: '40px 48px',
      marginBottom: CARD_GAP,
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 18 }}>
      {items.map(([n, d]) => (
        <div key={n} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.12)', borderLeft: '2px solid rgba(255,255,255,0.7)', borderRadius: 4 }}>
          <div style={{ fontSize: 14, color: '#fff', letterSpacing: 3, marginBottom: 4, fontWeight: 500 }}>{n}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.75, color: '#fff' }}>{d}</div>
        </div>
      ))}
    </div>
  );
}

function FinalCta() {
  return (
    <div style={{
      marginTop: 24, marginBottom: 0, padding: '64px 40px', textAlign: 'center',
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      border: '0.5px solid rgba(255,255,255,0.28)',
      borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.35)',
    }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 5, marginBottom: 18, textTransform: 'lowercase' }}>your turn</div>
      <div style={{ fontSize: 22, color: '#fff', letterSpacing: 4, marginBottom: 36, lineHeight: 1.5 }}>
        说了这么多，<br/>不如<strong>滚回去扔一个瓶子</strong>。
      </div>
      <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn btn-primary" style={{ fontSize: 17, letterSpacing: 6 }}>回到海面</a>
    </div>
  );
}
