import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem', textAlign: 'center',
      background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff',
    }}>
      <div style={{ maxWidth: 460 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>👕</div>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 8 }}>
          <span style={{
            background: 'linear-gradient(135deg,#00E5C8,#0099FF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>404</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 8 }}>
          Page not found
        </p>
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.85rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Looks like this design got lost in the wash. Let&apos;s get you back on track.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/design" className="btn btn-ghost">Open studio</Link>
        </div>
      </div>
    </main>
  );
}
