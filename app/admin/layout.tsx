'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// SVG stroke icons — 16×16 viewBox, strokeWidth 1.5, fill none
const NAV_ICONS: Record<string, React.ReactNode> = {
  overview: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
      <path d="M2 2h2l1.5 7h7l1.5-5H5" /><circle cx="6.5" cy="12.5" r="1" /><circle cx="12.5" cy="12.5" r="1" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
      <circle cx="6" cy="5" r="2.5" /><path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="12" cy="5" r="2" /><path d="M12 10c1.7 0 3 1.3 3 3" />
    </svg>
  ),
  designs: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
      <circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2.5" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14" />
    </svg>
  ),
  artists: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
      <path d="M2 14c2-4 5-9 6-9s.5 2-.5 3c-1.5 1.5 2 2 3-1 .8-2.4 1-4 1-4" /><circle cx="13" cy="3.5" r="1" />
    </svg>
  ),
  subscriptions: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
      <path d="M8 2l1.8 3.6L14 6.5l-3 2.9.7 4.1L8 11.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z" />
    </svg>
  ),
};

const NAV = [
  { href: '/admin',             label: 'Overview',       iconKey: 'overview' },
  { href: '/admin/orders',      label: 'Orders',         iconKey: 'orders' },
  { href: '/admin/customers',   label: 'Customers',      iconKey: 'customers' },
  { href: '/admin/designs',     label: 'Designs',        iconKey: 'designs' },
  { href: '/admin/artists',     label: 'Artists',        iconKey: 'artists' },
  { href: '/admin/subscriptions', label: 'Subscriptions', iconKey: 'subscriptions' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  // UX-level check only — the real gate is middleware.ts verifying the session server-side
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.role === 'OWNER') setAllowed(true);
        else router.replace('/home');
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (!allowed) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050507' }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>Checking access...</div>
    </div>
  );

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: '#050507', display: 'flex' }}>
      {/* Sidebar */}
      <aside aria-label="Admin navigation" className="admin-aside" style={{
        width: 210, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem 0.875rem', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', gap: 2,
      }}>
        <div className="admin-brand" style={{ marginBottom: '1.75rem', padding: '0 0.625rem' }}>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.4rem', letterSpacing: '0.06em', lineHeight: 1, color: '#fff' }}>
            STYLX<span style={{ color: '#00E5C8' }}>.AI</span>
          </div>
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', fontWeight: 700, marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>

        <nav className="admin-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(n => {
          const active = n.href === '/admin'
            ? path === '/admin'
            : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className="admin-navlink" style={{
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
              <span style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.6 }}>{NAV_ICONS[n.iconKey]}</span>
              {n.label}
            </Link>
          );
        })}
        </nav>

        <div className="admin-aside-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/home" style={{
            fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem',
          }}><svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 6H2M6 2L2 6l4 4" /></svg>Back to studio</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main" style={{ flex: 1, padding: '2.5rem 3rem', overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
