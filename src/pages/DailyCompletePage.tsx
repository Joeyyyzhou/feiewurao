import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onGoProfile: () => void;
  hasViewedGuests: boolean;
  onViewGuests: () => void;
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds };
}

export default function DailyCompletePage({ onGoProfile, hasViewedGuests, onViewGuests }: Props) {
  const [time, setTime] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="text-center max-w-xl w-full"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        <div className="font-meta text-[11px] tracking-[0.22em] uppercase text-accent mb-5 flex items-center justify-center gap-2">
          <span className="w-6 h-[1px] bg-accent" />
          今日已完成
          <span className="w-6 h-[1px] bg-accent" />
        </div>

        <div className="text-5xl mb-6 select-none">🐧💤</div>
        <h2 className="font-display text-[42px] font-normal text-text mb-3 tracking-[-0.02em]">
          今天就到<span className="italic text-accent">这里</span>啦
        </h2>
        <p className="font-cn text-[16px] text-text-secondary mb-10 leading-relaxed max-w-md mx-auto">
          明天会有新的问题和新的嘉宾，<br />
          期待下一次心动 ✨
        </p>

        {/* Countdown */}
        <div className="card p-7 mb-10 inline-block">
          <p className="font-meta text-[11px] tracking-[0.22em] uppercase text-text-muted mb-4">距离新问题刷新还有</p>
          <div className="flex items-end justify-center gap-3">
            <div className="flex flex-col items-center">
              <span className="font-display text-[44px] font-normal italic text-accent tabular-nums leading-none">{pad(time.hours)}</span>
              <span className="font-meta text-[10px] tracking-[0.18em] uppercase text-text-muted mt-2">小时</span>
            </div>
            <span className="font-display text-[28px] text-text-muted leading-none mb-6">:</span>
            <div className="flex flex-col items-center">
              <span className="font-display text-[44px] font-normal italic text-accent tabular-nums leading-none">{pad(time.minutes)}</span>
              <span className="font-meta text-[10px] tracking-[0.18em] uppercase text-text-muted mt-2">分钟</span>
            </div>
            <span className="font-display text-[28px] text-text-muted leading-none mb-6">:</span>
            <div className="flex flex-col items-center">
              <motion.span
                className="font-display text-[44px] font-normal italic text-accent-deep tabular-nums leading-none"
                key={time.seconds}
                initial={{ opacity: 0.5, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {pad(time.seconds)}
              </motion.span>
              <span className="font-meta text-[10px] tracking-[0.18em] uppercase text-text-muted mt-2">秒</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          {!hasViewedGuests && (
            <motion.button onClick={onViewGuests}
              className="w-64 py-3.5 px-6 btn-primary"
              whileTap={{ scale: 0.97 }}>查看今日嘉宾 💡</motion.button>
          )}
          <motion.button onClick={onGoProfile}
            className="w-64 py-3.5 px-6 btn-glass"
            whileTap={{ scale: 0.97 }}>个人中心</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
