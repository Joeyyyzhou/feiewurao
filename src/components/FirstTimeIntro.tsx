import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'feiewurao_seen_intro_v1';

const SLIDES = [
  {
    emoji: '🌊',
    title: '欢迎来到这片海',
    body: [
      '在这里，没有人知道你是谁。',
      '你只有一个编号，和你的心情。',
    ],
  },
  {
    emoji: '🍾',
    title: '每天 3 个瓶子',
    body: [
      '写点什么都行，选个心情标签，扔进海里。',
      '谁会捡到？全看缘分。你也可以捞别人的。',
    ],
  },
  {
    emoji: '✉️',
    title: '回信就是瓶友',
    body: [
      '捞起瓶子后可以回信，成为瓶友后一对一聊天。',
      '不想聊了随时结束漂流，没有压力。',
    ],
  },
];

export default function FirstTimeIntro() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // 先检查 localStorage（已看过直接跳过）
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch { /* noop */ }

    // 再检查是不是老用户：有瓶子或对话记录就跳过
    const userId = supabase.auth.getUser()?.then ? null : null;
    // 用 session 检查
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string } } | null } }) => {
      if (!data.session) {
        // 未登录也跳过（不应该到 Sea 页面）
        return;
      }
      // 老用户检测：查有没有历史数据
      supabase
        .from('bottles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.session.user.id)
        .limit(1)
        .then(() => {
          // 简单策略：只要能进到 Sea 页面且没看过 intro 就展示
          // 老用户如果之前没用过这个版本，第一次也会看到
          // 但我们可以通过检查 created_at 来判断是否是真正的新用户
          return supabase
            .from('users')
            .select('created_at')
            .eq('id', data.session!.user.id)
            .single()
            .then(({ data: u }: { data: { created_at?: string } | null }) => {
              if (!u || !u.created_at) { setOpen(true); return; }
              // 注册超过 24 小时的算老用户，不弹
              const age = Date.now() - new Date(u.created_at).getTime();
              if (age > 24 * 60 * 60 * 1000) {
                // 老用户，自动标记已读
                try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
                return;
              }
              setOpen(true);
            });
        });
    });
  }, []);

  function close() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    setOpen(false);
  }

  if (!open) return null;
  const last = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'transparent',
      backdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      WebkitBackdropFilter: 'blur(40px) saturate(1.6) brightness(0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(20px, 6vw, 48px)',
      color: '#fff',
    }}>
      <div style={{
        maxWidth: 420, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(40px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 24,
        padding: 'clamp(36px, 8vw, 56px) clamp(28px, 6vw, 44px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* emoji */}
        <div style={{ fontSize: 44, marginBottom: 16 }}>
          {slide.emoji}
        </div>

        <h2 style={{
          margin: 0, marginBottom: 22,
          fontSize: 22, fontWeight: 400, letterSpacing: 3, lineHeight: 1.4,
          textShadow: '0 1px 8px rgba(0,0,0,0.35)',
        }}>{slide.title}</h2>

        <div style={{
          fontSize: 14.5, lineHeight: 2.1, letterSpacing: 1,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: 30,
          textShadow: '0 1px 6px rgba(0,0,0,0.3)',
        }}>
          {slide.body.map((line, i) => (
            <p key={i} style={{ margin: '2px 0' }}>{line}</p>
          ))}
        </div>

        {/* 进度小点 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 26 }}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={close}
            style={{
              flex: 1, padding: '12px 20px',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, fontSize: 13, letterSpacing: 2, cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >跳过</button>
          <button
            onClick={() => last ? close() : setIdx(idx + 1)}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: 'center' }}
          >{last ? '开始' : '下一步'}</button>
        </div>
      </div>
    </div>
  );
}
