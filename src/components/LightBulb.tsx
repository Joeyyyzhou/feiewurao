import { motion } from 'framer-motion';

interface Props {
  isOn: boolean;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function LightBulb({ isOn, size = 32, onClick, disabled = false }: Props) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center cursor-pointer disabled:cursor-default outline-none select-none"
      style={{ fontSize: size }}
      whileTap={disabled ? {} : { scale: 0.85 }}
    >
      {/* Glow behind emoji when on */}
      {isOn && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size * 1.6,
            height: size * 1.6,
            background: 'radial-gradient(circle, rgba(255,220,100,0.3) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className="relative z-10" style={{ filter: isOn ? 'none' : 'grayscale(0.8) opacity(0.4)' }}>
        💡
      </span>
    </motion.button>
  );
}

/** Penguin holding lightbulb — for landing page */
export function PenguinBulb({ size = 64 }: { size?: number }) {
  return (
    <motion.div
      className="relative select-none"
      style={{ fontSize: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
    >
      {/* Warm glow behind */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 2,
          height: size * 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,220,100,0.25) 0%, transparent 65%)',
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative z-10 flex items-end gap-0">
        <span style={{ fontSize: size * 0.85 }}>🐧</span>
        <motion.span
          style={{ fontSize: size * 0.7, marginLeft: -size * 0.2 }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          💡
        </motion.span>
      </div>
    </motion.div>
  );
}
