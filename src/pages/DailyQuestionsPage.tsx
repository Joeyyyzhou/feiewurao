import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, Check, MessageCircle, Users } from 'lucide-react';
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
    shallow: { label: '破冰', color: 'bg-blue-50 text-blue-400' },
    medium: { label: '深入了解', color: 'bg-orange-50 text-orange-400' },
    deep: { label: '灵魂触碰', color: 'bg-pink-50 text-pink-400' },
    life: { label: '生活', color: 'bg-emerald-50 text-emerald-400' },
  };
  const cat = catMap[q.category] || catMap.life;

  // 全局阶段
  const globalSteps = [
    { label: '答题', icon: <MessageCircle className="w-3.5 h-3.5" />, active: true },
    { label: '查看嘉宾', icon: <Users className="w-3.5 h-3.5" />, active: false },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 全局进度指示 + 题目进度 */}
      <div className="px-6 pt-5 pb-2 space-y-3">
        {/* 全局阶段指示 */}
        <div className="flex items-center justify-center gap-2">
          {globalSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <div className="w-6 h-[1.5px] bg-primary/20 mx-0.5" />}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                step.active 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-surface-alt text-text-muted'
              }`}>
                {step.icon}
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* 题目进度条 — 更醒目，居中显示 */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 w-full max-w-xs">
            {questions.map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-full h-2 rounded-full transition-all ${
                    i < idx ? 'bg-primary' : i === idx ? 'bg-primary' : 'bg-surface-alt'
                  }`}
                  animate={{ 
                    scale: i === idx ? 1 : 1,
                    opacity: i <= idx ? 1 : 0.5 
                  }}
                />
                {i <= idx && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    {i < idx ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <motion.div className="w-2 h-2 rounded-full bg-primary"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }} />
                    )}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-medium text-text-secondary">
            第 {idx + 1} / {questions.length} 题
          </span>
        </div>
      </div>

      {canSkip && (
        <div className="px-6">
          <button onClick={onFinish} className="text-xs text-text-secondary hover:text-primary transition-colors">跳过全部 →</button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={q.id} className="w-full max-w-2xl text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-6 ${cat.color}`}>{cat.label}</span>
            <h2 className="text-xl md:text-2xl font-bold text-text leading-relaxed mb-8 px-2" style={{ textWrap: 'balance', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{q.content}</h2>
            {!done && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="glass rounded-2xl p-4"><textarea value={val} onChange={e => setVal(e.target.value)} placeholder={q.hint} rows={3} maxLength={500} autoFocus className="w-full bg-transparent outline-none text-base text-text placeholder:text-text-muted resize-none" />
                <div className="flex justify-end"><span className="text-xs text-text-muted">{val.length}/500</span></div>
              </div>
            </motion.div>}
            {done && <motion.div className="glass rounded-2xl p-5 text-left" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}><p className="text-text text-sm leading-relaxed">{answers.get(q.id)}</p></motion.div>}
          </motion.div>
        </AnimatePresence>
      </div>
      {!done && <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#EAE4F2] via-[#EAE4F2/95] to-transparent">
        <div className="max-w-2xl mx-auto">
          <motion.button onClick={submit} disabled={!val.trim() && !canSkip}
            className="w-full py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-30" whileTap={{ scale: 0.97 }}>
            {isLast ? <>查看嘉宾 <ArrowRight className="w-4 h-4" /></> : <>提交 <Send className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </div>}
    </div>
  );
}
