'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const INP: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.9rem', outline: 'none' };

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? 'Reset failed'); return; }
      setDone(true);
      setTimeout(() => router.push('/'), 2500);
    } catch { setError('Network error'); }
    finally { setBusy(false); }
  }

  if (!token) return <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>This reset link is incomplete. <Link href="/forgot" style={{ color: '#00E5C8' }}>Request a new one</Link>.</p>;
  if (done) return <p style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 700 }}>Password updated. Taking you to sign in...</p>;

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
      <input type="password" required minLength={8} placeholder="New password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)} style={INP} autoComplete="new-password" />
      <input type="password" required placeholder="Repeat new password" value={confirm} onChange={e => setConfirm(e.target.value)} style={INP} autoComplete="new-password" />
      {error && <div role="alert" style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 700 }}>{error}</div>}
      <button type="submit" disabled={busy} style={{ padding: '0.75rem', borderRadius: 10, border: 'none', background: busy ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00E5C8,#0099FF)', color: busy ? 'rgba(255,255,255,0.4)' : '#050507', fontWeight: 900, fontSize: '0.9rem', cursor: busy ? 'default' : 'pointer' }}>
        {busy ? 'Saving...' : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '2.2rem', letterSpacing: '0.04em', marginBottom: 16 }}>Choose a new password</h1>
        <Suspense fallback={null}><ResetForm /></Suspense>
      </div>
    </div>
  );
}
