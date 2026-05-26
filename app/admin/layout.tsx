'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin',         label: 'Orders',  icon: '📦' },
  { href: '/admin/designs', label: 'Designs', icon: '🎨' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: 4,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em' }}>PrintDrop</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin</div>
        </div>
        {NAV.map(n => {
          const active = path === n.href || (n.href !== '/admin' && path.startsWith(n.href));
          return (
            <Link key={n.href} href={n.href} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.6rem 0.75rem', borderRadius: 10,
              color: active ? 'white' : 'rgba(255,255,255,0.4)',
              fontSize: '0.83rem', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s',
              background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: `1px solid ${active ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
            }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem' }}>
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '2.5rem 3rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
