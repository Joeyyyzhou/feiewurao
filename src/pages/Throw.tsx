import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import { supabase, invokeWithTimeout } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useIsNarrow } from '../lib/useIsNarrow';
import type { Mood } from '../lib/database.types';

const MOODS: Mood[] = ['开心', '兴奋', '有灵感', '被治愈', '想聊', '摸鱼', '发呆', 'emo', '加班', '想吐槽'];

export default function Throw() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [warn, setWarn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNarrow = useIsNarrow();

  async function submit() {
    if (!profile || !mood || !content.trim()) return;
    setErr(null);
    setWarn(false);
    setSubmitting(true);

    // 1) 先尝试调敏感词 Edge Function（**带 2.5 秒超时**，超时/未部署/任何异常都跳过，
    //    交给 throw_bottle RPC 的后端兜底；避免 Edge Function 冷启动卡死前端）
    const { data: scan } = await invokeWithTimeout('sensitive-check', { content: content.trim() });
    if (scan?.sensitive) {
      setSubmitting(false);
      setWarn(true);
      return;
    }

    // 2) 调 RPC throw_bottle（含每日额度检查 + 敏感词后端兜底）
    const { error } = await supabase.rpc('throw_bottle' as any, {
      p_content: content.trim(),
      p_mood: mood,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes('quota')) {
        setErr('今天的 3 次扔瓶机会已用完，明天再来吧。');
      } else if (error.message.includes('sensitive')) {
        setWarn(true);
      } else {
        setErr(error.message);
      }
      return;
    }
    setOverlay(true);
    // 跳回首页时带 ?refresh=throw 让 Sea 刷新配额
    setTimeout(() => nav('/?refresh=throw'), 2200);
  }

  return (
    <>
      <BgVideo />
      <div style={{ ...immersiveBar, padding: isNarrow ? '20px 18px 14px' : '32px 56px 24px' }}>
        <Link to="/" style={backStyle}>← 回到海面</Link>
      </div>

      <main style={{ ...pageStyle, padding: isNarrow ? '76px 16px 40px' : '100px 32px 60px' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ ...glassCard, padding: isNarrow ? '28px 22px' : '44px 48px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 4, marginBottom: 8, textAlign: 'right' }}>a letter from</div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 3, marginBottom: 28, borderBottom: '0.5px solid rgba(255,255,255,0.18)', paddingBottom: 14 }}>
              No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', margin: '0 4px' }}>{profile?.bottle_no ?? '----'}</em>　·　今晚
            </div>

            <textarea
              value={content}
              onChange={(e) => { if (e.target.value.length <= 300) setContent(e.target.value); setWarn(false); }}
              placeholder={"把想说的话写下来，\n不为被谁看见，\n只为被某人懂得。"}
              style={{
                width: '100%', border: 'none', background: 'transparent',
                fontFamily: '"Source Han Serif CN VF Light", serif',
                fontSize: isNarrow ? 15 : 17,
                lineHeight: isNarrow ? 1.8 : 2,
                color: '#fff', resize: 'none',
                minHeight: isNarrow ? 200 : 280,
                padding: 0, outline: 'none',
                letterSpacing: 1,
              }}
            />

            <div style={{ marginTop: isNarrow ? 24 : 32, paddingTop: 22, borderTop: '0.5px solid rgba(255,255,255,0.18)' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', letterSpacing: isNarrow ? 2 : 4, marginBottom: 16 }}>今天的状态</div>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8 }}>
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    style={{
                      fontSize: 13, padding: '9px 0', borderRadius: 999,
                      border: '0.5px solid rgba(255,255,255,0.35)',
                      color: mood === m ? '#1a4456' : 'rgba(255,255,255,0.82)',
                      background: mood === m ? 'rgba(255,255,255,0.94)' : 'transparent',
                      cursor: 'pointer',
                      fontFamily: mood === m ? '"Source Han Serif CN VF Medium", serif' : 'inherit',
                    }}
                  >{m}</button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: isNarrow ? 24 : 32, paddingTop: 18, borderTop: '0.5px solid rgba(255,255,255,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{content.length} / 300</div>
              <button
                onClick={submit}
                disabled={!content.trim() || !mood || submitting}
                className="btn btn-primary"
                style={{ padding: isNarrow ? '11px 22px' : '13px 36px', fontSize: isNarrow ? 14 : 15 }}
              >
                {submitting ? '扔出中…' : '扔出这个瓶子'}
              </button>
            </div>

            {warn && (
              <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(170,60,60,0.18)', border: '0.5px solid rgba(255,180,180,0.45)', borderRadius: 10, fontSize: 13, lineHeight: 1.7, color: 'rgba(255,230,230,0.95)' }}>
                <strong>这条信息暂时不能扔出。</strong>系统检测到可能违反社区规则的内容，请修改后再试。
              </div>
            )}
            {err && <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,180,180,0.95)' }}>⚠ {err}</div>}
          </div>
        </div>
      </main>

      <div className={`transition-overlay ${overlay ? 'show' : ''}`}>
        <div className="transition-eyebrow">your bottle is now drifting</div>
        <div className="transition-text">No. <em>{profile?.bottle_no}</em>　已入海</div>
      </div>
    </>
  );
}

const immersiveBar: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '32px 56px 24px', background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)' };
const backStyle: React.CSSProperties = { fontSize: 14, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, textDecoration: 'none', textShadow: '0 1px 8px rgba(0,0,0,0.4)' };
const pageStyle: React.CSSProperties = { position: 'relative', zIndex: 1, minHeight: '100vh', padding: '100px 32px 60px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' };
const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.16)',
  backdropFilter: 'blur(40px) saturate(1.5) brightness(0.9)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.5) brightness(0.9)',
  border: '0.5px solid rgba(255,255,255,0.32)',
  borderRadius: 16,
  padding: '44px 48px',
  color: '#fff',
  boxShadow: '0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)',
};
