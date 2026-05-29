import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DesignActionButtons } from './DesignActionButtons';

export const dynamic = 'force-dynamic';

type FilterVal = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_STYLE = {
  PENDING:  { label: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  APPROVED: { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  REJECTED: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
} as const;

export default async function AdminArtistsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'PENDING' } = await searchParams;
  const activeFilter = (['ALL', 'PENDING', 'APPROVED', 'REJECTED'].includes(filter) ? filter : 'PENDING') as FilterVal;

  const [designs, counts] = await Promise.all([
    prisma.artistDesign.findMany({
      where: activeFilter === 'ALL' ? {} : { status: activeFilter },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { artist: { select: { name: true, email: true } } },
    }),
    prisma.artistDesign.groupBy({ by: ['status'], _count: { id: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count.id]));
  const pending  = countMap['PENDING']  ?? 0;
  const approved = countMap['APPROVED'] ?? 0;
  const total    = (countMap['PENDING'] ?? 0) + (countMap['APPROVED'] ?? 0) + (countMap['REJECTED'] ?? 0);

  const totalEarned = await prisma.artistDesign.aggregate({ _sum: { totalEarned: true } });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Artist Designs</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>Review and approve artist submissions</p>
      </div>

      {/* Stats */}
      <div className="rsp-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Pending Review', value: pending,          icon: '⏳', color: '#F59E0B' },
          { label: 'Approved',       value: approved,         icon: '✅', color: '#10B981' },
          { label: 'Total Designs',  value: total,            icon: '🎨', color: '#8B5CF6' },
          { label: 'Total Paid Out', value: `$${(totalEarned._sum.totalEarned ?? 0).toFixed(2)}`, icon: '💰', color: '#3B82F6' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.icon} {s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.9rem', fontWeight: 400, letterSpacing: '0.02em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: '1.5rem' }}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
          <Link key={f} href={`/admin/artists?filter=${f}`} aria-current={activeFilter === f ? 'page' : undefined} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: activeFilter === f ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)', background: activeFilter === f ? 'rgba(0,229,200,0.08)' : 'transparent', color: activeFilter === f ? '#00E5C8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}>
            {f === 'ALL' ? `All (${total})` : f === 'PENDING' ? `Pending (${pending})` : f}
          </Link>
        ))}
      </div>

      {designs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: 'rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎨</div>
          <p>{activeFilter === 'PENDING' ? 'No pending designs to review' : 'No designs found'}</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Design', 'Artist', 'Price / Earnings', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designs.map((d, i) => {
                const s = STATUS_STYLE[d.status as keyof typeof STATUS_STYLE];
                return (
                  <tr key={d.id} style={{ borderBottom: i < designs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {d.svg.startsWith('<svg') ? (
                            <div style={{ width: 32, height: 32 }} dangerouslySetInnerHTML={{ __html: d.svg.replace(/currentColor/g,'rgba(255,255,255,0.7)').replace('<svg ','<svg width="32" height="32" ') }} />
                          ) : (
                            <img src={d.svg} alt={d.title} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{d.title}</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{d.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{d.artist.name}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{d.artist.email}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>${d.price.toFixed(2)}</div>
                      <div style={{ fontSize: '0.62rem', color: '#00E5C8' }}>Artist: ${(d.price * 0.5).toFixed(2)}</div>
                      {d.salesCount > 0 && <div style={{ fontSize: '0.6rem', color: '#10B981', marginTop: 1 }}>{d.salesCount} sold · ${d.totalEarned.toFixed(2)} paid</div>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                      {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <DesignActionButtons id={d.id} status={d.status} />
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
