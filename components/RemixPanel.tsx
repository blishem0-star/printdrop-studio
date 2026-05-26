'use client';
import { useState } from 'react';
import { Design, DESIGNS } from '@/lib/mockData';

const REMIX_STYLES = [
  { label: 'Darker Tones', emoji: '🌑' },
  { label: 'Neon Pop', emoji: '⚡' },
  { label: 'Minimalist', emoji: '◻️' },
  { label: 'Retro Wash', emoji: '📺' },
];

type Props = {
  currentDesign: Design;
  onSelect: (d: Design) => void;
};

export default function RemixPanel({ currentDesign, onSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [remixes, setRemixes] = useState<Design[] | null>(null);

  const handleRemix = () => {
    setLoading(true);
    setRemixes(null);
    setTimeout(() => {
      // mock: return 4 similar designs
      const pool = DESIGNS.filter(d => d.id !== currentDesign.id);
      const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, 4);
      setRemixes(picks);
      setLoading(false);
    }, 1800);
  };

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 16, padding: '1.25rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>✦ Remix this design</span>
          <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>AI generates 4 variations of {currentDesign.title}</p>
        </div>
        <button className="btn-primary" onClick={handleRemix} disabled={loading}
          style={{ padding: '0.45rem 1rem', fontSize: 12, opacity: loading ? 0.5 : 1 }}>
          {loading ? '...' : 'Remix →'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '1rem' }}>
          {REMIX_STYLES.map((s, i) => (
            <div key={i} style={{
              width: 70, height: 70, borderRadius: 12,
              background: '#161616', border: '1px solid #222',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite alternate`,
            }}>
              <span style={{ fontSize: 24, opacity: 0.4 }}>{s.emoji}</span>
            </div>
          ))}
          <style>{`@keyframes pulse { from { opacity:0.3 } to { opacity:0.8 } }`}</style>
        </div>
      )}

      {remixes && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {remixes.map((d, i) => (
            <button key={d.id} onClick={() => onSelect(d)} style={{
              background: '#111', border: '1px solid #1e1e1e',
              borderRadius: 12, padding: '0.875rem',
              cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{ fontSize: 32 }}>{d.emoji}</div>
              <div style={{ fontSize: 11, color: '#ccc', fontWeight: 600 }}>{REMIX_STYLES[i]?.label}</div>
              <div style={{ fontSize: 10, color: '#555' }}>{d.title}</div>
              <div style={{ fontSize: 12, color: '#FF4D1C', fontWeight: 700 }}>${d.price}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
