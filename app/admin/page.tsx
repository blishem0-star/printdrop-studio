import { prisma } from '@/lib/prisma';
import { STATUS_COLOR, STATUS_BG, STATUS_LABEL, type OrderStatus } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [orders, customers, designs] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { customer: true, items: { include: { designAsset: true } } } }),
    prisma.customer.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.designAsset.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  type ORow = (typeof orders)[number];

  const revenue = orders.filter((o: ORow) => o.status !== 'CANCELLED').reduce((s: number, o: ORow) => s + o.total, 0);
  const pending = orders.filter((o: ORow) => o.status === 'PAID' || o.status === 'IN_PRODUCTION').length;
  const delivered = orders.filter((o: ORow) => o.status === 'DELIVERED').length;
  const recent = orders.slice(0, 8);

  const statCards = [
    { label: 'Total Revenue', value: `$${revenue.toFixed(2)}`, icon: '💰', color: '#10B981' },
    { label: 'Total Orders', value: orders.length, icon: '📦', color: '#3B82F6' },
    { label: 'Customers', value: customers.length, icon: '👥', color: '#8B5CF6' },
    { label: 'In Progress', value: pending, icon: '⚡', color: '#F59E0B' },
    { label: 'Delivered', value: delivered, icon: '✅', color: '#10B981' },
    { label: 'Designs Saved', value: designs.length, icon: '🎨', color: '#00E5C8' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Overview</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>All-time stats</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12, marginBottom: '2.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)',
            padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.02)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.04em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '2.5rem' }}>
        {[
          { href: '/admin/orders', icon: '📦', label: 'Manage Orders', desc: `${orders.length} total` },
          { href: '/admin/customers', icon: '👥', label: 'Customers', desc: `${customers.length} registered` },
          { href: '/admin/designs', icon: '🎨', label: 'Saved Designs', desc: `${designs.length} assets` },
        ].map(q => (
          <Link key={q.href} href={q.href} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '1.25rem', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            textDecoration: 'none', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 22 }}>{q.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{q.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{q.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>→</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: '0.72rem', color: 'rgba(0,229,200,0.7)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <p>No orders yet</p>
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Order', 'Customer', 'Design', 'Total', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((order: ORow, i: number) => {
                  const item = order.items[0];
                  const design = item?.designAsset;
                  return (
                    <tr key={order.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{order.customer.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{order.customer.email}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {design ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: design.colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{design.emoji}</div>
                            <div>
                              <div style={{ fontSize: '0.77rem', fontWeight: 600 }}>{design.title}</div>
                              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)' }}>{design.colorName} · {design.size}</div>
                            </div>
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '0.88rem' }}>${order.total.toFixed(2)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
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
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Link href={`/admin/orders/${order.id}`} style={{
                          fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
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
    </div>
  );
}
