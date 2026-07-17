import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StatusButtons } from './StatusButtons';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { designAsset: true } } },
  });

  if (!order) notFound();

  const design = order.items[0]?.designAsset;

  return (
    <div style={{ maxWidth: 860 }} aria-label={`Order #${order.id.slice(0, 8).toUpperCase()} details`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <Link href="/admin/orders" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.8rem' }}>Orders</Link>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
        <h1 style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>#{order.id.slice(0, 8).toUpperCase()}</h1>
      </div>

      <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Design */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Design</div>
            {design ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {design.filePath ? (
                  <Image src={design.filePath} alt={design.title} width={80} height={92} style={{ borderRadius: 10, background: design.colorHex }} />
                ) : (
                  <div style={{ width: 80, height: 92, borderRadius: 10, background: design.colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>{design.emoji}</div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{design.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[design.colorName, `Size ${design.size}`, 'DTG Print'].map(t => (
                      <span key={t} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>{t}</span>
                    ))}
                  </div>
                  {design.customText && (
                    <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      Custom text: <strong style={{ color: 'white' }}>&ldquo;{design.customText}&rdquo;</strong>
                    </div>
                  )}
                  {design.filePath && (
                    <a href={design.filePath} download style={{ display: 'inline-block', marginTop: 12, fontSize: '0.72rem', color: '#00E5C8', textDecoration: 'none', fontWeight: 600 }}>
                      ↓ Download print file
                    </a>
                  )}
                </div>
              </div>
            ) : <p style={{ color: 'rgba(255,255,255,0.25)' }}>No design</p>}
          </div>

          {/* Shipping */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Shipping address</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{order.shippingName}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              {order.shippingAddr}<br />
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
            {order.notes && (
              <div style={{ marginTop: 12, padding: '0.7rem 0.9rem', borderRadius: 10, background: 'rgba(0,229,200,0.05)', border: '1px solid rgba(0,229,200,0.15)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-line' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(0,229,200,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Delivery notes</span>
                {order.notes}
              </div>
            )}
          </div>

          {/* Customer */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Customer</div>
            <p style={{ fontWeight: 600 }}>{order.customer.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginTop: 4 }}>{order.customer.email}</p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Status */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Status</div>
            <StatusButtons orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Summary */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Summary</div>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>× {item.qty} shirt</span>
                <span>${item.unitPrice.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: '#00E5C8' }}>${order.total.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
              Placed {new Date(order.createdAt).toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
