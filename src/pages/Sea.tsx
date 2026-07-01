import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import AppNav from '../components/AppNav';
import AboutDrawer from '../components/AboutDrawer';
import OceanWeather from '../components/OceanWeather';
import FirstTimeIntro from '../components/FirstTimeIntro';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useIsNarrow } from '../lib/useIsNarrow';

interface MyBottle {
  id: string;
  bottle_no: number;
  mood: string;
  content: string;
  status: string;
  created_at: string;
  has_conversation: boolean;
}

export default function Sea() {
  const { profile } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const fromReply = loc.search.includes('fromReply');
  const [thrown, setThrown] = useState(0);
  const [picked, setPicked] = useState(0);
  const [toastShow, setToastShow] = useState(fromReply);
  const [myBottles, setMyBottles] = useState<MyBottle[]>([]);
  const [bottlesLoading, setBottlesLoading] = useState(false);
  const isNarrow = useIsNarrow();

  useEffect(() => {
    if (fromReply) {
      const t = setTimeout(() => setToastShow(false), 3500);
      return () => clearTimeout(t);
    }
  }, [fromReply]);

  const fetchQuota = useCallback(() => {
    if (!profile) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from('quotas')
      .select('thrown, picked')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setThrown(data.thrown);
          setPicked(data.picked);
        } else {
          setThrown(0);
          setPicked(0);
        }
      });
  }, [profile]);

  const fetchMyBottles = useCallback(async () => {
    if (!profile) return;
    setBottlesLoading(true);
    const { data, error } = await supabase
      .from('bottles')
      .select('id, bottle_no, mood, content, status, created_at')
      .eq('thrower_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) {
      const bottles = data as any[];
      const withConv = await Promise.all(
        bottles.map(async (b) => {
          const { count } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('bottle_id', b.id);
          return { ...b, has_conversation: (count || 0) > 0 };
        })
      );
      setMyBottles(withConv);
    }
    setBottlesLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const doFetch = () => {
      fetchQuota();
      fetchMyBottles();
    };

    doFetch();

    const onVisible = () => { if (!document.hidden) doFetch(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', doFetch);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', doFetch);
    };
  }, [profile, loc.search, loc.key, fetchQuota, fetchMyBottles]);

  const moodLabel: Record<string, string> = {
    happy: '开心', sad: '难过', angry: '生气',
    anxious: '焦虑', excited: '兴奋', tired: '疲惫',
    calm: '平静', lonely: '孤独', grateful: '感恩',
    confused: '困惑', hopeful: '希望',
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return '刚刚';
    if (diffH < 24) return `${diffH}h前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <AppNav />

      {toastShow && (
        <div style={{
          position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'rgba(0,30,50,0.85)',
          backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,0.25)',
          borderRadius: 999,
          padding: isNarrow ? '10px 18px' : '12px 26px',
          color: '#fff',
          fontSize: isNarrow ? 12 : 13, letterSpacing: isNarrow ? 2 : 3,
          maxWidth: '90vw', textAlign: 'center',
        }}>
          回信已送出 · <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: '0 4px', color: '#ffb84d' }}>瓶友</em> 多了一位
        </div>
      )}

      <main style={{
        position: 'relative', zIndex: 1, minHeight: '100vh', paddingBottom: 40,
        display: 'flex', flexDirection: 'column',
        justifyContent: myBottles.length === 0 ? 'center' : 'flex-start',
      }}>
        <OceanWeather narrow={isNarrow} />

        {/* 标题区 */}
        <div style={{
          padding: myBottles.length === 0
            ? (isNarrow ? '0 24px 0' : '0 56px 0')
            : (isNarrow ? '100px 24px 0' : '140px 56px 0'),
          textAlign: 'center', color: '#fff',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: isNarrow ? 11 : 14,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: isNarrow ? 3 : 6,
            marginBottom: isNarrow ? 14 : 20,
            textTransform: 'lowercase',
            textShadow: '0 1px 12px rgba(0,0,0,0.5)',
          }}>
            a quiet sea inside tencent
          </div>
          <h1 style={{
            fontSize: isNarrow ? 22 : 32,
            fontWeight: 300,
            lineHeight: isNarrow ? 1.55 : 1.4,
            color: 'rgba(255,255,255,0.97)',
            textShadow: '0 2px 30px rgba(0,0,0,0.55)',
            letterSpacing: isNarrow ? 2 : 4,
            margin: 0,
          }}>
            {isNarrow ? (
              <>在鹅厂扔一个漂流瓶，<br/>可能有人懂你。</>
            ) : (
              <>在鹅厂扔一个漂流瓶，可能有人懂你。</>
            )}
          </h1>
        </div>

        {/* 按钮区 */}
        <div style={{
          display: 'flex',
          gap: isNarrow ? 10 : 18,
          justifyContent: 'center',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          padding: isNarrow ? '32px 24px 0' : '48px 56px 0',
        }}>
          {thrown >= 3 && picked >= 3 ? (
            <Link to="/friends" className="btn btn-primary">
              看看你的瓶友
            </Link>
          ) : (
            <>
              {thrown >= 3 ? (
                <Link to="/friends" className="btn btn-primary">
                  看看你的瓶友
                </Link>
              ) : (
                <Link to="/throw" className="btn btn-primary">
                  扔一个瓶子
                  <span style={quotaInline}>{3 - thrown} / 3</span>
                </Link>
              )}
              {picked >= 3 ? (
                <Link to="/friends" className="btn btn-ghost">
                  看看你的瓶友
                </Link>
              ) : (
                <Link to="/pick" className="btn btn-ghost">
                  捞一个瓶子
                  <span style={quotaInline}>{3 - picked} / 3</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* 我的瓶子列表 */}
        {myBottles.length > 0 && (
          <div style={{
            padding: isNarrow ? '28px 20px 0' : '40px 56px 0',
            maxWidth: 520,
            margin: '0 auto',
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isNarrow ? 11 : 13,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: isNarrow ? 3 : 5,
              textTransform: 'uppercase',
              marginBottom: isNarrow ? 12 : 16,
              textAlign: 'center',
            }}>
              我的瓶子
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myBottles.map(b => {
                const isActive = b.status === 'active';
                const isReplied = b.has_conversation;
                const statusLabel = isActive ? '漂流中' : isReplied ? '已回信' : '已沉底';
                const statusColor = isActive
                  ? 'rgba(74,194,255,0.85)'
                  : isReplied
                  ? 'rgba(255,184,77,0.85)'
                  : 'rgba(255,255,255,0.4)';
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/bottle/${b.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(24px)',
                      borderRadius: 14,
                      border: '0.5px solid rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    {/* 状态圆点 */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor,
                      flexShrink: 0,
                    }} />
                    {/* 瓶子编号 + 心情 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isNarrow ? 12 : 13,
                        color: 'rgba(255,255,255,0.9)',
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 500,
                        marginBottom: 2,
                      }}>
                        No.{b.bottle_no} · {moodLabel[b.mood] || b.mood}
                      </div>
                      {/* 内容预览 */}
                      <div style={{
                        fontSize: isNarrow ? 11 : 12,
                        color: 'rgba(255,255,255,0.5)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {b.content.slice(0, 40)}
                      </div>
                    </div>
                    {/* 状态 + 时间 */}
                    <div style={{
                      fontSize: isNarrow ? 10 : 11,
                      color: statusColor,
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      flexShrink: 0,
                      textAlign: 'right',
                      lineHeight: 1.4,
                    }}>
                      <div>{statusLabel}</div>
                      <div style={{ opacity: 0.7 }}>{formatTime(b.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      <AboutDrawer />
      <FirstTimeIntro />
    </>
  );
}

const quotaInline: React.CSSProperties = {
  marginLeft: 6,
  fontFamily: "'Cormorant Garamond', serif",
  fontStyle: 'italic',
  fontSize: 13,
  opacity: 0.55,
  letterSpacing: 0,
};
