'use client';

import { PRODUCT_PATHS, type ProductType } from '@/lib/productTypes';
import { useId } from 'react';

type ProductHologramProps = {
  type: ProductType;
  active?: boolean;
  colorHex?: string;
  size?: number;
};

export function ProductHologram({ type, active = false, colorHex = '#f7f7f7', size = 46 }: ProductHologramProps) {
  const shineId = useId().replace(/:/g, '');
  const p = PRODUCT_PATHS[type];
  const glow = active ? 'rgba(0,229,200,0.42)' : 'rgba(255,255,255,0.16)';
  const stroke = active ? '#00E5C8' : 'rgba(255,255,255,0.24)';

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span style={{position:'absolute',inset:'17% 12% 8%',borderRadius:'50%',background:`radial-gradient(ellipse,${glow},transparent 68%)`,filter:'blur(7px)',opacity:active?1:0.55}}/>
      <svg
        viewBox={p.viewBox ?? '0 0 200 200'}
        width={size}
        height={size}
        fill="none"
        style={{
          position: 'relative',
          zIndex: 1,
          filter: `drop-shadow(0 10px 16px rgba(0,0,0,0.42)) drop-shadow(0 0 ${active ? 12 : 5}px ${glow})`,
          transform: active ? 'translateY(-1px) scale(1.03)' : 'translateY(0) scale(0.96)',
          transition: 'transform 0.16s ease, filter 0.16s ease',
        }}
      >
        <path d={p.body} fill={colorHex} stroke={stroke} strokeWidth="2"/>
        {p.shadeLeft && <path d={p.shadeLeft} fill="rgba(0,0,0,0.09)"/>}
        {p.shadeRight && <path d={p.shadeRight} fill="rgba(255,255,255,0.08)"/>}
        {p.detail && <path d={p.detail} fill={p.detailFill ?? 'none'} stroke={active ? 'rgba(0,229,200,0.5)' : 'rgba(255,255,255,0.28)'} strokeWidth="2" strokeLinecap="round"/>}
        <path d={p.body} fill={`url(#${shineId})`} opacity="0.18"/>
        <defs>
          <linearGradient id={shineId} x1="34" y1="24" x2="164" y2="188" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.42"/>
            <stop offset="0.48" stopColor="#ffffff" stopOpacity="0.04"/>
            <stop offset="1" stopColor="#00E5C8" stopOpacity={active ? '0.22' : '0.08'}/>
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
