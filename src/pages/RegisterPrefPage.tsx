import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';

interface Props { gender: 'male'|'female'; onComplete: (p: { prefGender: 'male'|'female'; prefBaseCities: string[] }) => void; }

export default function RegisterPrefPage({ gender, onComplete }: Props) {
  const [pg, setPg] = useState<'male'|'female'>(gender === 'male' ? 'female' : 'male');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div className="w-full max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass rounded-3xl p-6">
          <div className="w-10 h-10 rounded-2xl bg-primary-soft flex items-center justify-center mb-5">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-medium text-text mb-1">设置偏好</h2>
          <p className="text-sm text-text-secondary mb-1">告诉我们你想认识什么样的人</p>
          <p className="text-xs text-danger/70 mb-6">设置后不可修改</p>

          <div className="mb-6">
            <label className="text-sm font-medium text-text mb-2.5 block">想认识</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[{ v: 'male' as const, l: '男生' }, { v: 'female' as const, l: '女生' }].map(g => (
                <button key={g.v} onClick={() => setPg(g.v)}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${pg === g.v ? 'btn-primary' : 'btn-glass'}`}>{g.l}</button>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          onClick={() => onComplete({ prefGender: pg, prefBaseCities: [] })}
          className="w-full mt-4 py-3.5 rounded-2xl btn-primary text-base flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}>
          开始探索 <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
