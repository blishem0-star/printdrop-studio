'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Report the error so the owner sees production breakage in the admin panel.
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        message: error.message || String(error),
        digest: error.digest,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/log-error', new Blob([payload], { type: 'application/json' }));
      else fetch('/api/log-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    } catch { /* logging must never break the error page */ }
  }, [error]);

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
      background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff',
    }}>
      <div style={{ maxWidth: 440, position: 'relative' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ width: 68, height: 68, margin: '0 auto 16px', borderRadius: 18, border: '1px solid rgba(239,68,68,0.24)', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', position: 'relative' }}>
          <svg viewBox="0 0 24 24" width={34} height={34} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l9 16H3z" /><path d="M12 9v4M12 17h.01" /></svg>
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2.5rem', fontWeight: 400, letterSpacing: '0.04em', marginBottom: 10 }}>
          Something went wrong
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', marginBottom: '2rem', lineHeight: 1.7 }}>
          An unexpected error occurred. Your studio selections are saved - you can try again.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/home" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
