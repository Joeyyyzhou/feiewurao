import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Weather {
  total_bottles: number;
  top_moods: { mood: string; count: number }[];
  phrase: { pct: number; mood: string } | null;
}

function buildPhrase(top: { mood: string; count: number }[], total: number): { pct: number; mood: string } | null {
  if (!top.length || total === 0) return null;
  const first = top[0];
  return {
    pct: Math.round((first.count / total) * 100),
    mood: first.mood,
  };
}

export default function OceanWeather({ narrow }: { narrow?: boolean }) {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.rpc('get_ocean_weather' as any);
      if (cancelled || error) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return;
      const top = (row.top_moods ?? []) as { mood: string; count: number }[];
      const total = Number(row.total_bottles) || 0;
      setWeather({
        total_bottles: total,
        top_moods: top,
        phrase: buildPhrase(top, total),
      });
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!weather || weather.total_bottles === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: narrow ? 78 : 116,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px) saturate(1.4) brightness(0.95)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4) brightness(0.95)',
        border: '0.5px solid rgba(255,255,255,0.22)',
        borderRadius: 999,
        padding: narrow ? '6px 14px' : '8px 18px',
        color: '#fff',
        fontSize: narrow ? 11.5 : 12.5,
        letterSpacing: 1,
        whiteSpace: 'nowrap',
        textShadow: '0 1px 8px rgba(0,0,0,0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      }}
    >
      <span style={{ opacity: 0.88 }}>今日海面</span>
      <span style={{ fontWeight: 500 }}>
        {' '}<span style={{ opacity: 0.72 }}>{weather.phrase?.pct}%</span> 在 {weather.phrase?.mood}
      </span>
    </div>
  );
}
