import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, invokeWithTimeout } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { useIsNarrow } from '../lib/useIsNarrow';
import type { ReplyMood } from '../lib/database.types';

const REPLY_MOODS: ReplyMood[] = ['同感', '抱抱', '陪你', '听着', '打气', '路过', '冒泡', '辛苦'];
const REPLY_EMOJI: Record<string, string> = {
  '同感': '🤝', '抱抱': '🤗', '陪你': '🌙', '听着': '👂',
  '打气': '🌟', '路过': '🍃', '冒泡': '💧', '辛苦': '☕',
};

// 草稿键：bottleId 维度，确保切换瓶子时不串
const replyDraftKey = (bottleId: string) => `fewr.reply.draft.${bottleId}`;

interface PickedBottle {
  id: string;
  content: string;
  mood: string;
  author_no: string;
  created_at: string;
}

export default function Pick() {
  const { profile } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [bottle, setBottle] = useState<PickedBottle | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyMood, setReplyMood] = useState<ReplyMood | null>(null);
  const [overlay, setOverlay] = useState<'reply' | 'toss' | 'report' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);

  const [pickErr, setPickErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isNarrow = useIsNarrow();

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('pick_bottle' as any);
      if (cancelled) return;
      if (error) {
        if (error.message.includes('quota')) {
          setPickErr('今天的海已经平静下来了，明天 0 点潮水会再次涌起。');
        } else {
          setPickErr(error.message);
        }
        setLoading(false);
        return;
      }
      // RPC 返回 setof，data 是数组
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setBottle(row as any);
        // 尝试恢复这条瓶子的回信草稿
        try {
          const raw = localStorage.getItem(replyDraftKey((row as any).id));
          if (raw) {
            const d = JSON.parse(raw);
            if (d?.text) setReplyText(d.text);
            if (d?.mood) setReplyMood(d.mood);
            if (d?.text) setReplyOpen(true);
          }
        } catch {}
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  // 自动保存回信草稿（按 bottleId 维度）
  useEffect(() => {
    if (!bottle?.id) return;
    if (!replyText.trim() && !replyMood) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(replyDraftKey(bottle.id), JSON.stringify({ text: replyText, mood: replyMood }));
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [bottle?.id, replyText, replyMood]);

  async function sendReply() {
    if (!bottle || !replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 敏感词检查（带超时，超时/未部署直接放过）
      const { data: scan } = await invokeWithTimeout('sensitive-check', { content: replyText.trim() });
      if (scan?.sensitive) {
        toast.error('回信内容可能违反社区规则，请修改后再发送');
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.rpc('submit_reply' as any, {
        p_bottle_id: bottle.id,
        p_content: replyText.trim(),
        p_reply_mood: replyMood,
      });
      if (error) {
        toast.error('回信发送失败：' + error.message);
        setSubmitting(false);
        return;
      }
      setOverlay('reply');
      // 回信成功，清掉草稿
      try { localStorage.removeItem(replyDraftKey(bottle.id)); } catch {}
      setTimeout(() => nav('/?fromReply=1'), 2200);
    } catch (e: any) {
      toast.error('网络异常，请稍后重试');
      setSubmitting(false);
    }
  }
  async function tossBack() {
    if (!bottle || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('toss_bottle' as any, { p_bottle_id: bottle.id });
      if (error) { toast.error('放回失败：' + error.message); setSubmitting(false); return; }
      try { localStorage.removeItem(replyDraftKey(bottle.id)); } catch {}
      setOverlay('toss');
      setTimeout(() => nav('/?refresh=toss'), 2200);
    } catch (e: any) {
      toast.error('网络异常，请稍后重试');
      setSubmitting(false);
    }
  }
  async function submitReport() {
    if (!bottle || !reportReason || !profile || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter: profile.id,
        bottle_id: bottle.id,
        message_id: null,
        reason: reportReason as any,
      });
      if (error) { toast.error('举报失败：' + error.message); setSubmitting(false); return; }
      setReportOpen(false);
      setOverlay('report');
      setTimeout(() => nav('/'), 2400);
    } catch (e: any) {
      toast.error('网络异常，请稍后重试');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={{ ...immersiveBar, padding: isNarrow ? '20px 18px 14px' : '32px 56px 24px' }}>
        <Link to="/" style={backStyle}>← 回到海面</Link>
      </div>

      <main style={{ ...pageStyle, padding: isNarrow ? '76px 16px 40px' : '100px 32px 60px' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ ...glassCard, padding: isNarrow ? '28px 22px' : '44px 48px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.5)' }}>正在从海里捞起一个瓶子…</div>
            ) : !bottle ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.5)' }}>
                {pickErr ? (<>{pickErr}</>) : (<>海里暂时没有适合你的瓶子。<br/>过一会儿再来试试？</>)}
                <div style={{ marginTop: 24 }}><Link to="/" className="btn btn-ghost">回到海面</Link></div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 4, marginBottom: 8 }}>a letter from</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', letterSpacing: 3, marginBottom: 28, borderBottom: '0.5px solid rgba(255,255,255,0.18)', paddingBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span>No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.95)' }}>{bottle.author_no}</em>　·　刚才</span>
                  <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 12, letterSpacing: 2 }}>{bottle.mood}</span>
                </div>

                <div style={{ fontSize: 17, lineHeight: 2, color: '#fff', letterSpacing: 1, marginBottom: 36, whiteSpace: 'pre-wrap' }}>
                  {bottle.content}
                </div>

                {!replyOpen ? (
                  <div style={{ paddingTop: 22, borderTop: '0.5px solid rgba(255,255,255,0.18)', display: 'flex', gap: isNarrow ? 8 : 12, flexWrap: isNarrow ? 'wrap' : 'nowrap' }}>
                    <button onClick={() => setReplyOpen(true)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: isNarrow ? '100%' : 'auto' }}>回信</button>
                    <button onClick={tossBack} disabled={submitting} className="btn btn-ghost" style={{ padding: isNarrow ? '11px 18px' : '14px 22px', flex: isNarrow ? 1 : 'initial', justifyContent: 'center', opacity: submitting ? 0.5 : 1 }}>放回海里</button>
                    <button onClick={() => setReportOpen(true)} style={{
                      background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13,
                      padding: isNarrow ? '11px 14px' : '14px 18px', borderRadius: 999, border: '0.5px solid rgba(255,255,255,0.22)',
                      letterSpacing: 3, cursor: 'pointer',
                      flex: isNarrow ? 1 : 'initial',
                    }}>举报</button>
                  </div>
                ) : (
                  <div style={{ marginTop: 24, paddingTop: 22, borderTop: '0.5px solid rgba(255,255,255,0.18)' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 4, marginBottom: 14, textTransform: 'lowercase' }}>your reply to <em style={{ color: 'rgba(255,255,255,0.92)', marginLeft: 6 }}>No. {bottle.author_no}</em></div>
                    <textarea
                      value={replyText}
                      onChange={(e) => { if (e.target.value.length <= 500) setReplyText(e.target.value); }}
                      placeholder={"给 TA 写一封回信。\n对方将以瓶友的方式收到，从此你们的对话保留在「瓶友」tab。"}
                      className="letter-textarea"
                      style={{
                        width: '100%', minHeight: 180,
                        background: 'rgba(255,255,255,0.10)', border: '0.5px solid rgba(255,255,255,0.32)',
                        borderRadius: 10, padding: '16px 18px',
                        fontSize: 16, lineHeight: 1.9, color: 'rgba(255,255,255,0.98)', letterSpacing: 1,
                        outline: 'none', resize: 'vertical',
                        textShadow: '0 1px 4px rgba(0,0,0,0.55)',
                      }}
                    />
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px dashed rgba(255,255,255,0.18)' }}>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.62)', letterSpacing: 3, marginBottom: 10 }}>你现在的状态</div>
                      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 8 }}>
                        {REPLY_MOODS.map(m => (
                          <button key={m} onClick={() => setReplyMood(replyMood === m ? null : m)} style={{
                            fontSize: 12.5, padding: '8px 0', borderRadius: 999,
                            border: '0.5px solid rgba(255,255,255,0.35)',
                            color: replyMood === m ? '#1a4456' : 'rgba(255,255,255,0.82)',
                            background: replyMood === m ? 'rgba(255,255,255,0.94)' : 'transparent',
                            cursor: 'pointer',
                            fontFamily: replyMood === m ? '"Source Han Serif CN VF Medium", serif' : 'inherit',
                          }}><span style={{ marginRight: 4, opacity: 0.85 }}>{REPLY_EMOJI[m]}</span>{m}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}><em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{replyText.length}</em> / 500</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setReplyOpen(false); setReplyText(''); setReplyMood(null); }} style={{
                          background: 'transparent', border: '0.5px solid rgba(255,255,255,0.3)',
                          color: 'rgba(255,255,255,0.7)', padding: '10px 22px', borderRadius: 999,
                          fontSize: 13, letterSpacing: 3, cursor: 'pointer',
                        }}>取消</button>
                        <button onClick={sendReply} disabled={!replyText.trim() || submitting} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14, opacity: (!replyText.trim() || submitting) ? 0.5 : 1 }}>{submitting ? '送出中…' : '送出回信'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 举报弹窗 */}
      {reportOpen && (
        <div onClick={() => setReportOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,5,15,0.55)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'rgba(28,36,50,0.85)', backdropFilter: 'blur(40px) saturate(1.4)',
            border: '0.5px solid rgba(255,255,255,0.22)', borderRadius: 16,
            padding: '32px 36px', maxWidth: 420, width: '100%',
            color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}>
            <div style={{ fontSize: 17, letterSpacing: 4, textAlign: 'center', marginBottom: 6 }}>举报这个瓶子</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', letterSpacing: 1.5, marginBottom: 20 }}>不会向对方透露举报人</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {[
                ['harass', '骚扰、人身攻击'],
                ['sensitive', '政治、违法、敏感内容'],
                ['porn', '色情、低俗'],
                ['spam', '广告、引流、冒名'],
                ['leak', '泄露公司机密 / 同事隐私'],
                ['other', '其它'],
              ].map(([v, label]) => (
                <label key={v} onClick={() => setReportReason(v)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px',
                  border: `0.5px solid ${reportReason === v ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)'}`,
                  borderRadius: 10, cursor: 'pointer', fontSize: 13.5, letterSpacing: 1.5,
                  color: '#fff',
                  background: reportReason === v ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  fontFamily: reportReason === v ? '"Source Han Serif CN VF Medium", serif' : 'inherit',
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: `1px solid rgba(255,255,255,0.45)`,
                    background: reportReason === v ? '#fff' : 'transparent',
                    boxShadow: reportReason === v ? 'inset 0 0 0 3px rgba(28,36,50,0.95)' : 'none',
                    flexShrink: 0,
                  }} />
                  {label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setReportOpen(false)} style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', padding: '9px 22px', borderRadius: 999, fontSize: 13, letterSpacing: 3, cursor: 'pointer' }}>取消</button>
              <button onClick={submitReport} disabled={!reportReason || submitting} style={{
                background: 'rgba(200, 90, 90, 0.95)', border: '0.5px solid rgba(200, 90, 90, 0.95)',
                color: '#fff', padding: '9px 22px', borderRadius: 999,
                fontSize: 13, letterSpacing: 3, cursor: 'pointer',
                fontFamily: '"Source Han Serif CN VF Medium", serif',
                opacity: (reportReason && !submitting) ? 1 : 0.35,
              }}>{submitting ? '提交中…' : '提交举报'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 全屏过场 */}
      {overlay === 'reply' && <Overlay eyebrow="your reply has been sent" text={<>回信已送出 · 与 No.<em>{bottle?.author_no}</em> 成为瓶友</>} />}
      {overlay === 'toss' && <Overlay eyebrow="the bottle drifts on" text={<>瓶子已回到海里 · 等下一个人捞起</>} />}
      {overlay === 'report' && <Overlay eyebrow="report received" text={<>举报已提交 · 我们会尽快处理</>} />}
    </>
  );
}

function Overlay({ eyebrow, text }: { eyebrow: string; text: React.ReactNode }) {
  return (
    <div className="transition-overlay show">
      <div className="transition-eyebrow">{eyebrow}</div>
      <div className="transition-text">{text}</div>
    </div>
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
