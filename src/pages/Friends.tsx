import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';
import Avatar from '../components/Avatar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface FriendItem {
  conversationId: string;
  bottleNo: string;
  avatarColor: string;
  preview: string;
  speaker: 'me' | 'them';
  time: string;
  ended: boolean;
}

export default function Friends() {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('id, status, created_at, ended_at, user_a, user_b')
        .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error || !convs) {
        setLoading(false);
        return;
      }
      const otherIds = convs.map((c: any) => c.user_a === profile.id ? c.user_b : c.user_a);
      const { data: others } = await supabase.rpc('get_friend_profiles' as any, { p_other_ids: otherIds });
      const othersMap = new Map<string, { bottle_no: string; avatar_color: string }>();
      (others ?? []).forEach((u: any) => othersMap.set(u.id, { bottle_no: u.bottle_no, avatar_color: u.avatar_color }));

      const items: FriendItem[] = await Promise.all((convs as any[]).map(async (c) => {
        const otherId = c.user_a === profile.id ? c.user_b : c.user_a;
        const other = othersMap.get(otherId);
        const { data: msg } = await supabase
          .from('messages')
          .select('content, sender_id, created_at')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return {
          conversationId: c.id,
          bottleNo: other?.bottle_no ?? '----',
          avatarColor: other?.avatar_color ?? 'c1',
          preview: (msg as any)?.content?.slice(0, 28) ?? '',
          speaker: (msg as any)?.sender_id === profile.id ? 'me' : 'them',
          time: relativeTime(c.ended_at ?? (msg as any)?.created_at ?? c.created_at),
          ended: c.status === 'ended',
        };
      }));
      if (cancelled) return;
      setFriends(items);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const active = friends.filter(f => !f.ended);
  const ended = friends.filter(f => f.ended);

  return (
    <>
      <BgVideo />
      <AppNav />
      <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '130px 56px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.55)', letterSpacing: 5, marginBottom: 8, textTransform: 'lowercase' }}>my drift letters</div>
        <h1 style={{ fontSize: 36, color: '#fff', letterSpacing: 8, marginBottom: 6, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>瓶友</h1>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', letterSpacing: 3, marginBottom: 48 }}>
          {loading ? '加载中…' : `${active.length} 段还在漂流的对话　·　${ended.length} 段已经结束`}
        </div>

        {!loading && friends.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 80, padding: '60px 20px', fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: 4 }}>
            还没有瓶友。<br/>
            <Link to="/sea" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '0.5px solid rgba(255,255,255,0.4)', textDecoration: 'none', marginTop: 16, display: 'inline-block' }}>去海边看看 →</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {friends.map(f => (
            <Link
              key={f.conversationId}
              to={`/chat/${f.conversationId}${f.ended ? '?ended=1' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '22px 24px',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                borderRadius: 12, color: '#fff',
                textDecoration: 'none',
                opacity: f.ended ? 0.55 : 1,
              }}
            >
              <Avatar color={f.avatarColor} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, letterSpacing: 2, marginBottom: 4 }}>
                  No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{f.bottleNo}</em>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', letterSpacing: 1, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.ended ? '这段漂流结束了 · 记录已保留' : <><span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 6 }}>{f.speaker === 'me' ? '你：' : 'TA：'}</span>{f.preview}</>}
                </div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{f.time}</div>
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
