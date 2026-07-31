import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsNarrow } from '../lib/useIsNarrow';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function AppNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const path = loc.pathname;
  const isSea = path === '/' || path === '/sea';
  const isNarrow = useIsNarrow();
  const { profile } = useAuth();

  const [countdown, setCountdown] = useState({ h: '--', m: '--' });
  const [unread, setUnread] = useState(0);
  const profileIdRef = useRef<string | null>(null);
  const prevPathRef = useRef<string>('');
  profileIdRef.current = profile?.id ?? null;

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

  const fetchUnread = useCallback(async () => {
    if (!profileIdRef.current) { setUnread(0); return; }
    const { data, error } = await supabase.rpc('count_unread_conversations' as any);
    if (!error) setUnread(Number(data) || 0);
  }, []);

  // 拉总未读数（瓶友 tab 红点）：轮询 + 路由变化 + 焦点返回
  useEffect(() => {
    if (!profile) { setUnread(0); return; }

    // 进入瓶友 tab：立即乐观清零红点（"进入=已看"），不等 RPC
    if (path === '/friends') {
      setUnread(0);
      prevPathRef.current = path;
      return;
    }

    // 从 /chat 页面返回时，延迟 600ms 再拉取（等 mark_conversation_read RPC commit）
    const fromChat = prevPathRef.current.startsWith('/chat');
    const delay = fromChat ? 600 : 0;
    prevPathRef.current = path;

    const timer = setTimeout(() => { if (profileIdRef.current) fetchUnread(); }, delay);
    const id = setInterval(fetchUnread, 30000);
    const onVisible = () => { if (!document.hidden) fetchUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchUnread);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchUnread);
    };
  }, [profile, path, fetchUnread]);

  // Realtime：新消息到达时立即刷新未读数（红点实时出现）
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('appnav:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (payload.new?.sender_id !== profileIdRef.current) {
            fetchUnread();
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, fetchUnread]);

  return (
    <nav className="app-nav">
      <div className="nav-tabs">
        <Link to="/" className={`nav-link ${isSea ? 'active' : ''}`}>海</Link>
        <Link to="/friends" className={`nav-link ${path === '/friends' ? 'active' : ''}`} style={{ position: 'relative' }}>
          瓶友
          {unread > 0 && path !== '/friends' && (
            // 玻璃风微光小点：奶白圆 + 暖光晕，呼吸动画。不显示数字，保持克制。
            <span
              aria-label={`${unread} 条未读`}
              style={{
                position: 'absolute', top: -2, right: -8,
                width: 6, height: 6, borderRadius: 999,
                background: 'rgba(255, 252, 240, 0.95)',
                boxShadow: '0 0 8px rgba(255, 240, 200, 0.85), 0 0 0 0.5px rgba(0,0,0,0.2)',
                animation: 'softPulse 2.4s ease-in-out infinite',
              }}
            />
          )}
        </Link>
        <Link to="/me" className={`nav-link ${path === '/me' ? 'active' : ''}`}>我</Link>
      </div>
      <div style={{
        marginLeft: 'auto',
        display: 'flex', alignItems: 'center', gap: isNarrow ? 8 : 16,
      }}>
        <button
          onClick={() => nav('/download')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer',
            padding: 0,
            fontSize: isNarrow ? 11 : 12,
            letterSpacing: 1.5,
            fontFamily: '"Source Han Serif CN VF Light", serif',
            textShadow: '0 1px 6px rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
        >
          🫙 桌面版
        </button>
        <div style={{
        fontSize: isNarrow ? 11 : 12,
        fontFamily: '"Source Han Serif CN VF Light", serif',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: isNarrow ? 1.5 : 3,
        textShadow: '0 1px 6px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
      }}>
        {isNarrow ? (
          <>距明天 <em style={emStyle}>{countdown.h}</em>:<em style={emStyle}>{countdown.m}</em></>
        ) : (
          <>潮水重涌于明日 <em style={emStyle}>0</em>:<em style={emStyle}>00</em> · 还有 <em style={emStyle}>{countdown.h}</em>:<em style={emStyle}>{countdown.m}</em></>
        )}
      </div>
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
