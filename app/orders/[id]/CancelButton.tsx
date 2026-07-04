'use client';
import { useState, useTransition } from 'react';
import { cancelOwnOrder } from './actions';

export function CancelButton({ orderId, email }: { orderId: string; email?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelOwnOrder(orderId, email);
      if (!r.ok) setError(r.error ?? 'Could not cancel.');
    });
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}
        style={{ marginTop: 18, padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
        Cancel this request
      </button>
    );
  }
  return (
    <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Cancel this order request? Nothing has been charged.</span>
      <button onClick={cancel} disabled={pending}
        style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: pending ? 'rgba(255,255,255,0.08)' : '#ef4444', color: pending ? 'rgba(255,255,255,0.4)' : '#fff', fontSize: '0.76rem', fontWeight: 900, cursor: pending ? 'default' : 'pointer' }}>
        {pending ? 'Cancelling...' : 'Yes, cancel it'}
      </button>
      <button onClick={() => setConfirming(false)} disabled={pending}
        style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
        Keep it
      </button>
      {error && <span role="alert" style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 700 }}>{error}</span>}
    </div>
  );
}
