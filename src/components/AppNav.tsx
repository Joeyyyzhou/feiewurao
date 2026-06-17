import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useIsNarrow } from '../lib/useIsNarrow';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function AppNav() {
  const loc = useLocation();
  const path = loc.pathname;
  const isSea = path === '/' || path === '/sea';
  const isNarrow = useIsNarrow();
  const { profile } = useAuth();

  const [countdown, setCountdown] = useState({ h: '--', m: '--' });
  const [unread, setUnread] = useState(0);

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

  // 拉总未读数（瓶友 tab 红点）
  useEffect(() => {
    if (!profile) { setUnread(0); return; }
    const fetchUnread = async () => {
      const { data, error } = await supabase.rpc('count_unread_conversations' as any);
      if (!error) setUnread(Number(data) || 0);
    };
    fetchUnread();
    // 进入瓶友 tab 后，本来应该把 unread 清空；这里依赖路由变化重拉一次
    const id = setInterval(fetchUnread, 30000);
    const onVisible = () => { if (!document.hidden) fetchUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchUnread);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchUnread);
    };
  }, [profile, path]);

  return (
    <nav className="app-nav">
      <div className="nav-tabs">
        <Link to="/" className={`nav-link ${isSea ? 'active' : ''}`}>海</Link>
        <Link to="/friends" className={`nav-link ${path === '/friends' ? 'active' : ''}`} style={{ position: 'relative' }}>
          瓶友
          {unread > 0 && path !== '/friends' && (
            <span style={{
              position: 'absolute', top: -4, right: -10,
              minWidth: 16, height: 16, padding: '0 4px',
              background: 'rgba(220, 110, 90, 0.95)',
              borderRadius: 999, color: '#fff',
              fontSize: 10, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(220, 110, 90, 0.55)',
              border: '1px solid rgba(20, 30, 45, 0.85)',
            }}>{unread > 9 ? '9+' : unread}</span>
          )}
        </Link>
        <Link to="/me" className={`nav-link ${path === '/me' ? 'active' : ''}`}>我</Link>
      </div>
      <div style={{
        marginLeft: 'auto',
        fontFamily: '"Source Han Serif CN VF Light", serif',
        fontSize: isNarrow ? 11 : 12,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: isNarrow ? 1.5 : 3,
        textShadow: '0 1px 6px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
      }}>
        {isNarrow ? (
          <>还有 <em style={emStyle}>{countdown.h}</em>:<em style={emStyle}>{countdown.m}</em></>
        ) : (
          <>每日 <em style={emStyle}>0</em>:<em style={emStyle}>00</em> 重置 · 还有 <em style={emStyle}>{countdown.h}</em>:<em style={emStyle}>{countdown.m}</em> 刷新</>
        )}
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
