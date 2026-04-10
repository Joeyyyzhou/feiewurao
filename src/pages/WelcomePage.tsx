import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  orderNum: number;
  nickname: string;
  onContinue: () => void;
}

export default function WelcomePage({ orderNum, nickname, onContinue }: Props) {
  const [displayNum, setDisplayNum] = useState(0);

  // Animated counter roll-up
  useEffect(() => {
    if (orderNum <= 0) return;
    const duration = 1200;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // easeOutExpo
      const eased = 1 - Math.pow(2, -10 * progress);
      setDisplayNum(Math.round(eased * orderNum));
      if (step >= steps) {
        setDisplayNum(orderNum);
        clearInterval(timer);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [orderNum]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, delay: 0.1 }}
      >
        {/* Sparkle icon */}
        <motion.div
          className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>

        <p className="text-sm text-text-secondary mb-2">欢迎你，{nickname}</p>

        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-text-secondary text-base">你是第</span>
          <motion.span
            className="text-5xl font-bold text-primary mx-2 tabular-nums inline-block"
            key={displayNum}
          >
            {displayNum.toLocaleString()}
          </motion.span>
          <span className="text-text-secondary text-base">个加入的鹅厂人</span>
        </motion.div>

        <motion.p
          className="text-sm text-text-muted mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          在这里，灵魂先行
        </motion.p>

        <motion.button
          onClick={onContinue}
          className="px-8 py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2 mx-auto"
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          开始探索 <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
