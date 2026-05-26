'use client';
import Link from 'next/link';
import TShirtMockup from './TShirtMockup';
import { STATS } from '@/lib/mockData';

type FloatingShirt = { color: string; emoji: string; delay: string; top: string; rotate: string; left?: string; right?: string };
const FLOATING_SHIRTS: FloatingShirt[] = [
  { color: '#0d0d0d', emoji: '🌌', delay: '0s', top: '10%', left: '5%', rotate: '-8deg' },
  { color: '#1a2744', emoji: '🏙️', delay: '1.5s', top: '60%', left: '2%', rotate: '5deg' },
  { color: '#1e3a2f', emoji: '🌿', delay: '0.8s', top: '20%', right: '4%', rotate: '10deg' },
  { color: '#c0392b', emoji: '🌊', delay: '2s', top: '65%', right: '3%', rotate: '-6deg' },
];

export default function Hero() {
  return (
    <section style={{ minHeight: '100vh', paddingTop: 80, position: 'relative', overflow: 'hidden' }}
      className="flex flex-col items-center justify-center px-6">

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%', zIndex: 0,
        background: 'radial-gradient(circle, rgba(255,77,28,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Floating shirts - desktop only */}
      {FLOATING_SHIRTS.map((s, i) => (
        <div key={i} className="hidden lg:block" style={{
          position: 'absolute',
          top: s.top, left: s.left, right: s.right,
          transform: `rotate(${s.rotate})`,
          animation: `float 5s ease-in-out ${s.delay} infinite`,
          opacity: 0.6, zIndex: 1, pointerEvents: 'none',
        }}>
          <TShirtMockup color={s.color} emoji={s.emoji} size="sm" />
        </div>
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, textAlign: 'center' }}>
        <div className="section-tag mb-6" style={{ margin: '0 auto 1.5rem' }}>
          ✦ Premium Custom T-Shirts
        </div>

        <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          Wear What You{' '}
          <span className="gradient-text">Imagine</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#888', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Browse hundreds of premium designs or let AI create something uniquely yours.
          Order in 3 steps, delivered in 72 hours.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Link href="/catalog" className="btn-primary" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
            Browse Designs
            <span style={{ opacity: 0.7 }}>→</span>
          </Link>
          <Link href="/design" className="btn-secondary" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
            ✦ Create with AI
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#555', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #FF4D1C, transparent)', margin: '0 auto' }} />
      </div>
    </section>
  );
}
