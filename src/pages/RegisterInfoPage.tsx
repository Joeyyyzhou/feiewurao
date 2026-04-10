import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { BASE_CITIES, AVATAR_COLORS } from '../data/questions';

interface Props { onComplete: (d: { email: string; nickname: string; password: string; gender: 'male'|'female'; baseCity: string; wechatId: string; avatarColor: string }) => void; }

export default function RegisterInfoPage({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male'|'female'|null>(null);
  const [baseCity, setBaseCity] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].value);
  const [error, setError] = useState('');

  const steps = [
    { t: '你的昵称', s: '2-8个字符，这将是你的专属名字' },
    { t: '设置密码', s: '下次登录时使用，至少6位' },
    { t: '性别', s: '选择后不可修改' },
    { t: '工作城市', s: '选择你目前的 Base 地' },
    { t: '微信号', s: '仅在双向匹配成功后对对方可见，加密存储' },
    { t: '头像颜色', s: '你的专属标识' },
  ];

  const validate = () => {
    setError('');
    if (step === 0 && (nickname.trim().length < 2 || nickname.trim().length > 8)) { setError('需要2-8个字符'); return false; }
    if (step === 1 && password.length < 6) { setError('密码至少6位'); return false; }
    if (step === 2 && !gender) { setError('请选择'); return false; }
    if (step === 3 && !baseCity) { setError('请选择城市'); return false; }
    if (step === 4 && !wechatId.trim()) { setError('请输入微信号'); return false; }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete({ email: 'demo@tencent.com', nickname: nickname.trim(), password, gender: gender!, baseCity, wechatId: wechatId.trim(), avatarColor });
  };

  const avatarLetter = nickname.trim()
    ? (/^[a-zA-Z]/.test(nickname.trim()) ? nickname.trim()[0].toUpperCase() : nickname.trim()[0])
    : '?';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 pt-6">
        <div className="w-full h-1.5 rounded-full bg-white/30 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-primary-light to-primary" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="text-xs text-text-muted mt-2 text-right">{step + 1}/{steps.length}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={step} className="w-full max-w-xl" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div className="glass rounded-3xl p-6">
              <h2 className="text-lg font-medium text-text mb-1">{steps[step].t}</h2>
              <p className="text-sm text-text-secondary mb-6">{steps[step].s}</p>

              {/* Step 0: Nickname */}
              {step === 0 && (
                <input type="text" value={nickname} onChange={e => { setNickname(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && next()} placeholder="输入昵称" maxLength={8} autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
              )}

              {/* Step 1: Password */}
              {step === 1 && (
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && next()} placeholder="设置密码" autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
              )}

              {/* Step 2: Gender */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 'male' as const, l: '男生' }, { v: 'female' as const, l: '女生' }].map(g => (
                    <motion.button key={g.v} onClick={() => { setGender(g.v); setError(''); }}
                      className={`py-4 rounded-2xl text-base font-medium transition-all ${gender === g.v ? 'btn-primary' : 'btn-glass'}`}
                      whileTap={{ scale: 0.97 }}>{g.l}</motion.button>
                  ))}
                </div>
              )}

              {/* Step 3: City */}
              {step === 3 && (
                <div className="flex flex-wrap gap-2">
                  {BASE_CITIES.map(c => (
                    <motion.button key={c} onClick={() => setBaseCity(c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${baseCity === c ? 'btn-primary !rounded-full' : 'btn-glass !rounded-full'}`}
                      whileTap={{ scale: 0.95 }}>{c}</motion.button>
                  ))}
                </div>
              )}

              {/* Step 4: WeChat */}
              {step === 4 && (
                <div>
                  <input type="text" value={wechatId} onChange={e => { setWechatId(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && next()} placeholder="输入微信号" autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
                  <div className="mt-3 flex items-start gap-2 px-1">
                    <span className="text-sm shrink-0">🔒</span>
                    <p className="text-xs text-text-muted leading-relaxed">你的微信号经过加密存储，只有双向匹配成功后对方才能看到。</p>
                  </div>
                </div>
              )}

              {/* Step 5: Avatar color */}
              {step === 5 && (
                <div className="flex flex-col items-center gap-6">
                  <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: avatarColor, boxShadow: `0 4px 16px ${avatarColor}30` }}
                    animate={{ backgroundColor: avatarColor }}>{avatarLetter}</motion.div>
                  <div className="grid grid-cols-3 gap-3 justify-items-center">
                    {AVATAR_COLORS.map(c => (
                      <motion.button key={c.value} onClick={() => setAvatarColor(c.value)} whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center gap-1">
                        <div className={`w-12 h-12 rounded-xl transition-all ${avatarColor === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110' : 'opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: c.value }} />
                        <span className="text-[10px] text-text-muted">{c.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {error && <motion.p className="text-danger text-xs mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-start/80 via-bg-start/40 to-transparent backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 0 && (
            <motion.button onClick={() => setStep(step - 1)} className="w-12 h-12 rounded-2xl btn-glass flex items-center justify-center" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button onClick={next} className="flex-1 h-12 rounded-2xl btn-primary flex items-center justify-center gap-2 text-base" whileTap={{ scale: 0.97 }}>
            {step === steps.length - 1 ? <>完成 <Check className="w-4 h-4" /></> : <>下一步 <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
