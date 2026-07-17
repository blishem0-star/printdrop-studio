import Link from 'next/link';

// Shared footer for content pages (FAQ, size guide, legal) so no page is a
// dead end - server-safe, links only.
export function SiteFooter() {
  const links: [string, string][] = [
    ['Catalog', '/catalog'],
    ['Design studio', '/design'],
    ['FAQ', '/faq'],
    ['Size guide', '/size-guide'],
    ['Terms', '/legal/terms'],
    ['Privacy', '/legal/privacy'],
    ['Refunds', '/legal/refunds'],
  ];
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '4rem', padding: '2rem 1.5rem 2.5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.1rem', letterSpacing: '0.04em', color: '#fff' }}>STYLX<span style={{ color: '#00E5C8' }}>.</span></span>
        <nav aria-label="Site" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.1rem' }}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none' }}>{label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
