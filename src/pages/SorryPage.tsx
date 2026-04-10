import { motion } from 'framer-motion';

interface Props { onBack: () => void; }

export default function SorryPage({ onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="text-center max-w-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex justify-center mb-4 text-5xl select-none">
          <span>🐧</span>
          <span className="ml-[-8px]" style={{ filter: 'grayscale(0.8) opacity(0.4)' }}>💡</span>
        </div>
        <h2 className="text-2xl font-bold text-text mb-3">非鹅勿扰</h2>
        <p className="text-text-secondary mb-1">暂不对腾讯以外同事开放 :）</p>
        <p className="text-sm text-text-muted mb-10">期待未来与你相见</p>
        <motion.button onClick={onBack} className="px-8 py-3 rounded-2xl btn-glass text-sm font-medium" whileTap={{ scale: 0.97 }}>返回首页</motion.button>
      </motion.div>
    </div>
  );
}
