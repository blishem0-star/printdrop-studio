import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'STYLX.AI — Describe it. Wear it.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #050507 0%, #0a0a18 60%, #050510 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,200,0.12) 0%, transparent 60%)',
          top: -100, right: 100, display: 'flex',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,100,255,0.08) 0%, transparent 65%)',
          bottom: -80, left: 50, display: 'flex',
        }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{ fontSize: 88, fontWeight: 900, color: '#ffffff', letterSpacing: '-2px', lineHeight: 1 }}>STYLX</span>
            <span style={{ fontSize: 88, fontWeight: 900, color: '#00E5C8', letterSpacing: '-2px', lineHeight: 1 }}>.AI</span>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.55)', fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase' }}>
            Describe it. Wear it.
          </div>

          {/* Divider */}
          <div style={{ width: 120, height: 2, background: 'linear-gradient(90deg, transparent, #00E5C8, transparent)', display: 'flex' }} />

          {/* Sub */}
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)', fontWeight: 400, textAlign: 'center', maxWidth: 700 }}>
            AI-generated custom shirts · 300 DPI DTG print · Ships in 72 hours
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
