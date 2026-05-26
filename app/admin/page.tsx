import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  DRAFT:         'rgba(255,255,255,0.25)',
  PAID:          '#3B82F6',
  IN_PRODUCTION: '#F59E0B',
  SHIPPED:       '#8B5CF6',
  DELIVERED:     '#10B981',
  CANCELLED:     '#EF4444',
};

const STATUS_BG: Record<string, string> = {
  DRAFT:         'rgba(255,255,255,0.04)',
  PAID:          'rgba(59,130,246,0.1)',
  IN_PRODUCTION: 'rgba(245,158,11,0.1)',
  SHIPPED:       'rgba(139,92,246,0.1)',
  DELIVERED:     'rgba(16,185,129,0.1)',
  CANCELLED:     'rgba(239,68,68,0.1)',
};

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: { include: { designAsset: true } },
    },
  });

  const stats = {
    total: orders.length,
    revenue: orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0),
    pending: orders.filter(o => o.status === 'PAID' || o.status === 'IN_PRODUCTION').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Orders</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: 4 }}>All orders, newest first</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Total orders', value: stats.total },
          { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}` },
          { label: 'In progress', value: stats.pending },
          { label: 'Delivered', value: stats.delivered },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.025)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>No orders yet. Place one from the studio!</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Order', 'Customer', 'Design', 'Total', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const item = order.items[0];
                const design = item?.designAsset;
                return (
                  <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{order.customer.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{order.customer.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {design ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: design.colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{design.emoji}</div>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{design.title}</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{design.colorName} · {design.size}</div>
                          </div>
                        </div>
                      ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.9rem' }}>${order.total.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                        fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: STATUS_COLOR[order.status], background: STATUS_BG[order.status],
                        border: `1px solid ${STATUS_COLOR[order.status]}33`,
                      }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link href={`/admin/orders/${order.id}`} style={{
                        fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none', padding: '4px 10px', borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
                      }}>View →</Link>
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
