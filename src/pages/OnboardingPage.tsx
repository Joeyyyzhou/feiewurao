import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === slides.length - 1;
  const slide = slides[idx];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header / Progress */}
      <header className="max-w-2xl mx-auto w-full px-6 pt-7 pb-5 border-b border-border">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-accent text-[40px] leading-none -translate-y-0.5 select-none">·</span>
            <span className="font-display text-[20px] font-medium tracking-tight">非鹅勿扰</span>
            <span className="font-display italic text-[13px] text-text-muted">新人引导</span>
          </div>
          <button
            onClick={onComplete}
            className="font-meta text-[11px] tracking-[0.16em] uppercase text-text-muted hover:text-accent transition-colors"
          >
            跳过
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-between items-center">
          <span className="font-meta text-[11px] tracking-[0.22em] uppercase text-text-muted">
            第 {['一', '二', '三', '四', '五', '六'][idx]} 章 / 0{idx + 1}
          </span>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-[2px] transition-all ${i === idx ? 'w-7 bg-accent' : i < idx ? 'w-3 bg-accent/40' : 'w-3 bg-border'}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex justify-center px-6 pt-12 pb-32 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            {/* Emoji */}
            <div className="text-[44px] leading-none mb-6 select-none">{slide.emoji}</div>

            {/* Title */}
            <h2 className="font-display text-[clamp(36px,4.6vw,52px)] font-normal leading-[1.1] tracking-[-0.02em] text-text mb-8 max-w-[620px]">
              {slide.title}
            </h2>

            {/* Paragraphs */}
            <div className="space-y-4 mb-2">
              {slide.paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  className="font-cn text-[16.5px] leading-[1.85] text-text-secondary max-w-[640px]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  {p}
                </motion.p>
              ))}
            </div>

            {/* Quote */}
            {slide.quote && (
              <motion.div
                className="quote-block mt-7 mb-2 max-w-[640px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="font-display italic text-[17px] text-text leading-snug">{slide.quote.text}</p>
                <p className="font-meta text-[11px] tracking-[0.12em] text-text-muted mt-1.5">{slide.quote.source}</p>
              </motion.div>
            )}

            {/* Examples */}
            {slide.examples && (
              <motion.div
                className="mt-6 mb-2 flex flex-col gap-2.5 max-w-[640px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {slide.examples.map((ex, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3.5 px-4 py-3.5 bg-paper border border-border-subtle"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                  >
                    <span
                      className={`font-meta text-[10px] font-medium tracking-[0.18em] uppercase px-2 py-1 shrink-0 mt-[3px] ${ex.color}`}
                    >
                      {ex.label}
                    </span>
                    <span className="font-display italic text-[16px] text-text-secondary leading-snug">
                      "{ex.question}"
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Highlight */}
            {slide.highlight && (
              <motion.div
                className="highlight-block mt-7 mb-2 max-w-[640px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-[22px] leading-snug shrink-0">{slide.highlight.icon}</span>
                <p className="font-cn text-[15.5px] leading-[1.7] text-text whitespace-pre-line">
                  {slide.highlight.text}
                </p>
              </motion.div>
            )}

            {/* Footnote */}
            {slide.footnote && (
              <p className="font-cn text-[13.5px] leading-[1.65] text-text-muted mt-5 max-w-[620px]">
                {slide.footnote}
              </p>
            )}

            {/* Tags */}
            {slide.tags && (
              <motion.div
                className="mt-7 flex flex-wrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {slide.tags.map((tag, i) => (
                  <span key={i} className="tag">
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-8 pb-6 bg-gradient-to-t from-[#F5F0E8] via-[#F5F0E8]/95 to-transparent z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          {idx > 0 && (
            <motion.button
              onClick={() => setIdx(idx - 1)}
              className="w-12 h-12 btn-glass flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            onClick={() => (isLast ? onComplete() : setIdx(idx + 1))}
            className="flex-1 py-3.5 px-6 btn-primary text-base"
            whileTap={{ scale: 0.97 }}
          >
            {isLast ? (
              '开始吧 ✨'
            ) : (
              <>
                继续 <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ────── Slide data ────── */

interface Slide {
  emoji: string;
  title: string;
  paragraphs: string[];
  tags?: string[];
  quote?: { text: string; source: string };
  examples?: { label: string; question: string; color: string }[];
  footnote?: string;
  highlight?: { icon: string; text: string };
}

const slides: Slide[] = [
  {
    emoji: '🐧💡',
    title: '欢迎来到非鹅勿扰',
    paragraphs: [
      '这是一个只属于腾讯人的灵魂交友空间。',
      '我们相信，真正的心动不是因为一张照片，而是因为某个回答让你会心一笑、某句话让你觉得「这个人懂我」。',
      '在这里，你不需要精修自拍、不需要展示身材，只需要认真回答问题，做真实的自己。',
    ],
    tags: ['不露脸', '不爆照', '只看灵魂'],
  },
  {
    emoji: '📖',
    title: '来自心理学的 36 个问题',
    paragraphs: [
      '1997年，美国心理学家 Arthur Aron 做了一个大胆的实验：他让两个完全陌生的人坐在一起，按顺序回答 36 个逐渐深入的问题——从「你理想中完美的一天」到「你最后悔没有对谁说什么」。',
      '结果令人震惊：仅仅 45 分钟的问答，这些陌生人之间就建立了深层的亲密感。其中一对实验参与者，半年后真的结婚了。',
      '2015年，《纽约时报》以「36 Questions That Lead to Love」为题发表专栏，引发全球数百万人尝试这组问题。我们的题库正是基于此改编，加入了贴近鹅厂生活的场景题。',
    ],
    quote: {
      text: '"The 36 Questions That Lead to Love"',
      source: '— The New York Times, 2015',
    },
    tags: ['Arthur Aron · 1997', '《纽约时报》专题'],
  },
  {
    emoji: '✍️',
    title: '每天回答 4 个问题',
    paragraphs: [
      '每天凌晨 0 点，系统会为你抽取 4 个新问题。问题从浅到深，分为四个层次——先从轻松的话题打开心扉，逐渐走向最真实的内心世界。',
      '比如下面这些：',
    ],
    examples: [
      { label: '破冰', question: '如果可以和任何人共进晚餐，你会选谁？', color: 'tag-blue' },
      { label: '深入', question: '你人生中最大的成就是什么？', color: 'tag-orange' },
      { label: '灵魂', question: '你最后悔没有对谁说什么？', color: 'tag-pink' },
      { label: '生活', question: '周末不加班的时候你最喜欢做什么？', color: 'tag-green' },
    ],
    footnote: '前 9 天每天必须答完 4 题才能查看嘉宾，之后可以跳过——毕竟先得让别人有东西可看嘛。',
  },
  {
    emoji: '💡',
    title: '留灯 / 灭灯',
    paragraphs: [
      '回答完问题后，系统会为你匹配 5 位也回答了相同问题的嘉宾。你能看到他们对同一个问题的回答——但看不到任何照片、不知道对方长什么样。',
      '就像《非诚勿扰》一样，你需要逐题阅读嘉宾的回答。每看完一题，都可以为不心动的嘉宾「灭灯」。随着问题越来越深入，留下来的嘉宾越来越少……',
    ],
    highlight: {
      icon: '⚡',
      text: '最终你只能为 1 位嘉宾留灯。\n每天只有 1 次留灯机会，请把灯留给那个让你忍不住微笑的人。',
    },
    tags: ['逐题淘汰', '每天 1 次', '嘉宾不重复出现'],
  },
  {
    emoji: '💜',
    title: '双向留灯 = 解锁微信号',
    paragraphs: [
      '你为 TA 留灯后，TA 下次登录时会收到通知「有人对你留灯了」。TA 可以查看你回答的问题，然后决定是否也为你留灯。',
      '只有当你们互相留灯，双方才能看到对方的微信号。这是双向的心意，没有人会被单方面打扰。',
      '如果 TA 选择忽略，你不会收到任何通知——我们保护每个人的体面。',
    ],
    highlight: {
      icon: '⏰',
      text: '留灯有效期 7 天。7 天内对方未回应，留灯自动熄灭。缘分要趁热。',
    },
    tags: ['双向匹配', '7天有效', '忽略不通知'],
  },
  {
    emoji: '🔒',
    title: '你的隐私，我们守护',
    paragraphs: [
      '微信号只在双向匹配成功后才对匹配对象可见，任何其他人都看不到——包括管理员。',
      '所有数据加密存储，你的回答不会关联到你的真实身份。我们不会将任何信息用于推广或分享给第三方。',
      '随时可以在个人中心注销账号，一键删除所有数据，干干净净，不留痕迹。',
    ],
    tags: ['加密存储', '匹配后才填微信', '随时可注销', '管理员不可见'],
  },
];
