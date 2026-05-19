import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';
import AboutDrawer from '../components/AboutDrawer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function Sea() {
  const { profile } = useAuth();
  const loc = useLocation();
  const fromReply = loc.search.includes('fromReply');
  const [thrown, setThrown] = useState(0);
  const [picked, setPicked] = useState(0);
  const [toastShow, setToastShow] = useState(fromReply);

  useEffect(() => {
    if (fromReply) {
      const t = setTimeout(() => setToastShow(false), 3500);
      return () => clearTimeout(t);
    }
  }, [fromReply]);

  useEffect(() => {
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
        }
      });
  }, [profile]);

  return (
    <>
      <BgVideo />
      <AppNav />

      {toastShow && (
        <div style={{
          position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'rgba(0,30,50,0.85)',
          backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,0.25)',
          borderRadius: 999, padding: '12px 26px', color: '#fff',
          fontSize: 13, letterSpacing: 3,
        }}>
          回信已送出 · <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: '0 4px', color: '#ffb84d' }}>瓶友</em> 多了一位
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 1, height: '100vh' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '160px 56px 0', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: 6, marginBottom: 22, textTransform: 'lowercase', textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}>
            a quiet sea inside tencent
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, lineHeight: 1.4, color: 'rgba(255,255,255,0.97)', textShadow: '0 2px 30px rgba(0,0,0,0.55)', letterSpacing: 4, margin: 0 }}>
            在鹅厂扔一个漂流瓶，可能有人懂你。
          </h1>
        </div>

        <div style={{ position: 'absolute', left: '50%', bottom: '18%', transform: 'translateX(-50%)', display: 'flex', gap: 18 }}>
          {thrown >= 3 ? (
            <button className="btn btn-primary" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
              今日扔瓶已满
              <QuotaBadge n={0} dark />
            </button>
          ) : (
            <Link to="/throw" className="btn btn-primary">
              扔一个瓶子
              <QuotaBadge n={3 - thrown} dark />
            </Link>
          )}
          {picked >= 3 ? (
            <button className="btn btn-ghost" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
              今日捞瓶已满
              <QuotaBadge n={0} />
            </button>
          ) : (
            <Link to="/pick" className="btn btn-ghost">
              捞一个瓶子
              <QuotaBadge n={3 - picked} />
            </Link>
          )}
        </div>
      </main>

      <AboutDrawer />
    </>
  );
}

// 配额徽章 — 显眼版
function QuotaBadge({ n, dark = false }: { n: number; dark?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 2,
      marginLeft: 6,
      padding: '3px 12px',
      borderRadius: 999,
      background: dark ? 'rgba(26, 46, 69, 0.16)' : 'rgba(255, 255, 255, 0.22)',
      border: dark ? '0.5px solid rgba(26, 46, 69, 0.25)' : '0.5px solid rgba(255, 255, 255, 0.45)',
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: 'italic',
      fontSize: 18,
      fontWeight: 500,
      color: dark ? '#1a2e45' : '#fff',
      letterSpacing: 0,
      lineHeight: 1.1,
    }}>
      <em style={{ fontStyle: 'inherit' }}>{n}</em>
      <span style={{ fontSize: 12, opacity: 0.55, margin: '0 1px' }}>/</span>
      <em style={{ fontStyle: 'inherit', opacity: 0.7 }}>3</em>
    </span>
  );
}
