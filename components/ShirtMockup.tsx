import React from 'react';
import { SHIRT_PATH } from '@/lib/studio/constants';

type Props = {
  colorHex: string;
  size?: number;              // rendered width in px (height scales 1.15x)
  children?: React.ReactNode; // optional design content, clipped to the shirt
  className?: string;
  style?: React.CSSProperties;
};

// Blank tee mockup — shares the single SHIRT_PATH source of truth (lib/studio/constants)
// drawn in the native 200x230 coordinate space and scaled via viewBox.
export default function ShirtMockup({ colorHex, size = 200, children, className, style }: Props) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 200 230"
      width={size}
      height={Math.round(size * 1.15)}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* Fabric shading for dimension */}
        <linearGradient id={`fg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.12" />
          <stop offset="40%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="black" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={`fold-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="black" stopOpacity="0.08" />
        </linearGradient>
        <clipPath id={`clip-${id}`}><path d={SHIRT_PATH} /></clipPath>
      </defs>

      <path d={SHIRT_PATH} fill={colorHex} />
      <path d={SHIRT_PATH} fill={`url(#fg-${id})`} />
      <path d={SHIRT_PATH} fill={`url(#fold-${id})`} />
      {/* Crew-neck collar rib */}
      <path d="M74 52 Q100 64,126 52 Q100 58,74 52 Z" fill="rgba(0,0,0,0.13)" />

      {children && <g clipPath={`url(#clip-${id})`}>{children}</g>}
    </svg>
  );
}
