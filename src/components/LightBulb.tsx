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
      <span className="relative z-10" style={{ filter: isOn ? 'none' : 'grayscale(0.8) opacity(0.4)' }}>
        💡
      </span>
    </motion.button>
  );
}

/** Penguin holding lightbulb — for landing page (simplified) */
export function PenguinBulb({ size = 64 }: { size?: number }) {
  return (
    <div className="select-none" style={{ fontSize: size }}>
      <div className="flex items-end gap-0">
        <span style={{ fontSize: size * 0.85 }}>🐧</span>
        <span style={{ fontSize: size * 0.7, marginLeft: -size * 0.2 }}>💡</span>
      </div>
    </div>
  );
}
