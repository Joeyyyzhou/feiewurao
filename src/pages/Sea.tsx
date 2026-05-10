import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BgVideo from '../components/BgVideo';
import AppNav from '../components/AppNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function Sea() {
  const { profile } = useAuth();
  const loc = useLocation();
  const fromReply = loc.search.includes('fromReply');
  const [thrown, setThrown] = useState(0);
  const [picked, setPicked] = useState(0);
  const [hasUnread, setHasUnread] = useState(fromReply);
  const [toastShow, setToastShow] = useState(fromReply);
  const [countdown, setCountdown] = useState({ h: '--', m: '--' });

  useEffect(() => {
    if (fromReply) {
      const t = setTimeout(() => setToastShow(false), 3500);
      return () => clearTimeout(t);
    }
  }, [fromReply]);

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
          <Link to="/throw" className="btn btn-primary" aria-disabled={thrown >= 3}>
            扔一个瓶子
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: 0.55 }}>{3 - thrown} / 3</span>
          </Link>
          <Link to="/pick" className="btn btn-ghost" aria-disabled={picked >= 3}>
            捞一个瓶子
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, opacity: 0.55 }}>{3 - picked} / 3</span>
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: 'rgba(255,255,255,0.6)', letterSpacing: 6, fontSize: 12, fontFamily: "'Source Han Serif CN VF Light', serif" }}>
          每日 <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>0</em>:<em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>00</em> 重置 · 还有 <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>{countdown.h}</em>:<em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', margin: '0 3px' }}>{countdown.m}</em> 刷新
        </div>
      </main>
    </>
  );
}
