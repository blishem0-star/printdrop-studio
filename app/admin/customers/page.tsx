import { prisma } from '@/lib/prisma';
import { CONFIRMED_ORDER_STATUSES, isConfirmedOrderStatus } from '@/lib/orderStatus';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page = '1', q = '' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const query = q.trim().slice(0, 100);
  const where = query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }] } : undefined;

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: { id: true, status: true, total: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const [withOrdersCount, totalRevResult] = await Promise.all([
    prisma.customer.count({ where: { orders: { some: {} } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: CONFIRMED_ORDER_STATUSES } } }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const totalRevenue = totalRevResult._sum.total ?? 0;

  type CustRow = (typeof customers)[number];
  type OrderRow = CustRow['orders'][number];

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Customers</h1>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>
            {totalCount} {query ? `results for "${query}"` : 'registered'} - page {pageNum} of {totalPages || 1}
          </p>
        </div>
        <form method="GET" action="/admin/customers" style={{ display: 'flex', gap: 6 }}>
          <input type="search" name="q" defaultValue={query} placeholder="Search name or email..." maxLength={100} aria-label="Search customers" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: '0.78rem', outline: 'none', width: 220 }} />
          <button type="submit" style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,229,200,0.3)', background: 'rgba(0,229,200,0.08)', color: '#00E5C8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Search</button>
          {query && <Link href="/admin/customers" aria-label="Clear search" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}><svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg></Link>}
        </form>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Total customers', value: totalCount,                  color: '#3B82F6' },
          { label: 'With orders',     value: withOrdersCount,             color: '#00E5C8' },
          { label: 'Confirmed value', value: `$${totalRevenue.toFixed(2)}`, color: '#10B981' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.9rem', fontWeight: 400, letterSpacing: '0.02em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {totalCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <svg viewBox="0 0 32 32" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={40} height={40} style={{ marginBottom: 12, display: 'inline-block' }} aria-hidden="true"><circle cx="12" cy="10" r="5"/><path d="M2 28c0-5.5 4.5-10 10-10s10 4.5 10 10"/><circle cx="24" cy="10" r="4"/><path d="M24 20c3.3 0 6 2.7 6 6"/></svg>
          <p>No customers yet</p>
        </div>
      ) : (
        <>
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
            <table aria-label="Customers list" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Customer', 'Email', 'Account', 'Orders', 'Confirmed', 'Joined', ''].map(h => (
                    <th key={h} scope="col" style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: CustRow, i: number) => {
                  const customerRevenue = customer.orders
                    .filter((o: OrderRow) => isConfirmedOrderStatus(o.status))
                    .reduce((s: number, o: OrderRow) => s + o.total, 0);
                  const hasPassword = !!customer.password;
                  return (
                    <tr key={customer.id} className="admin-tr" style={{ borderBottom: i < customers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: `hsl(${customer.name.charCodeAt(0) * 5 % 360},40%,25%)`,
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)',
                          }}>
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{customer.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                        {customer.email}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                          fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: hasPassword ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                          color: hasPassword ? '#10B981' : 'rgba(255,255,255,0.28)',
                          border: `1px solid ${hasPassword ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                          {hasPassword ? 'Registered' : 'Guest'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.88rem' }}>
                        {customer.orders.length > 0 ? (
                          <span>{customer.orders.length}</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.88rem', color: customerRevenue > 0 ? '#10B981' : 'rgba(255,255,255,0.2)' }}>
                        {customerRevenue > 0 ? `$${customerRevenue.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                        {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {customer.orders.length > 0 && (
                          <Link href={`/admin/orders?customer=${customer.id}`} style={{
                            fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                            textDecoration: 'none', padding: '3px 9px', borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
                          }}>Orders</Link>
                        )}
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
                Showing {(pageNum - 1) * PAGE_SIZE + 1}-{Math.min(pageNum * PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {pageNum > 1 && (
                  <Link href={`/admin/customers?page=${pageNum - 1}`} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Prev</Link>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = pageNum <= 3 ? i + 1 : pageNum - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <Link key={pg} href={`/admin/customers?page=${pg}`} aria-current={pg === pageNum ? 'page' : undefined} style={{ padding: '5px 11px', borderRadius: 8, border: `1px solid ${pg === pageNum ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.08)'}`, background: pg === pageNum ? 'rgba(0,229,200,0.1)' : 'rgba(255,255,255,0.03)', color: pg === pageNum ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>{pg}</Link>
                  );
                })}
                {pageNum < totalPages && (
                  <Link href={`/admin/customers?page=${pageNum + 1}`} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Next</Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
