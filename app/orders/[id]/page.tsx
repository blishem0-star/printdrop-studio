import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { STATUS_LABEL } from '@/lib/types';
import { CancelButton } from './CancelButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Track your order request',
  description: 'Follow your STYLX order request from review to fulfillment.',
  robots: { index: false }, // order pages are private, keep them out of search
};

const STATUS_FLOW = ['DRAFT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'] as const;

export default async function OrderTrackingPage(
  { params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ email?: string }> }
) {
  const { id } = await params;
  const { email } = await searchParams;
  const session = await getSession();

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true, status: true, total: true, createdAt: true, updatedAt: true,
      shippingCity: true, shippingState: true,
      customerId: true, customer: { select: { email: true } },
      items: { select: { unitPrice: true, qty: true, designAsset: { select: { title: true, colorName: true, size: true } } } },
    },
  });

  // Authorization: the logged-in owner of the order, or a guest who knows the order email
  const authorized = !!order && (
    (session && session.id === order.customerId) ||
    (!!email && email.toLowerCase().trim() === order.customer.email)
  );

  if (!order || !authorized) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '2rem', letterSpacing: '0.05em', marginBottom: 8 }}>Track your order request</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: 20 }}>
            {order ? 'Enter the email used for this order request to view its status.' : 'Order not found - check the link, or verify with your email below.'}
          </p>
          <form method="GET" style={{ display: 'flex', gap: 8 }}>
            <input name="email" type="email" required placeholder="you@example.com" defaultValue={email ?? ''}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
            <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: 10, background: '#00E5C8', color: '#03241F', fontWeight: 800, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>View</button>
          </form>
          <Link href="/home" style={{ display: 'inline-block', marginTop: 18, color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textDecoration: 'none' }}>Back home</Link>
        </div>
      </div>
    );
  }

  const cancelled = order.status === 'CANCELLED';
  const stepIdx = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(0,229,200,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Order request tracking</div>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '2.4rem', letterSpacing: '0.04em', margin: '0 0 4px' }}>
          {STATUS_LABEL[order.status] ?? order.status}
        </h1>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginBottom: 28 }}>
          Request <span style={{ fontFamily: 'monospace' }}>{order.id.slice(-8).toUpperCase()}</span> - submitted {order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>

        {/* Progress */}
        {cancelled ? (
          <div style={{ padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: '0.85rem', marginBottom: 28 }}>
            This order was cancelled. If that&apos;s unexpected, contact support.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {STATUS_FLOW.map((s, i) => (
              <div key={s} style={{ flex: i < STATUS_FLOW.length - 1 ? 1 : 'none', display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: i <= stepIdx ? 'rgba(0,229,200,0.15)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${i <= stepIdx ? '#00E5C8' : 'rgba(255,255,255,0.12)'}` }}>
                    {i < stepIdx ? (
                      <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="#00E5C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 6.5l2.5 2.5L10 3.5" /></svg>
                    ) : (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: i <= stepIdx ? '#00E5C8' : 'rgba(255,255,255,0.18)' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: i <= stepIdx ? 'rgba(0,229,200,0.85)' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{STATUS_LABEL[s]}</div>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div style={{ flex: 1, height: 1.5, margin: '0 8px 18px', background: i < stepIdx ? 'rgba(0,229,200,0.5)' : 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Items */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
          {order.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{it.designAsset?.title ?? 'Custom design'}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>{it.designAsset?.colorName} - {it.designAsset?.size}{it.qty > 1 ? ` - x${it.qty}` : ''}</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.1rem' }}>${(it.unitPrice * it.qty).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Total (incl. shipping)</span>
            <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.3rem', color: '#00E5C8' }}>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.status === 'DRAFT' && <CancelButton orderId={order.id} email={email} />}

        <div style={{ marginTop: 16, fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
          Delivery details: {order.shippingCity}, {order.shippingState} - Last update {order.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <Link href="/home" style={{ display: 'inline-block', marginTop: 20, color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textDecoration: 'none' }}>Back home</Link>
      </div>
    </div>
  );
}
