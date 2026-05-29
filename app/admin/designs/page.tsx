import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

export default async function AdminDesignsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page = '1' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);

  const [designs, totalCount] = await Promise.all([
    prisma.designAsset.findMany({
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: { orderItems: { take: 1, include: { order: { include: { customer: { select: { name: true } } } } } } },
    }),
    prisma.designAsset.count(),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Design Assets</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: 4 }}>
          {totalCount} total · page {pageNum} of {totalPages || 1}
        </p>
      </div>

      {designs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
          <p>No designs yet. Place an order from the studio!</p>
        </div>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {designs.map((d: (typeof designs)[number]) => {
            const order = d.orderItems[0]?.order;
            return (
              <div key={d.id} style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                {/* Preview */}
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${d.colorHex}22`, borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  {d.filePath ? (
                    <Image src={d.filePath} alt={d.title} width={100} height={115} style={{ objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: 64 }}>{d.emoji ?? '👕'}</div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 8, background: d.colorHex, border: '2px solid rgba(255,255,255,0.15)' }} />
                </div>

                {/* Info */}
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{d.title}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    {[d.colorName, `Size ${d.size}`].map(t => (
                      <span key={t} style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>{t}</span>
                    ))}
                    {d.customText && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(0,229,200,0.08)', color: '#00E5C8', border: '1px solid rgba(0,229,200,0.2)' }}>✏ {d.customText}</span>
                    )}
                  </div>

                  {order ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                        {order.customer.name}
                      </div>
                      <Link href={`/admin/orders/${order.id}`} style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                        View order →
                      </Link>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>No order linked</div>
                  )}

                  {d.filePath && (
                    <a href={d.filePath} download style={{ display: 'block', marginTop: 8, fontSize: '0.68rem', color: '#00E5C8', textDecoration: 'none', fontWeight: 600 }}>
                      ↓ Download print file
                    </a>
                  )}

                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', marginTop: 8 }}>
                    {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
              {(pageNum - 1) * PAGE_SIZE + 1}–{Math.min(pageNum * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {pageNum > 1 && <Link href={`/admin/designs?page=${pageNum - 1}`} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>← Prev</Link>}
              {pageNum < totalPages && <Link href={`/admin/designs?page=${pageNum + 1}`} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Next →</Link>}
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
