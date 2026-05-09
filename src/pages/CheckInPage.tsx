import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sun, Moon, CloudSun, Sparkles, BookOpen, Home } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import OnboardingPage from './OnboardingPage';

interface Props {
  nickname: string;
  avatarColor: string;
  dayCount: number;
  streak: number;
  pendingLights: number;
  onContinue: () => void;
}

type Tab = 'home' | 'today';

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
  return quotes[(Math.max(1, dayCount) - 1) % quotes.length];
}

export default function CheckInPage({ nickname, avatarColor, dayCount, streak, pendingLights, onContinue }: Props) {
  const [tab, setTab] = useState<Tab>('today');
  const [showQuote, setShowQuote] = useState(false);
  const greeting = getGreeting();
  const quote = getDailyQuote(dayCount);

  useEffect(() => {
    const t = setTimeout(() => setShowQuote(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部 tab 切换 */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-accent text-[32px] leading-none -translate-y-0.5 select-none">·</span>
            <span className="font-display text-[17px] font-medium tracking-tight">非鹅勿扰</span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-paper border border-border-subtle">
            <button
              onClick={() => setTab('today')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-cn text-[13px] transition-all ${
                tab === 'today' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              今日
            </button>
            <button
              onClick={() => setTab('home')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-cn text-[13px] transition-all ${
                tab === 'home' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              首页
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'today' ? (
          <motion.div
            key="today"
            className="flex-1 flex flex-col items-center justify-center px-6 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
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

              {/* 连续登录 N 天 */}
              <motion.div
                className="card p-7 mt-9"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span className="font-meta text-[11px] text-text-muted tracking-[0.22em] uppercase">
                    {streak > 0 ? '已连续答题' : '今天开始'}
                  </span>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <motion.span
                    className="font-display text-[64px] font-normal italic text-accent tabular-nums leading-none"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.7 }}
                    key={streak}
                  >
                    {streak}
                  </motion.span>
                  <span className="font-cn text-base text-text-secondary">天</span>
                </div>
                <p className="font-meta text-[10px] text-text-muted mt-2 tracking-[0.12em]">
                  {streak > 0
                    ? `累计活跃 ${dayCount} 天 · 今日答题即可 +1`
                    : `累计活跃 ${dayCount} 天 · 今天答题就重启连续记录`}
                </p>

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

              {/* 指引提示 */}
              <motion.button
                onClick={() => setTab('home')}
                className="mt-4 font-meta text-[11px] tracking-[0.16em] uppercase text-text-muted hover:text-accent transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                · 第一次来？看看玩法介绍 ·
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="home"
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* 嵌入式首页：复用 OnboardingPage 的六章内容 */}
            <OnboardingPage onComplete={() => setTab('today')} viewMode embedded />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
