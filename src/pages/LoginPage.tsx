import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (nickname: string, password: string) => Promise<boolean>;
  onGoRegister: () => void;
}

export default function LoginPage({ onLogin, onGoRegister }: Props) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!nickname.trim()) { setError('请输入昵称'); return; }
    if (!password) { setError('请输入密码'); return; }
    setLoading(true);
    const success = await onLogin(nickname.trim(), password);
    setLoading(false);
    if (!success) { setError('昵称或密码错误'); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-3 select-none">
            <span className="text-3xl">🐧</span>
            <span className="text-2xl">💡</span>
          </div>
          <h1 className="text-2xl font-bold text-text">欢迎回来</h1>
          <p className="text-sm text-text-secondary mt-1">非鹅勿扰 · 不看脸，只听心</p>
        </div>

        <div className="card rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">昵称</label>
            <input type="text" value={nickname} onChange={e => { setNickname(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('pwd')?.focus()}
              placeholder="输入你的昵称" autoFocus
              className="w-full px-4 py-3 rounded-xl input-glass text-base" />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">密码</label>
            <input id="pwd" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="输入密码"
              className="w-full px-4 py-3 rounded-xl input-glass text-base" />
          </div>

          {error && <motion.p className="text-danger text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

          <motion.button onClick={handleLogin} disabled={loading}
            className="w-full py-3.5 rounded-xl btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-50"
            whileTap={{ scale: 0.97 }}>
            {loading ? '登录中...' : <>登录 <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary">
          还没有账号？<button onClick={onGoRegister} className="text-accent hover:underline ml-1">去注册</button>
        </p>
      </motion.div>
    </div>
  );
}
