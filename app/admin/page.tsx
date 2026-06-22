import React from 'react';
import { prisma } from '@/lib/prisma';
import { STATUS_COLOR, STATUS_BG, STATUS_LABEL, type OrderStatus } from '@/lib/types';
import { getIntegrations, integrationScore } from '@/lib/integrations';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [revenueAgg, orderCount, customerCount, designCount, pendingCount, deliveredCount, recent] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.designAsset.count(),
    prisma.order.count({ where: { status: { in: ['PAID', 'IN_PRODUCTION'] } } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, email: true } }, items: { include: { designAsset: true } } },
    }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;
  const integrations = getIntegrations();
  const readiness = integrationScore(integrations);
  const missingIntegrations = integrations.filter(i => i.status === 'missing');
  type ORow = (typeof recent)[number];

  // SVG icons for stat cards — inline, no emoji
  const statIcons: Record<string, React.ReactNode> = {
    revenue: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M6 7h3a1 1 0 010 2H6"/></svg>,
    orders: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><path d="M2 2h2l1.5 7h7l1.5-5H5"/><circle cx="6.5" cy="12.5" r="1"/><circle cx="12.5" cy="12.5" r="1"/></svg>,
    customers: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/><circle cx="12" cy="5" r="2"/><path d="M12 10c1.7 0 3 1.3 3 3"/></svg>,
    progress: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
    delivered: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>,
    designs: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/></svg>,
    integrations: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><path d="M5.5 5.5h5v5h-5z" /><path d="M8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4" /></svg>,
  };

  const statCards = [
    { label: 'Total Revenue',  value: `$${revenue.toFixed(2)}`, iconKey: 'revenue',   color: '#10B981' },
    { label: 'Total Orders',   value: orderCount,               iconKey: 'orders',    color: '#3B82F6' },
    { label: 'Customers',      value: customerCount,            iconKey: 'customers', color: '#8B5CF6' },
    { label: 'In Progress',    value: pendingCount,             iconKey: 'progress',  color: '#F59E0B' },
    { label: 'Delivered',      value: deliveredCount,           iconKey: 'delivered', color: '#10B981' },
    { label: 'Designs Saved',  value: designCount,              iconKey: 'designs',   color: '#00E5C8' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Overview</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>All-time stats</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12, marginBottom: '2.5rem' }}>
        {statCards.map((s, i) => (
          <div key={s.label} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            {/* Ghost number watermark */}
            <div style={{ position: 'absolute', bottom: -8, right: 6, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '3.5rem', color: `${s.color}08`, letterSpacing: '0.02em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: s.color, opacity: 0.7 }}>{statIcons[s.iconKey]}</span>{s.label}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.9rem', fontWeight: 400, letterSpacing: '0.02em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '2.5rem' }}>
        {[
          { href: '/admin/orders',    iconKey: 'orders',    label: 'Manage Orders',  desc: `${orderCount} total`,          color: '#3B82F6' },
          { href: '/admin/customers', iconKey: 'customers', label: 'Customers',      desc: `${customerCount} registered`,  color: '#8B5CF6' },
          { href: '/admin/designs',   iconKey: 'designs',   label: 'Saved Designs',  desc: `${designCount} assets`,        color: '#00E5C8' },
        ].map(q => (
          <Link key={q.href} href={q.href} className="scan-card holo-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1.35rem 1.5rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', textDecoration: 'none', transition: 'transform 0.18s, box-shadow 0.18s' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: `${q.color}14`, border: `1px solid ${q.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: q.color, flexShrink: 0 }}>{statIcons[q.iconKey]}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>{q.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>{q.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.18)', fontSize: '0.85rem' }}>→</span>
          </Link>
        ))}
      </div>

      <section className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,0.9fr) minmax(360px,1.4fr)', gap: 12, marginBottom: '2.5rem' }}>
        <Link href="/admin/integrations" className="scan-card holo-card" style={{ borderRadius: 16, border: '1px solid rgba(0,229,200,0.16)', background: 'linear-gradient(145deg,rgba(0,229,200,0.08),rgba(255,255,255,0.025))', padding: '1.35rem 1.5rem', textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,153,255,0.16),transparent 64%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#00E5C8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Production readiness</div>
              <span style={{ color: 'rgba(255,255,255,0.36)' }}>{statIcons.integrations}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 8, marginTop: 10 }}>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '3.4rem', color: '#00E5C8', lineHeight: 0.95 }}>{readiness}</div>
              <div style={{ color: 'rgba(255,255,255,0.36)', fontWeight: 900, marginBottom: 7 }}>/100</div>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 10 }}>
              <div style={{ width: `${readiness}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#00E5C8,#0099FF)' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem', lineHeight: 1.55, marginTop: 12 }}>
              {missingIntegrations.length ? `${missingIntegrations.map(i => i.name).join(', ')} still need setup.` : 'Core integrations are configured. Run a live launch test.'}
            </p>
          </div>
        </Link>

        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '1.35rem 1.5rem' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Premium launch checklist</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Real payment before paid status', done: integrations.find(i => i.key === 'stripe')?.status === 'live' },
              { label: 'AI helper key stored server-side', done: integrations.find(i => i.key === 'openai')?.status !== 'missing' },
              { label: 'Fulfillment provider configured', done: integrations.find(i => i.key === 'printify')?.status !== 'missing' },
              { label: 'Orders, customers, designs, artists dashboard live', done: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 9, color: item.done ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.5)', fontSize: '0.76rem', fontWeight: 700 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, border: `1px solid ${item.done ? 'rgba(16,185,129,0.45)' : 'rgba(245,158,11,0.4)'}`, background: item.done ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)', color: item.done ? '#10B981' : '#F59E0B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.done ? <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.4 6.4l2.1 2.1 5-5" /></svg> : <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: '0.72rem', color: 'rgba(0,229,200,0.7)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
            <svg viewBox="0 0 32 32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={36} height={36} style={{ marginBottom: 10, display: 'inline-block' }} aria-hidden="true"><path d="M4 4h4l3 14h14l3-10H10"/><circle cx="13" cy="24" r="2"/><circle cx="25" cy="24" r="2"/></svg>
            <p>No orders yet</p>
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
            <table aria-label="Recent orders" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Order', 'Customer', 'Design', 'Total', 'Status', 'Date', ''].map(h => (
                    <th key={h} scope="col" style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((order: ORow, i: number) => {
                  const item = order.items[0];
                  const design = item?.designAsset;
                  return (
                    <tr key={order.id} className="admin-tr" style={{ borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: design.colorHex, border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '0.9rem', letterSpacing: '0.02em', color: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>{design.title?.charAt(0).toUpperCase() ?? '?'}</div>
                            <div>
                              <div style={{ fontSize: '0.77rem', fontWeight: 600 }}>{design.title}</div>
                              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)' }}>{design.colorName} · {design.size}</div>
                            </div>
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '0.88rem' }}>${order.total.toFixed(2)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: STATUS_COLOR[order.status as OrderStatus], background: STATUS_BG[order.status as OrderStatus], border: `1px solid ${STATUS_COLOR[order.status as OrderStatus]}33` }}>
                          {STATUS_LABEL[order.status as OrderStatus]}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Link href={`/admin/orders/${order.id}`} style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>View →</Link>
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
