import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle, X, Flag } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import type { GuestCard } from '../store/mockData';
import { questions as allQ } from '../data/questions';
import { reportUser, blockUser } from '../lib/api';

const REPORT_REASONS = [
  '色情低俗',
  '骚扰或攻击性言论',
  '广告/垃圾信息',
  '虚假身份',
  '其他',
];

interface Props {
  guests: GuestCard[];
  questionIds: number[];
  userId?: string;
  onUpdateLight: (id: string, s: 'on'|'off') => void;
  onFinalizeLight: (id: string) => void;
  onGiveUp: () => void;
  onBlockUser?: (blockedId: string) => void;
}

export default function GuestShowPage({ guests, questionIds, userId, onUpdateLight, onFinalizeLight, onGiveUp, onBlockUser }: Props) {
  const [ri, setRi] = useState(0);
  const [ag, setAg] = useState<GuestCard[]>(guests);
  const [showGuide, setShowGuide] = useState(true);
  const [allOff, setAllOff] = useState(false);
  const [turningOff, setTurningOff] = useState<string | null>(null);

  // Report modal state
  const [reportTarget, setReportTarget] = useState<{ guestId: string; guestName: string; questionId: number; answerContent: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReport = async () => {
    if (!reportTarget || !selectedReason || !userId) return;
    await reportUser(userId, reportTarget.guestId, selectedReason, reportTarget.questionId, reportTarget.answerContent);
    await blockUser(userId, reportTarget.guestId);
    // Remove blocked guest from list
    onUpdateLight(reportTarget.guestId, 'off');
    setAg(p => p.map(x => x.id === reportTarget.guestId ? { ...x, lightStatus: 'off' } : x));
    onBlockUser?.(reportTarget.guestId);
    setReportSubmitted(true);
    setTimeout(() => {
      setReportTarget(null);
      setSelectedReason('');
      setReportSubmitted(false);
    }, 1500);
  };

  // Collect all unique question IDs that ANY on-guest has answered
  // Prioritize today's questions first, then fill with historical ones
  const displayQuestionIds = useMemo(() => {
    const allAnswerQIds = new Set<number>();
    ag.forEach(g => {
      if (g.lightStatus === 'on') {
        g.answers.forEach(a => allAnswerQIds.add(a.questionId));
      }
    });
    // Put today's questions first, then others
    const todayQs = questionIds.filter(qid => allAnswerQIds.has(qid));
    const otherQs = [...allAnswerQIds].filter(qid => !questionIds.includes(qid));
    const combined = [...todayQs, ...otherQs];
    return combined.length > 0 ? combined.slice(0, 4) : questionIds;
  }, [ag, questionIds]);

  const qId = displayQuestionIds[ri]; const q = allQ.find(x => x.id === qId);
  const isLast = ri === displayQuestionIds.length - 1;
  const onGuests = ag.filter(g => g.lightStatus === 'on');

  useEffect(() => {
    if (onGuests.length === 0 && ag.length > 0) setAllOff(true);
  }, [onGuests.length, ag.length]);

  useEffect(() => {
    const t = setTimeout(() => setShowGuide(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // 可以进入下一步的条件：
  // - 还没到最后一题：至少有 1 个嘉宾灯还亮（让用户继续看下一题）
  // - 到最后一题：恰好剩 1 个嘉宾（才能确认留灯）
  const canGo = useMemo(() => isLast ? onGuests.length === 1 : onGuests.length > 0, [isLast, onGuests]);

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

  // Confirm light modal
  const [showLightConfirm, setShowLightConfirm] = useState(false);

  const next = () => {
    // 只有到最后一题时才弹出确认留灯弹窗，避免跳过剩余题目
    if (isLast) {
      setShowLightConfirm(true);
      return;
    }
    setRi(ri + 1);
  };

  const confirmLight = () => {
    setShowLightConfirm(false);
    if (onGuests[0]) onFinalizeLight(onGuests[0].id);
  };

  // No guests available
  if (guests.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div className="text-center max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            className="text-6xl mb-6 select-none"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🐧
          </motion.div>
          <h2 className="text-2xl font-bold text-text mb-3">暂时还没有嘉宾回答</h2>
          <p className="text-text-secondary mb-2">你是最早回答问题的人之一</p>
          <p className="text-sm text-text-muted mb-10">当其他嘉宾也回答了今天的问题，你们就能看到彼此的答案啦</p>
          <motion.button onClick={onGiveUp}
            className="px-10 py-3.5 rounded-2xl btn-primary text-base"
            whileTap={{ scale: 0.97 }}>
            期待明天再来 ✨
          </motion.button>
        </motion.div>
      </div>
    );
  }

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
          {displayQuestionIds.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i <= ri ? 'w-6 bg-primary' : 'w-6 bg-surface-alt'}`} />)}
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
                    <p className={`text-sm leading-relaxed ${ans?.content ? 'text-text' : 'text-text-muted italic'}`}>{ans?.content || 'TA 还没有回答这道题'}</p>
                    {/* Report button */}
                    {ans?.content && (
                      <button
                        onClick={() => setReportTarget({
                          guestId: g.id,
                          guestName: g.nickname,
                          questionId: qId,
                          answerContent: ans.content,
                        })}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted hover:text-danger transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        <span>举报</span>
                      </button>
                    )}
                  </div>
                  {/* 灭灯按钮 — 更大更明显 */}
                  <motion.button
                    onClick={() => !isTurningOff && turnOff(g.id)}
                    disabled={isTurningOff}
                    className="shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-surface hover:bg-red-50 border border-white/70 hover:border-red-300 transition-all group"
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
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#EAE4F2] via-[#EAE4F2/95] to-transparent">
        <div className="max-w-2xl mx-auto">
          <motion.button onClick={next} disabled={!canGo}
            className="w-full py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-30"
            whileTap={{ scale: 0.97 }}>
            {isLast ? '确认留灯 💡' : <>下一题 <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </div>

      {/* Light Confirmation Modal */}
      <AnimatePresence>
        {showLightConfirm && onGuests[0] && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowLightConfirm(false)} />
            <motion.div className="rounded-2xl p-6 max-w-sm w-full relative z-10 bg-white border border-border shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="text-center">
                <div className="text-4xl mb-3">💡</div>
                <h3 className="text-base font-bold text-text mb-2">确认为 {onGuests[0].nickname} 留灯？</h3>
                <p className="text-sm text-text-secondary mb-1">每天只有 1 次留灯机会</p>
                <p className="text-xs text-text-muted mb-6">留灯后无法取消，TA 会收到通知</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLightConfirm(false)}
                    className="flex-1 py-3 rounded-xl btn-glass text-sm font-medium">再想想</button>
                  <motion.button onClick={confirmLight}
                    className="flex-1 py-3 rounded-xl btn-primary text-sm font-semibold"
                    whileTap={{ scale: 0.97 }}>确认留灯 💡</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportTarget && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => !reportSubmitted && (setReportTarget(null), setSelectedReason(''))} />
            <motion.div className="rounded-2xl p-6 max-w-sm w-full relative z-10 bg-white border border-border shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              {reportSubmitted ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-base font-bold text-text">举报成功</p>
                  <p className="text-sm text-text-secondary mt-1">已拉黑该用户，不会再看到 TA</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                      <Flag className="w-4 h-4 text-danger" /> 举报 {reportTarget.guestName}
                    </h3>
                    <button onClick={() => (setReportTarget(null), setSelectedReason(''))} className="p-1 text-text-muted hover:text-text">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-surface-alt rounded-xl p-3 mb-4">
                    <p className="text-xs text-text-muted mb-1">被举报的回答：</p>
                    <p className="text-sm text-text leading-relaxed">"{reportTarget.answerContent}"</p>
                  </div>

                  <p className="text-sm text-text-secondary mb-3">请选择举报原因：</p>
                  <div className="space-y-2 mb-5">
                    {REPORT_REASONS.map(reason => (
                      <button key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${
                          selectedReason === reason
                            ? 'border-danger bg-danger/5 text-danger font-medium'
                            : 'border-border bg-white text-text-secondary hover:border-text-muted'
                        }`}>
                        {reason}
                      </button>
                    ))}
                  </div>

                  <div className="bg-amber-50 rounded-xl px-4 py-3 mb-5">
                    <p className="text-xs text-amber-700">
                      ⚠️ 举报后将自动拉黑该用户，TA 的回答将不再出现在你的嘉宾列表中。此操作不可撤销。
                    </p>
                  </div>

                  <motion.button
                    onClick={handleReport}
                    disabled={!selectedReason}
                    className="w-full py-3 rounded-xl text-sm font-medium text-white bg-danger hover:bg-danger/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    whileTap={{ scale: 0.97 }}>
                    确认举报并拉黑
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
