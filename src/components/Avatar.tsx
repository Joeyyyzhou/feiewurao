// 8 色三色渐变（与 demo 一致）
export const AVATAR_GRADIENTS: Record<string, string> = {
  c1: 'linear-gradient(135deg, #f5d6b8 0%, #d8826e 50%, #4a2418 100%)',
  c2: 'linear-gradient(135deg, #f0d6e0 0%, #6a9bc4 50%, #1a2a4a 100%)',
  c3: 'linear-gradient(135deg, #e8d4f0 0%, #9a7bbc 50%, #2a1a4a 100%)',
  c4: 'linear-gradient(135deg, #ffd4cf 0%, #c47888 50%, #4a1a2a 100%)',
  c5: 'linear-gradient(135deg, #e0e8c4 0%, #6aa67d 50%, #1a3a2a 100%)',
  c6: 'linear-gradient(135deg, #f0e0a8 0%, #c48a4a 50%, #4a2a1a 100%)',
  c7: 'linear-gradient(135deg, #d4d8f0 0%, #6a7ac4 50%, #1a1a4a 100%)',
  c8: 'linear-gradient(135deg, #ffd4a8 0%, #c46a4a 50%, #3a1a14 100%)',
};

interface Props {
  color: string;
  size?: number;
  className?: string;
}
export default function Avatar({ color, size = 44, className }: Props) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: AVATAR_GRADIENTS[color] ?? AVATAR_GRADIENTS.c1,
        boxShadow: '0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    />
  );
}
