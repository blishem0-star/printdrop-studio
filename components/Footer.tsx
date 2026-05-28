import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem 1.5rem', marginTop: '2rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
          Print<span style={{ color: '#FF5C28' }}>Drop</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 12 }}>
            Premium custom printing
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[['Studio', '/design'], ['Catalog', '/catalog'], ['How it works', '/#how']].map(([l, h]) => (
            <Link key={h} href={h} style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.15s' }}
              className="hover:text-white">{l}</Link>
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.72rem' }}>© 2025 PrintDrop</div>
      </div>
    </footer>
  );
}
