'use client';
import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>
          Something went wrong
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', marginBottom: '2rem', lineHeight: 1.7 }}>
          An unexpected error occurred. Your studio selections are saved — you can try again.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
