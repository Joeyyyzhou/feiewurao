import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle, X } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import type { GuestCard } from '../store/mockData';
import { questions as allQ } from '../data/questions';

interface Props { guests: GuestCard[]; questionIds: number[]; onUpdateLight: (id: string, s: 'on'|'off') => void; onFinalizeLight: (id: string) => void; onGiveUp: () => void; }

export default function GuestShowPage({ guests, questionIds, onUpdateLight, onFinalizeLight, onGiveUp }: Props) {
  const [ri, setRi] = useState(0);
  const [ag, setAg] = useState<GuestCard[]>(guests);
  const [showGuide, setShowGuide] = useState(true);
  const [allOff, setAllOff] = useState(false);
  const [turningOff, setTurningOff] = useState<string | null>(null);

  const qId = questionIds[ri]; const q = allQ.find(x => x.id === qId);
  const isLast = ri === questionIds.length - 1;
  const onGuests = ag.filter(g => g.lightStatus === 'on');

  useEffect(() => {
    if (onGuests.length === 0 && ag.length > 0) setAllOff(true);
  }, [onGuests.length, ag.length]);

  useEffect(() => {
    const t = setTimeout(() => setShowGuide(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const canGo = useMemo(() => (isLast || onGuests.length <= 1) ? onGuests.length === 1 : onGuests.length > 0, [isLast, onGuests]);

  const turnOff = useCallback((id: string) => {
    setShowGuide(false);
    // Step 1: mark as "turning off" — triggers gray animation
    setTurningOff(id);
    // Step 2: after gray animation plays, actually remove
    setTimeout(() => {
      onUpdateLight(id, 'off');
      setAg(p => p.map(x => x.id === id ? { ...x, lightStatus: 'off' } : x));
      setTurningOff(null);
    }, 600);
  }, [onUpdateLight]);

  const next = () => {
    if (onGuests.length === 1 || isLast) { if (onGuests[0]) onFinalizeLight(onGuests[0].id); return; }
    setRi(ri + 1);
  };

  if (!q) return null;
  const catMap: Record<string, string> = { shallow: '破冰', medium: '深入了解', deep: '灵魂触碰', life: '生活' };

  // All lights off
  if (allOff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div className="text-center max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-5xl mb-6 select-none">
            <span>🐧</span>
            <span className="ml-1" style={{ filter: 'grayscale(0.8) opacity(0.4)' }}>💡</span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">今天的灯都灭了</h2>
          <p className="text-text-secondary mb-2">没关系，缘分不能急</p>
          <p className="text-sm text-text-muted mb-10">明天会有新的嘉宾和新的问题等你</p>
          <motion.button onClick={onGiveUp}
            className="px-10 py-3.5 rounded-2xl btn-primary text-base"
            whileTap={{ scale: 0.97 }}>
            好的，明天再来 ✨
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {questionIds.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i <= ri ? 'w-6 bg-primary' : 'w-6 bg-white/30'}`} />)}
        </div>
        <span className="text-xs text-text-secondary font-medium">
          💡 {onGuests.length} / {ag.length}
        </span>
      </div>

      {guests.length < 5 && ri === 0 && (
        <motion.div className="mx-6 mt-4 px-4 py-3 bg-primary-soft rounded-2xl flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertCircle className="w-4 h-4 text-primary shrink-0" /><span className="text-xs text-primary-dark">当前条件下共 {guests.length} 位嘉宾</span>
        </motion.div>
      )}

      {/* Guide banner */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            className="mx-6 mt-4 px-4 py-3 rounded-2xl bg-gold/15 border border-gold/30 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <motion.span className="text-2xl"
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 1, repeat: Infinity }}>💡</motion.span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">点击「灭灯」为不心动的嘉宾熄灯</p>
              <p className="text-xs text-text-secondary mt-0.5">逐题淘汰，最终只留 1 盏灯</p>
            </div>
            <button onClick={() => setShowGuide(false)} className="text-text-muted hover:text-text p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <motion.div className="px-6 pt-5 pb-3" key={qId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="text-xs font-medium text-primary mb-2 inline-block">{catMap[q.category]}</span>
        <h2 className="text-lg font-bold text-text leading-relaxed">{q.content}</h2>
      </motion.div>

      {/* Guest cards */}
      <div className="flex-1 px-6 pb-28 overflow-y-auto space-y-3">
        <AnimatePresence mode="popLayout">
          {onGuests.map((g, i) => {
            const ans = g.answers.find(a => a.questionId === qId);
            const isTurningOff = turningOff === g.id;
            return (
              <motion.div key={g.id}
                className="glass rounded-2xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: isTurningOff ? 0.3 : 1,
                  y: 0,
                  scale: isTurningOff ? 0.95 : 1,
                  filter: isTurningOff ? 'grayscale(1)' : 'grayscale(0)',
                }}
                exit={{ opacity: 0, x: -120, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                transition={{ duration: isTurningOff ? 0.4 : 0.3, delay: isTurningOff ? 0 : i * 0.05 }}
                layout>
                <div className="flex items-start gap-4">
                  {/* Avatar + name */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 w-12">
                    <Avatar nickname={g.nickname} color={g.avatarColor} size={42} />
                    <span className="text-[11px] text-text-secondary">{g.nickname}</span>
                  </div>
                  {/* Answer */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm leading-relaxed text-text">{ans?.content || '—'}</p>
                  </div>
                  {/* 灭灯按钮 — 更大更明显 */}
                  <motion.button
                    onClick={() => !isTurningOff && turnOff(g.id)}
                    disabled={isTurningOff}
                    className="shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-white/50 hover:bg-red-50 border border-white/70 hover:border-red-300 transition-all group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.span
                      className="text-2xl leading-none select-none block"
                      style={{ filter: isTurningOff ? 'grayscale(1) brightness(0.5)' : 'none' }}
                      animate={isTurningOff ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 0.8, 0.6] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      💡
                    </motion.span>
                    <span className={`text-xs font-semibold transition-colors ${isTurningOff ? 'text-gray-400' : 'text-text-secondary group-hover:text-red-500'}`}>
                      {isTurningOff ? '灭灯中...' : '灭灯'}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-start/80 to-transparent backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <motion.button onClick={next} disabled={!canGo}
            className="w-full py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-30"
            whileTap={{ scale: 0.97 }}>
            {isLast || onGuests.length === 1 ? '确认留灯 💡' : <>下一题 <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
