import { motion } from 'framer-motion';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import type { LightRecord } from '../store/mockData';
import { questions as allQ } from '../data/questions';

interface Props { notification: LightRecord; onRespond: (id: string, accept: boolean) => void; onBack: () => void; }

export default function NotificationDetailPage({ notification, onRespond, onBack }: Props) {
  const { fromUser } = notification;
  const catMap: Record<string, string> = { shallow: '破冰', medium: '深入了解', deep: '灵魂触碰', life: '生活' };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 backdrop-blur-lg bg-bg-start/60 border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/20 transition-colors"><ArrowLeft className="w-5 h-5 text-text" /></button>
          <span className="font-semibold text-text">有人对你留灯了 💡</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Avatar nickname={fromUser.nickname} color={fromUser.avatarColor} size={64} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text">{fromUser.nickname}</h2>
          <p className="text-xs text-text-secondary mt-1">{new Date(notification.createdAt).toLocaleDateString('zh-CN')} 留灯</p>
          <span className="inline-block mt-2 text-[11px] font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-600">
            {Math.max(0, Math.ceil((new Date(notification.expiresAt).getTime() - Date.now()) / 86400000))} 天后过期
          </span>
        </motion.div>
        <p className="text-sm font-medium text-text-secondary mb-4">TA 的回答</p>
        <div className="space-y-3">
          {fromUser.answers.map((a, i) => { const aq = allQ.find(q => q.id === a.questionId); return (
            <motion.div key={a.questionId} className="glass rounded-2xl p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <span className="text-xs text-primary font-medium">{catMap[aq?.category || 'life']}</span>
              <p className="text-sm font-medium text-text mt-1 mb-2">{aq?.content}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{a.content}</p>
            </motion.div>
          ); })}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-start/80 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex gap-3">
          <motion.button onClick={() => onRespond(notification.id, false)}
            className="flex-1 py-3.5 rounded-2xl btn-glass font-medium flex items-center justify-center gap-1.5" whileTap={{ scale: 0.97 }}><X className="w-4 h-4" /> 忽略</motion.button>
          <motion.button onClick={() => onRespond(notification.id, true)}
            className="flex-[2] py-3.5 rounded-2xl btn-primary font-semibold flex items-center justify-center gap-1.5" whileTap={{ scale: 0.97 }}><Heart className="w-4 h-4" /> 回应留灯</motion.button>
        </div>
      </div>
    </div>
  );
}
