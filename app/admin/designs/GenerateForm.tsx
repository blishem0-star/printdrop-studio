'use client';
import { useState, useTransition } from 'react';
import { generateCatalogDesigns } from './actions';

// One-click catalog growth: pick a category (ideally a leader from the
// Category-demand panel) and publish fresh house designs instantly.
export function GenerateForm({ categories }: { categories: string[] }) {
  const [category, setCategory] = useState(categories[0] ?? 'Nature');
  const [count, setCount] = useState(4);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setResult(null);
    startTransition(async () => {
      try {
        const r = await generateCatalogDesigns(category, count);
        setResult(`${r.created} new ${category} designs published to the catalog${r.skipped ? ` (${r.skipped} duplicate titles skipped)` : ''}.`);
      } catch {
        setResult('Generation failed - check the server logs.');
      }
    });
  }

  const sel: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' };
  return (
    <div style={{ border: '1px solid rgba(0,229,200,0.16)', background: 'rgba(0,229,200,0.03)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#00E5C8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Generate designs</div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Grow the catalog where demand is - new designs go live under STYLX Studio immediately.</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={category} onChange={e => setCategory(e.target.value)} style={sel} aria-label="Category">
          {categories.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
        </select>
        <select value={count} onChange={e => setCount(+e.target.value)} style={sel} aria-label="How many">
          {[2, 4, 6, 8, 12].map(n => <option key={n} value={n} style={{ background: '#111' }}>{n} designs</option>)}
        </select>
        <button onClick={run} disabled={pending}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: pending ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00E5C8,#0099FF)', color: pending ? 'rgba(255,255,255,0.4)' : '#050507', fontWeight: 900, fontSize: '0.78rem', cursor: pending ? 'default' : 'pointer' }}>
          {pending ? 'Generating...' : 'Generate & publish'}
        </button>
        {result && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>{result}</span>}
      </div>
    </div>
  );
}
