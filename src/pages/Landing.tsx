import { useNavigate } from 'react-router-dom';
import AboutDrawer from '../components/AboutDrawer';
import { useIsNarrow } from '../lib/useIsNarrow';

export default function Landing() {
  const nav = useNavigate();
  const isNarrow = useIsNarrow();

  return (
    <>
      {/* 右上角：下载 Mac 菜单栏客户端 */}
      <button
        onClick={() => nav('/download')}
        style={{
          position: 'fixed', top: isNarrow ? 14 : 20, right: isNarrow ? 16 : 28, zIndex: 110,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: isNarrow ? '8px 14px' : '10px 18px',
          background: 'rgba(8, 22, 34, 0.95)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: '1.5px solid rgba(255,255,255,0.7)',
          borderRadius: 999,
          color: '#fff',
          fontSize: isNarrow ? 12 : 14, letterSpacing: 1, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: isNarrow ? 13 : 16 }}>🍶</span>
        {isNarrow ? 'Mac 客户端' : '下载 Mac 客户端'}
      </button>
      <main style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        padding: isNarrow ? '76px 24px 60px' : '120px 56px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        {/* 主标题区 */}
        <div style={{ textAlign: 'center', marginBottom: isNarrow ? 28 : 44 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: isNarrow ? 11 : 13,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: isNarrow ? 4 : 6,
            marginBottom: 14,
            textTransform: 'lowercase',
          }}>
            a quiet sea inside tencent
          </div>
          <h1 style={{
            fontSize: isNarrow ? 28 : 40,
            fontWeight: 300,
            letterSpacing: isNarrow ? 2 : 4,
            lineHeight: 1.5,
            margin: 0,
            marginBottom: 16,
          }}>
            非鹅勿扰漂流瓶
          </h1>
          <div style={{
            fontSize: isNarrow ? 14 : 16,
            fontWeight: 300,
            letterSpacing: isNarrow ? 2 : 3,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.7,
          }}>
            在鹅厂扔一个漂流瓶，<em style={{ fontStyle: 'normal' }}>可能有人懂你</em>
          </div>
        </div>

        {/* 玻璃卡：3 步介绍 + 按钮 */}
        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
          border: '0.5px solid rgba(255,255,255,0.32)',
          borderRadius: 16,
          padding: isNarrow ? '28px 22px' : '38px 44px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}>
          <div style={{
            textAlign: 'center', fontSize: isNarrow ? 12 : 13,
            color: 'rgba(255,255,255,0.6)', letterSpacing: isNarrow ? 3 : 4,
            paddingBottom: 14, marginBottom: 24,
            borderBottom: '0.5px solid rgba(255,255,255,0.18)',
          }}>
            how it works
          </div>

          {[
            { num: '01', title: '写下心情，扔进海里', sub: '一句话也行 · 心情贴纸代替表情' },
            { num: '02', title: '随机捞起一个瓶子', sub: '陌生人 · 没有算法推荐' },
            { num: '03', title: '回信，成为瓶友', sub: '一对一聊天 · 结束随时可走' },
          ].map((step) => (
            <div key={step.num} style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              marginBottom: 18,
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                fontSize: isNarrow ? 22 : 26,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.2, flexShrink: 0,
                minWidth: 36,
              }}>{step.num}</div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: isNarrow ? 14 : 15, letterSpacing: 1.5, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: isNarrow ? 12 : 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, lineHeight: 1.6 }}>{step.sub}</div>
              </div>
            </div>
          ))}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
            onClick={() => nav('/register')}
          >
            进入海面
          </button>
          <button
            onClick={() => nav('/download')}
            style={{
              width: '100%', justifyContent: 'center', marginTop: 12,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 999,
              fontFamily: "'Source Han Serif CN VF Medium', serif",
              fontSize: 14, letterSpacing: 2,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff', cursor: 'pointer',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ fontSize: 16 }}>🍶</span> 下载 Mac 菜单栏客户端
          </button>
          <div style={{
            textAlign: 'center', marginTop: 14,
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5,
          }}>
            仅鹅厂员工 · 匿名 · 端到端加密
          </div>
        </div>

        {/* 关于折叠链接 */}
        <button
          onClick={() => nav('/?about=1')}
          style={{
            marginTop: isNarrow ? 32 : 44,
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13, letterSpacing: 3,
            cursor: 'pointer', padding: '8px 16px',
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}
        >
          关于这片海 ↓
        </button>

        {/* footer */}
        <div style={{
          marginTop: isNarrow ? 32 : 56,
          fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
          fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, lineHeight: 1.8,
          textAlign: 'center',
        }}>
          © 2026 · 仅鹅厂员工 · 匿名 · 端到端加密<br/>
          made by Joey
        </div>
      </main>

      <AboutDrawer />
    </>
  );
}
