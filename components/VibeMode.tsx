'use client';
import { useState } from 'react';
import { DESIGNS } from '@/lib/mockData';
import DesignCard from './DesignCard';

const VIBES = [
  { id: 'dark', label: 'Dark & Edgy', emoji: '🖤', gradient: 'linear-gradient(135deg,#1a0a0a,#2d0000)', border: '#4a1010', ids: ['1','2','8'] },
  { id: 'chill', label: 'Chill Minimal', emoji: '🌊', gradient: 'linear-gradient(135deg,#0a1628,#0d2040)', border: '#1a3a6a', ids: ['4','7','3'] },
  { id: 'funny', label: 'Funny & Bold', emoji: '😂', gradient: 'linear-gradient(135deg,#1a1200,#2d2200)', border: '#4a3800', ids: ['4','8','2'] },
  { id: 'nature', label: 'Nature Lover', emoji: '🌿', gradient: 'linear-gradient(135deg,#0a1a0a,#0d280d)', border: '#1a4a1a', ids: ['3','7','5'] },
  { id: 'urban', label: 'Urban Street', emoji: '🏙️', gradient: 'linear-gradient(135deg,#0a0a1a,#15152a)', border: '#2a2a5a', ids: ['2','8','1'] },
  { id: 'ai', label: 'AI & Surreal', emoji: '✦', gradient: 'linear-gradient(135deg,#12001a,#1a0028)', border: '#3a005a', ids: ['6','1','5'] },
];

export default function VibeMode() {
  const [activeVibe, setActiveVibe] = useState<string | null>(null);

  const vibe = VIBES.find(v => v.id === activeVibe);
  const filteredDesigns = vibe
    ? vibe.ids.map(id => DESIGNS.find(d => d.id === id)).filter(Boolean)
    : [];

  return (
    <section style={{ padding: '5rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="tag" style={{ margin: '0 auto 1rem' }}>Vibe Mode ✦ New</div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
          Find designs by <span className="g-text">your energy</span>
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto' }}>
          Skip the search. Pick a mood and we&apos;ll curate the perfect designs for you.
        </p>
      </div>

      {/* Vibe pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: '2.5rem' }}>
        {VIBES.map(v => (
          <button key={v.id} onClick={() => setActiveVibe(a => a === v.id ? null : v.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.75rem 1.5rem', borderRadius: 100,
            background: activeVibe === v.id ? v.gradient : '#111',
            border: `2px solid ${activeVibe === v.id ? v.border : '#1e1e1e'}`,
            color: activeVibe === v.id ? '#fff' : '#666',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: activeVibe === v.id ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeVibe === v.id ? `0 0 20px ${v.border}` : 'none',
          }}>
            <span style={{ fontSize: 18 }}>{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* Result grid */}
      {activeVibe && filteredDesigns.length > 0 && (
        <div>
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center', marginBottom: '1.5rem' }}>
            {filteredDesigns.length} designs curated for <strong style={{ color: '#fff' }}>{vibe?.label}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
            {filteredDesigns.map(d => d && <DesignCard key={d.id} design={d} />)}
          </div>
        </div>
      )}

      {!activeVibe && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#333', fontSize: 40 }}>
          ↑ Pick a vibe
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </section>
  );
}
