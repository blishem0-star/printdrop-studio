'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { label: 'Studio', href: '/design' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'How it works', href: '/#how' },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 60,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(6,6,8,0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', height: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#FF4D1C,#FF8C00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: 'white',
          }}>P</div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white', letterSpacing: '-0.02em' }}>
            Print<span style={{ color: '#FF5C28' }}>Drop</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hidden md:flex">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: 500,
              color: path === n.href ? 'white' : 'rgba(255,255,255,0.45)',
              background: path === n.href ? 'rgba(255,255,255,0.07)' : 'transparent',
              transition: 'all 0.15s',
            }}>{n.label}</Link>
          ))}
        </nav>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/catalog" className="btn btn-ghost btn-sm hidden md:inline-flex">Browse</Link>
          <Link href="/design" className="btn btn-primary btn-sm">
            Start designing
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
