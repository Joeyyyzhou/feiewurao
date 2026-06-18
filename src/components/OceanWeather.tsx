import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Weather {
  total_bottles: number;
  top_moods: { mood: string; count: number }[];
  phrase: string;
}

const PHRASE_MAP: Record<string, string> = {
  '开心': '晴朗 26°',
  '兴奋': '阳光灿烂',
  '被治愈': '微风 26°',
  '有灵感': '晴 适合发呆',
  '想聊': '海面平静 适合搭话',
  '摸鱼': '微风习习 适合摸鱼',
  '发呆': '多云 适合发呆',
  'emo': '多云转 emo',
  '加班': '加班指数 80%',
  '想吐槽': '雷阵雨预警',
};

function buildPhrase(top: { mood: string; count: number }[]): string {
  if (!top.length) return '海面平静 暂无瓶子';
  const first = top[0].mood;
  // 单一情绪
  if (top.length === 1) return PHRASE_MAP[first] ?? `今日 ${first}`;
  const second = top[1].mood;
  // 优先用第一个的天气词，附上第二个心情
  const base = PHRASE_MAP[first] ?? `今日 ${first}`;
  return `${base} · 转 ${second}`;
}

export default function OceanWeather({ narrow }: { narrow?: boolean }) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.rpc('get_ocean_weather' as any);
      if (cancelled || error) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return;
      const top = (row.top_moods ?? []) as { mood: string; count: number }[];
      setWeather({
        total_bottles: Number(row.total_bottles) || 0,
        top_moods: top,
        phrase: buildPhrase(top),
      });
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000); // 每 5 分钟刷一次
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!weather || weather.total_bottles === 0) return null;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        position: 'absolute',
        top: narrow ? 78 : 116,
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'pointer',
        zIndex: 5,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px) saturate(1.4) brightness(0.95)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4) brightness(0.95)',
        border: '0.5px solid rgba(255,255,255,0.22)',
        borderRadius: 999,
        padding: narrow ? '6px 14px' : '8px 18px',
        color: '#fff',
        fontSize: narrow ? 11 : 12,
        letterSpacing: 1,
        whiteSpace: 'nowrap',
        textShadow: '0 1px 8px rgba(0,0,0,0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      }}
    >
      <span style={{ marginRight: 6, opacity: 0.7 }}>✶</span>
      <span style={{ opacity: 0.7, marginRight: 8 }}>今日鹅厂海域</span>
      <strong style={{ fontWeight: 500 }}>{weather.phrase}</strong>

      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20,40,60,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '0.5px solid rgba(255,255,255,0.18)',
          borderRadius: 12,
          padding: '14px 18px',
          minWidth: 220,
          fontSize: 12,
          letterSpacing: 1,
          color: 'rgba(255,255,255,0.92)',
          textShadow: 'none',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: 10, opacity: 0.6, fontSize: 11 }}>
            近 24 小时 · {weather.total_bottles} 个瓶子
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {weather.top_moods.map((m) => {
              const pct = ((m.count / weather.total_bottles) * 100).toFixed(0);
              return (
                <div key={m.mood} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ flex: 1, textAlign: 'left' }}>{m.mood}</span>
                  <span style={{ flex: 2, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'rgba(255,200,100,0.7)', borderRadius: 2 }} />
                  </span>
                  <span style={{ minWidth: 36, textAlign: 'right', opacity: 0.6 }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
