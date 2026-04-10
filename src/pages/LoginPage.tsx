import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (nickname: string, password: string) => boolean;
  onGoRegister: () => void;
}

export default function LoginPage({ onLogin, onGoRegister }: Props) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberDays, setRememberDays] = useState(30);

  const handleLogin = () => {
    setError('');
    if (!nickname.trim()) { setError('请输入昵称'); return; }
    if (!password) { setError('请输入密码'); return; }
    const success = onLogin(nickname.trim(), password);
    if (!success) { setError('昵称或密码错误'); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-end mb-4 select-none">
            <motion.span className="text-5xl inline-block origin-bottom"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>🐧</motion.span>
            <motion.span className="text-4xl -ml-2 inline-block origin-bottom"
              animate={{ rotate: [-10, 10, -10], y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>💡</motion.span>
          </div>
          <h1 className="text-2xl font-bold text-text">欢迎回来</h1>
          <p className="text-sm text-text-secondary mt-1">非鹅勿扰 · 不看脸，只听心</p>
        </div>

        {/* Login form */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">昵称</label>
            <input type="text" value={nickname} onChange={e => { setNickname(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('pwd')?.focus()}
              placeholder="输入你的昵称" autoFocus
              className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">密码</label>
            <input id="pwd" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="输入密码"
              className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
          </div>

          {/* Remember days */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-text-muted">记住登录状态</span>
            <div className="flex gap-2">
              {[7, 15, 30].map(d => (
                <button key={d} onClick={() => setRememberDays(d)}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${rememberDays === d ? 'bg-primary/15 text-primary font-medium' : 'text-text-muted hover:text-text-secondary'}`}>
                  {d}天
                </button>
              ))}
            </div>
          </div>

          {error && <motion.p className="text-danger text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

          <motion.button onClick={handleLogin}
            className="w-full py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}>
            登录 <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-text-secondary">
          还没有账号？
          <button onClick={onGoRegister} className="text-primary hover:underline ml-1">去注册</button>
        </p>
      </motion.div>
    </div>
  );
}
