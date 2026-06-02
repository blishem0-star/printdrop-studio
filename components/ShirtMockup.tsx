import React from 'react';

type Props = {
  colorHex: string;
  size?: number;           // viewBox size, default 200
  children?: React.ReactNode; // design content rendered on the shirt
  className?: string;
  style?: React.CSSProperties;
};

export default function ShirtMockup({ colorHex, size = 200, children, className, style }: Props) {
  const id = React.useId().replace(/:/g, '');
  const s = size;
  const cx = s / 2;

  // Scale factor relative to original 200px viewBox
  const sc = s / 200;

  return (
    <svg
      viewBox={`0 0 ${s} ${s}`}
      width={s}
      height={s}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* Fabric gradient — gives the shirt dimension */}
        <linearGradient id={`fg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.12" />
          <stop offset="40%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="black" stopOpacity="0.18" />
        </linearGradient>
        {/* Subtle fold highlight */}
        <linearGradient id={`fold-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="black" stopOpacity="0.08" />
        </linearGradient>
        {/* Collar shadow */}
        <radialGradient id={`collar-${id}`} cx="50%" cy="0%" r="50%">
          <stop offset="0%" stopColor="black" stopOpacity="0.25" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <path d={`M${30*sc} ${58*sc} C${18*sc} ${65*sc},${2*sc} ${79*sc},${2*sc} ${82*sc} L${26*sc} ${97*sc} C${23*sc} ${140*sc},${21*sc} ${182*sc},${21*sc} ${221*sc} L${179*sc} ${221*sc} C${179*sc} ${182*sc},${177*sc} ${140*sc},${174*sc} ${97*sc} L${198*sc} ${82*sc} C${198*sc} ${79*sc},${182*sc} ${65*sc},${170*sc} ${58*sc} L${144*sc} ${72*sc} Q${130*sc} ${28*sc},${100*sc} ${26*sc} Q${70*sc} ${28*sc},${56*sc} ${72*sc} Z`} />
        </clipPath>
      </defs>

      {/* Base shirt */}
      <path
        d={`M${30*sc} ${58*sc} C${18*sc} ${65*sc},${2*sc} ${79*sc},${2*sc} ${82*sc} L${26*sc} ${97*sc} C${23*sc} ${140*sc},${21*sc} ${182*sc},${21*sc} ${221*sc} L${179*sc} ${221*sc} C${179*sc} ${182*sc},${177*sc} ${140*sc},${174*sc} ${97*sc} L${198*sc} ${82*sc} C${198*sc} ${79*sc},${182*sc} ${65*sc},${170*sc} ${58*sc} L${144*sc} ${72*sc} Q${130*sc} ${28*sc},${100*sc} ${26*sc} Q${70*sc} ${28*sc},${56*sc} ${72*sc} Z`}
        fill={colorHex}
      />
      {/* Fabric sheen */}
      <path
        d={`M${30*sc} ${58*sc} C${18*sc} ${65*sc},${2*sc} ${79*sc},${2*sc} ${82*sc} L${26*sc} ${97*sc} C${23*sc} ${140*sc},${21*sc} ${182*sc},${21*sc} ${221*sc} L${179*sc} ${221*sc} C${179*sc} ${182*sc},${177*sc} ${140*sc},${174*sc} ${97*sc} L${198*sc} ${82*sc} C${198*sc} ${79*sc},${182*sc} ${65*sc},${170*sc} ${58*sc} L${144*sc} ${72*sc} Q${130*sc} ${28*sc},${100*sc} ${26*sc} Q${70*sc} ${28*sc},${56*sc} ${72*sc} Z`}
        fill={`url(#fg-${id})`}
      />
      {/* Fold */}
      <path
        d={`M${30*sc} ${58*sc} C${18*sc} ${65*sc},${2*sc} ${79*sc},${2*sc} ${82*sc} L${26*sc} ${97*sc} C${23*sc} ${140*sc},${21*sc} ${182*sc},${21*sc} ${221*sc} L${179*sc} ${221*sc} C${179*sc} ${182*sc},${177*sc} ${140*sc},${174*sc} ${97*sc} L${198*sc} ${82*sc} C${198*sc} ${79*sc},${182*sc} ${65*sc},${170*sc} ${58*sc} L${144*sc} ${72*sc} Q${130*sc} ${28*sc},${100*sc} ${26*sc} Q${70*sc} ${28*sc},${56*sc} ${72*sc} Z`}
        fill={`url(#fold-${id})`}
      />
      {/* Collar shadow */}
      <ellipse cx={`${cx}`} cy={`${31*sc}`} rx={`${26*sc}`} ry={`${10*sc}`} fill={`url(#collar-${id})`} />

      {/* Design slot — clipped to shirt */}
      {children && (
        <g clipPath={`url(#clip-${id})`}>
          {children}
        </g>
      )}
    </svg>
  );
}
