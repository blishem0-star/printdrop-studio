import { prisma } from '@/lib/prisma';
import { STATUS_COLOR, STATUS_BG, STATUS_LABEL, type OrderStatus } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: { include: { designAsset: true } } },
  });

  type ORow = (typeof orders)[number];

  const stats = {
    total: orders.length,
    revenue: orders.filter((o: ORow) => o.status !== 'CANCELLED').reduce((s: number, o: ORow) => s + o.total, 0),
    pending: orders.filter((o: ORow) => o.status === 'PAID' || o.status === 'IN_PRODUCTION').length,
    delivered: orders.filter((o: ORow) => o.status === 'DELIVERED').length,
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Orders</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>All orders, newest first</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Total orders', value: stats.total },
          { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}` },
          { label: 'In progress', value: stats.pending },
          { label: 'Delivered', value: stats.delivered },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.125rem 1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p>No orders yet</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Order', 'Customer', 'Design', 'Total', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order: ORow, i: number) => {
                const item = order.items[0];
                const design = item?.designAsset;
                return (
                  <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{order.customer.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{order.customer.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {design ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: design.colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{design.emoji}</div>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{design.title}</div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{design.colorName} · {design.size}</div>
                          </div>
                        </div>
                      ) : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.88rem' }}>${order.total.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 9px', borderRadius: 999,
                        fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: STATUS_COLOR[order.status as OrderStatus],
                        background: STATUS_BG[order.status as OrderStatus],
                        border: `1px solid ${STATUS_COLOR[order.status as OrderStatus]}33`,
                      }}>
                        {STATUS_LABEL[order.status as OrderStatus]}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link href={`/admin/orders/${order.id}`} style={{
                        fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)',
                        textDecoration: 'none', padding: '3px 9px', borderRadius: 6,
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
