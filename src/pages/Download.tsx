import { Link } from 'react-router-dom';
import { useIsNarrow } from '../lib/useIsNarrow';

export default function Download() {
  const isNarrow = useIsNarrow();

  const cardBtn = (label: string, sub: string, href: string) => (
    <a
      href={href}
      download
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.14)',
        border: '0.5px solid rgba(255,255,255,0.34)',
        borderRadius: 14,
        color: '#fff', textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.24)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
    >
      <span style={{ fontSize: 15, letterSpacing: 1, fontWeight: 500 }}>⬇ {label}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>{sub}</span>
    </a>
  );

  return (
    <main style={{
      position: 'relative', zIndex: 1, minHeight: '100vh',
      padding: isNarrow ? '80px 24px 60px' : '110px 56px 80px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 46, marginBottom: 10 }}>🍶</div>
        <h1 style={{ fontSize: isNarrow ? 24 : 30, fontWeight: 300, letterSpacing: 3, margin: 0, marginBottom: 12 }}>
          非鹅勿扰 · Mac 菜单栏工具
        </h1>
        <div style={{ fontSize: isNarrow ? 13 : 14, fontWeight: 300, letterSpacing: 1.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, maxWidth: 420 }}>
          常驻菜单栏，随手扔瓶、捞瓶，<br />有人回信时第一时间提醒你
        </div>
      </div>

      {/* 下载卡 */}
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.5) brightness(0.92)',
        border: '0.5px solid rgba(255,255,255,0.32)',
        borderRadius: 18,
        padding: isNarrow ? '24px 20px' : '32px 34px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
          {cardBtn('Apple 芯片 (M1/M2/M3/M4)', '2020 年后的 Mac 多为此类', 'https://github.com/Joeyyyzhou/feiewurao/releases/download/v1.0.0-mac/feiewurao-mac-arm64.dmg')}
          {cardBtn('Intel 芯片', '较早期的 Intel Mac', 'https://github.com/Joeyyyzhou/feiewurao/releases/download/v1.0.0-mac/feiewurao-mac-x64.dmg')}
        </div>

        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, letterSpacing: 0.3,
          borderTop: '0.5px solid rgba(255,255,255,0.18)', paddingTop: 16,
        }}>
          <div style={{ fontWeight: 500, marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>安装步骤</div>
          1. 下载后双击 .dmg，把「非鹅勿扰」拖进「应用程序」<br />
          2. 首次打开：<b>右键</b>图标 → 选「打开」→ 再点「打开」<br />
          &nbsp;&nbsp;&nbsp;（因未做苹果签名，仅首次需要这样）<br />
          3. 打开后看<b>屏幕右上角菜单栏</b>的漂流瓶图标，点它即可
        </div>

        <div style={{
          fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 14, lineHeight: 1.7,
        }}>
          不确定芯片类型？点左上角  → 关于本机，查看「芯片 / 处理器」一栏。
        </div>
      </div>

      <Link to="/" style={{
        marginTop: 28, color: 'rgba(255,255,255,0.75)', fontSize: 13,
        letterSpacing: 2, textDecoration: 'none',
      }}>
        ← 返回首页
      </Link>
    </main>
  );
}
