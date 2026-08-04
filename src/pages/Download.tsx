import { Link } from 'react-router-dom';
import { useIsNarrow } from '../lib/useIsNarrow';

export default function Download() {
  const isNarrow = useIsNarrow();

  return (
    <main style={{
      position: 'relative', zIndex: 1, minHeight: '100vh',
      padding: isNarrow ? '100px 24px 60px' : '130px 56px 80px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: '#fff',
    }}>
      {/* 标题 */}
      <h1 style={{
        fontSize: isNarrow ? 22 : 28, fontWeight: 300, letterSpacing: 4,
        margin: 0, marginBottom: 10, textAlign: 'center',
        textShadow: '0 2px 16px rgba(0,0,0,0.4)',
      }}>
        下载 Mac桌面版
      </h1>
      <p style={{
        fontSize: isNarrow ? 12 : 13, color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1.5, margin: 0, marginBottom: isNarrow ? 32 : 44,
        textShadow: '0 1px 8px rgba(0,0,0,0.3)',
      }}>
        常驻菜单栏 · 随手扔瓶捞瓶 · 新消息即时提醒
      </p>

      {/* 下载按钮区 — 实心高亮，最高层级 */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        width: '100%', maxWidth: 360, marginBottom: isNarrow ? 28 : 40,
      }}>
        <a
          href="https://github.com/Joeyyyzhou/feiewurao/releases/download/v1.0.0-mac/feiewurao-mac-arm64.dmg"
          download
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            padding: '14px 0',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 10,
            color: '#1a2a3a',
            fontSize: 15, fontWeight: 600, letterSpacing: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
        >
          ⬇ Apple 芯片 (M1/M2/M3/M4)
        </a>
        <a
          href="https://github.com/Joeyyyzhou/feiewurao/releases/download/v1.0.0-mac/feiewurao-mac-x64.dmg"
          download
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            padding: '14px 0',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14, fontWeight: 400, letterSpacing: 1,
            transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          ⬇ Intel 芯片
        </a>
      </div>

      {/* 安装提示 — 弱层级 */}
      <div style={{
        width: '100%', maxWidth: 360,
        fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.9,
        letterSpacing: 0.3, textShadow: '0 1px 6px rgba(0,0,0,0.3)',
      }}>
        <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>安装提示</div>
        1. 双击 .dmg → 把图标拖进「应用程序」<br />
        2. 首次打开右键图标 → 打开 → 再点打开<br />
        3. 看屏幕右上角菜单栏的漂流瓶图标<br />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11}}>
          不确定芯片？ → 关于本机 → 芯片/处理器
        </span>
      </div>

      <Link to="/" style={{
        marginTop: isNarrow ? 32 : 44, color: 'rgba(255,255,255,0.5)', fontSize: 12,
        letterSpacing: 2, textDecoration: 'none',
        textShadow: '0 1px 6px rgba(0,0,0,0.3)',
      }}>
        ← 返回
      </Link>
    </main>
  );
}
