import React from 'react';

type Props = {
  colorHex: string;
  size?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const FRONT_MOCKUP = '/mockups/tshirt-front.png';

export default function ShirtMockup({ colorHex, size = 200, children, className, style }: Props) {
  const isWhite = ['#fff', '#ffffff', 'white'].includes(colorHex.toLowerCase());
  const id = React.useId().replace(/:/g, '');
  const tintId = `shirtTint-${id}`;
  const shadowId = `shirtShadow-${id}`;
  const blurId = `shirtFloorBlur-${id}`;

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: Math.round(size * 1.15),
        aspectRatio: '200 / 230',
        filter: 'drop-shadow(0 18px 32px rgba(0,0,0,0.45))',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 200 230"
        width="100%"
        height="100%"
        focusable="false"
        style={{ display: 'block', overflow: 'visible', userSelect: 'none' }}
      >
        <defs>
          <filter id={shadowId} x="-30%" y="-10%" width="160%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="rgba(0,0,0,0.42)" />
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.24)" />
          </filter>
          <filter id={blurId}>
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={tintId} colorInterpolationFilters="sRGB">
            <feFlood floodColor={colorHex} result="tint" />
            <feComposite in="tint" in2="SourceAlpha" operator="in" result="color" />
            <feBlend in="SourceGraphic" in2="color" mode="multiply" />
          </filter>
        </defs>
        <ellipse cx="100" cy="216" rx="58" ry="7" fill="rgba(0,0,0,0.25)" filter={`url(#${blurId})`} />
        <image
          href={FRONT_MOCKUP}
          x="2"
          y="14"
          width="196"
          height="196"
          preserveAspectRatio="xMidYMid meet"
          filter={isWhite ? `url(#${shadowId})` : `url(#${tintId})`}
        />
      </svg>
      {children && (
        <div style={{ position: 'absolute', left: '28%', top: '35.65%', width: '44%', height: '56.5%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}
