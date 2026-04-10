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

        <div className="text-5xl mb-6 select-none">🐧💤</div>
        <h2 className="text-2xl font-bold text-text mb-3">今天就到这里啦</h2>
        <p className="text-text-secondary mb-8">明天会有新的问题和新的嘉宾，期待下一次心动 ✨</p>

        {/* Countdown */}
        <div className="glass rounded-3xl p-6 mb-8 inline-block">
          <p className="text-xs text-text-muted mb-3">距离新问题刷新还有</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-primary tabular-nums">{pad(time.hours)}</span>
              <span className="text-[10px] text-text-muted mt-1">小时</span>
            </div>
            <span className="text-2xl text-text-muted font-light mb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-primary tabular-nums">{pad(time.minutes)}</span>
              <span className="text-[10px] text-text-muted mt-1">分钟</span>
            </div>
            <span className="text-2xl text-text-muted font-light mb-4">:</span>
            <div className="flex flex-col items-center">
              <motion.span
                className="text-3xl font-bold text-primary-light tabular-nums"
                key={time.seconds}
                initial={{ opacity: 0.5, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {pad(time.seconds)}
              </motion.span>
              <span className="text-[10px] text-text-muted mt-1">秒</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          {!hasViewedGuests && (
            <motion.button onClick={onViewGuests}
              className="w-64 py-3.5 rounded-2xl btn-primary text-sm"
              whileTap={{ scale: 0.97 }}>查看今日嘉宾 💡</motion.button>
          )}
          <motion.button onClick={onGoProfile}
            className="w-64 py-3.5 rounded-2xl btn-glass text-sm font-medium"
            whileTap={{ scale: 0.97 }}>个人中心</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
