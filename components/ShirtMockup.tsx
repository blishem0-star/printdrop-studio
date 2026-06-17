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
  const isLight = ['#fff', '#ffffff', 'white'].includes(colorHex.toLowerCase());
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
        <filter id={`shadow-${id}`} x="-25%" y="-10%" width="150%" height="135%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.32)" />
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        <pattern id={`weave-${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 1.5H6M1.5 0V6" stroke={isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.045)'} strokeWidth="0.35" />
        </pattern>
        <linearGradient id={`fg-${id}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="48%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="black" stopOpacity="0.16" />
        </linearGradient>
        <radialGradient id={`fold-${id}`} cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="72%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.08" />
        </radialGradient>
        <clipPath id={`clip-${id}`}><path d={SHIRT_PATH} /></clipPath>
      </defs>

      <ellipse cx="100" cy="222" rx="60" ry="5" fill="rgba(0,0,0,0.22)" />
      <path d={SHIRT_PATH} fill={colorHex} filter={`url(#shadow-${id})`} />
      <path d={SHIRT_PATH} fill={`url(#fg-${id})`} />
      <path d={SHIRT_PATH} fill={`url(#weave-${id})`} opacity="0.7" />

      {children && <g clipPath={`url(#clip-${id})`}>{children}</g>}

      <path d={SHIRT_PATH} fill={`url(#fold-${id})`} pointerEvents="none" />
      <path d="M56 82 C56 116,55 162,55 204" fill="none" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.8" strokeLinecap="round" />
      <path d="M144 82 C144 116,145 162,145 204" fill="none" stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'} strokeWidth="0.8" strokeLinecap="round" />
      <path d="M54 54 C51 64,53 74,56 82" fill="none" stroke={isLight ? 'rgba(0,0,0,0.11)' : 'rgba(255,255,255,0.13)'} strokeWidth="1" strokeLinecap="round" />
      <path d="M146 54 C149 64,147 74,144 82" fill="none" stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'} strokeWidth="1" strokeLinecap="round" />
      <path d="M27 84 Q36 91,47 92" fill="none" stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.13)'} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M173 84 Q164 91,153 92" fill="none" stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="100" y1="70" x2="100" y2="201" stroke={isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.055)'} strokeWidth="0.7" />
      <path d="M58 203 Q100 211,142 203" fill="none" stroke={isLight ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.13)'} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M73 50 C81 56,91 59,100 59 C109 59,119 56,127 50 C122 66,78 66,73 50 Z" fill={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.22)'} />
      <path d="M77 53 C84 59,92 61,100 61 C108 61,116 59,123 53" fill="none" stroke={isLight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'} strokeWidth="1.2" strokeLinecap="round" />
      <path d={SHIRT_PATH} fill="none" stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.7" />
    </svg>
  );
}
