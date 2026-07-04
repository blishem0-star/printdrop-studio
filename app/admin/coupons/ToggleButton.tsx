'use client';
import { useTransition } from 'react';
import { toggleCoupon } from './actions';

export function ToggleButton({ code, active }: { code: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => toggleCoupon(code, !active))} disabled={pending}
      style={{ padding: '6px 14px', borderRadius: 9, border: `1px solid ${active ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.3)'}`, background: 'transparent', color: pending ? 'rgba(255,255,255,0.3)' : active ? '#f87171' : '#34d399', fontSize: '0.72rem', fontWeight: 800, cursor: pending ? 'default' : 'pointer' }}>
      {pending ? '...' : active ? 'Disable' : 'Enable'}
    </button>
  );
}
