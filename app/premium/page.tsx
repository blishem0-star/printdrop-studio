'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPE_EMOJI, PRODUCT_BASE_PRICE, buildProductSvg } from '@/lib/productTypes';
import type { ProductType } from '@/lib/productTypes';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string; role?: string };
type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
type Subscription = {
  id: string; status: SubscriptionStatus; stylePrefs: string;
  nextShipmentAt: string;
  shipments: { id: string; status: string; createdAt: string; items: string }[];
};

const STYLES = [
  { id: 'minimal',    label: 'Minimal',    desc: 'Clean lines, muted tones',      icon: '◾', color: '#94A3B8' },
  { id: 'bold',       label: 'Bold',       desc: 'High contrast, graphic prints',  icon: '⚡', color: '#F59E0B' },
  { id: 'urban',      label: 'Urban',      desc: 'Street art, city vibes',         icon: '🏙', color: '#6366F1' },
  { id: 'nature',     label: 'Nature',     desc: 'Earth tones, organic shapes',    icon: '🌿', color: '#10B981' },
  { id: 'vintage',    label: 'Vintage',    desc: 'Retro prints, faded palette',    icon: '🎞', color: '#D97706' },
  { id: 'streetwear', label: 'Streetwear', desc: 'Oversized, logo-forward',        icon: '🔥', color: '#EF4444' },
];

const ALL_PRODUCT_TYPES: ProductType[] = ['TSHIRT', 'LONG_SLEEVE', 'HOODIE', 'HOODIE_VEST', 'SOCKS'];
const MONTHLY_PRICE = 59.99;
const ITEMS_PER_BOX = 3;

export default function PremiumPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>(['TSHIRT', 'HOODIE']);
  const [prefSize, setPrefSize] = useState('M');
  const [step, setStep] = useState<'intro' | 'customize' | 'confirm' | 'success'>('intro');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      setSession(sess);
      if (sess.customerId) {
        fetch(`/api/subscription?customerId=${sess.customerId}`)
          .then(r => r.json())
          .then(s => { setSubscription(s); })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch { router.replace('/'); }
  }, [router]);

  function toggleType(t: ProductType) {
    setSelectedTypes(prev =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]
    );
  }

  async function subscribe() {
    if (!session?.customerId || !selectedStyle || selectedTypes.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: session.customerId,
          stylePrefs: { style: selectedStyle, productTypes: selectedTypes, size: prefSize },
        }),
      });
      if (res.ok) {
        const sub = await res.json();
        setSubscription(sub);
        setStep('success');
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  async function cancelSubscription() {
    if (!subscription) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id, status: 'CANCELLED' }),
      });
      if (res.ok) setSubscription(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch { /* ignore */ }
    finally { setCancelling(false); }
  }

  async function pauseSubscription() {
    if (!subscription) return;
    const newStatus = subscription.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    const res = await fetch('/api/subscription', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subscription.id, status: newStatus }),
    });
    if (res.ok) setSubscription(prev => prev ? { ...prev, status: newStatus } : null);
  }

  const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '1.5rem' };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, background: 'rgba(8,8,8,0.96)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer' }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '-0.03em' }}>✨ PrintDrop Premium</span>
        <div style={{ flex: 1 }} />
        {subscription?.status === 'ACTIVE' && (
          <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'linear-gradient(90deg,rgba(255,77,28,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(255,77,28,0.3)', color: '#FF8C40' }}>PREMIUM ACTIVE</span>
        )}
      </header>

      {/* Active subscription management */}
      {subscription && subscription.status !== 'CANCELLED' ? (
        <ActiveSubscription
          subscription={subscription}
          onPause={pauseSubscription}
          onCancel={cancelSubscription}
          cancelling={cancelling}
          card={card}
        />
      ) : (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 2rem' }}>

          {/* Hero */}
          {step === 'intro' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', fontSize: '0.7rem', fontWeight: 700, padding: '4px 14px', borderRadius: 999, background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.2)', color: '#FF8C40', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✨ Monthly Box</div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '1rem', lineHeight: 1.1 }}>
                  3 items, curated for<br />
                  <span style={{ background: 'linear-gradient(135deg,#FF4D1C,#FF8C40)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your style</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
                  Every month we pick 3 pieces that match your style — tees, hoodies, long sleeves or socks. Printed fresh, shipped to your door.
                </p>
              </div>

              {/* Product showcase */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '2.5rem' }}>
                {ALL_PRODUCT_TYPES.map(t => (
                  <div key={t} style={{ ...card, textAlign: 'center', padding: '1rem 0.5rem' }}>
                    <div dangerouslySetInnerHTML={{ __html: buildProductSvg(t, { fill: '#1e1e1e', stroke: 'rgba(255,255,255,0.15)', size: 80 }) }} style={{ display: 'flex', justifyContent: 'center' }} />
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{PRODUCT_TYPE_LABELS[t]}</div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>from ${PRODUCT_BASE_PRICE[t]}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '2.5rem' }}>
                {[
                  { n: '01', title: 'Pick your style', desc: 'Tell us your aesthetic — minimal, bold, urban, and more.' },
                  { n: '02', title: 'We curate 3 items', desc: 'Our team selects designs matching your vibe, freshly printed.' },
                  { n: '03', title: 'Ships every month', desc: 'Delivered on the 1st of each month. Pause or cancel anytime.' },
                ].map(s => (
                  <div key={s.n} style={{ ...card }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,77,28,0.5)', letterSpacing: '0.1em', marginBottom: 8 }}>{s.n}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Price card */}
              <div style={{ background: 'linear-gradient(135deg,rgba(255,77,28,0.06),rgba(139,92,246,0.06))', border: '1px solid rgba(255,77,28,0.2)', borderRadius: 20, padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Monthly Box</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em' }}>${MONTHLY_PRICE}</span>
                  <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.4)' }}>/month</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem' }}>
                  {ITEMS_PER_BOX} curated items · Free shipping · Cancel anytime
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {['🎁 Surprise box', '🚚 Free delivery', '⏸ Pause anytime', '💳 Billed monthly'].map(f => (
                    <span key={f} style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
                <button onClick={() => setStep('customize')} style={{ padding: '0.875rem 3rem', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#FF4D1C,#FF8C40)', color: '#fff', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,77,28,0.35)', letterSpacing: '-0.01em' }}>
                  Get started →
                </button>
              </div>
            </>
          )}

          {/* Step: Customize */}
          {step === 'customize' && (
            <div>
              <button onClick={() => setStep('intro')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Back</button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>Customize your box</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginBottom: '2rem' }}>These preferences guide what we pick for you each month.</p>

              {/* Style picker */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Your Style *</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setSelectedStyle(s.id)} style={{ padding: '0.875rem', borderRadius: 14, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${selectedStyle === s.id ? s.color + '66' : 'rgba(255,255,255,0.07)'}`, background: selectedStyle === s.id ? s.color + '11' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s', position: 'relative' }}>
                      {selectedStyle === s.id && <div style={{ position: 'absolute', top: 8, right: 10, width: 16, height: 16, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#000', fontWeight: 900 }}>✓</div>}
                      <div style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: selectedStyle === s.id ? s.color : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product type picker */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Product types *</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {ALL_PRODUCT_TYPES.map(t => {
                    const on = selectedTypes.includes(t);
                    return (
                      <button key={t} onClick={() => toggleType(t)} style={{ padding: '0.75rem 0.5rem', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${on ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.07)'}`, background: on ? 'rgba(255,77,28,0.07)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                        <div dangerouslySetInnerHTML={{ __html: buildProductSvg(t, { fill: on ? '#FF4D1C' : '#2a2a2a', stroke: on ? 'rgba(255,77,28,0.3)' : 'rgba(255,255,255,0.1)', size: 56 }) }} style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }} />
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: on ? '#FF8C40' : 'rgba(255,255,255,0.4)' }}>{PRODUCT_TYPE_LABELS[t]}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Select all types you want to receive</div>
              </div>

              {/* Size */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Your Size</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['XS','S','M','L','XL','XXL'].map(s => (
                    <button key={s} onClick={() => setPrefSize(s)} style={{ width: 46, height: 46, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${prefSize === s ? '#FF4D1C' : 'rgba(255,255,255,0.08)'}`, background: prefSize === s ? 'rgba(255,77,28,0.1)' : 'rgba(255,255,255,0.02)', color: prefSize === s ? '#FF8C40' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s', transform: prefSize === s ? 'scale(1.08)' : 'scale(1)' }}>{s}</button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep('confirm')} disabled={!selectedStyle || selectedTypes.length === 0} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: selectedStyle ? 'linear-gradient(135deg,#FF4D1C,#FF8C40)' : 'rgba(255,255,255,0.05)', color: selectedStyle ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.95rem', cursor: selectedStyle ? 'pointer' : 'default', boxShadow: selectedStyle ? '0 8px 24px rgba(255,77,28,0.3)' : 'none', transition: 'all 0.2s' }}>
                Review order →
              </button>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div>
              <button onClick={() => setStep('customize')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Back</button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1.75rem' }}>Confirm your box</h2>

              <div style={{ ...card, marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Your Preferences</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Row label="Style" value={STYLES.find(s => s.id === selectedStyle)?.label ?? ''} />
                  <Row label="Products" value={selectedTypes.map(t => PRODUCT_TYPE_LABELS[t]).join(', ')} />
                  <Row label="Size" value={prefSize} />
                  <Row label="Items/month" value={`${ITEMS_PER_BOX} items`} />
                </div>
              </div>

              <div style={{ ...card, background: 'rgba(255,77,28,0.03)', border: '1px solid rgba(255,77,28,0.15)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Monthly box ({ITEMS_PER_BOX} items)</span>
                  <span style={{ fontWeight: 700 }}>${MONTHLY_PRICE}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Shipping</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                  <span>Total/month</span>
                  <span style={{ color: '#FF8C40', fontSize: '1.1rem' }}>${MONTHLY_PRICE}</span>
                </div>
              </div>

              <div style={{ padding: '0.875rem 1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.72rem', color: 'rgba(245,158,11,0.7)', lineHeight: 1.6 }}>
                🔒 Payment integration coming soon — Stripe recurring billing will be connected here. Your subscription is saved.
              </div>

              <button onClick={subscribe} disabled={submitting} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: !submitting ? 'linear-gradient(135deg,#FF4D1C,#FF8C40)' : 'rgba(255,255,255,0.05)', color: !submitting ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: '0.95rem', cursor: !submitting ? 'pointer' : 'default', boxShadow: '0 8px 24px rgba(255,77,28,0.3)', transition: 'all 0.2s' }}>
                {submitting ? 'Activating...' : `Activate Premium — $${MONTHLY_PRICE}/mo`}
              </button>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>Premium activated!</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2rem' }}>Your first box ships on the 1st of next month.</p>
              <button onClick={() => router.push('/home')} style={{ padding: '0.875rem 2.5rem', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#FF4D1C,#FF8C40)', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>← Back to home</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ActiveSubscription({ subscription, onPause, onCancel, cancelling, card }: {
  subscription: Subscription;
  onPause: () => void;
  onCancel: () => void;
  cancelling: boolean;
  card: React.CSSProperties;
}) {
  const prefs = (() => { try { return JSON.parse(subscription.stylePrefs); } catch { return {}; } })();
  const statusColor = subscription.status === 'ACTIVE' ? '#10B981' : '#F59E0B';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>✨</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 6 }}>Your Premium Box</h1>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '3px 12px', borderRadius: 999, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, color: statusColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{subscription.status}</span>
      </div>

      <div style={{ ...card, marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Preferences</div>
        <Row label="Style" value={prefs.style ?? '—'} />
        <div style={{ height: 8 }} />
        <Row label="Products" value={(prefs.productTypes ?? []).map((t: ProductType) => PRODUCT_TYPE_LABELS[t]).join(', ')} />
        <div style={{ height: 8 }} />
        <Row label="Size" value={prefs.size ?? '—'} />
        <div style={{ height: 8 }} />
        <Row label="Next shipment" value={new Date(subscription.nextShipmentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
      </div>

      {subscription.shipments.length > 0 && (
        <div style={{ ...card, marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Shipment History</div>
          {subscription.shipments.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Box #{s.id.slice(0,6).toUpperCase()}</span>
              <span style={{ color: s.status === 'DELIVERED' ? '#10B981' : s.status === 'SHIPPED' ? '#8B5CF6' : '#F59E0B', fontWeight: 600, fontSize: '0.72rem' }}>{s.status}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onPause} style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)', color: '#F59E0B', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
          {subscription.status === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={onCancel} disabled={cancelling} style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)', color: '#EF4444', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: cancelling ? 0.5 : 1 }}>
          {cancelling ? '...' : '✕ Cancel subscription'}
        </button>
      </div>
    </div>
  );
}
