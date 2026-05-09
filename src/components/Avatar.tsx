interface Props { nickname: string; color: string; size?: number; className?: string; }

export function Avatar({ nickname, color, size = 44, className = '' }: Props) {
  const letter = /^[a-zA-Z]/.test(nickname) ? nickname[0].toUpperCase() : nickname[0];
  return (
    <div className={`rounded-xl flex items-center justify-center text-white font-semibold select-none shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}
