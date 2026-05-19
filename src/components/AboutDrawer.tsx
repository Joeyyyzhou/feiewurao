import { useEffect, useState } from 'react';

export default function AboutDrawer() {
  const [open, setOpen] = useState(false);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // 锁滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <>
      {/* 右下角悬浮触发按钮：极简圆圈 ? */}
      <button
        onClick={() => setOpen(true)}
        aria-label="关于这片海"
        title="关于这片海"
        className="about-fab"
        style={{
          position: 'fixed', right: 28, bottom: 28, zIndex: 240,
          width: 44, height: 44,
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          border: '0.5px solid rgba(255,255,255,0.42)',
          borderRadius: '50%',
          color: 'rgba(255,255,255,0.92)',
          padding: 0,
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1,
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .25s ease, background .25s ease, border-color .25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
          e.currentTarget.style.transform = 'scale(1.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >?</button>

      {/* 遮罩 */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 250,
          background: 'rgba(0, 15, 30, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .35s ease',
        }}
      />

      {/* 抽屉本体 — 奶油米色暖调 */}
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(560px, 100vw)', zIndex: 260,
          background: 'rgba(248, 243, 232, 0.92)',
          backdropFilter: 'blur(40px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
          borderLeft: '0.5px solid rgba(180, 165, 130, 0.22)',
          boxShadow: '-24px 0 48px rgba(50, 30, 10, 0.18)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .42s cubic-bezier(.22,.61,.36,1)',
          overflow: 'auto',
          color: '#2a1f1a',
        }}
      >
        <div style={{ padding: '32px 44px', position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(248,243,232,0.98) 0%, rgba(248,243,232,0.7) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(120, 100, 70, 0.18)',
        }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(80, 60, 30, 0.6)', letterSpacing: 5, textTransform: 'lowercase', marginBottom: 4 }}>about</div>
            <div style={{ fontSize: 18, color: '#2a1f1a', letterSpacing: 4, fontFamily: '"Source Han Serif CN VF Medium", serif' }}>关于这片海</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="关闭"
            style={{
              background: 'transparent', border: 'none', color: 'rgba(80, 60, 30, 0.5)',
              cursor: 'pointer', fontSize: 22, padding: 8, lineHeight: 1,
              fontFamily: 'inherit',
            }}
          >×</button>
        </div>

        <div style={{ padding: '12px 44px 64px' }}>
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

          <div style={{
            marginTop: 24, padding: '40px 32px', textAlign: 'center',
            background: 'rgba(255, 250, 235, 0.6)',
            border: '0.5px solid rgba(120, 100, 70, 0.22)',
            borderRadius: 14,
          }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(80, 60, 30, 0.6)', letterSpacing: 5, marginBottom: 14, textTransform: 'lowercase' }}>your turn</div>
            <div style={{ fontSize: 16, color: '#2a1f1a', letterSpacing: 3, marginBottom: 22, lineHeight: 1.7, fontFamily: '"Source Han Serif CN VF Light", serif' }}>
              说了这么多，<br/>不如<strong style={{ fontFamily: '"Source Han Serif CN VF Medium", serif' }}>先扔一个瓶子</strong>。
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: '#2a1f1a', color: '#fcf6ea',
                border: '0.5px solid #2a1f1a',
                borderRadius: 999, padding: '12px 32px',
                fontFamily: '"Source Han Serif CN VF Medium", serif',
                fontSize: 14, letterSpacing: 4,
                cursor: 'pointer',
              }}
            >回到海面</button>
          </div>
        </div>
      </aside>
    </>
  );
}

const CARD_GAP = 56;

function Card({ num, en, title, children }: { num: string; en: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255, 252, 244, 0.7)',
      border: '0.5px solid rgba(120, 100, 70, 0.18)',
      borderRadius: 14,
      padding: '32px 32px',
      marginBottom: CARD_GAP,
      boxShadow: '0 2px 12px rgba(80, 60, 30, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 14, marginBottom: 18, borderBottom: '0.5px solid rgba(120, 100, 70, 0.18)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 28, color: 'rgba(80, 60, 30, 0.55)' }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(80, 60, 30, 0.55)', letterSpacing: 4, textTransform: 'lowercase', marginBottom: 4 }}>{en}</div>
          <div style={{ fontSize: 18, color: '#2a1f1a', letterSpacing: 3, fontFamily: '"Source Han Serif CN VF Medium", serif' }}>{title}</div>
        </div>
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.95, color: '#3a2f2a', letterSpacing: 1, fontFamily: '"Source Han Serif CN VF Light", serif' }}>
        {children}
      </div>
    </div>
  );
}

function Verse({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'block', margin: '6px 0 16px', paddingLeft: 14, borderLeft: '2px solid rgba(120, 100, 70, 0.35)', color: '#3a2f2a', lineHeight: 1.95, fontStyle: 'italic' }}>
      {children}
    </span>
  );
}

function Steps() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
      <Step num="i" name="扔瓶" desc={<>写一段话<br/>匿名扔进海里</>} />
      <Step num="ii" name="捞瓶" desc={<>随机捞起<br/>同事的瓶子</>} />
      <Step num="iii" name="回信" desc={<>回信成瓶友<br/>不回放回海</>} />
    </div>
  );
}

function Step({ num, name, desc }: { num: string; name: string; desc: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 8px', background: 'rgba(255, 250, 235, 0.7)', border: '0.5px solid rgba(120, 100, 70, 0.2)', borderRadius: 10 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, color: 'rgba(80, 60, 30, 0.7)' }}>{num}</div>
      <div style={{ fontSize: 14, color: '#2a1f1a', letterSpacing: 2, margin: '4px 0 4px', fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#5a4f4a' }}>{desc}</div>
    </div>
  );
}

function Principles() {
  const items: [string, string][] = [
    ['同温层', '仅限鹅厂员工，企业邮箱认证。'],
    ['绝对匿名', '无昵称、无照片，每人一个随机编号。'],
    ['平台克制', '不算法、不推荐、不打扰对话。'],
    ['体面告别', '可随时结束漂流，记录双方保留。'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
      {items.map(([n, d]) => (
        <div key={n} style={{ padding: '12px 16px', background: 'rgba(255, 250, 235, 0.7)', borderLeft: '2px solid rgba(120, 100, 70, 0.55)', borderRadius: 4 }}>
          <div style={{ fontSize: 13, color: '#2a1f1a', letterSpacing: 2.5, marginBottom: 4, fontWeight: 500 }}>{n}</div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: '#3a2f2a' }}>{d}</div>
        </div>
      ))}
    </div>
  );
}
