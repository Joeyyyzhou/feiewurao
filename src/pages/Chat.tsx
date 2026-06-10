import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import { supabase, invokeWithTimeout } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { useIsNarrow } from '../lib/useIsNarrow';
import type { MessageRow } from '../lib/database.types';

export default function Chat() {
  const { conversationId } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const loc = useLocation();
  const nav = useNavigate();
  const ended = loc.search.includes('ended=1');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherNo, setOtherNo] = useState('----');
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNarrow = useIsNarrow();

  // 加载消息 + 找到对方 + 订阅 Realtime
  useEffect(() => {
    if (!conversationId || !profile) return;

    let unsub: (() => void) | null = null;
    (async () => {
      // 找出对方
      const { data: conv } = await supabase
        .from('conversations')
        .select('user_a, user_b')
        .eq('id', conversationId)
        .single();
      if (conv) {
        const otherId = (conv as any).user_a === profile.id ? (conv as any).user_b : (conv as any).user_a;
        setOtherUserId(otherId);
        const { data: u } = await supabase.rpc('get_friend_profile' as any, { p_other_id: otherId });
        const row = Array.isArray(u) ? u[0] : u;
        if (row) setOtherNo((row as any).bottle_no);
      }

      // 拉历史消息
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (msgs) setMessages(msgs as MessageRow[]);

      // 订阅 Realtime
      const channel = supabase
        .channel(`conv:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload: any) => {
            setMessages((prev) => {
              if (prev.find(m => m.id === (payload.new as any).id)) return prev;
              return [...prev, payload.new as MessageRow];
            });
          },
        )
        .subscribe();
      unsub = () => { supabase.removeChannel(channel); };
    })();
    return () => { if (unsub) unsub(); };
  }, [conversationId, profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || !conversationId || !profile) return;
    const text = input.trim();
    setInput('');
    try {
      // 敏感词预检（带超时，超时/未部署直接放过）
      const { data: scan } = await invokeWithTimeout('sensitive-check', { content: text });
      if (scan?.sensitive) {
        setInput(text);
        toast.error('内容可能违反社区规则，请修改后再发送');
        return;
      }
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: text,
        reply_mood: null,
      });
      if (error) {
        setInput(text);
        toast.error('消息发送失败：' + error.message);
      }
    } catch (e: any) {
      setInput(text);
      toast.error('网络异常，请稍后重试');
    }
    // 自己发的也通过 Realtime 回流，避免重复 setState
  }
  async function endChat() {
    if (!conversationId) return;
    try {
      const { error } = await supabase.rpc('end_conversation' as any, { p_conv_id: conversationId });
      if (error) { toast.error('结束失败：' + error.message); return; }
      toast.success('已结束这段漂流');
      nav('/friends');
    } catch (e: any) {
      toast.error('网络异常，请稍后重试');
    }
  }
  async function blockTA() {
    if (!profile || !otherUserId) { nav('/friends'); return; }
    try {
      const { error } = await supabase.from('blocks').insert({ blocker: profile.id, blocked: otherUserId });
      if (error) { toast.error('拉黑失败：' + error.message); return; }
      toast.success('已拉黑 TA');
      nav('/friends');
    } catch (e: any) {
      toast.error('网络异常，请稍后重试');
    }
  }

  return (
    <>
      <BgVideo />
      <div style={{ ...immersiveBar, padding: isNarrow ? '20px 16px 14px' : '32px 56px 24px' }}>
        <Link to="/friends" style={backStyle}>← 瓶友</Link>
        <div style={{
          fontSize: isNarrow ? 13 : 16,
          color: '#fff',
          letterSpacing: isNarrow ? 2 : 6,
          textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          fontFamily: '"Source Han Serif CN VF Medium", serif',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: isNarrow ? '55vw' : 'none',
        }}>与 No.{otherNo} 的漂流</div>
        <a onClick={() => setMenuOpen(!menuOpen)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', letterSpacing: 4, cursor: 'pointer' }}>⋯</a>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: isNarrow ? 56 : 76, right: isNarrow ? 14 : 56, zIndex: 150,
          background: 'rgba(20, 25, 35, 0.92)', backdropFilter: 'blur(28px)',
          border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: 12,
          padding: 8, minWidth: 180, boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column',
        }}>
          {!ended && <a onClick={endChat} style={menuItemStyle}>结束这段漂流</a>}
          <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.12)', margin: '4px 8px' }} />
          <a onClick={blockTA} style={{ ...menuItemStyle, color: 'rgba(220, 130, 130, 0.95)' }}>拉黑 TA</a>
          <a style={{ ...menuItemStyle, color: 'rgba(220, 130, 130, 0.95)' }}>举报</a>
        </div>
      )}

      <div ref={scrollRef} style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        padding: isNarrow ? '76px 16px 100px' : '100px 32px 120px',
        maxWidth: 720, margin: '0 auto',
      }}>
        {messages.map(m => {
          const me = m.sender_id === profile?.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{
                  maxWidth: isNarrow ? '78vw' : 'min(70vw, 480px)',
                  padding: isNarrow ? '11px 16px' : '14px 20px',
                  fontSize: isNarrow ? 15 : 16,
                  lineHeight: 1.7, letterSpacing: 1,
                  borderRadius: 18,
                  backdropFilter: 'blur(28px) saturate(1.4) brightness(0.95)',
                  WebkitBackdropFilter: 'blur(28px) saturate(1.4) brightness(0.95)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.08)',
                  background: me ? 'rgba(120, 80, 56, 0.38)' : 'rgba(252, 246, 232, 0.32)',
                  color: '#fff',
                  border: me ? '0.5px solid rgba(255, 220, 180, 0.28)' : '0.5px solid rgba(255,255,255,0.4)',
                  borderTopLeftRadius: me ? 18 : 6,
                  borderTopRightRadius: me ? 6 : 18,
                  textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      {!ended && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
          padding: isNarrow ? '12px 14px 16px' : '16px 32px 24px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.8) 100%)',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            maxWidth: 720, width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.94)', border: '0.5px solid rgba(255,255,255,0.5)',
            borderRadius: 999,
            padding: isNarrow ? '6px 6px 6px 14px' : '8px 8px 8px 18px',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="写下回复……"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: isNarrow ? 14 : 15, outline: 'none', padding: '8px 4px', color: '#2a1f1a', letterSpacing: 1, minWidth: 0 }}
            />
            <button onClick={send} style={{
              background: '#2a1f1a', color: '#fcf8f0', border: 'none',
              padding: isNarrow ? '8px 18px' : '9px 22px', borderRadius: 999,
              fontFamily: '"Source Han Serif CN VF Medium", serif',
              fontSize: isNarrow ? 13 : 14, letterSpacing: isNarrow ? 2 : 3, cursor: 'pointer',
              flexShrink: 0,
            }}>发送</button>
          </div>
        </div>
      )}
    </>
  );
}

const immersiveBar: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '32px 56px 24px', background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const backStyle: React.CSSProperties = { fontSize: 14, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, textDecoration: 'none', textShadow: '0 1px 8px rgba(0,0,0,0.4)' };
const menuItemStyle: React.CSSProperties = { padding: '12px 18px', fontSize: 14, color: 'rgba(255,255,255,0.88)', letterSpacing: 3, textDecoration: 'none', borderRadius: 8, cursor: 'pointer' };
