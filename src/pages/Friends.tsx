import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';
import Avatar from '../components/Avatar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useIsNarrow } from '../lib/useIsNarrow';

interface FriendItem {
  conversationId: string;
  bottleNo: string;
  avatarColor: string;
  preview: string;
  speaker: 'me' | 'them' | 'new';
  time: string;
  ended: boolean;
  unread: number;
}

export default function Friends() {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isNarrow = useIsNarrow();

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      // 一次性 RPC：拉所有 conv + 对方信息 + 最后一条消息 + 未读数
      const { data, error } = await supabase.rpc('list_my_conversations' as any);
      if (cancelled) return;
      if (error || !data) {
        // 兜底：旧逻辑（不会有未读数）
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, status, created_at, ended_at, user_a, user_b')
          .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
          .order('created_at', { ascending: false });
        if (!convs) { setLoading(false); return; }
        const items = convs.map((c: any) => ({
          conversationId: c.id, bottleNo: '----', avatarColor: 'c1',
          preview: '', speaker: 'new' as const, time: relativeTime(c.created_at),
          ended: c.status === 'ended', unread: 0,
        }));
        setFriends(items);
        setLoading(false);
        return;
      }

      const items: FriendItem[] = (data as any[]).map((row) => {
        const hasMsg = !!row.last_msg_content;
        return {
          conversationId: row.conversation_id,
          bottleNo: row.other_no ?? '----',
          avatarColor: row.other_avatar_color ?? 'c1',
          preview: hasMsg ? String(row.last_msg_content).slice(0, 28) : '',
          speaker: hasMsg ? (row.last_msg_sender === profile.id ? 'me' : 'them') : 'new',
          time: relativeTime(row.ended_at ?? row.last_msg_at ?? row.conv_created_at),
          ended: row.status === 'ended',
          unread: Number(row.unread_count) || 0,
        };
      });
      setFriends(items);
      setLoading(false);
    };

    load();
    // 切回标签 / 路由回到这里时也刷新（瓶友列表可能有新消息）
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', load);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', load);
    };
  }, [profile]);

  const active = friends.filter(f => !f.ended);
  const ended = friends.filter(f => f.ended);

  return (
    <>
      <BgVideo />
      <AppNav />
      <main style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        padding: isNarrow ? '90px 18px 60px' : '130px 56px 60px',
        maxWidth: 800, margin: '0 auto',
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: isNarrow ? 12 : 14, color: 'rgba(255,255,255,0.55)', letterSpacing: isNarrow ? 3 : 5, marginBottom: 8, textTransform: 'lowercase' }}>my drift letters</div>
        <h1 style={{ fontSize: isNarrow ? 26 : 36, color: '#fff', letterSpacing: isNarrow ? 4 : 8, marginBottom: 6, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>瓶友</h1>
        <div style={{ fontSize: isNarrow ? 12 : 14, color: 'rgba(255,255,255,0.55)', letterSpacing: isNarrow ? 1 : 3, marginBottom: isNarrow ? 28 : 48 }}>
          {loading ? '加载中…' : `${active.length} 段还在漂流的对话　·　${ended.length} 段已经结束`}
        </div>

        {!loading && friends.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: isNarrow ? 40 : 80, padding: isNarrow ? '40px 16px' : '60px 20px', fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: isNarrow ? 2 : 4 }}>
            还没有瓶友。<br/>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '0.5px solid rgba(255,255,255,0.4)', textDecoration: 'none', marginTop: 16, display: 'inline-block' }}>去海边看看 →</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {friends.map(f => (
            <Link
              key={f.conversationId}
              to={`/chat/${f.conversationId}${f.ended ? '?ended=1' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: isNarrow ? 12 : 20,
                padding: isNarrow ? '14px 14px' : '22px 24px',
                background: f.unread > 0 && !f.ended ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                border: f.unread > 0 && !f.ended ? '0.5px solid rgba(255,200,120,0.35)' : '0.5px solid rgba(255,255,255,0.12)',
                borderRadius: 12, color: '#fff',
                textDecoration: 'none',
                opacity: f.ended ? 0.55 : 1,
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar color={f.avatarColor} size={isNarrow ? 40 : 52} />
                {f.unread > 0 && !f.ended && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    minWidth: 18, height: 18, padding: '0 5px',
                    background: 'rgba(220, 110, 90, 0.95)',
                    borderRadius: 999, color: '#fff',
                    fontSize: 11, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(220, 110, 90, 0.55)',
                    border: '1.5px solid rgba(20, 30, 45, 0.9)',
                  }}>{f.unread > 99 ? '99+' : f.unread}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isNarrow ? 15 : 17, letterSpacing: 2, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{f.bottleNo}</em></span>
                  {f.speaker === 'new' && !f.ended && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(255,200,120,0.18)',
                      border: '0.5px solid rgba(255,200,120,0.45)',
                      color: 'rgba(255,220,170,0.95)',
                      letterSpacing: 2,
                    }}>新瓶友</span>
                  )}
                </div>
                <div style={{ fontSize: isNarrow ? 12 : 13, color: 'rgba(255,255,255,0.62)', letterSpacing: 1, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.ended
                    ? '这段漂流结束了 · 记录已保留'
                    : f.speaker === 'new'
                      ? <span style={{ color: 'rgba(255,220,170,0.85)' }}>TA 捡到了你的瓶子，等待回信</span>
                      : <><span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 6 }}>{f.speaker === 'me' ? '你：' : 'TA：'}</span>{f.preview}</>
                  }
                </div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: isNarrow ? 11 : 13, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{f.time}</div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} 周前`;
  return `${Math.floor(d / 30)} 个月前`;
}
