import Link from 'next/link';
import { Design, SHIRT_COLORS } from '@/lib/mockData';
import TShirtMockup from './TShirtMockup';

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  bestseller: { bg: 'rgba(255,140,0,0.1)', color: '#FF9A00', label: '🔥 Bestseller' },
  new:        { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: '✦ New' },
  trending:   { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa', label: '↑ Trending' },
  ai:         { bg: 'rgba(96,165,250,0.1)', color: '#60A5FA', label: '✦ AI' },
};

export default function DesignCard({ design }: { design: Design }) {
  const badge = design.badge ? BADGE[design.badge] : null;
  const shirtColor = SHIRT_COLORS.find(c => c.id === design.availableColors[0]) ?? SHIRT_COLORS[0];

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Preview area */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        padding: '1.75rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', minHeight: 200, justifyContent: 'center',
      }}>
        {badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: badge.bg, color: badge.color,
            fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.04em',
          }}>{badge.label}</div>
        )}
        <TShirtMockup color={shirtColor.hex} textColor={shirtColor.textColor} emoji={design.emoji} size="md" />

        {/* Color dots */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 5 }}>
          {design.availableColors.slice(0, 5).map(cid => {
            const c = SHIRT_COLORS.find(x => x.id === cid);
            return c ? (
              <div key={cid} title={c.name} style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex, outline: '1.5px solid rgba(255,255,255,0.12)', outlineOffset: 1 }} />
            ) : null;
          })}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '1.125rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="label" style={{ marginBottom: 5 }}>{design.category}</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{design.title}</h3>
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#FF5C28', flexShrink: 0 }}>${design.price}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          <span style={{ color: '#F59E0B' }}>★★★★★</span>
          {design.rating} · {design.reviews} reviews
        </div>
        <Link href={`/design?id=${design.id}`} className="btn btn-primary btn-sm"
          style={{ marginTop: 'auto', justifyContent: 'center', borderRadius: 10 }}>
          Customize →
        </Link>
      </div>
    </div>
  );
}
