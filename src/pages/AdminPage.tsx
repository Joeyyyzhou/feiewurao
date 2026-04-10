import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Eye, Heart, Zap, Search } from 'lucide-react';
import { getPV, getUserCount, getUsers, getLightActions, getMatches, getDailyPV } from '../store/stats';
import type { RegisteredUser } from '../store/stats';
import { Avatar } from '../components/Avatar';

interface Props { onBack: () => void; }

export default function AdminPage({ onBack }: Props) {
  const [tab, setTab] = useState<'overview' | 'users' | 'activity'>('overview');
  const [search, setSearch] = useState('');

  const pv = getPV();
  const userCount = getUserCount();
  const users = getUsers();
  const lights = getLightActions();
  const matches = getMatches();
  const dailyPV = getDailyPV();

  // Stats cards data
  const stats = [
    { label: '总访问量', value: pv, icon: Eye, color: 'bg-blue-100 text-blue-600' },
    { label: '注册用户', value: userCount, icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: '留灯操作', value: lights.length, icon: Zap, color: 'bg-amber-100 text-amber-600' },
    { label: '成功匹配', value: matches.length, icon: Heart, color: 'bg-pink-100 text-pink-600' },
  ];

  // Gender distribution
  const genderStats = useMemo(() => {
    const m = users.filter(u => u.gender === 'male').length;
    const f = users.filter(u => u.gender === 'female').length;
    return { male: m, female: f, total: m + f };
  }, [users]);

  // City distribution
  const cityStats = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach(u => { map[u.baseCity] = (map[u.baseCity] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [users]);

  // Daily PV for simple bar chart
  const pvDays = useMemo(() => {
    const entries = Object.entries(dailyPV).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
    const max = Math.max(...entries.map(e => e[1]), 1);
    return entries.map(([date, count]) => ({ date: date.slice(5), count, pct: (count / max) * 100 }));
  }, [dailyPV]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.nickname.toLowerCase().includes(q) || u.baseCity.includes(q));
  }, [users, search]);

  const tabs = [
    { key: 'overview' as const, label: '数据概览' },
    { key: 'users' as const, label: '用户列表' },
    { key: 'activity' as const, label: '操作日志' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3FA]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/60 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text">管理后台</h1>
            <p className="text-xs text-text-muted">非鹅勿扰 · 运营数据</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-6 flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                tab === t.key ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-text'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* ---- Overview ---- */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 border border-border-subtle">
                  <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                    <s.icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-2xl font-bold text-text tabular-nums">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* PV trend */}
            <div className="bg-white rounded-2xl p-5 border border-border-subtle">
              <h3 className="text-sm font-bold text-text mb-4">近 7 日访问趋势</h3>
              {pvDays.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">暂无数据</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {pvDays.map(d => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-secondary font-medium">{d.count}</span>
                      <div className="w-full rounded-t-lg bg-primary/20 relative" style={{ height: `${Math.max(d.pct, 5)}%` }}>
                        <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-primary" style={{ height: '100%' }} />
                      </div>
                      <span className="text-[10px] text-text-muted">{d.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gender + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Gender */}
              <div className="bg-white rounded-2xl p-5 border border-border-subtle">
                <h3 className="text-sm font-bold text-text mb-4">性别分布</h3>
                {genderStats.total === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">男生</span>
                        <span className="font-medium text-text">{genderStats.male}</span>
                      </div>
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(genderStats.male / genderStats.total) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">女生</span>
                        <span className="font-medium text-text">{genderStats.female}</span>
                      </div>
                      <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${(genderStats.female / genderStats.total) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* City */}
              <div className="bg-white rounded-2xl p-5 border border-border-subtle">
                <h3 className="text-sm font-bold text-text mb-4">城市分布</h3>
                {cityStats.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">暂无数据</p>
                ) : (
                  <div className="space-y-2">
                    {cityStats.slice(0, 6).map(([city, count]) => (
                      <div key={city} className="flex items-center justify-between">
                        <span className="text-sm text-text">{city}</span>
                        <span className="text-sm font-medium text-primary tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- Users ---- */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="搜索昵称或城市..."
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-border-subtle text-sm text-text placeholder:text-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* User count */}
            <p className="text-xs text-text-muted">共 {filteredUsers.length} 位用户</p>

            {/* User list */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-border-subtle">
                  <p className="text-sm text-text-muted">暂无注册用户</p>
                </div>
              ) : (
                filteredUsers.map((u: RegisteredUser) => (
                  <div key={u.id} className="bg-white rounded-2xl p-4 border border-border-subtle flex items-center gap-4">
                    <Avatar nickname={u.nickname} color={u.avatarColor} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text">{u.nickname}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-soft text-primary font-medium">#{u.orderNum}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {u.gender === 'male' ? '男' : '女'} · {u.baseCity} · {new Date(u.registeredAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ---- Activity ---- */}
        {tab === 'activity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-text-muted">共 {lights.length + matches.length} 条记录</p>
            {lights.length === 0 && matches.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-border-subtle">
                <p className="text-sm text-text-muted">暂无操作记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Matches first */}
                {matches.map((m, i) => (
                  <div key={`m-${i}`} className="bg-white rounded-2xl p-4 border border-border-subtle flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text"><span className="font-medium">{m.user1}</span> 与 <span className="font-medium">{m.user2}</span> 匹配成功</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{new Date(m.matchedAt).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                ))}
                {/* Light actions */}
                {lights.slice().reverse().slice(0, 50).map((l, i) => (
                  <div key={`l-${i}`} className="bg-white rounded-2xl p-4 border border-border-subtle flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${l.action === 'on' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text">
                        <span className="font-medium">{l.fromUser}</span>
                        {l.action === 'off' ? ' 灭灯了 ' : ' 留灯了 '}
                        <span className="font-medium">{l.toUser}</span>
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">{new Date(l.timestamp).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
