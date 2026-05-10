import { Link, useLocation } from 'react-router-dom';

function BottleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="-32 -56 64 110"
      width={size}
      height={(size * 110) / 64}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path
        d="M -8 -50 L 8 -50 L 8 -38 L 14 -28 C 22 -16 26 -4 26 14 C 26 32 14 44 0 44 C -14 44 -26 32 -26 14 C -26 -4 -22 -16 -14 -28 L -8 -38 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line
        x1="-8"
        y1="-50"
        x2="8"
        y2="-50"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AppNav() {
  const loc = useLocation();
  const path = loc.pathname;
  return (
    <nav className="app-nav">
      <Link
        to="/"
        className={`nav-link nav-brand ${path === '/' ? 'active' : ''}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <BottleIcon size={18} />
        <span>非鹅勿扰</span>
      </Link>
      <div className="nav-tabs">
        <Link to="/sea" className={`nav-link ${path === '/sea' ? 'active' : ''}`}>海</Link>
        <Link to="/friends" className={`nav-link ${path === '/friends' ? 'active' : ''}`}>瓶友</Link>
        <Link to="/me" className={`nav-link ${path === '/me' ? 'active' : ''}`}>我</Link>
      </div>
    </nav>
  );
}
