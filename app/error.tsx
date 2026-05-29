'use client';
import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
      background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff',
    }}>
      <div style={{ maxWidth: 440, position: 'relative' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠</div>
        <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2.5rem', fontWeight: 400, letterSpacing: '0.04em', marginBottom: 10 }}>
          Something went wrong
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', marginBottom: '2rem', lineHeight: 1.7 }}>
          An unexpected error occurred. Your studio selections are saved — you can try again.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/home" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
