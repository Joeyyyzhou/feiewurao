import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Avatar } from '../components/Avatar';
import type { GuestCard } from '../store/mockData';

interface Props { guest: GuestCard | null; wechatId?: string; onContinue: () => void; onGoHome: () => void; }

export default function MatchSuccessPage({ guest, wechatId, onContinue, onGoHome }: Props) {
  const [copied, setCopied] = useState(false);
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) { fired.current = true;
      const end = Date.now() + 2500;
      const f = () => {
        confetti({ particleCount: 3, angle: 60, spread: 50, origin: { x: 0, y: 0.7 }, colors: ['#8981E1', '#D5A3F3', '#FFCA42', '#EDE7F6', '#4ADE80'] });
        confetti({ particleCount: 3, angle: 120, spread: 50, origin: { x: 1, y: 0.7 }, colors: ['#8981E1', '#D5A3F3', '#FFCA42', '#EDE7F6', '#4ADE80'] });
        if (Date.now() < end) requestAnimationFrame(f);
      }; f();
    }
  }, []);

  if (!guest) return null;
  const guestWechat = wechatId || 'soul_mate_2026';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="text-center max-w-xl w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.div className="text-5xl mb-4 select-none"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <motion.span animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="inline-block">💡</motion.span>
        </motion.div>

        <motion.div className="mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
          <Avatar nickname={guest.nickname} color={guest.avatarColor} size={72} className="mx-auto" />
        </motion.div>
        <motion.h2 className="text-2xl font-bold text-text mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{guest.nickname}</motion.h2>
        <motion.p className="text-text-secondary mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          你们亮了彼此的灯 ✨<br />接下来的故事由你们书写
        </motion.p>

        <motion.div className="glass rounded-3xl p-6 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <p className="text-xs text-text-secondary mb-2">TA 的微信号</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl font-bold text-text">{guestWechat}</span>
            <button onClick={() => { navigator.clipboard.writeText(guestWechat); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-100 text-success' : 'btn-glass'}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && <p className="text-success text-xs mt-1.5">已复制</p>}
          <p className="text-[11px] text-text-muted mt-3">🔒 微信号仅双方可见，加密存储</p>
        </motion.div>

        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <motion.button onClick={onContinue} className="w-full py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2" whileTap={{ scale: 0.97 }}>明天继续 <ArrowRight className="w-4 h-4" /></motion.button>
          <button onClick={onGoHome} className="text-sm text-text-secondary hover:text-primary transition-colors py-1">个人中心</button>
        </motion.div>
      </motion.div>
    </div>
  );
}
