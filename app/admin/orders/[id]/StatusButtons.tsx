'use client';
import { useTransition } from 'react';
import { ORDER_STATUSES, STATUS_COLOR, type OrderStatus } from '@/lib/types';
import { updateOrderStatus } from './actions';

export function StatusButtons({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {ORDER_STATUSES.map(s => {
        const active = currentStatus === s;
        return (
          <button key={s} aria-pressed={active} disabled={pending || active}
            onClick={() => startTransition(() => updateOrderStatus(orderId, s))}
            style={{
              width: '100%', padding: '0.6rem 0.875rem', borderRadius: 10, cursor: active || pending ? 'default' : 'pointer',
              background: active ? `${STATUS_COLOR[s as OrderStatus]}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? STATUS_COLOR[s as OrderStatus] + '55' : 'rgba(255,255,255,0.06)'}`,
              color: active ? STATUS_COLOR[s as OrderStatus] : 'rgba(255,255,255,0.35)',
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              textAlign: 'left' as const, transition: 'all 0.15s',
              opacity: pending && !active ? 0.4 : 1,
            }}>
            {active ? '● ' : '○ '}{s.replace('_', ' ')}
          </button>
        );
      })}
    </div>
  );
}
