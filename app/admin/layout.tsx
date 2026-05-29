'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OWNER_EMAIL } from '@/lib/owner';

const NAV = [
  { href: '/admin',             label: 'Overview',   icon: '📊' },
  { href: '/admin/orders',      label: 'Orders',     icon: '📦' },
  { href: '/admin/customers',   label: 'Customers',  icon: '👥' },
  { href: '/admin/designs',     label: 'Designs',    icon: '🎨' },
  { href: '/admin/artists',       label: 'Artists',       icon: '🖌️' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '✨' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess = JSON.parse(raw);
      if (sess.email !== OWNER_EMAIL) { router.replace('/home'); return; }
      setAllowed(true);
    } catch {
      router.replace('/');
    }
  }, [router]);

  if (!allowed) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050507' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>Checking access...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050507', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 210, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem 0.875rem', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', gap: 2,
      }}>
        <div style={{ marginBottom: '1.75rem', padding: '0 0.625rem' }}>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.4rem', letterSpacing: '0.06em', lineHeight: 1, color: '#fff' }}>
            STYLX<span style={{ color: '#00E5C8' }}>.AI</span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', fontWeight: 700, marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>

        {NAV.map(n => {
          const active = n.href === '/admin'
            ? path === '/admin'
            : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '0.575rem 0.75rem', paddingLeft: active ? 'calc(0.75rem - 2px)' : '0.75rem',
              borderRadius: 10,
              color: active ? '#fff' : 'rgba(255,255,255,0.38)',
              fontSize: '0.82rem', fontWeight: active ? 700 : 500,
              textDecoration: 'none', transition: 'all 0.15s',
              background: active ? 'rgba(0,229,200,0.07)' : 'transparent',
              border: `1px solid ${active ? 'rgba(0,229,200,0.18)' : 'transparent'}`,
              borderLeft: active ? '2px solid #00E5C8' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              {n.label}
            </Link>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/home" style={{
            fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem',
          }}>← Back to studio</Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '2.5rem 3rem', overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
