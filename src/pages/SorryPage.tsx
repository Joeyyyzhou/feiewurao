import { motion } from 'framer-motion';

interface Props { onBack: () => void; }

export default function SorryPage({ onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="text-center max-w-md"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-4xl mb-6 select-none" style={{ filter: 'grayscale(0.6) opacity(0.5)' }}>🐧💡</div>
        <h2 className="text-2xl font-bold text-text mb-3">非鹅勿扰</h2>
        <p className="text-text-secondary leading-relaxed mb-8">
          目前仅对腾讯在职员工开放，感谢你的关注。
          <br />期待未来有机会见面 :)
        </p>
        <motion.button onClick={onBack}
          className="py-3 px-8 rounded-xl btn-glass text-sm"
          whileTap={{ scale: 0.97 }}>
          ← 返回
        </motion.button>
      </motion.div>
    </div>
  );
}
