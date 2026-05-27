'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Session = { type: 'guest' | 'user'; name: string; email?: string };

export default function StudioLanding() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      setSession(JSON.parse(raw));
    } catch {
      router.replace('/');
    }
  }, [router]);

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <span style={{ fontSize: 28 }}>🖨</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.05em', margin: '0.5rem 0 0.5rem' }}>
          PrintDrop
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', margin: 0 }}>
          How do you want to print your shirt?
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', width: '100%', maxWidth: 700 }}>

        {/* Custom */}
        <button
          onClick={() => router.push('/studio/custom')}
          style={{
            padding: '2.25rem 1.75rem',
            background: 'rgba(255,77,28,0.05)',
            border: '1.5px solid rgba(255,77,28,0.22)',
            borderRadius: 20, cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,28,0.09)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,77,28,0.4)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,28,0.05)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,77,28,0.22)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 40, marginBottom: '1rem' }}>✏️</div>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.03em', color: '#fff', marginBottom: 8 }}>
            Custom Design
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Upload your own artwork or add custom text. Full creative freedom.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={tagStyle('#FF4D1C')}>From $24.99</span>
            <span style={tagStyle('rgba(255,255,255,0.15)')}>72h delivery</span>
          </div>
        </button>

        {/* Catalog */}
        <button
          onClick={() => router.push('/studio/catalog')}
          style={{
            padding: '2.25rem 1.75rem',
            background: 'rgba(99,102,241,0.05)',
            border: '1.5px solid rgba(99,102,241,0.2)',
            borderRadius: 20, cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.09)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.4)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.05)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.2)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 40, marginBottom: '1rem' }}>🎨</div>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.03em', color: '#fff', marginBottom: 8 }}>
            Ready-Made Designs
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Browse our catalog of print-ready designs. Pick, customize color & size.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={tagStyle('#6366F1')}>From $15.99</span>
            <span style={tagStyle('rgba(255,255,255,0.15)')}>72h delivery</span>
            <span style={tagStyle('#10B981')}>Save up to $8</span>
          </div>
        </button>
      </div>

      <p style={{ marginTop: '2.5rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.72rem' }}>
        Logged in as <span style={{ color: 'rgba(255,255,255,0.35)' }}>{session.name}</span>
        {' · '}
        <span
          onClick={() => { localStorage.removeItem('pd_session'); router.replace('/'); }}
          style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.25)', textDecoration: 'underline' }}
        >Sign out</span>
      </p>
    </div>
  );
}

function tagStyle(color: string): React.CSSProperties {
  return {
    fontSize: '0.65rem', fontWeight: 700,
    background: `${color}18`,
    border: `1px solid ${color}35`,
    borderRadius: 999, padding: '3px 9px',
    color: color === 'rgba(255,255,255,0.15)' ? 'rgba(255,255,255,0.4)' : color,
  };
}
