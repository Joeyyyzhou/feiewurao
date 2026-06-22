import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AboutDrawer() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  // 监听 URL query：?about=1 自动展开（用于从其他页面跳过来时拉起）
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    if (params.get('about') === '1') {
      setOpen(true);
      // 拉起后把 query 从地址栏清掉，避免下次刷新又自动弹
      params.delete('about');
      const next = params.toString();
      nav(`${loc.pathname}${next ? '?' + next : ''}`, { replace: true });
    }
  }, [loc.search]);

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
          padding: 'clamp(20px, 5vw, 32px) clamp(24px, 6vw, 44px)',
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
        <div style={{ flex: 1, overflow: 'auto', padding: 'clamp(28px, 6vw, 44px) clamp(20px, 6vw, 44px) 64px' }}>
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
      padding: 'clamp(22px, 5vw, 32px) clamp(20px, 5vw, 32px)',
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
  // 重写：横向 3 步主流程 + 末端两种结局。所有图标在同一基线上对齐，箭头平直清晰，
  // 不再有交叉曲线/堆叠的"drift…"文字。viewBox 540×240，留足边距。
  return (
    <div style={{ marginTop: 14 }}>
      <svg viewBox="0 0 540 240" width="100%" style={{ display: 'block' }} aria-label="漂流瓶流程">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.85)" />
          </marker>
        </defs>

        {/* ===== 主流程：写信 → 扔进海 → 被同事捞起 ===== */}
        {/* 三个节点圆心 y=50，半径 22 */}

        {/* 1. 写信 */}
        <g>
          <circle cx="80" cy="50" r="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          <rect x="70" y="40" width="20" height="18" rx="2" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1" />
          <line x1="74" y1="46" x2="86" y2="46" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <line x1="74" y1="50" x2="86" y2="50" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <line x1="74" y1="54" x2="82" y2="54" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <text x="80" y="92" fill="#fff" fontSize="11" textAnchor="middle" letterSpacing="2">写信</text>
        </g>

        {/* 2. 扔进海 */}
        <g>
          <circle cx="270" cy="50" r="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          {/* 瓶子图标：居中在 (270,50) 周围 */}
          <path d="M266 38 L266 42 L264 44 L264 62 Q264 64 266 64 L274 64 Q276 64 276 62 L276 44 L274 42 L274 38 Z"
                fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1" />
          <rect x="265" y="52" width="10" height="6" fill="rgba(255,255,255,0.45)" />
          <text x="270" y="92" fill="#fff" fontSize="11" textAnchor="middle" letterSpacing="2">匿名扔进海</text>
        </g>

        {/* 3. 被捞起 */}
        <g>
          <circle cx="460" cy="50" r="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          {/* 手图标：简化 — 五指 + 手掌 */}
          <path d="M450 50 L450 42 Q450 40 452 40 Q454 40 454 42 L454 38 Q454 36 456 36 Q458 36 458 38 L458 42 L458 36 Q458 34 460 34 Q462 34 462 36 L462 42 L462 38 Q462 36 464 36 Q466 36 466 38 L466 50 Q466 56 460 56 L456 56 Q450 56 450 50 Z"
                fill="rgba(255,255,255,0.92)" />
          <text x="460" y="92" fill="#fff" fontSize="11" textAnchor="middle" letterSpacing="2">被同事捞起</text>
        </g>

        {/* 两条平直箭头连接三个圆 */}
        <line x1="106" y1="50" x2="242" y2="50" stroke="rgba(255,255,255,0.85)" strokeWidth="1" markerEnd="url(#arrow)" />
        <line x1="296" y1="50" x2="432" y2="50" stroke="rgba(255,255,255,0.85)" strokeWidth="1" markerEnd="url(#arrow)" />

        {/* "drift" 浮在第二个箭头上方一点点，作为氛围词，不和图标交叉 */}
        <text x="365" y="42" fill="rgba(255,255,255,0.6)" fontSize="10" textAnchor="middle" letterSpacing="2"
              fontStyle="italic" fontFamily="'Cormorant Garamond', serif">drift…</text>

        {/* ===== 分叉：捞起后 TA 的两个选择 ===== */}
        {/* 从"被捞起"节点向下分两路 */}
        <line x1="460" y1="106" x2="460" y2="126" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <line x1="180" y1="126" x2="460" y2="126" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <line x1="180" y1="126" x2="180" y2="146" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" markerEnd="url(#arrow)" />
        <line x1="380" y1="126" x2="380" y2="146" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" markerEnd="url(#arrow)" />

        {/* 选项 A：回信 → 成瓶友（左下） */}
        <g>
          <rect x="80" y="152" width="200" height="60" rx="10"
                fill="rgba(255, 195, 100, 0.16)" stroke="rgba(255, 215, 150, 0.6)" strokeWidth="0.7" />
          <text x="180" y="176" fill="#ffd89a" fontSize="13" textAnchor="middle" letterSpacing="3" fontWeight="500">回信</text>
          <text x="180" y="196" fill="rgba(255,235,200,0.95)" fontSize="11" textAnchor="middle" letterSpacing="1.5">从此你们是「瓶友」</text>
        </g>

        {/* 选项 B：放回海 → 瓶子继续漂（右下） */}
        <g>
          <rect x="280" y="152" width="200" height="60" rx="10"
                fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.38)" strokeWidth="0.5" strokeDasharray="3 3" />
          <text x="380" y="176" fill="rgba(255,255,255,0.92)" fontSize="13" textAnchor="middle" letterSpacing="3">放回海</text>
          <text x="380" y="196" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="middle" letterSpacing="1.5">瓶子继续漂流</text>
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
