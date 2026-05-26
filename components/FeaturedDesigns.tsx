import Link from 'next/link';
import { DESIGNS } from '@/lib/mockData';
import DesignCard from './DesignCard';

export default function FeaturedDesigns() {
  const featured = DESIGNS.filter(d => d.badge).slice(0, 4);

  return (
    <section style={{ padding: '2rem 1.5rem 6rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="tag" style={{ marginBottom: '1rem' }}>Popular picks</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Fan favorites
          </h2>
        </div>
        <Link href="/catalog" className="btn btn-ghost" style={{ padding: '0.6rem 1.5rem', fontSize: 13 }}>
          View all designs →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
        {featured.map(d => <DesignCard key={d.id} design={d} />)}
      </div>
    </section>
  );
}
