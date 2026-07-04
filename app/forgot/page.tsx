'use client';
import { useState } from 'react';
import Link from 'next/link';

const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.9rem', outline: 'none' };

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try { await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } catch { /* same UX either way */ }
    setSent(true); setBusy(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '2.2rem', letterSpacing: '0.04em', marginBottom: 8 }}>Forgot your password?</h1>
        {sent ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam) - the link works for 1 hour.
          </p>
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 20 }}>Enter your account email and we will send you a link to choose a new password.</p>
            <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
              <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={INP} autoComplete="email" />
              <button type="submit" disabled={busy} style={{ padding: '0.75rem', borderRadius: 10, border: 'none', background: busy ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00E5C8,#0099FF)', color: busy ? 'rgba(255,255,255,0.4)' : '#050507', fontWeight: 900, fontSize: '0.9rem', cursor: busy ? 'default' : 'pointer' }}>
                {busy ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <Link href="/" style={{ display: 'inline-block', marginTop: 18, color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textDecoration: 'none' }}>Back to sign in</Link>
      </div>
    </div>
  );
}
