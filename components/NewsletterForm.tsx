'use client';
import { useState } from 'react';

export function NewsletterForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source }) });
      setState(res.ok ? 'done' : 'error');
    } catch { setState('error'); }
  }

  if (state === 'done') {
    return <p style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>You are on the list - watch your inbox.</p>;
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, maxWidth: 420, width: '100%' }}>
      <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email for updates"
        style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.65rem 0.9rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
      <button type="submit" disabled={state === 'busy'}
        style={{ padding: '0.65rem 1.2rem', borderRadius: 10, border: 'none', background: state === 'busy' ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00E5C8,#0099FF)', color: state === 'busy' ? 'rgba(255,255,255,0.4)' : '#050507', fontWeight: 900, fontSize: '0.8rem', cursor: state === 'busy' ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
        {state === 'busy' ? 'Joining...' : 'Notify me'}
      </button>
      {state === 'error' && <span role="alert" style={{ alignSelf: 'center', color: '#f87171', fontSize: '0.72rem', fontWeight: 700 }}>Try again</span>}
    </form>
  );
}
