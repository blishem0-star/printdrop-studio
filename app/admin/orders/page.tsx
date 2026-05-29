import { prisma } from '@/lib/prisma';
import { STATUS_COLOR, STATUS_BG, STATUS_LABEL, type OrderStatus } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const VALID_STATUSES = ['DRAFT','PAID','IN_PRODUCTION','SHIPPED','DELIVERED','CANCELLED'];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const { page = '1', status = '' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const statusFilter = VALID_STATUSES.includes(status) ? (status as OrderStatus) : null;
  const where = statusFilter ? { status: statusFilter } : undefined;

  const [orders, totalCount, allStats] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, items: { include: { designAsset: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { status: { not: 'CANCELLED' } },
    }),
  ]);

  const [pendingCount, deliveredCount] = await Promise.all([
    prisma.order.count({ where: { status: { in: ['PAID', 'IN_PRODUCTION'] } } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  type ORow = (typeof orders)[number];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Orders</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>
          {totalCount} total orders · page {pageNum} of {totalPages || 1}
        </p>
      </div>

      {/* Stats */}
      <div className="rsp-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Total orders', value: totalCount,                                           color: '#3B82F6' },
          { label: 'Revenue',      value: `$${(allStats._sum.total ?? 0).toFixed(2)}`,          color: '#10B981' },
          { label: 'In progress',  value: pendingCount,                                          color: '#F59E0B' },
          { label: 'Delivered',    value: deliveredCount,                                        color: '#00E5C8' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.9rem', fontWeight: 400, letterSpacing: '0.02em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[{ label: `All`, value: '' }, ...VALID_STATUSES.map(s => ({ label: s.replace('_',' '), value: s }))].map(f => (
          <Link key={f.value} href={`/admin/orders?status=${f.value}`} aria-current={statusFilter === f.value ? 'page' : undefined} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: statusFilter === f.value ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)', background: statusFilter === f.value ? 'rgba(0,229,200,0.08)' : 'transparent', color: statusFilter === f.value ? '#00E5C8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}>{f.label}</Link>
        ))}
      </div>

      {totalCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p>No orders yet</p>
        </div>
      ) : (
        <>
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                Showing {(pageNum - 1) * PAGE_SIZE + 1}–{Math.min(pageNum * PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {pageNum > 1 && (
                  <Link href={`/admin/orders?page=${pageNum - 1}`} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>← Prev</Link>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = pageNum <= 3 ? i + 1 : pageNum - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <Link key={pg} href={`/admin/orders?page=${pg}`} style={{ padding: '5px 11px', borderRadius: 8, border: `1px solid ${pg === pageNum ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.08)'}`, background: pg === pageNum ? 'rgba(0,229,200,0.1)' : 'rgba(255,255,255,0.03)', color: pg === pageNum ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>{pg}</Link>
                  );
                })}
                {pageNum < totalPages && (
                  <Link href={`/admin/orders?page=${pageNum + 1}`} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Next →</Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
