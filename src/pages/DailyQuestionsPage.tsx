import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send } from 'lucide-react';
import type { Question } from '../data/questions';

interface Props { questions: Question[]; onSubmitAnswer: (qId: number, content: string) => void; onFinish: () => void; canSkip: boolean; }

export default function DailyQuestionsPage({ questions, onSubmitAnswer, onFinish, canSkip }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [val, setVal] = useState('');
  const q = questions[idx]; const isLast = idx === questions.length - 1; const done = answers.has(q?.id);

  const submit = () => {
    if (!val.trim() && !canSkip) return;
    const c = val.trim() || '（跳过）';
    onSubmitAnswer(q.id, c); setAnswers(p => new Map(p).set(q.id, c)); setVal('');
    if (isLast) setTimeout(onFinish, 400); else setTimeout(() => setIdx(idx + 1), 250);
  };

  if (!q) return null;
  const catMap: Record<string, { label: string; color: string }> = {
    shallow: { label: '破冰', color: 'tag-blue' },
    medium: { label: '深入了解', color: 'tag-orange' },
    deep: { label: '灵魂触碰', color: 'tag-pink' },
    life: { label: '生活', color: 'tag-green' },
  };
  const cat = catMap[q.category] || catMap.life;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部进度条 */}
      <div className="px-6 pt-7 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-meta text-[11px] tracking-[0.22em] uppercase text-accent">
            今日 · 第 {idx + 1} / {questions.length} 题
          </span>
          {canSkip && (
            <button onClick={onFinish} className="font-meta text-[11px] tracking-[0.16em] uppercase text-text-muted hover:text-accent transition-colors">
              跳过全部 →
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <motion.div
              key={i}
              className={`flex-1 h-[2px] transition-all ${
                i < idx ? 'bg-accent' : i === idx ? 'bg-accent' : 'bg-border'
              }`}
              animate={{ opacity: i <= idx ? 1 : 0.5 }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={q.id} className="w-full max-w-2xl text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <span className={`tag ${cat.color} mb-7 inline-block`}>{cat.label}</span>
            <h2
              className="font-display text-[clamp(28px,3.6vw,40px)] font-normal text-text leading-[1.25] tracking-[-0.015em] mb-10 px-2"
              style={{ textWrap: 'balance', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}
            >
              {q.content}
            </h2>
            {!done && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="card p-5 text-left">
                <textarea
                  value={val}
                  onChange={e => setVal(e.target.value)}
                  placeholder={q.hint}
                  rows={4}
                  maxLength={500}
                  autoFocus
                  className="w-full bg-transparent outline-none font-cn text-[16px] leading-relaxed text-text placeholder:text-text-faint placeholder:italic resize-none"
                />
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-border-subtle">
                  <span className="font-meta text-[11px] tracking-[0.12em] uppercase text-text-muted">诚实比好听重要</span>
                  <span className="font-meta text-[11px] text-text-muted tabular-nums">{val.length}/500</span>
                </div>
              </div>
            </motion.div>}
            {done && <motion.div className="card p-5 text-left" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <p className="font-cn text-text text-[16px] leading-relaxed">{answers.get(q.id)}</p>
            </motion.div>}
          </motion.div>
        </AnimatePresence>
      </div>
      {!done && <div className="fixed bottom-0 left-0 right-0 px-6 pt-8 pb-6 bg-gradient-to-t from-[#F5F0E8] via-[#F5F0E8]/95 to-transparent z-20">
        <div className="max-w-2xl mx-auto">
          <motion.button onClick={submit} disabled={!val.trim() && !canSkip}
            className="w-full py-3.5 px-6 btn-primary disabled:opacity-30" whileTap={{ scale: 0.97 }}>
            {isLast ? <>查看嘉宾 <ArrowRight className="w-4 h-4" /></> : <>提交 <Send className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </div>}
    </div>
  );
}
