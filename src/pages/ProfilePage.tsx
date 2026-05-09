import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check, MessageCircle, User, Bell, Heart, LogOut, AlertTriangle, ChevronRight, X, Pencil, Shield } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import type { UserProfile, Answer, LightRecord, MatchRecord } from '../store/mockData';
import { questions as allQ } from '../data/questions';
import { getUserAnswers } from '../lib/api';

interface Props {
  user: UserProfile;
  answers: Answer[];
  lightNotifications: LightRecord[];
  matches: MatchRecord[];
  sentLights?: { nickname: string; avatarColor: string; date: string }[];
  onBack: () => void;
  onViewNotification: (n: LightRecord) => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
  onUpdateProfile?: (fields: { nickname?: string; baseCity?: string; wechatId?: string }) => void;
  onGoAbout?: () => void;
}
type Tab = 'info' | 'answers' | 'lights' | 'matches';

export default function ProfilePage({ user, answers, lightNotifications, matches, sentLights, onBack, onViewNotification, onDeleteAccount, onLogout, onUpdateProfile, onGoAbout }: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [copiedId, setCopiedId] = useState<string|null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewingMatch, setViewingMatch] = useState<{ nickname: string; color: string; answers: { questionId: number; content: string }[] } | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  // Edit state
  const [editing, setEditing] = useState<string | null>(null); // 'nickname' | 'baseCity' | 'wechatId'
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: string, value: string) => {
    setEditing(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editing || !editValue.trim()) return;
    onUpdateProfile?.({ [editing]: editValue.trim() });
    setEditing(null);
    setEditValue('');
  };

  const pending = lightNotifications.filter(n => n.status === 'pending').length;
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'info', label: '信息', icon: <User className="w-4 h-4" /> },
    { key: 'answers', label: '回答', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'lights', label: '留灯', icon: <Bell className="w-4 h-4" />, badge: pending },
    { key: 'matches', label: '匹配', icon: <Heart className="w-4 h-4" /> },
  ];

  const infoFields = [
    { l: '昵称', k: 'nickname', v: user.nickname, editable: true },
    { l: '性别', k: 'gender', v: user.gender === 'male' ? '男' : '女', editable: false },
    { l: '城市', k: 'baseCity', v: user.baseCity, editable: true },
    { l: '微信号', k: 'wechatId', v: user.wechatId, editable: true },
    { l: '想认识', k: 'prefGender', v: user.prefGender === 'male' ? '男生' : '女生', editable: false },
  ];

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/20 transition-colors"><ArrowLeft className="w-5 h-5 text-text" /></button>
          <span className="font-semibold text-text">个人中心</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
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
          {/* === INFO TAB === */}
          {tab === 'info' && <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {infoFields.map(item => (
              <div key={item.l} className="glass rounded-2xl px-4 py-3.5 flex justify-between items-center">
                <span className="text-sm text-text-secondary">{item.l}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text">{item.v}</span>
                  {item.editable && (
                    <button onClick={() => startEdit(item.k, typeof item.v === 'string' ? item.v : '')}
                      className="p-1 text-text-muted hover:text-primary transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Privacy note */}
            <div className="rounded-2xl bg-primary-soft px-4 py-3 flex items-start gap-2.5 mt-3">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary-dark leading-relaxed">
                你的微信号经过加密存储，仅在双向匹配成功后对匹配对象可见。性别和偏好注册后不可修改。
              </p>
            </div>

            <p className="text-[11px] text-text-muted text-center pt-1">性别和偏好不可修改，其他信息点击 ✏️ 编辑</p>

            {/* About / Logout / Delete */}
            <div className="pt-8 pb-4 space-y-2">
              {onGoAbout && (
                <button onClick={onGoAbout}
                  className="w-full py-3 rounded-2xl text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-alt transition-all flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" /> 关于非鹅勿扰
                </button>
              )}
              <button onClick={onLogout}
                className="w-full py-3 rounded-2xl text-sm font-medium text-text-secondary hover:text-text hover:bg-surface-alt transition-all flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> 退出登录
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 rounded-2xl text-sm font-medium text-danger/70 hover:text-danger hover:bg-danger/5 transition-all flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 注销账号
              </button>
            </div>

            {/* Edit modal */}
            <AnimatePresence>
              {editing && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
                  <motion.div className="rounded-2xl p-6 max-w-sm w-full relative z-10 bg-white border border-border shadow-xl"
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                    <h3 className="text-base font-bold text-text mb-4">
                      修改{editing === 'nickname' ? '昵称' : editing === 'baseCity' ? '城市' : '微信号'}
                    </h3>
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl input-glass text-sm"
                      placeholder={`请输入新的${editing === 'nickname' ? '昵称' : editing === 'baseCity' ? '城市' : '微信号'}`}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    />
                    {editing === 'wechatId' && (
                      <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1">
                        🔒 加密存储，仅匹配对象可见
                      </p>
                    )}
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl btn-glass text-sm">取消</button>
                      <button onClick={saveEdit} disabled={!editValue.trim()} className="flex-1 py-3 rounded-xl btn-primary text-sm disabled:opacity-30">保存</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
                  <motion.div className="rounded-2xl p-6 max-w-sm w-full relative z-10 bg-white border border-border shadow-xl"
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
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl btn-glass text-sm font-medium">取消</button>
                      <button onClick={() => { setShowDeleteConfirm(false); onDeleteAccount(); }}
                        className="flex-1 py-3 rounded-2xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-all">确认注销</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>}

          {/* === ANSWERS TAB === */}
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

          {/* === LIGHTS TAB (received + sent) === */}
          {tab === 'lights' && <motion.div key="lights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            <div className="rounded-2xl bg-primary-soft px-4 py-3 flex items-center gap-2.5 mb-1">
              <span className="text-base">📧</span>
              <p className="text-xs text-primary-dark">有人对你留灯时，我们会发邮件到你的企业邮箱提醒你</p>
            </div>

            {/* Received lights */}
            {lightNotifications.length > 0 && (
              <p className="text-xs font-medium text-text-secondary pt-2 pb-1">收到的留灯</p>
            )}
            {lightNotifications.length === 0 && (!sentLights || sentLights.length === 0) && (
              <p className="text-center py-12 text-text-secondary text-sm">暂无留灯记录</p>
            )}
            {lightNotifications.map(n => (
              <motion.div key={n.id} onClick={() => n.status === 'pending' && onViewNotification(n)}
                className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all ${n.status === 'pending' ? 'cursor-pointer glass-hover border-l-4 border-l-gold' : 'opacity-50'}`}>
                <Avatar nickname={n.fromUser.nickname} color={n.fromUser.avatarColor} size={40} />
                <div className="flex-1"><p className="text-sm font-medium text-text">{n.fromUser.nickname}</p><p className="text-[11px] text-text-muted">{new Date(n.createdAt).toLocaleDateString('zh-CN')}</p></div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${n.status === 'pending' ? 'bg-amber-100 text-amber-600' : n.status === 'matched' ? 'bg-green-100 text-green-600' : 'bg-surface-alt text-text-muted'}`}>
                  {n.status === 'pending' ? '待回应' : n.status === 'matched' ? '已匹配' : n.status === 'ignored' ? '已忽略' : '已过期'}
                </span>
              </motion.div>
            ))}

            {/* Sent lights */}
            {sentLights && sentLights.length > 0 && (
              <>
                <p className="text-xs font-medium text-text-secondary pt-4 pb-1">我留灯的</p>
                {sentLights.map((s, i) => (
                  <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4 opacity-70">
                    <Avatar nickname={s.nickname} color={s.avatarColor} size={40} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{s.nickname}</p>
                      <p className="text-[11px] text-text-muted">{new Date(s.date).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-500">
                      💡 已留灯
                    </span>
                  </div>
                ))}
              </>
            )}
          </motion.div>}

          {/* === MATCHES TAB === */}
          {tab === 'matches' && <motion.div key="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {matches.length === 0 ? <p className="text-center py-12 text-text-secondary text-sm">还没有匹配</p> :
              matches.map(m => (
                <motion.div key={m.id} className="glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-hover transition-all"
                  onClick={async () => {
                    if (!m.userId) return;
                    setLoadingAnswers(true);
                    const ans = await getUserAnswers(m.userId);
                    setViewingMatch({ nickname: m.user.nickname, color: m.user.avatarColor, answers: ans });
                    setLoadingAnswers(false);
                  }}
                  whileTap={{ scale: 0.98 }}>
                  <Avatar nickname={m.user.nickname} color={m.user.avatarColor} size={40} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">{m.user.nickname}</p>
                    <p className="text-[11px] text-text-muted">{new Date(m.matchedAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text">{m.wechatId}</span>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(m.wechatId); setCopiedId(m.id); setTimeout(() => setCopiedId(null), 2000); }}
                      className={`p-1.5 rounded-xl transition-all ${copiedId === m.id ? 'bg-green-100 text-success' : 'btn-glass'}`}>
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </motion.div>
              ))}

            {/* Match answer detail modal */}
            <AnimatePresence>
              {viewingMatch && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/40" onClick={() => setViewingMatch(null)} />
                  <motion.div className="rounded-2xl p-6 max-w-md w-full relative z-10 max-h-[80vh] overflow-y-auto bg-white border border-border shadow-xl"
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <Avatar nickname={viewingMatch.nickname} color={viewingMatch.color} size={40} />
                        <div>
                          <h3 className="text-base font-bold text-text">{viewingMatch.nickname} 的回答</h3>
                          <p className="text-xs text-text-muted">你们匹配成功时看到的问题</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingMatch(null)} className="p-1 text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
                    </div>
                    {viewingMatch.answers.length === 0 ? (
                      <p className="text-sm text-text-muted text-center py-8">暂无回答记录</p>
                    ) : (
                      <div className="space-y-3">
                        {viewingMatch.answers.slice(0, 8).map((a, i) => {
                          const q = allQ.find(x => x.id === a.questionId);
                          return (
                            <div key={i} className="bg-surface-alt rounded-xl p-3">
                              <p className="text-xs text-accent mb-1">第 {i + 1} 题</p>
                              <p className="text-sm font-medium text-text mb-1.5">{q?.content || `问题 #${a.questionId}`}</p>
                              <p className="text-sm text-text-secondary leading-relaxed">{a.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {loadingAnswers && <p className="text-center text-xs text-text-muted py-2">加载中...</p>}
          </motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}
