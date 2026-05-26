'use client';
import { useState } from 'react';
import { DESIGNS, CATEGORIES } from '@/lib/mockData';
import DesignCard from '@/components/DesignCard';
import Footer from '@/components/Footer';
import VibeMode from '@/components/VibeMode';

export default function CatalogPage() {
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState<'popular'|'price-low'|'price-high'|'newest'>('popular');
  const [q, setQ] = useState('');

  const results = DESIGNS
    .filter(d => cat === 'All' || d.category === cat)
    .filter(d => !q || d.title.toLowerCase().includes(q.toLowerCase()) || d.tags.some(t => t.includes(q.toLowerCase())))
    .sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'newest') return +b.id - +a.id;
      return b.reviews - a.reviews;
    });

  return (
    <main style={{ paddingTop: 60, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '2.5rem 1.5rem 2rem', maxWidth: 1280, margin: '0 auto' }}>
        <div className="tag" style={{ marginBottom: 14 }}>All Designs</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: '-0.04em' }}>
            Find your design
          </h1>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>{results.length} results</span>
        </div>
      </div>

      <VibeMode />

      {/* Filter bar */}
      <div style={{ padding: '0 1.5rem 1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
            style={{ width: 200, paddingLeft: '2.25rem' }} />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>🔍</span>
        </div>

        {/* Category */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '6px 14px', borderRadius: 999, border: '1px solid',
              borderColor: cat === c ? 'rgba(255,77,28,0.45)' : 'rgba(255,255,255,0.07)',
              background: cat === c ? 'rgba(255,77,28,0.08)' : 'transparent',
              color: cat === c ? '#FF8C40' : 'rgba(255,255,255,0.35)',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>{c}</button>
          ))}
        </div>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="input" style={{ width: 'auto', cursor: 'pointer' }}>
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 1.5rem 5rem', maxWidth: 1280, margin: '0 auto' }}>
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p>No designs found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '1rem' }}>
            {results.map(d => <DesignCard key={d.id} design={d} />)}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
