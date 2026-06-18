import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import { supabase, invokeWithTimeout } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useIsNarrow } from '../lib/useIsNarrow';
import type { Mood } from '../lib/database.types';

const MOODS: Mood[] = ['开心', '兴奋', '有灵感', '被治愈', '想聊', '摸鱼', '发呆', 'emo', '加班', '想吐槽'];
const MOOD_EMOJI: Record<Mood, string> = {
  '开心': '🌤', '兴奋': '✨', '有灵感': '💡', '被治愈': '🌿', '想聊': '💭',
  '摸鱼': '🐟', '发呆': '🌫', 'emo': '🌧', '加班': '⏰', '想吐槽': '🙄',
};
const DRAFT_KEY = 'fewr.throw.draft';

export default function Throw() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [warn, setWarn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const isNarrow = useIsNarrow();

  // 草稿恢复（仅在挂载时尝试一次）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.content) {
          setContent(d.content);
          if (d.mood) setMood(d.mood);
          setDraftRestored(true);
          setTimeout(() => setDraftRestored(false), 4500);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // 自动保存草稿（debounce 不严格，simple 即可）
  useEffect(() => {
    if (!content.trim() && !mood) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, mood })); } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [content, mood]);

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
        setErr('今晚的潮汐已经退去，明天 0 点会再涌起。');
      } else if (error.message.includes('sensitive')) {
        setWarn(true);
      } else {
        setErr(error.message);
      }
      return;
    }
    setOverlay(true);
    // 扔出成功，清空草稿
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
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
          {draftRestored && (
            <div style={{
              marginBottom: 14, padding: '10px 14px',
              background: 'rgba(255,220,180,0.14)',
              border: '0.5px solid rgba(255,200,150,0.4)',
              borderRadius: 10,
              fontSize: 12.5, color: 'rgba(255,235,210,0.95)',
              letterSpacing: 1, textAlign: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
              已为你恢复上次没扔完的瓶子草稿
            </div>
          )}
          <div style={{ ...glassCard, padding: isNarrow ? '28px 22px' : '44px 48px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.78)', letterSpacing: 4, marginBottom: 8, textAlign: 'right', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>a letter from</div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.82)', letterSpacing: 3, marginBottom: 28, borderBottom: '0.5px solid rgba(255,255,255,0.28)', paddingBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#fff', margin: '0 4px' }}>{profile?.bottle_no ?? '----'}</em>　·　今晚
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
                color: 'rgba(255,255,255,0.98)', resize: 'none',
                minHeight: isNarrow ? 200 : 280,
                padding: 0, outline: 'none',
                letterSpacing: 1,
                textShadow: '0 1px 4px rgba(0,0,0,0.55)',
              }}
              className="letter-textarea"
            />

            <div style={{ marginTop: isNarrow ? 24 : 32, paddingTop: 22, borderTop: '0.5px solid rgba(255,255,255,0.28)' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', letterSpacing: isNarrow ? 2 : 4, marginBottom: 16, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>今天的状态</div>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8 }}>
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    style={{
                      fontSize: 13, padding: '9px 0', borderRadius: 999,
                      border: '0.5px solid rgba(255,255,255,0.5)',
                      color: mood === m ? '#1a4456' : '#fff',
                      background: mood === m ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      fontFamily: mood === m ? '"Source Han Serif CN VF Medium", serif' : 'inherit',
                      textShadow: mood === m ? 'none' : '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  ><span style={{ marginRight: 4, opacity: 0.85 }}>{MOOD_EMOJI[m]}</span>{m}</button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: isNarrow ? 24 : 32, paddingTop: 18, borderTop: '0.5px solid rgba(255,255,255,0.28)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14,
                  color: content.length >= 290 ? 'rgba(255,160,140,0.95)'
                       : content.length >= 260 ? 'rgba(255,210,140,0.95)'
                       : 'rgba(255,255,255,0.78)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  transition: 'color 0.2s ease',
                }}>{content.length} / 300</div>
                {(!content.trim() || !mood) && (
                  <div style={{ fontSize: 12, color: 'rgba(255,220,180,0.95)', letterSpacing: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    {!content.trim() && !mood ? '还差：写点内容 + 选个心情' :
                     !content.trim() ? '还差：写点内容' :
                     '还差：选一个今天的状态'}
                  </div>
                )}
              </div>
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
