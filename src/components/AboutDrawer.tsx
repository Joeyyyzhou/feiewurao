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

      {/* 抽屉本体 — 浅化磨砂玻璃 */}
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(560px, 100vw)', zIndex: 260,
          background: 'rgba(70, 100, 135, 0.32)',
          backdropFilter: 'blur(48px) saturate(1.4) brightness(1.05)',
          WebkitBackdropFilter: 'blur(48px) saturate(1.4) brightness(1.05)',
          borderLeft: '0.5px solid rgba(255,255,255,0.28)',
          boxShadow: '-24px 0 48px rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.18)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .42s cubic-bezier(.22,.61,.36,1)',
          overflow: 'hidden',
          color: '#fff',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* 头部 — 真·固定在抽屉顶部，不随内容滚动 */}
        <div style={{
          flexShrink: 0,
          padding: '32px 44px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(70,100,135,0.55) 0%, rgba(70,100,135,0.15) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.18)',
        }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 5, textTransform: 'lowercase', marginBottom: 4 }}>about</div>
            <div style={{ fontSize: 18, color: '#fff', letterSpacing: 4, fontFamily: '"Source Han Serif CN VF Medium", serif', textShadow: '0 1px 8px rgba(0,0,0,0.35)' }}>关于这片海</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="关闭"
            style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 24, padding: 8, lineHeight: 1,
              fontFamily: 'inherit',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >×</button>
        </div>

        {/* 滚动内容区 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '44px 44px 64px' }}>
          <Card num="01" en="why this sea exists" title="为什么会有这片海">
            <p style={{ marginBottom: 18 }}>2010 年前后，QQ 邮箱里有一片海。</p>
            <p style={{ marginBottom: 18 }}>
              那时候我还在上小学，<br/>
              不需要做 PPT，<br/>
              也没人问下一个里程碑是什么。<br/>
              下课回家，打开邮箱，<br/>
              写一句话扔进去，<br/>
              第二天起来去捞一个回来。
            </p>
            <p style={{ marginBottom: 18 }}>
              瓶子里有陌生人的失恋、喜悦、阳台外的雨，<br/>
              也有自己藏了很久没敢讲的事。
            </p>
            <Verse>海很大，<br/>我很小，<br/>但那一刻，谁也不孤单。</Verse>
            <p style={{ marginTop: 18, marginBottom: 18 }}>
              后来海被关掉了，<br/>
              我也长大了，进了大厂，开了周会，<br/>
              学会了把话留在心里。
            </p>
            <p style={{ marginBottom: 0 }}>
              2026 年，<strong>非鹅勿扰</strong>，<br/>
              是给所有还记得那片海的人，<br/>
              也是给从没见过它的人。
            </p>
          </Card>

          <Card num="02" en="how to play" title="怎么玩漂流瓶">
            <p style={{ marginBottom: 6, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>每天 3 次扔瓶 + 3 次捞瓶。</p>
            <FlowDiagram />
          </Card>

          <Card num="03" en="principles & safety" title="我们想守护的边界">
            <PrinciplesIcons />
          </Card>

          <div style={{
            marginTop: 24, padding: '40px 32px', textAlign: 'center',
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
            border: '0.5px solid rgba(255,255,255,0.28)',
            borderRadius: 14,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.75)', letterSpacing: 5, marginBottom: 14, textTransform: 'lowercase' }}>your turn</div>
            <div style={{ fontSize: 16, color: '#fff', letterSpacing: 3, marginBottom: 22, lineHeight: 1.7, fontFamily: '"Source Han Serif CN VF Light", serif', textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>
              说了这么多，<br/>不如<strong style={{ fontFamily: '"Source Han Serif CN VF Medium", serif' }}>先扔一个瓶子</strong>。
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.94)', color: '#1a4456',
                border: '0.5px solid rgba(255,255,255,0.7)',
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
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(20px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      border: '0.5px solid rgba(255,255,255,0.28)',
      borderRadius: 14,
      padding: '32px 32px',
      marginBottom: CARD_GAP,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 14, marginBottom: 18, borderBottom: '0.5px solid rgba(255,255,255,0.22)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 28, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 4, textTransform: 'lowercase', marginBottom: 4 }}>{en}</div>
          <div style={{ fontSize: 18, color: '#fff', letterSpacing: 3, fontFamily: '"Source Han Serif CN VF Medium", serif', textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>{title}</div>
        </div>
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 2.15, color: 'rgba(255,255,255,0.95)', letterSpacing: 1.5, fontFamily: '"Source Han Serif CN VF Light", serif', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
        {children}
      </div>
    </div>
  );
}

function Verse({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'block', margin: '6px 0 16px', paddingLeft: 14, borderLeft: '2px solid rgba(255,255,255,0.45)', color: '#fff', lineHeight: 1.95, fontStyle: 'italic' }}>
      {children}
    </span>
  );
}

function FlowDiagram() {
  // 漂流瓶完整旅程：写信 → 扔瓶 → 海里随机 → 被人捞起 → 回信(成瓶友) / 放回海(继续漂)
  return (
    <div style={{ marginTop: 14 }}>
      <svg viewBox="0 0 480 220" width="100%" style={{ display: 'block' }} aria-label="漂流瓶流程">
        <defs>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.85)" />
          </marker>
        </defs>

        {/* 海面背景条 */}
        <rect x="0" y="92" width="460" height="40" fill="url(#seaGrad)" />
        <path d="M0 102 Q 30 96 60 102 T 120 102 T 180 102 T 240 102 T 300 102 T 360 102 T 420 102 T 480 102"
              stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" fill="none" />

        {/* 节点 1：写信 */}
        <g>
          <circle cx="46" cy="44" r="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          {/* 信纸图标 */}
          <rect x="36" y="34" width="20" height="18" rx="2" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1" />
          <line x1="40" y1="40" x2="52" y2="40" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <line x1="40" y1="44" x2="52" y2="44" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <line x1="40" y1="48" x2="48" y2="48" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <text x="46" y="86" fill="#fff" fontSize="11" textAnchor="middle" letterSpacing="2">写信</text>
        </g>

        {/* 节点 2：扔瓶进海 */}
        <g>
          <circle cx="160" cy="44" r="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          {/* 瓶子图标 */}
          <path d="M156 32 L156 36 L154 38 L154 56 Q154 58 156 58 L164 58 Q166 58 166 56 L166 38 L164 36 L164 32 Z"
                fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1" />
          <rect x="155" y="46" width="10" height="6" fill="rgba(255,255,255,0.45)" />
          <text x="160" y="86" fill="#fff" fontSize="11" textAnchor="middle" letterSpacing="2">匿名扔进海</text>
        </g>

        {/* 节点 3：海里漂流（中间是海） */}
        <g>
          <circle cx="274" cy="112" r="20" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" strokeDasharray="3 3" />
          {/* 小波浪 */}
          <path d="M262 112 q 4 -4 8 0 t 8 0 t 8 0" stroke="rgba(255,255,255,0.85)" strokeWidth="1" fill="none" />
          <text x="274" y="148" fill="rgba(255,255,255,0.85)" fontSize="10.5" textAnchor="middle" letterSpacing="2" fontStyle="italic" fontFamily="'Cormorant Garamond', serif">drift…</text>
        </g>

        {/* 节点 4：随机被捞 */}
        <g>
          <circle cx="388" cy="44" r="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          {/* 手图标 */}
          <path d="M380 50 L380 40 Q380 38 382 38 Q384 38 384 40 L384 36 Q384 34 386 34 Q388 34 388 36 L388 40 L388 34 Q388 32 390 32 Q392 32 392 34 L392 42 L392 36 Q392 34 394 34 Q396 34 396 36 L396 50 Q396 56 390 56 L384 56 Q380 56 380 50 Z"
                fill="rgba(255,255,255,0.95)" />
          <text x="388" y="86" fill="#fff" fontSize="11" textAnchor="middle" letterSpacing="2">随机被同事捞起</text>
        </g>

        {/* 箭头：写信 → 扔瓶 → 漂流 → 被捞 */}
        <line x1="72" y1="44" x2="132" y2="44" stroke="rgba(255,255,255,0.85)" strokeWidth="1" markerEnd="url(#arrow)" />
        <path d="M180 56 Q 218 90 254 108" stroke="rgba(255,255,255,0.85)" strokeWidth="1" fill="none" markerEnd="url(#arrow)" strokeDasharray="4 3" />
        <path d="M294 108 Q 330 90 364 56" stroke="rgba(255,255,255,0.85)" strokeWidth="1" fill="none" markerEnd="url(#arrow)" strokeDasharray="4 3" />

        {/* 分叉：回信 / 放回海 */}
        <line x1="388" y1="68" x2="388" y2="118" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
        <line x1="240" y1="118" x2="436" y2="118" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
        <line x1="270" y1="118" x2="270" y2="138" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
        <line x1="406" y1="118" x2="406" y2="138" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
        <polygon points="270,140 266,134 274,134" fill="rgba(255,255,255,0.85)" />
        <polygon points="406,140 402,134 410,134" fill="rgba(255,255,255,0.85)" />

        {/* 终点 A：回信 → 成瓶友（左下） */}
        <g>
          <rect x="206" y="142" width="128" height="56" rx="8"
                fill="rgba(255, 195, 100, 0.18)" stroke="rgba(255, 215, 150, 0.65)" strokeWidth="0.7" />
          <text x="270" y="164" fill="#ffd89a" fontSize="12" textAnchor="middle" letterSpacing="2" fontWeight="500">回信</text>
          <text x="270" y="184" fill="rgba(255,235,200,0.95)" fontSize="10.5" textAnchor="middle" letterSpacing="1.5">成为「瓶友」</text>
        </g>

        {/* 终点 B：放回 → 继续漂（右下） */}
        <g>
          <rect x="342" y="142" width="128" height="56" rx="8"
                fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" strokeDasharray="3 3" />
          <text x="406" y="164" fill="rgba(255,255,255,0.92)" fontSize="12" textAnchor="middle" letterSpacing="2">放回海</text>
          <text x="406" y="184" fill="rgba(255,255,255,0.7)" fontSize="10.5" textAnchor="middle" letterSpacing="1.5">瓶子继续漂</text>
        </g>
      </svg>

      <div style={{
        marginTop: 12, fontSize: 11.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)',
        fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', textAlign: 'center', letterSpacing: 1.5,
      }}>
        no algorithm · no recommendation · just drift
      </div>
    </div>
  );
}

function PrinciplesIcons() {
  const items: { icon: React.ReactNode; title: string; desc: string }[] = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 L20 7 V13 C20 17 16 20 12 21 C8 20 4 17 4 13 V7 Z"
                stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="rgba(255,255,255,0.08)" />
          <path d="M9 12 L11 14 L15 10" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
        </svg>
      ),
      title: '同温层',
      desc: '仅限鹅厂员工，企业邮箱认证。',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="rgba(255,255,255,0.08)" />
          <text x="12" y="15.5" fill="rgba(255,255,255,0.95)" fontSize="9" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontStyle="italic">No.</text>
        </svg>
      ),
      title: '绝对匿名',
      desc: '无昵称、无照片，只有随机编号。',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 12 H19" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" />
          <circle cx="8" cy="12" r="2" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" />
          <circle cx="16" cy="12" r="2" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" />
          <line x1="4" y1="6" x2="20" y2="18" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" />
        </svg>
      ),
      title: '平台克制',
      desc: '不做算法推荐，不打扰对话。',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 18 Q12 8 19 18" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
          <circle cx="12" cy="11" r="2.5" fill="rgba(255,255,255,0.85)" />
        </svg>
      ),
      title: '体面告别',
      desc: '可随时结束漂流，记录双方保留。',
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
      {items.map((it) => (
        <div key={it.title} style={{
          padding: '14px 14px',
          background: 'rgba(255,255,255,0.12)',
          border: '0.5px solid rgba(255,255,255,0.28)',
          borderRadius: 10,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>{it.icon}</div>
          <div>
            <div style={{ fontSize: 13, color: '#fff', letterSpacing: 2.5, marginBottom: 4, fontWeight: 500 }}>{it.title}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
