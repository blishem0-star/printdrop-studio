import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff' }}>
      <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.2rem', color: '#fff', textDecoration: 'none', letterSpacing: '0.05em' }}>STYLX<span style={{ color: '#00E5C8' }}>.</span></Link>
        <nav style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
          {[['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Refunds', '/legal/refunds']].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>{label}</Link>
          ))}
        </nav>
      </header>
      <main className="legal-body" style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {children}
        <style>{`
          .legal-body h1{font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:2.4rem;letter-spacing:0.04em;margin:0 0 6px}
          .legal-body .updated{color:rgba(255,255,255,0.35);font-size:0.72rem;margin-bottom:28px}
          .legal-body h2{font-size:0.95rem;font-weight:800;margin:26px 0 8px;color:rgba(255,255,255,0.9)}
          .legal-body p,.legal-body li{color:rgba(255,255,255,0.6);font-size:0.86rem;line-height:1.75}
          .legal-body ul{padding-left:1.2rem;margin:8px 0}
          .legal-body a{color:#00E5C8;text-decoration:none}
        `}</style>
      </main>
      <SiteFooter />
    </div>
  );
}
