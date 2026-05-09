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
          className="text-text-secondary text-sm mt-5 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span>{greeting.emoji}</span>
          {greeting.text}
        </motion.p>

        <motion.h1
          className="text-2xl font-bold text-text mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          欢迎回来，{nickname}
        </motion.h1>

        {/* 签到天数卡片 */}
        <motion.div
          className="glass rounded-2xl p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-text-secondary font-medium">连续签到</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <motion.span
              className="text-5xl font-bold text-primary tabular-nums"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.7 }}
              key={dayCount}
            >
              {dayCount || 1}
            </motion.span>
            <span className="text-lg text-text-secondary font-medium">天</span>
          </div>

          {/* 每日一句 */}
          {showQuote && (
            <motion.p
              className="text-sm text-text-secondary mt-5 leading-relaxed italic"
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
            className="mt-4 rounded-2xl bg-primary-soft px-4 py-3 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <span className="text-base">💡</span>
            <p className="text-sm text-primary font-medium">
              有 {pendingLights} 位嘉宾为你留灯，等你回应
            </p>
          </motion.div>
        )}

        {/* 开始按钮 */}
        <motion.button
          onClick={onContinue}
          className="w-full mt-8 py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2"
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
