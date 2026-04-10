import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

interface Slide {
  emoji: string;
  title: string;
  paragraphs: string[];
  tags?: string[];
  quote?: { text: string; source: string };
  levels?: { label: string; desc: string; color: string }[];
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
      '1997年，美国心理学家 Arthur Aron 发表了一项著名研究：让两个陌生人依次回答 36 个逐渐深入的问题，就能在短时间内建立起亲密感。',
      '后来《纽约时报》以专题报道了这件事，引发全球关注——然后真的有人靠回答这些问题坠入爱河。',
      '我们的题库正是基于这 36 个问题改编，并加入了贴近鹅厂生活的场景题。从「你理想中完美的一天是什么样的」到「你最后悔没有对谁说什么」，每一个问题都是一次灵魂的触碰。',
    ],
    tags: ['Arthur Aron · 1997', 'NYT 专题报道', '从破冰到灵魂深处'],
    quote: {
      text: '"The 36 Questions That Lead to Love"',
      source: '— The New York Times, 2015',
    },
  },
  {
    emoji: '✍️',
    title: '每天回答 4 个问题',
    paragraphs: [
      '每天凌晨 0 点，系统会为你抽取 4 个新问题。问题分为四个层次，从轻松到深入，层层递进：',
    ],
    levels: [
      { label: '破冰', desc: '轻松有趣的话题，打开心扉', color: 'bg-blue-50 text-blue-400' },
      { label: '深入了解', desc: '价值观和人生态度', color: 'bg-orange-50 text-orange-400' },
      { label: '灵魂触碰', desc: '最真实的内心世界', color: 'bg-pink-50 text-pink-400' },
      { label: '生活场景', desc: '日常中见真性情', color: 'bg-emerald-50 text-emerald-400' },
    ],
    footnote: '前 9 天每天必须答完 4 题才能查看嘉宾，之后可以跳过。毕竟先得让别人有东西可看嘛。',
  },
  {
    emoji: '💡',
    title: '留灯 / 灭灯',
    paragraphs: [
      '回答完问题后，系统会为你匹配 5 位也回答了相同问题的嘉宾。你可以看到他们的回答——但看不到任何照片。',
      '像《非诚勿扰》一样，你需要逐题阅读嘉宾的回答，每看完一题都可以选择灭灯。随着问题深入，留下来的嘉宾越来越少……',
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
    title: '关于隐私',
    paragraphs: [
      '微信号只在匹配成功后才需要填写，且仅对匹配对象可见。',
      '所有数据加密存储，管理员也看不到。你的回答不会关联到真实身份。',
      '随时可以注销账号，一键删除所有数据。干干净净，不留痕迹。',
    ],
    tags: ['加密存储', '匹配后才填微信', '随时可注销'],
  },
];

export default function OnboardingPage({ onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Progress */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <motion.div key={i}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-primary' : i < idx ? 'w-3 bg-primary-light' : 'w-1.5 bg-primary-light/30'}`}
              animate={{ width: i === idx ? 24 : i < idx ? 12 : 6 }} />
          ))}
        </div>
        <button onClick={onComplete} className="text-xs text-text-muted hover:text-primary transition-colors">
          跳过
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-8 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={idx} className="w-full max-w-xl"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}>

            {/* Emoji */}
            <div className="text-4xl mb-5 select-none">{slide.emoji}</div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-text mb-5">{slide.title}</h2>

            {/* Paragraphs */}
            <div className="space-y-3 mb-5">
              {slide.paragraphs.map((p, i) => (
                <motion.p key={i} className="text-sm text-text-secondary leading-relaxed"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}>
                  {p}
                </motion.p>
              ))}
            </div>

            {/* Quote */}
            {slide.quote && (
              <motion.div className="glass rounded-2xl p-4 mb-5 border-l-4 border-l-primary"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <p className="text-sm italic text-text">{slide.quote.text}</p>
                <p className="text-xs text-text-muted mt-1">{slide.quote.source}</p>
              </motion.div>
            )}

            {/* Levels */}
            {slide.levels && (
              <motion.div className="space-y-2 mb-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                {slide.levels.map((lv, i) => (
                  <motion.div key={i} className="glass rounded-2xl px-4 py-3 flex items-center gap-3"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${lv.color}`}>{lv.label}</span>
                    <span className="text-sm text-text-secondary">{lv.desc}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Footnote */}
            {slide.footnote && (
              <p className="text-xs text-text-muted mb-4">{slide.footnote}</p>
            )}

            {/* Highlight box */}
            {slide.highlight && (
              <motion.div className="rounded-2xl bg-primary-soft p-4 mb-5"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0">{slide.highlight.icon}</span>
                  <p className="text-sm text-primary-dark leading-relaxed whitespace-pre-line">{slide.highlight.text}</p>
                </div>
              </motion.div>
            )}

            {/* Tags */}
            {slide.tags && (
              <motion.div className="flex flex-wrap gap-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {slide.tags.map((tag, i) => (
                  <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/50 text-text-secondary border border-white/60">
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-start/80 to-transparent backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex gap-3">
          {idx > 0 && (
            <motion.button onClick={() => setIdx(idx - 1)}
              className="w-12 h-12 rounded-2xl btn-glass flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            onClick={() => isLast ? onComplete() : setIdx(idx + 1)}
            className="flex-1 py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}>
            {isLast ? '开始吧 ✨' : <>继续 <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
