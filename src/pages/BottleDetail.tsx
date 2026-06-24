import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppNav from '../components/AppNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useIsNarrow } from '../lib/useIsNarrow';

interface BottleEvent {
  id: string;
  event_type: string;
  actor_id: string;
  created_at: string;
  actor_no?: number;
  actor_mood?: string;
}

export default function BottleDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const isNarrow = useIsNarrow();
  const [bottle, setBottle] = useState<any>(null);
  const [events, setEvents] = useState<BottleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profile) return;
    let cancelled = false;

    const fetchDetail = async () => {
      // 瓶子基本信息
      const { data: b } = await supabase
        .from('bottles')
        .select('*')
        .eq('id', id)
        .single();
      if (cancelled) return;
      setBottle(b);

      // 漂流事件（如果有 bottle_events 表）
      try {
        const { data: evts } = await supabase
          .from('bottle_events')
          .select('*')
          .eq('bottle_id', id)
          .order('created_at', { ascending: true });
        if (!cancelled && evts) setEvents(evts as any[]);
      } catch {
        // bottle_events 表可能不存在，忽略
      }
      setLoading(false);
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [id, profile]);

  if (loading || !bottle) {
    return (
      <>
        <AppNav />
        <div style={{
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 14, letterSpacing: 3,
        }}>
          drifting...
        </div>
      </>
    );
  }

  // 只有瓶主才能看详情
  if (bottle.thrower_id !== profile?.id) {
    return (
      <>
        <AppNav />
        <div style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 14, letterSpacing: 2,
          gap: 16,
        }}>
          这是别人的瓶子
          <Link to="/sea" className="btn btn-ghost" style={{ fontSize: 12, letterSpacing: 2 }}>
            回到海面
          </Link>
        </div>
      </>
    );
  }

  const moodLabel: Record<string, string> = {
    happy: '开心', sad: '难过', angry: '生气',
    anxious: '焦虑', excited: '兴奋', tired: '疲惫',
    calm: '平静', lonely: '孤独', grateful: '感恩',
    confused: '困惑', hopeful: '希望',
  };

  const statusLabel: Record<string, string> = {
    active: '漂流中',
    taken: '已被捞起',
    reported: '被举报',
    deleted: '已删除',
  };

  const eventLabel: Record<string, string> = {
    throw: '扔进海里',
    pick: '被捞起',
    toss: '放回海里',
    reply: '回信了',
  };

  return (
    <>
      <AppNav />
      <main style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        padding: isNarrow ? '100px 20px 40px' : '120px 56px 60px',
        color: '#fff',
      }}>
        {/* 返回 */}
        <Link to="/sea" style={{
          display: 'inline-block',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isNarrow ? 11 : 12,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: isNarrow ? 20 : 28,
          textDecoration: 'none',
        }}>
          ← 回到海面
        </Link>

        {/* 瓶子信息卡 */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(32px)',
          borderRadius: 20,
          border: '0.5px solid rgba(255,255,255,0.12)',
          padding: isNarrow ? '20px 18px' : '28px 32px',
          marginBottom: isNarrow ? 24 : 36,
          maxWidth: 520,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isNarrow ? 13 : 15,
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 500,
            }}>
              No.{bottle.bottle_no}
            </div>
            <div style={{
              fontSize: isNarrow ? 10 : 11,
              color: 'rgba(74,194,255,0.85)',
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              letterSpacing: 1,
            }}>
              {statusLabel[bottle.status] || bottle.status}
            </div>
          </div>

          <div style={{
            fontSize: isNarrow ? 13 : 15,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.88)',
            marginBottom: 16,
            whiteSpace: 'pre-wrap',
          }}>
            {bottle.content}
          </div>

          <div style={{
            display: 'flex', gap: 16,
            fontSize: isNarrow ? 10 : 11,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 1,
          }}>
            <span>心情：{moodLabel[bottle.mood] || bottle.mood}</span>
            <span>{new Date(bottle.created_at).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 漂流轨迹 */}
        <div style={{
          maxWidth: 520,
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isNarrow ? 11 : 13,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: isNarrow ? 3 : 5,
            textTransform: 'uppercase',
            marginBottom: isNarrow ? 14 : 20,
          }}>
            漂流轨迹
          </div>

          {events.length === 0 ? (
            <div style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: isNarrow ? 11 : 12,
              letterSpacing: 2,
            }}>
              暂无轨迹记录
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {events.map((evt, i) => (
                <div key={evt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < events.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  {/* 时间线圆点 */}
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'rgba(74,194,255,0.6)',
                    flexShrink: 0,
                  }} />
                  <div style={{
                    flex: 1,
                    fontSize: isNarrow ? 11 : 12,
                    color: 'rgba(255,255,255,0.7)',
                  }}>
                    {eventLabel[evt.event_type] || evt.event_type}
                    {evt.actor_no && (
                      <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                        No.{evt.actor_no}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: isNarrow ? 10 : 11,
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    flexShrink: 0,
                  }}>
                    {new Date(evt.created_at).toLocaleDateString('zh-CN', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
