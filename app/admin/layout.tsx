import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Orders' },
  { href: '/admin/designs', label: 'Designs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em' }}>PrintDrop</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin</div>
        </div>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{
            display: 'block', padding: '0.55rem 0.75rem', borderRadius: 8,
            color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >{n.label}</Link>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>← Back to site</Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
