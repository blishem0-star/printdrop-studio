'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OWNER_EMAIL } from '@/lib/owner';
import { useToast } from '@/components/Toast';
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPE_EMOJI, PRODUCT_BASE_PRICE, buildProductSvg } from '@/lib/productTypes';
import type { ProductType } from '@/lib/productTypes';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string; role?: string };
type SubStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
type Subscription = { id: string; status: SubStatus; stylePrefs: string; nextShipmentAt: string };

const STYLES = [
  { id: 'minimal',    label: 'Minimal',    desc: 'Clean lines, muted tones',     icon: '◾', color: '#94A3B8' },
  { id: 'bold',       label: 'Bold',       desc: 'High contrast, graphic prints', icon: '⚡', color: '#F59E0B' },
  { id: 'urban',      label: 'Urban',      desc: 'Street art, city vibes',        icon: '🏙', color: '#6366F1' },
  { id: 'nature',     label: 'Nature',     desc: 'Earth tones, organic shapes',   icon: '🌿', color: '#10B981' },
  { id: 'vintage',    label: 'Vintage',    desc: 'Retro prints, faded palette',   icon: '🎞', color: '#D97706' },
  { id: 'streetwear', label: 'Streetwear', desc: 'Oversized, logo-forward',       icon: '🔥', color: '#EF4444' },
];
const ALL_TYPES: ProductType[] = ['TSHIRT', 'LONG_SLEEVE', 'HOODIE', 'HOODIE_VEST', 'SOCKS'];
const MONTHLY = 59.99;

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(false);
  const { show: showToast, element: toastEl } = useToast();

  // Subscribe form
  const [showForm, setShowForm] = useState(false);
  const [selStyle, setSelStyle] = useState('');
  const [selTypes, setSelTypes] = useState<ProductType[]>(['TSHIRT', 'HOODIE']);
  const [prefSize, setPrefSize] = useState('M');
  const [submitting, setSubmitting] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      setSession(sess);
      if (sess.customerId) {
        setSubLoading(true);
        fetch(`/api/subscription?customerId=${sess.customerId}`)
          .then(r => r.json()).then(s => { if (s) setSub(s); }).catch(() => {}).finally(() => setSubLoading(false));
      }
    } catch { router.replace('/'); }
  }, [router]);

  function toggleType(t: ProductType) {
    setSelTypes(prev => prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]);
  }

  async function subscribe() {
    if (!session?.customerId || !selStyle) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: session.customerId, stylePrefs: { style: selStyle, productTypes: selTypes, size: prefSize } }),
      });
      if (res.ok) { setSub(await res.json()); setSubSuccess(true); setShowForm(false); showToast('Subscription activated! 🎉', 'success'); }
      else { showToast('Failed to subscribe. Try again.', 'error'); }
    } catch { showToast('Network error.', 'error'); } finally { setSubmitting(false); }
  }

  async function cancelSub() {
    if (!sub || subActionLoading) return;
    if (!window.confirm('Cancel your subscription? You will still receive boxes already shipped.')) return;
    setSubActionLoading(true);
    try {
      const res = await fetch('/api/subscription', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId: sub.id, customerId: session?.customerId, status: 'CANCELLED' }) });
      if (res.ok) { setSub(prev => prev ? { ...prev, status: 'CANCELLED' } : null); showToast('Subscription cancelled.', 'info'); }
      else { showToast('Failed to cancel. Try again.', 'error'); }
    } catch { showToast('Network error.', 'error'); } finally { setSubActionLoading(false); }
  }

  async function togglePause() {
    if (!sub || subActionLoading) return;
    const newStatus: SubStatus = sub.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    setSubActionLoading(true);
    try {
      const res = await fetch('/api/subscription', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId: sub.id, customerId: session?.customerId, status: newStatus }) });
      if (res.ok) { setSub(prev => prev ? { ...prev, status: newStatus } : null); showToast(newStatus === 'PAUSED' ? 'Subscription paused.' : 'Subscription resumed.', 'info'); }
      else { showToast('Failed to update. Try again.', 'error'); }
    } catch { showToast('Network error.', 'error'); } finally { setSubActionLoading(false); }
  }

  function signOut() {
    try { localStorage.removeItem('pd_session'); } catch { /* */ }
    router.replace('/');
  }

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#050507,#060610)' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  const hasActiveSub = sub && sub.status !== 'CANCELLED';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507 0%,#060610 100%)', color: 'white', position: 'relative' }}>
      {toastEl}
      {/* Background atmosphere */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.04) 0%, transparent 60%)', top: '-5%', left: '55%' }} />
        <div style={{ position: 'absolute', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.035) 0%, transparent 65%)', bottom: '10%', left: '-8%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 58, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 8, background: 'rgba(5,5,7,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.35rem', fontWeight: 400, letterSpacing: '0.04em', marginRight: 16, color: '#fff' }}>
          STYLX<span style={{ color: '#00E5C8' }}>.AI</span>
        </span>

        <button onClick={() => router.push('/design')} style={navBtn('teal')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,200,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,200,0.07)'; }}>
          ✏️ Design Studio
        </button>

        <button onClick={() => router.push('/catalog')} style={navBtn('indigo')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; }}>
          🎨 Catalog
        </button>

        <div style={{ flex: 1 }} />

        {session.type === 'guest' && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.7)' }}>Guest</span>
        )}
        {session.type === 'user' && session.role === 'ARTIST' && (
          <button onClick={() => router.push('/artist')} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.25)', color: '#00E5C8', cursor: 'pointer' }}>🎨 Artist Studio</button>
        )}
        {session.type === 'user' && (
          <button onClick={() => router.push('/profile')} aria-label={`View profile for ${session.name}`}
            style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, background: 'transparent', border: '1px solid transparent', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,229,200,0.15)', border: '1px solid rgba(0,229,200,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, color: '#00E5C8' }}>
              {session.name.charAt(0).toUpperCase()}
            </div>
            {session.name}
          </button>
        )}
        {session.email === OWNER_EMAIL && (
          <a href="/admin" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.2)', color: 'rgba(0,229,200,0.85)', textDecoration: 'none' }}>⚙ Admin</a>
        )}
        <button onClick={signOut} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Sign out</button>
      </header>

      <main className="rsp-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '3.5rem 2rem 5rem', position: 'relative', zIndex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,229,200,0.15), rgba(0,153,255,0.1))', border: '1px solid rgba(0,229,200,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 900, color: '#00E5C8', flexShrink: 0, fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-reveal" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 5 }}>
              Hey {session.name === 'Guest' ? 'there' : session.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', letterSpacing: '0.01em' }}>What do you want to create today?</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: '3.5rem' }}>
          {/* Design Studio card */}
          <button onClick={() => router.push('/design')} className="scan-card holo-card" style={{ padding: '2rem', borderRadius: 20, cursor: 'pointer', textAlign: 'left', background: 'linear-gradient(135deg,rgba(0,229,200,0.06),rgba(0,229,200,0.015))', border: '1px solid rgba(0,229,200,0.16)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,229,200,0.42)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 60px rgba(0,229,200,0.12), 0 0 0 1px rgba(0,229,200,0.1)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,229,200,0.16)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
            {/* Ghost label */}
            <div style={{ position: 'absolute', bottom: -8, right: 8, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '5rem', color: 'rgba(0,229,200,0.05)', letterSpacing: '0.02em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>01</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,229,200,0.1)', border: '1px solid rgba(0,229,200,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✏️</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.75rem', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 7 }}>Design Studio</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.36)', lineHeight: 1.6 }}>Design from scratch — add text, upload images, or generate with AI</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, color: '#00E5C8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Open studio
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#00E5C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </button>

          {/* Catalog card */}
          <button onClick={() => router.push('/catalog')} className="scan-card holo-card" style={{ padding: '2rem', borderRadius: 20, cursor: 'pointer', textAlign: 'left', background: 'linear-gradient(135deg,rgba(0,153,255,0.06),rgba(123,97,255,0.03))', border: '1px solid rgba(0,153,255,0.18)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,153,255,0.42)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 60px rgba(0,153,255,0.12), 0 0 0 1px rgba(0,153,255,0.1)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,153,255,0.18)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
            {/* Ghost label */}
            <div style={{ position: 'absolute', bottom: -8, right: 8, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '5rem', color: 'rgba(0,153,255,0.05)', letterSpacing: '0.02em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>02</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,153,255,0.1)', border: '1px solid rgba(0,153,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎨</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.75rem', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 7 }}>Browse Catalog</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.36)', lineHeight: 1.6 }}>Pick from ready-made designs — tees, hoodies, socks and more</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, color: '#0099FF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Browse collection
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#0099FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </button>
        </div>

        {/* ── Premium subscription section ── */}
        <div className="glow-animated" style={{ borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(0,229,200,0.18)', background: 'linear-gradient(135deg,rgba(0,229,200,0.04) 0%,rgba(0,153,255,0.025) 50%,rgba(123,97,255,0.02) 100%)' }}>
          {/* Top accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,#00E5C8,#0099FF,#7B61FF)', backgroundSize: '200% 100%', animation: 'gradient-move 4s ease infinite' }} />

          <div style={{ padding: '2rem 2rem 1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.22)', color: '#00E5C8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  ✨ Monthly Box
                </div>
                <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, letterSpacing: '0.025em', lineHeight: 1.1, marginBottom: 6 }}>
                  3 pieces, curated for your style
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 440 }}>
                  Every month we select 3 freshly-printed items that match your vibe — shipped free to your door.
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '3rem', fontWeight: 400, letterSpacing: '0.02em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>${MONTHLY}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>per month · cancel anytime</div>
              </div>
            </div>

            {/* Product types */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {ALL_TYPES.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                  <span>{PRODUCT_TYPE_EMOJI[t]}</span>{PRODUCT_TYPE_LABELS[t]}
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>from ${PRODUCT_BASE_PRICE[t]}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ display: 'flex', gap: 18, marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {['🎁 Surprise every month', '🚚 Free shipping', '⏸ Pause anytime', '💳 Billed monthly'].map(f => (
                <span key={f} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{f}</span>
              ))}
            </div>

            {/* ── Active subscription state ── */}
            {hasActiveSub && (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, marginBottom: 3 }}>✓ You&apos;re subscribed{sub!.status === 'PAUSED' ? ' (paused)' : ''}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                    Next shipment: {new Date(sub!.nextShipmentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={togglePause} disabled={subActionLoading} style={{ padding: '6px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: subActionLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, cursor: subActionLoading ? 'default' : 'pointer', opacity: subActionLoading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                    {sub!.status === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button onClick={cancelSub} disabled={subActionLoading} style={{ padding: '6px 14px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: '0.72rem', fontWeight: 700, cursor: subActionLoading ? 'default' : 'pointer', opacity: subActionLoading ? 0.5 : 1, transition: 'opacity 0.15s' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* ── Success message ── */}
            {subSuccess && !showForm && (
              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🎉</div>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>You&apos;re in!</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Your first box ships on the 1st. We&apos;ll email you a tracking number.</div>
              </div>
            )}

            {/* ── CTA / Form ── */}
            {!hasActiveSub && !subSuccess && session.type === 'guest' && (
              <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, fontSize: '0.78rem', color: 'rgba(245,158,11,0.75)', textAlign: 'center' }}>
                <a href="/" style={{ color: '#F59E0B', fontWeight: 700, textDecoration: 'none' }}>Sign in</a> to subscribe
              </div>
            )}

            {!hasActiveSub && !subSuccess && session.type === 'user' && !showForm && (
              <button onClick={() => setShowForm(true)} style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,229,200,0.25)', transition: 'all 0.15s' }}>
                Subscribe — ${MONTHLY}/month
              </button>
            )}

            {/* ── Subscribe form ── */}
            {showForm && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                <div>
                  <div style={LS}>Your style</div>
                  <div className="rsp-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {STYLES.map(s => (
                      <button key={s.id} onClick={() => setSelStyle(s.id)} style={{ padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${selStyle === s.id ? s.color + '66' : 'rgba(255,255,255,0.07)'}`, background: selStyle === s.id ? s.color + '12' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selStyle === s.id ? 'white' : 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={LS}>Products I want</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {ALL_TYPES.map(t => (
                      <button key={t} onClick={() => toggleType(t)} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid', borderColor: selTypes.includes(t) ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.08)', background: selTypes.includes(t) ? 'rgba(0,229,200,0.08)' : 'transparent', color: selTypes.includes(t) ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.13s' }}>
                        {PRODUCT_TYPE_EMOJI[t]} {PRODUCT_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={LS}>Default size</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['XS','S','M','L','XL','XXL'].map(s => (
                      <button key={s} onClick={() => setPrefSize(s)} style={{ width: 44, height: 44, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${prefSize === s ? '#00E5C8' : 'rgba(255,255,255,0.08)'}`, background: prefSize === s ? 'rgba(0,229,200,0.1)' : 'rgba(255,255,255,0.02)', color: prefSize === s ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.78rem', transition: 'all 0.13s' }}>{s}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={subscribe} disabled={!selStyle || submitting} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: selStyle && !submitting ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.06)', color: selStyle && !submitting ? '#050507' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.88rem', cursor: selStyle && !submitting ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                    {submitting ? 'Subscribing...' : `Confirm — $${MONTHLY}/month`}
                  </button>
                  <button onClick={() => setShowForm(false)} style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
                </div>

                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
                  🔒 Billed on the 1st each month · Pause or cancel anytime · No hidden fees
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

function navBtn(accent: 'teal' | 'indigo'): React.CSSProperties {
  const c = accent === 'teal'
    ? { bg: 'rgba(0,229,200,0.07)', border: 'rgba(0,229,200,0.22)', color: 'rgba(0,229,200,0.85)' }
    : { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.25)', color: 'rgba(129,140,248,0.9)' };
  return { padding: '6px 16px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' };
}

const LS: React.CSSProperties = { display: 'block', fontSize: '0.59rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 };
