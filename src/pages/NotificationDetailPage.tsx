import { motion } from 'framer-motion';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import type { LightRecord } from '../store/mockData';
import { questions as allQ } from '../data/questions';

interface Props { notification: LightRecord; onRespond: (id: string, accept: boolean) => void; onBack: () => void; }

export default function NotificationDetailPage({ notification, onRespond, onBack }: Props) {
  const { fromUser } = notification;
  const catMap: Record<string, { label: string; cls: string }> = {
    shallow: { label: '破冰', cls: 'tag-blue' },
    medium: { label: '深入了解', cls: 'tag-orange' },
    deep: { label: '灵魂触碰', cls: 'tag-pink' },
    life: { label: '生活', cls: 'tag-green' },
  };

  const daysLeft = Math.max(0, Math.ceil((new Date(notification.expiresAt).getTime() - Date.now()) / 86400000));

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 -ml-1.5 hover:bg-surface-alt transition-colors">
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <span className="font-display text-[18px] font-medium text-text">
            有人对你 <span className="italic text-accent">留灯</span> 了 💡
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 pb-32">
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Avatar nickname={fromUser.nickname} color={fromUser.avatarColor} size={72} className="mx-auto mb-4" />
          <h2 className="font-display text-[32px] font-normal text-text tracking-[-0.02em]">
            <span className="italic text-accent">{fromUser.nickname}</span>
          </h2>
          <p className="font-meta text-[11px] tracking-[0.18em] uppercase text-text-muted mt-2">
            {new Date(notification.createdAt).toLocaleDateString('zh-CN')} · 留灯
          </p>
          <span className="tag tag-orange mt-3 inline-block">
            {daysLeft} 天后过期
          </span>
        </motion.div>

        <div className="eyebrow mb-5">TA 的回答</div>
        <div className="space-y-3">
          {fromUser.answers.map((a, i) => {
            const aq = allQ.find(q => q.id === a.questionId);
            const cat = catMap[aq?.category || 'life'] || catMap.life;
            return (
              <motion.div
                key={a.questionId}
                className="card p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <span className={`tag ${cat.cls} mb-2.5 inline-block`}>{cat.label}</span>
                <p className="font-display text-[18px] italic text-text mt-1 mb-3 leading-snug">"{aq?.content}"</p>
                <p className="font-cn text-[15px] text-text-secondary leading-[1.8]">{a.content}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pt-8 pb-6 bg-gradient-to-t from-[#F5F0E8] via-[#F5F0E8]/95 to-transparent z-20">
        <div className="max-w-4xl mx-auto flex gap-3">
          <motion.button
            onClick={() => onRespond(notification.id, false)}
            className="flex-1 py-3.5 px-5 btn-glass flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
          >
            <X className="w-4 h-4" /> 忽略
          </motion.button>
          <motion.button
            onClick={() => onRespond(notification.id, true)}
            className="flex-[2] py-3.5 px-5 btn-primary"
            whileTap={{ scale: 0.97 }}
          >
            <Heart className="w-4 h-4" /> 回应留灯
          </motion.button>
        </div>
      </div>
    </div>
  );
}
