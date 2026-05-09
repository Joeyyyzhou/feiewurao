import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import BgVideo from '../components/BgVideo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { MessageRow } from '../lib/database.types';

export default function Chat() {
  const { conversationId } = useParams();
  const { profile } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const ended = loc.search.includes('ended=1');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    // TODO(接力): load messages + Realtime subscribe
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || !conversationId || !profile) return;
    // TODO(接力): supabase.from('messages').insert
    const text = input.trim();
    setInput('');
    setMessages(m => [...m, { id: String(Date.now()), conversation_id: conversationId, sender_id: profile.id, content: text, reply_mood: null, created_at: new Date().toISOString() }]);
  }
  async function endChat() {
    // TODO(接力): RPC end_conversation
    nav('/friends');
  }
  async function blockTA() {
    // TODO(接力): insert blocks
    nav('/friends');
  }

  return (
    <>
      <BgVideo />
      <div style={immersiveBar}>
        <Link to="/friends" style={backStyle}>← 瓶友</Link>
        <div style={{ fontSize: 16, color: '#fff', letterSpacing: 6, textShadow: '0 1px 8px rgba(0,0,0,0.4)', fontFamily: '"Source Han Serif CN VF Medium", serif' }}>与 No.{conversationId?.slice(0, 4)} 的漂流</div>
        <a onClick={() => setMenuOpen(!menuOpen)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', letterSpacing: 4, cursor: 'pointer' }}>⋯</a>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 76, right: 56, zIndex: 150,
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

      <div ref={scrollRef} style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '100px 32px 120px', maxWidth: 720, margin: '0 auto' }}>
        {messages.map(m => {
          const me = m.sender_id === profile?.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{
                  maxWidth: 'min(70vw, 480px)',
                  padding: '14px 20px', fontSize: 16, lineHeight: 1.7, letterSpacing: 1,
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
                }}>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      {!ended && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
          padding: '16px 32px 24px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.8) 100%)',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ maxWidth: 720, width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.94)', border: '0.5px solid rgba(255,255,255,0.5)', borderRadius: 999, padding: '8px 8px 8px 18px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="写下回复……"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, outline: 'none', padding: '8px 4px', color: '#2a1f1a', letterSpacing: 1 }}
            />
            <button onClick={send} style={{
              background: '#2a1f1a', color: '#fcf8f0', border: 'none',
              padding: '9px 22px', borderRadius: 999,
              fontFamily: '"Source Han Serif CN VF Medium", serif',
              fontSize: 14, letterSpacing: 3, cursor: 'pointer',
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
