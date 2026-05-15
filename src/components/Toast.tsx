import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';

type ToastKind = 'info' | 'error' | 'success';
interface Toast { id: number; kind: ToastKind; text: string; }

interface ToastCtx {
  show: (text: string, kind?: ToastKind) => void;
  error: (text: string) => void;
  success: (text: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = ++idRef.current;
    setList((l) => [...l, { id, kind, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);

  const error = useCallback((text: string) => show(text, 'error'), [show]);
  const success = useCallback((text: string) => show(text, 'success'), [show]);

  return (
    <Ctx.Provider value={{ show, error, success }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {list.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const bg =
    toast.kind === 'error'
      ? 'rgba(120, 30, 30, 0.85)'
      : toast.kind === 'success'
      ? 'rgba(28, 60, 50, 0.85)'
      : 'rgba(15, 35, 55, 0.85)';
  const border =
    toast.kind === 'error'
      ? 'rgba(255, 180, 180, 0.45)'
      : toast.kind === 'success'
      ? 'rgba(180, 230, 200, 0.45)'
      : 'rgba(255, 255, 255, 0.3)';
  return (
    <div
      style={{
        background: bg,
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        border: `0.5px solid ${border}`,
        borderRadius: 999,
        padding: '12px 24px',
        color: '#fff',
        fontFamily: '"Source Han Serif CN VF Light", serif',
        fontSize: 13,
        letterSpacing: 2,
        maxWidth: 'min(520px, 92vw)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.32s ease, transform 0.32s ease',
        pointerEvents: 'auto',
      }}
    >
      {toast.text}
    </div>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // 容错：未包裹 Provider 时退化为 console，不抛错
    return {
      show: (t) => console.warn('[toast]', t),
      error: (t) => console.warn('[toast error]', t),
      success: (t) => console.warn('[toast success]', t),
    };
  }
  return ctx;
}
