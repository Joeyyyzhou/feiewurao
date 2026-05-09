import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sun, Moon, CloudSun, Sparkles } from 'lucide-react';
import { Avatar } from '../components/Avatar';

interface Props {
  nickname: string;
  avatarColor: string;
  dayCount: number;
  pendingLights: number;
  onContinue: () => void;
}

function getGreeting(): { text: string; icon: React.ReactNode; emoji: string } {
  const h = new Date().getHours();
  if (h < 6) return { text: '夜深了，还在等那个人？', icon: <Moon className="w-5 h-5" />, emoji: '🌙' };
  if (h < 12) return { text: '早安，新的一天开始了', icon: <Sun className="w-5 h-5" />, emoji: '☀️' };
  if (h < 18) return { text: '下午好，来看看今天的故事', icon: <CloudSun className="w-5 h-5" />, emoji: '🌤' };
  return { text: '晚上好，灯亮了在等你', icon: <Moon className="w-5 h-5" />, emoji: '🌙' };
}

function getDailyQuote(dayCount: number): string {
  const quotes = [
    '每一次回答，都是一封匿名情书。',
    '灵魂有趣的人，终会相遇。',
    '今天也会有人，因为你的回答而心动。',
    '不急，好的故事都需要时间。',
    '你不知道谁在偷偷期待你的回答。',
    '真正的默契，从文字开始。',
    '也许今天，就是那个特别的日子。',
    '保持真实，有趣的灵魂自会靠近。',
    '每一盏灯，都是一份勇气。',
    '世界很大，但总有人在等你。',
    '认真回答的人，运气不会太差。',
    '今天的你，比昨天更有故事了。',
    '文字是最温柔的试探。',
    '不露脸，才更看得见心。',
  ];
  return quotes[(dayCount - 1) % quotes.length];
}

export default function CheckInPage({ nickname, avatarColor, dayCount, pendingLights, onContinue }: Props) {
  const [showQuote, setShowQuote] = useState(false);
  const greeting = getGreeting();
  const quote = getDailyQuote(dayCount);

  useEffect(() => {
    const t = setTimeout(() => setShowQuote(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 头像 + 问候 */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <Avatar nickname={nickname} color={avatarColor} size={72} />
        </motion.div>

        <motion.p
          className="font-meta text-text-muted text-[11px] mt-6 tracking-[0.18em] uppercase flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span>{greeting.emoji}</span>
          {greeting.text}
        </motion.p>

        <motion.h1
          className="font-display text-[36px] font-normal text-text mt-3 tracking-[-0.02em] leading-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          欢迎回来，<span className="italic text-accent">{nickname}</span>
        </motion.h1>

        {/* 签到天数卡片 */}
        <motion.div
          className="card p-7 mt-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="font-meta text-[11px] text-text-muted tracking-[0.22em] uppercase">留灯 第几天</span>
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <motion.span
              className="font-display text-[64px] font-normal italic text-accent tabular-nums leading-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.7 }}
              key={dayCount}
            >
              {dayCount || 1}
            </motion.span>
            <span className="font-cn text-base text-text-secondary">天</span>
          </div>

          {/* 每日一句 */}
          {showQuote && (
            <motion.p
              className="font-display text-[15px] italic text-text-secondary mt-6 leading-relaxed text-center border-t border-border-subtle pt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              「{quote}」
            </motion.p>
          )}
        </motion.div>

        {/* 留灯提醒 */}
        {pendingLights > 0 && (
          <motion.div
            className="mt-5 highlight-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <span className="text-lg leading-snug shrink-0">💡</span>
            <p className="font-cn text-[14px] text-text leading-snug">
              有 <span className="font-display italic text-accent text-[16px]">{pendingLights}</span> 位嘉宾为你留灯，等你回应
            </p>
          </motion.div>
        )}

        {/* 开始按钮 */}
        <motion.button
          onClick={onContinue}
          className="w-full mt-9 py-4 px-6 btn-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          whileTap={{ scale: 0.97 }}
        >
          开始今天的故事 <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
