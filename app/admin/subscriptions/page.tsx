import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PRODUCT_TYPE_LABELS } from '@/lib/productTypes';
import type { ProductType } from '@/lib/productTypes';

export const dynamic = 'force-dynamic';

const MONTHLY = 59.99;

const STATUS_STYLE = {
  ACTIVE:    { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  PAUSED:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  CANCELLED: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
} as const;

type FilterVal = 'ALL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'ACTIVE' } = await searchParams;
  const activeFilter = (['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'].includes(filter) ? filter : 'ACTIVE') as FilterVal;

  const [subs, counts] = await Promise.all([
    prisma.subscription.findMany({
      where: activeFilter === 'ALL' ? {} : { status: activeFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        shipments: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.subscription.groupBy({ by: ['status'], _count: { id: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count.id]));
  const active = countMap['ACTIVE'] ?? 0;
  const paused = countMap['PAUSED'] ?? 0;
  const total  = counts.reduce((s, c) => s + c._count.id, 0);
  const mrr    = active * MONTHLY;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Premium Subscriptions</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>Manage monthly box subscribers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Active',  value: active,              icon: '✅', color: '#10B981' },
          { label: 'Paused',  value: paused,              icon: '⏸',  color: '#F59E0B' },
          { label: 'Total',   value: total,               icon: '📦', color: '#8B5CF6' },
          { label: 'MRR',     value: `$${mrr.toFixed(2)}`, icon: '💰', color: '#3B82F6' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.icon} {s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.9rem', fontWeight: 400, letterSpacing: '0.02em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: '1.5rem' }}>
        {(['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map(f => (
          <Link key={f} href={`/admin/subscriptions?filter=${f}`} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: activeFilter === f ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)', background: activeFilter === f ? 'rgba(0,229,200,0.07)' : 'transparent', color: activeFilter === f ? '#00E5C8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}>
            {f === 'ALL' ? `All (${total})` : f === 'ACTIVE' ? `Active (${active})` : f}
          </Link>
        ))}
      </div>

      {subs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: 'rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <p>No subscriptions found</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Customer', 'Style Prefs', 'Status', 'Next Shipment', 'Boxes Sent', 'Since'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => {
                const prefs = (() => { try { return JSON.parse(s.stylePrefs); } catch { return {}; } })();
                const ss = STATUS_STYLE[s.status as keyof typeof STATUS_STYLE];
                return (
                  <tr key={s.id} style={{ borderBottom: i < subs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.customer.name}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{s.customer.email}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', marginBottom: 3 }}>{prefs.style ?? '—'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {(prefs.productTypes ?? []).map((t: ProductType) => (
                          <span key={t} style={{ fontSize: '0.5rem', fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>{PRODUCT_TYPE_LABELS[t]}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, color: ss.color, background: ss.bg, border: `1px solid ${ss.color}33`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: s.status === 'ACTIVE' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)' }}>
                      {new Date(s.nextShipmentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#00E5C8' }}>{s.shipments.length}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
