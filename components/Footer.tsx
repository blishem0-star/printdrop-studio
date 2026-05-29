import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ position: 'relative', marginTop: '4rem' }}>
      {/* Top gradient line */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,200,0.35) 40%, rgba(0,153,255,0.3) 60%, transparent 100%)' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 1.5rem 2.5rem', textAlign: 'center' }}>

        {/* Giant brand name */}
        <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(4rem, 12vw, 9rem)', fontWeight: 400, letterSpacing: '0.04em', lineHeight: 0.88, marginBottom: '0.6rem', color: 'rgba(255,255,255,0.07)' }}>
          STYLX<span style={{ color: 'rgba(0,229,200,0.22)' }}>.AI</span>
        </div>

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.06em', color: '#fff' }}>
            STYLX<span style={{ color: '#00E5C8' }}>.AI</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Describe it. Wear it.</div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {[['Studio', '/design'], ['Catalog', '/catalog'], ['How it works', '/#how']].map(([l, h]) => (
            <Link key={h} href={h} style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.72rem', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, transition: 'color 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)')}
            >{l}</Link>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 48, height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 auto 1.5rem' }} />

        {/* Copyright */}
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          © 2026 STYLX.AI — AI-Powered Custom Fashion
        </div>
      </div>
    </footer>
  );
}
