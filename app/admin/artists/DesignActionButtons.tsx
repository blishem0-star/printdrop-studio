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
        <button onClick={approve} disabled={pending} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700, fontSize: '0.68rem', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1 }}>
          ✓ Approve
        </button>
      )}
      {status !== 'REJECTED' && (
        <button onClick={reject} disabled={pending} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, fontSize: '0.68rem', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.5 : 1 }}>
          ✕ Reject
        </button>
      )}
    </div>
  );
}
