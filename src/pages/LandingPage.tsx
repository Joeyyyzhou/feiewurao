import { motion } from 'framer-motion';

interface Props { onYes: () => void; onNo: () => void; onLogin: () => void; }

export default function LandingPage({ onYes, onNo, onLogin }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="max-w-2xl mx-auto w-full px-6 pt-7 pb-6 flex items-baseline justify-between border-b border-border">
        <div className="flex items-baseline gap-3">
          <span className="text-accent text-[40px] leading-none -translate-y-0.5 select-none">·</span>
          <span className="font-display text-[22px] font-medium tracking-tight">非鹅勿扰</span>
          <span className="font-display italic text-[13px] text-text-muted">Tencent Souls</span>
        </div>
        <span className="font-meta text-[11px] tracking-[0.14em] uppercase text-text-muted">
          Est. 2026 · Invite Only
        </span>
      </header>

      {/* Landing body */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-xl mx-auto w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Penguin + Bulb */}
        <div className="flex items-baseline justify-center gap-1 mb-8 select-none">
          <motion.span
            className="text-[56px] leading-none inline-block"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            🐧
          </motion.span>
          <motion.span
            className="text-[44px] leading-none inline-block"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            💡
          </motion.span>
        </div>

        {/* Title */}
        <h1 className="font-display text-[clamp(56px,7vw,88px)] font-normal leading-none tracking-[-0.025em] text-text mb-5">
          非鹅勿扰
        </h1>

        {/* Slogan */}
        <p className="font-cn text-[18px] leading-relaxed text-text-secondary mb-14 max-w-md">
          不看脸，只听心。
          <br />
          每天一盏灯，照亮对的人。
        </p>

        {/* Action card */}
        <div className="card px-7 py-8 w-full mb-6">
          <div className="eyebrow mb-4">Tencent Souls Only</div>
          <p className="font-cn text-[17px] font-medium text-text mb-6">腾讯人专属灵魂交友空间</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={onYes}
              className="flex-1 py-3.5 px-5 btn-primary"
              whileTap={{ scale: 0.97 }}
            >
              是的，我是鹅厂人 🐧
            </motion.button>
            <motion.button
              onClick={onNo}
              className="flex-1 py-3.5 px-5 btn-glass"
              whileTap={{ scale: 0.97 }}
            >
              暂时不是
            </motion.button>
          </div>
        </div>

        <p className="font-meta text-[11px] tracking-[0.1em] uppercase text-text-muted mb-2">
          仅对腾讯在职员工开放
        </p>
        <p className="font-cn text-sm text-text-secondary">
          已有账号？
          <button
            onClick={onLogin}
            className="text-accent hover:text-accent-deep underline underline-offset-[3px] decoration-1 ml-1.5"
          >
            登录
          </button>
        </p>
      </motion.div>
    </div>
  );
}
