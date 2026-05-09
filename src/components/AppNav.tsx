import { Link, useLocation } from 'react-router-dom';

export default function AppNav() {
  const loc = useLocation();
  const path = loc.pathname;
  return (
    <nav className="app-nav">
      <Link
        to="/"
        className={`nav-link ${path === '/' ? 'active' : ''}`}
      >
        非鹅勿扰
      </Link>
      <div className="nav-tabs">
        <Link to="/sea" className={`nav-link ${path === '/sea' ? 'active' : ''}`}>海</Link>
        <Link to="/friends" className={`nav-link ${path === '/friends' ? 'active' : ''}`}>瓶友</Link>
        <Link to="/me" className={`nav-link ${path === '/me' ? 'active' : ''}`}>我</Link>
      </div>
    </nav>
  );
}
