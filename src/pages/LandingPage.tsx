import { motion } from 'framer-motion';

interface Props { onYes: () => void; onNo: () => void; onLogin: () => void; }

export default function LandingPage({ onYes, onNo, onLogin }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle sparkles */}
      {[
        { top: '15%', left: '12%', size: 3, delay: 0 },
        { top: '22%', right: '18%', size: 2, delay: 0.5 },
        { top: '62%', left: '8%', size: 2, delay: 1 },
        { top: '50%', right: '10%', size: 3, delay: 0.3 },
        { top: '78%', left: '22%', size: 2, delay: 0.8 },
      ].map((s, i) => (
        <motion.div key={i} className="absolute rounded-full bg-primary-light/50"
          style={{ top: s.top, left: (s as any).left, right: (s as any).right, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, delay: s.delay }} />
      ))}

      <motion.div className="text-center max-w-xl w-full relative z-10"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

        {/* Penguin + bulb — animated */}
        <div className="flex justify-center items-end mb-6 select-none">
          <motion.span className="text-5xl inline-block origin-bottom"
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            🐧
          </motion.span>
          <motion.span className="text-4xl -ml-2 inline-block origin-bottom"
            animate={{ rotate: [-10, 10, -10], y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
            💡
          </motion.span>
        </div>

        {/* Title — just big, bold, clean black. No animation, no gradient. */}
        <h1 className="text-5xl md:text-6xl font-black text-text tracking-tight mb-2">
          非鹅勿扰
        </h1>

        <p className="text-base text-text-secondary mb-12">
          不看脸，只听心。每天一盏灯，照亮对的人。
        </p>

        {/* Card */}
        <div className="glass rounded-3xl p-7">
          <p className="text-lg font-semibold text-text mb-6">你是腾讯员工吗？</p>
          <motion.button onClick={onYes}
            className="w-full py-3.5 rounded-2xl btn-primary text-base mb-3"
            whileTap={{ scale: 0.97 }}>是的，我是鹅厂人</motion.button>
          <motion.button onClick={onNo}
            className="w-full py-3.5 rounded-2xl btn-glass text-base"
            whileTap={{ scale: 0.97 }}>暂时不是</motion.button>
        </div>

        <p className="text-xs text-text-muted mt-6">仅对腾讯在职员工开放</p>
        <p className="text-sm text-text-secondary mt-4">
          已有账号？<button onClick={onLogin} className="text-primary hover:underline">登录</button>
        </p>
      </motion.div>
    </div>
  );
}
