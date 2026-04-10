import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Mail } from 'lucide-react';

interface Props { onVerify: (email: string) => void; phase: 'verify' | 'verify-sent'; }

export default function VerifyPage({ onVerify, phase }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = () => {
    const t = email.trim().toLowerCase();
    if (!t) { setError('请输入邮箱'); return; }
    if (!t.endsWith('@tencent.com')) { setError('请输入 @tencent.com 邮箱'); return; }
    setError(''); onVerify(t);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {phase === 'verify' ? (
          <motion.div key="input" className="w-full max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass rounded-3xl p-7">
              <div className="w-11 h-11 rounded-2xl bg-primary-soft flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text mb-1">验证身份</h2>
              <p className="text-sm text-text-secondary mb-6">输入你的腾讯企业邮箱</p>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="name@tencent.com" autoFocus
                className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
              {error && <motion.p className="text-danger text-xs mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
              <motion.button onClick={handleSubmit}
                className="w-full mt-4 py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}>发送验证邮件 <ArrowRight className="w-4 h-4" /></motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="sent" className="w-full max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-3xl p-7 text-center">
              <motion.div className="w-11 h-11 mx-auto rounded-2xl bg-green-100 flex items-center justify-center mb-5"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <Check className="w-5 h-5 text-success" />
              </motion.div>
              <h2 className="text-xl font-bold text-text mb-1">邮件已发送</h2>
              <p className="text-sm text-text-secondary mb-1">已发送至</p>
              <p className="text-sm font-medium text-text mb-6">{email}</p>
              <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
                <motion.span className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
                等待验证中...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
