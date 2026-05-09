import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Avatar } from '../components/Avatar';
import type { GuestCard } from '../store/mockData';

interface Props { guest: GuestCard | null; wechatId?: string; onContinue: () => void; onGoHome: () => void; }

export default function MatchSuccessPage({ guest, onContinue, onGoHome }: Props) {
  const [copied, setCopied] = useState(false);
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) { fired.current = true;
      const end = Date.now() + 2500;
      const f = () => {
        confetti({ particleCount: 3, angle: 60, spread: 50, origin: { x: 0, y: 0.7 }, colors: ['#B85C3A', '#CC3D2E', '#7B8A5F', '#F5F0E8', '#E8A855'] });
        confetti({ particleCount: 3, angle: 120, spread: 50, origin: { x: 1, y: 0.7 }, colors: ['#B85C3A', '#CC3D2E', '#7B8A5F', '#F5F0E8', '#E8A855'] });
        if (Date.now() < end) requestAnimationFrame(f);
      }; f();
    }
  }, []);

  if (!guest) return null;
  const guestWechat = (guest as GuestCard & { wechatId?: string }).wechatId || '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="text-center max-w-xl w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

        {/* Eyebrow */}
        <motion.div
          className="font-meta text-[11px] tracking-[0.22em] uppercase text-accent mb-6 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <span className="w-6 h-[1px] bg-accent" />
          双向亮灯
          <span className="w-6 h-[1px] bg-accent" />
        </motion.div>

        <motion.div className="text-5xl mb-6 select-none"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <motion.span animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="inline-block">💡</motion.span>
        </motion.div>

        <motion.div className="mx-auto mb-5" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
          <Avatar nickname={guest.nickname} color={guest.avatarColor} size={72} className="mx-auto" />
        </motion.div>

        <motion.h2
          className="font-display text-[44px] font-normal text-text mb-2 tracking-[-0.02em]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          <span className="italic text-accent">{guest.nickname}</span>
        </motion.h2>

        <motion.p
          className="font-cn text-[16px] text-text-secondary mb-10 leading-relaxed"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        >
          你们亮了彼此的灯 ✨<br />
          接下来的故事，由你们书写。
        </motion.p>

        <motion.div className="card p-6 mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <p className="font-meta text-[11px] tracking-[0.22em] uppercase text-text-muted mb-3">TA 的微信号</p>
          {guestWechat ? (
            <>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display text-[26px] text-text tracking-tight">{guestWechat}</span>
                <button onClick={() => { navigator.clipboard.writeText(guestWechat); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={`p-2 transition-all border ${copied ? 'border-sage text-sage' : 'btn-glass'}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <p className="font-meta text-[11px] tracking-[0.15em] uppercase text-sage mt-2">已复制</p>}
            </>
          ) : (
            <p className="font-cn text-[14px] text-text-muted">微信号可在「个人中心 → 匹配」中查看</p>
          )}
          <p className="font-meta text-[11px] tracking-[0.12em] uppercase text-text-muted mt-4">🔒 微信号仅双方可见 · 加密存储</p>
        </motion.div>

        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <motion.button onClick={onContinue} className="w-full py-3.5 px-6 btn-primary" whileTap={{ scale: 0.97 }}>
            明天继续 <ArrowRight className="w-4 h-4" />
          </motion.button>
          <button onClick={onGoHome} className="font-meta text-[12px] tracking-[0.15em] uppercase text-text-muted hover:text-accent transition-colors py-1">
            个人中心
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
