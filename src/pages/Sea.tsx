import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';
import AboutDrawer from '../components/AboutDrawer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useIsNarrow } from '../lib/useIsNarrow';

export default function Sea() {
  const { profile } = useAuth();
  const loc = useLocation();
  const fromReply = loc.search.includes('fromReply');
  const [thrown, setThrown] = useState(0);
  const [picked, setPicked] = useState(0);
  const [toastShow, setToastShow] = useState(fromReply);
  const isNarrow = useIsNarrow();

  useEffect(() => {
    if (fromReply) {
      const t = setTimeout(() => setToastShow(false), 3500);
      return () => clearTimeout(t);
    }
  }, [fromReply]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);

    const fetchQuota = () => {
      supabase
        .from('quotas')
        .select('thrown, picked')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle()
        .then(({ data }: any) => {
          if (cancelled) return;
          if (data) {
            setThrown(data.thrown);
            setPicked(data.picked);
          } else {
            // 当天还没生成 quota 行，归零
            setThrown(0);
            setPicked(0);
          }
        });
    };

    // 初次加载
    fetchQuota();

    // 1) 路由变化（带 ?refresh=throw/toss/fromReply 回来）→ 重拉
    //    loc 已在依赖里
    // 2) 标签页重新可见 → 重拉（防止后台久了数据陈旧）
    const onVisible = () => { if (!document.hidden) fetchQuota(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchQuota);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchQuota);
    };
  }, [profile, loc.search, loc.key]);

  return (
    <>
      <BgVideo />
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

      <main style={{ position: 'relative', zIndex: 1, height: '100vh' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: isNarrow ? '110px 24px 0' : '160px 56px 0',
          textAlign: 'center', color: '#fff',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: isNarrow ? 11 : 14,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: isNarrow ? 3 : 6,
            marginBottom: isNarrow ? 16 : 22,
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

        <div style={{
          position: 'absolute', left: '50%',
          bottom: isNarrow ? '12%' : '18%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: isNarrow ? 10 : 18,
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
        }}>
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
        </div>
      </main>

      <AboutDrawer />
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
