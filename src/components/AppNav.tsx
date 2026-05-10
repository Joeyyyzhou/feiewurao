import { Link, useLocation } from 'react-router-dom';

function RippleLogo({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <g
        transform="translate(32 32)"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        <ellipse cx="0" cy="8" rx="5" ry="1.6" strokeWidth="1.6" opacity="0.95" />
        <ellipse cx="0" cy="8" rx="13" ry="3.6" strokeWidth="1.3" opacity="0.7" />
        <ellipse cx="0" cy="8" rx="22" ry="6" strokeWidth="1" opacity="0.45" />
        <ellipse cx="0" cy="8" rx="30" ry="8" strokeWidth="0.7" opacity="0.22" />
        <circle cx="0" cy="8" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="0" cy="-18" r="1.4" fill="currentColor" stroke="none" />
        <line
          x1="0" y1="-18" x2="0" y2="4"
          strokeWidth="0.6"
          strokeDasharray="1 3"
          opacity="0.45"
        />
      </g>
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
        <RippleLogo size={22} />
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
