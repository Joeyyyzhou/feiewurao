import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AppNav() {
  const loc = useLocation();
  const path = loc.pathname;
  const isSea = path === '/' || path === '/sea';

  const [countdown, setCountdown] = useState({ h: '--', m: '--' });
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

  return (
    <nav className="app-nav">
      <div className="nav-tabs">
        <Link to="/" className={`nav-link ${isSea ? 'active' : ''}`}>海</Link>
        <Link to="/friends" className={`nav-link ${path === '/friends' ? 'active' : ''}`}>瓶友</Link>
        <Link to="/me" className={`nav-link ${path === '/me' ? 'active' : ''}`}>我</Link>
      </div>
      <div style={{
        marginLeft: 'auto',
        fontFamily: '"Source Han Serif CN VF Light", serif',
        fontSize: 12,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 3,
        textShadow: '0 1px 6px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
      }}>
        每日 <em style={emStyle}>0</em>:<em style={emStyle}>00</em> 重置 · 还有 <em style={emStyle}>{countdown.h}</em>:<em style={emStyle}>{countdown.m}</em> 刷新
      </div>
    </nav>
  );
}

const emStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontStyle: 'italic',
  color: 'rgba(255,255,255,0.78)',
  margin: '0 2px',
  fontSize: 13,
};
