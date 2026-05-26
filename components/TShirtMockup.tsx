'use client';

type Props = {
  color?: string;
  textColor?: string;
  label?: string;
  emoji?: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function TShirtMockup({ color = '#0d0d0d', textColor = '#fff', label, emoji, size = 'md' }: Props) {
  const dims = { sm: 140, md: 200, lg: 280 };
  const w = dims[size];
  const h = w * 1.15;

  return (
    <svg width={w} height={h} viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.5)" />
        </filter>
        <linearGradient id="shirtGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="highlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* T-shirt body */}
      <path
        d="M30 55 L0 80 L25 95 L20 220 L180 220 L175 95 L200 80 L170 55 L145 70 Q130 30 100 28 Q70 30 55 70 Z"
        fill="url(#shirtGrad)"
        filter="url(#shadow)"
      />
      {/* Collar */}
      <path
        d="M55 70 Q70 50 100 48 Q130 50 145 70 Q130 58 100 56 Q70 58 55 70 Z"
        fill="rgba(0,0,0,0.2)"
      />
      {/* Highlight */}
      <path
        d="M30 55 L55 70 Q70 50 100 48 Q130 50 145 70 L170 55 Q145 30 100 28 Q55 30 30 55 Z"
        fill="url(#highlight)"
      />
      {/* Sleeve folds */}
      <line x1="25" y1="95" x2="30" y2="55" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <line x1="175" y1="95" x2="170" y2="55" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />

      {/* Design area */}
      {emoji && (
        <text x="100" y="140" textAnchor="middle" fontSize="42" dominantBaseline="middle">
          {emoji}
        </text>
      )}
      {label && (
        <text x="100" y={emoji ? 168 : 145} textAnchor="middle" fontSize="12"
          fill={textColor} fontFamily="system-ui, sans-serif" fontWeight="700"
          letterSpacing="1" dominantBaseline="middle" opacity="0.9">
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  );
}
