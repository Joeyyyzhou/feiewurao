import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, KeyRound, RotateCw } from 'lucide-react';

interface Props {
  phase: 'verify' | 'verify-sent';
  onSendCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  onVerifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
}

export default function VerifyPage({ phase, onSendCode, onVerifyCode }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSend = async () => {
    const t = email.trim().toLowerCase();
    if (!t) { setError('请输入邮箱'); return; }
    if (!t.endsWith('@tencent.com')) { setError('请输入 @tencent.com 邮箱'); return; }
    setError('');
    setSending(true);
    const res = await onSendCode(t);
    setSending(false);
    if (!res.success) {
      setError(res.error || '发送失败，请重试');
    } else {
      setCountdown(60);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setSending(true);
    const res = await onSendCode(email.trim().toLowerCase());
    setSending(false);
    if (res.success) {
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      setError('');
    } else {
      setError(res.error || '发送失败');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (codeStr: string) => {
    setVerifying(true);
    setError('');
    const res = await onVerifyCode(email.trim().toLowerCase(), codeStr);
    setVerifying(false);
    if (!res.success) {
      setError(res.error || '验证码错误，请重试');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
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
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="name@tencent.com" autoFocus
                className="w-full px-4 py-3.5 rounded-2xl input-glass text-base" />
              {error && <motion.p className="text-danger text-xs mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
              <motion.button onClick={handleSend} disabled={sending}
                className="w-full mt-4 py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}>
                {sending ? '发送中...' : <>发送验证码 <ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="code" className="w-full max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-3xl p-7">
              <div className="w-11 h-11 rounded-2xl bg-primary-soft flex items-center justify-center mb-5">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text mb-1">输入验证码</h2>
              <p className="text-sm text-text-secondary mb-1">6 位验证码已发送至</p>
              <p className="text-sm font-medium text-primary mb-6">{email}</p>

              {/* 6-digit code input */}
              <div className="flex gap-2.5 justify-center mb-4" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    autoFocus={i === 0}
                    className={`w-11 h-13 text-center text-xl font-bold rounded-xl input-glass transition-all ${
                      digit ? 'border-primary bg-primary-soft/30' : ''
                    }`}
                  />
                ))}
              </div>

              {error && <motion.p className="text-danger text-xs text-center mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-text-muted text-sm mb-3">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  验证中...
                </div>
              )}

              {/* Resend */}
              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={countdown > 0 || sending}
                  className="text-sm text-text-secondary hover:text-primary transition-colors disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {countdown > 0 ? `${countdown}s 后可重新发送` : '重新发送验证码'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
