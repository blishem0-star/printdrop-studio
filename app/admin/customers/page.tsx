import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { orders: true },
  });

  type CustRow = (typeof customers)[number];
  type OrderRow = CustRow['orders'][number];

  const totalRevenue = customers.reduce((sum: number, c: CustRow) =>
    sum + c.orders.filter((o: OrderRow) => o.status !== 'CANCELLED').reduce((s: number, o: OrderRow) => s + o.total, 0), 0
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Customers</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>All registered customers</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Total customers', value: customers.length },
          { label: 'With orders', value: customers.filter((c: CustRow) => c.orders.length > 0).length },
          { label: 'Total revenue', value: `$${totalRevenue.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.125rem 1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p>No customers yet</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Customer', 'Email', 'Account', 'Orders', 'Revenue', 'Joined', ''].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer: CustRow, i: number) => {
                const customerRevenue = customer.orders
                  .filter((o: OrderRow) => o.status !== 'CANCELLED')
                  .reduce((s: number, o: OrderRow) => s + o.total, 0);
                const hasPassword = !!customer.password;
                return (
                  <tr key={customer.id} style={{ borderBottom: i < customers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.88rem', color: customerRevenue > 0 ? '#10B981' : 'rgba(255,255,255,0.2)' }}>
                      {customerRevenue > 0 ? `$${customerRevenue.toFixed(2)}` : '—'}
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
                        }}>Orders →</Link>
                      )}
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
