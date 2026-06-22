import { useEffect, useState } from 'react';

const STORAGE_KEY = 'feiewurao_seen_intro_v1';

const SLIDES = [
  {
    eyebrow: 'welcome to the sea',
    title: '这是一片海',
    body: '你看不到别人扔了什么，\n也没有人知道你是谁。\n每个人都是一个 4 位编号。',
  },
  {
    eyebrow: 'how it works',
    title: '扔瓶 = 写下心情',
    body: '一句话也行，配一个心情标签，\n扔进海里就漂走了。\n谁会捡到，全凭随机。',
  },
  {
    eyebrow: 'become bottle friends',
    title: '回信 = 成为瓶友',
    body: '你也可以捞起一个瓶子，\n选择回信或放回海里。\n回信之后会建立一对一的聊天，\n你可以随时结束这段对话。',
  },
];

export default function FirstTimeIntro() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch { /* noop */ }
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
      background: 'rgba(0,18,32,0.78)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(20px, 6vw, 48px)',
      color: '#fff',
    }}>
      <div style={{
        maxWidth: 460, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.22)',
        borderRadius: 18,
        padding: 'clamp(36px, 8vw, 56px) clamp(28px, 6vw, 44px)',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
          fontSize: 13, letterSpacing: 5,
          color: 'rgba(255,255,255,0.6)', marginBottom: 22,
          textTransform: 'lowercase',
        }}>{slide.eyebrow}</div>

        <h2 style={{
          margin: 0, marginBottom: 24,
          fontSize: 26, fontWeight: 300, letterSpacing: 4, lineHeight: 1.4,
        }}>{slide.title}</h2>

        <div style={{
          fontSize: 15, lineHeight: 2, letterSpacing: 1.5,
          color: 'rgba(255,255,255,0.82)',
          whiteSpace: 'pre-wrap',
          marginBottom: 32,
          fontFamily: '"Source Han Serif CN VF Light", serif',
        }}>{slide.body}</div>

        {/* 进度小点 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 26 }}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === idx ? '#fff' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={close}
            style={{
              flex: 1, padding: '12px 20px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.55)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              borderRadius: 12, fontSize: 13, letterSpacing: 2, cursor: 'pointer',
            }}
          >跳过</button>
          <button
            onClick={() => last ? close() : setIdx(idx + 1)}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: 'center' }}
          >{last ? '开始扔瓶' : '下一步'}</button>
        </div>
      </div>
    </div>
  );
}
