'use client';
import { useTransition } from 'react';
import { updateDesignStatus } from './actions';

export function DesignActionButtons({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  function approve() { startTransition(() => updateDesignStatus(id, 'APPROVED')); }
  function reject()  { startTransition(() => updateDesignStatus(id, 'REJECTED')); }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {status !== 'APPROVED' && (
        <button onClick={approve} disabled={pending} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700, fontSize: '0.68rem', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1 }}>
          <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5L9.5 3.5" /></svg>Approve
        </button>
      )}
      {status !== 'REJECTED' && (
        <button onClick={reject} disabled={pending} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, fontSize: '0.68rem', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1 }}>
          <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>Reject
        </button>
      )}
    </div>
  );
}
