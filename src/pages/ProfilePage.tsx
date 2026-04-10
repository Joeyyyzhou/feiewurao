import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check, MessageCircle, User, Bell, Heart, LogOut, AlertTriangle } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import type { UserProfile, Answer, LightRecord, MatchRecord } from '../store/mockData';
import { questions as allQ } from '../data/questions';

interface Props { user: UserProfile; answers: Answer[]; lightNotifications: LightRecord[]; matches: MatchRecord[]; onBack: () => void; onViewNotification: (n: LightRecord) => void; onDeleteAccount: () => void; onLogout: () => void; }
type Tab = 'info' | 'answers' | 'lights' | 'matches';

export default function ProfilePage({ user, answers, lightNotifications, matches, onBack, onViewNotification, onDeleteAccount, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [copiedId, setCopiedId] = useState<string|null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pending = lightNotifications.filter(n => n.status === 'pending').length;
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'info', label: '信息', icon: <User className="w-4 h-4" /> },
    { key: 'answers', label: '回答', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'lights', label: '留灯', icon: <Bell className="w-4 h-4" />, badge: pending },
    { key: 'matches', label: '匹配', icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 backdrop-blur-lg bg-bg-start/60 border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/20 transition-colors"><ArrowLeft className="w-5 h-5 text-text" /></button>
          <span className="font-semibold text-text">个人中心</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="glass rounded-3xl p-5 flex items-center gap-4">
          <Avatar nickname={user.nickname} color={user.avatarColor} size={52} />
          <div><h2 className="text-lg font-bold text-text">{user.nickname}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{user.gender === 'male' ? '男' : '女'} · {user.baseCity} · 第{user.dayCount}天</p>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 mt-5">
        <div className="flex glass rounded-2xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all relative ${tab === t.key ? 'btn-primary !shadow-sm' : 'text-text-secondary hover:text-text'}`}>
              {t.icon}{t.label}
              {t.badge && t.badge > 0 && <span className={`absolute -top-1 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${tab === t.key ? 'bg-white text-primary' : 'bg-danger text-white'}`}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-5 pb-20">
        <AnimatePresence mode="wait">
          {tab === 'info' && <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {[{ l: '昵称', v: user.nickname }, { l: '性别', v: user.gender === 'male' ? '男' : '女' }, { l: '城市', v: user.baseCity }, { l: '微信号', v: user.wechatId }, { l: '想认识', v: user.prefGender === 'male' ? '男生' : '女生' }].map(item => (
              <div key={item.l} className="glass rounded-2xl px-4 py-3.5 flex justify-between"><span className="text-sm text-text-secondary">{item.l}</span><span className="text-sm font-medium text-text">{item.v}</span></div>
            ))}
            <p className="text-[11px] text-text-muted text-center pt-2">注册后不可修改</p>

            {/* Logout & Delete */}
            <div className="pt-8 pb-4 space-y-2">
              <button onClick={onLogout}
                className="w-full py-3 rounded-2xl text-sm font-medium text-text-secondary hover:text-text hover:bg-white/30 transition-all flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> 退出登录
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 rounded-2xl text-sm font-medium text-danger/70 hover:text-danger hover:bg-danger/5 transition-all flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 注销账号
              </button>
            </div>

            {/* Delete confirmation modal */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                  <motion.div className="glass rounded-3xl p-6 max-w-sm w-full relative z-10"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-danger/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text">确认注销账号？</h3>
                        <p className="text-xs text-text-secondary mt-0.5">此操作不可撤销</p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                      注销后，你的所有数据（个人信息、回答记录、匹配记录）将被永久删除，无法恢复。
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 rounded-2xl btn-glass text-sm font-medium">取消</button>
                      <button onClick={() => { setShowDeleteConfirm(false); onDeleteAccount(); }}
                        className="flex-1 py-3 rounded-2xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-all">确认注销</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>}

          {tab === 'answers' && <motion.div key="ans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {answers.length === 0 ? <p className="text-center py-12 text-text-secondary text-sm">还没有回答</p> :
              answers.map((a, idx) => { const aq = allQ.find(q => q.id === a.questionId); return (
                <div key={a.questionId} className="glass rounded-2xl p-4">
                  <span className="text-xs text-primary font-medium">第 {idx + 1} 题</span>
                  <p className="text-sm font-medium text-text mt-1 mb-2">{aq?.content}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{a.content}</p>
                </div>
              ); })}
            <p className="text-[11px] text-text-muted text-center pt-2">历史回答不可编辑</p>
          </motion.div>}

          {tab === 'lights' && <motion.div key="lights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {/* Email notification hint */}
            <div className="rounded-2xl bg-primary-soft px-4 py-3 flex items-center gap-2.5 mb-1">
              <span className="text-base">📧</span>
              <p className="text-xs text-primary-dark">有人对你留灯时，我们会发邮件到你的企业邮箱提醒你</p>
            </div>
            {lightNotifications.length === 0 ? <p className="text-center py-12 text-text-secondary text-sm">暂无通知</p> :
              lightNotifications.map(n => (
                <motion.div key={n.id} onClick={() => n.status === 'pending' && onViewNotification(n)}
                  className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all ${n.status === 'pending' ? 'cursor-pointer glass-hover border-l-4 border-l-gold' : 'opacity-50'}`}>
                  <Avatar nickname={n.fromUser.nickname} color={n.fromUser.avatarColor} size={40} />
                  <div className="flex-1"><p className="text-sm font-medium text-text">{n.fromUser.nickname}</p><p className="text-[11px] text-text-muted">{new Date(n.createdAt).toLocaleDateString('zh-CN')}</p></div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${n.status === 'pending' ? 'bg-amber-100 text-amber-600' : n.status === 'matched' ? 'bg-green-100 text-green-600' : 'bg-white/30 text-text-muted'}`}>
                    {n.status === 'pending' ? '待回应' : n.status === 'matched' ? '已匹配' : n.status === 'ignored' ? '已忽略' : '已过期'}
                  </span>
                </motion.div>
              ))}
          </motion.div>}

          {tab === 'matches' && <motion.div key="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {matches.length === 0 ? <p className="text-center py-12 text-text-secondary text-sm">还没有匹配</p> :
              matches.map(m => (
                <div key={m.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                  <Avatar nickname={m.user.nickname} color={m.user.avatarColor} size={40} />
                  <div className="flex-1"><p className="text-sm font-medium text-text">{m.user.nickname}</p><p className="text-[11px] text-text-muted">{new Date(m.matchedAt).toLocaleDateString('zh-CN')}</p></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text">{m.wechatId}</span>
                    <button onClick={() => { navigator.clipboard.writeText(m.wechatId); setCopiedId(m.id); setTimeout(() => setCopiedId(null), 2000); }}
                      className={`p-1.5 rounded-xl transition-all ${copiedId === m.id ? 'bg-green-100 text-success' : 'btn-glass'}`}>
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
          </motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}
