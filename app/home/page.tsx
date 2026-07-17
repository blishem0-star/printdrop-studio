'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContinueDesignBanner } from '@/components/ContinueDesignBanner';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { PRODUCT_TYPE_LABELS, PRODUCT_BASE_PRICE, displayPrice } from '@/lib/productTypes';
import type { ProductType } from '@/lib/productTypes';
import { useLocalSession, setLocalSession } from '@/lib/useLocalSession';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';

type SubStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
type Subscription = { id: string; status: SubStatus; stylePrefs: string; nextShipmentAt: string };

const STYLE_ICONS: Record<string, React.ReactNode> = {
  minimal:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={14} height={14} aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="6" y1="11" x2="10" y2="11"/></svg>,
  bold:       <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={14} height={14} aria-hidden="true"><path d="M8 2v4l4-2-4 2v8"/><path d="M4 8h4"/></svg>,
  urban:      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true"><rect x="2" y="7" width="4" height="7"/><rect x="6" y="4" width="4" height="10"/><rect x="10" y="5.5" width="4" height="8.5"/></svg>,
  nature:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true"><path d="M8 14V9M3 9c0-4 9-6 9 2a5 5 0 01-9-2z"/></svg>,
  vintage:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M5 8h6M8 5v6"/><circle cx="8" cy="8" r="1.5"/></svg>,
  streetwear: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true"><path d="M5 3C4 4.5 3 6 3 7l2 1c0 2.5-.2 5-.2 7h6.4c0-2-.2-4.5-.2-7L13 7c0-1-1-2.5-2-4l-2 .8Q8 2,8 2Q8 2,7 3.8z"/></svg>,
};

const STYLES = [
  { id: 'minimal',    label: 'Minimal',    desc: 'Clean lines, muted tones',     color: '#94A3B8' },
  { id: 'bold',       label: 'Bold',       desc: 'High contrast, graphic prints', color: '#F59E0B' },
  { id: 'urban',      label: 'Urban',      desc: 'Street art, city vibes',        color: '#6366F1' },
  { id: 'nature',     label: 'Nature',     desc: 'Earth tones, organic shapes',   color: '#10B981' },
  { id: 'vintage',    label: 'Vintage',    desc: 'Retro prints, faded palette',   color: '#D97706' },
  { id: 'streetwear', label: 'Streetwear', desc: 'Oversized, logo-forward',       color: '#EF4444' },
];
const ALL_TYPES: ProductType[] = ['TSHIRT', 'LONG_SLEEVE', 'HOODIE', 'HOODIE_VEST', 'SOCKS'];
const MONTHLY = 59.99;

export default function HomePage() {
  const router = useRouter();
  const session = useLocalSession();
  const [sub, setSub] = useState<Subscription | null>(null);
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
    if (session === undefined) return; // not hydrated yet
    // Direct visitors browse as guests - the store never bounces a shopper.
    if (!session) { setLocalSession({ type: 'guest', name: 'Guest' }); return; }
    if (session.type === 'user') {
      fetch('/api/auth/me')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const user = d?.user;
          if (user && user.role !== session.role) {
            setLocalSession({ ...session, customerId: user.id, email: user.email, role: user.role });
          }
        })
        .catch(() => {});
    }
    if (session.customerId) {
      fetch('/api/subscription')
        .then(r => {
          // 401 = stale localStorage hint with no valid cookie, so session expired.
          if (r.status === 401) { setLocalSession(null); router.replace('/'); return null; }
          return r.ok ? r.json() : null;
        })
        .then(s => { if (s && s.id) setSub(s); })  // ignore error bodies / null
        .catch(() => {});
    }
  }, [session, router]);

  function toggleType(t: ProductType) {
    setSelTypes(prev => prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]);
  }

  async function subscribe() {
    if (!session?.customerId || !selStyle) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylePrefs: { style: selStyle, productTypes: selTypes, size: prefSize } }),
      });
      if (res.ok) { setSub(await res.json()); setSubSuccess(true); setShowForm(false); showToast('Subscription activated!', 'success'); }
      else { showToast('Failed to subscribe. Try again.', 'error'); }
    } catch { showToast('Network error.', 'error'); } finally { setSubmitting(false); }
  }

  async function cancelSub() {
    if (!sub || subActionLoading) return;
    if (!window.confirm('Cancel your subscription plan? Existing order requests will stay in your account.')) return;
    setSubActionLoading(true);
    try {
      const res = await fetch('/api/subscription', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId: sub.id, status: 'CANCELLED' }) });
      if (res.ok) { setSub(prev => prev ? { ...prev, status: 'CANCELLED' } : null); showToast('Subscription cancelled.', 'info'); }
      else { showToast('Failed to cancel. Try again.', 'error'); }
    } catch { showToast('Network error.', 'error'); } finally { setSubActionLoading(false); }
  }

  async function togglePause() {
    if (!sub || subActionLoading) return;
    const newStatus: SubStatus = sub.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    setSubActionLoading(true);
    try {
      const res = await fetch('/api/subscription', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId: sub.id, status: newStatus }) });
      if (res.ok) { setSub(prev => prev ? { ...prev, status: newStatus } : null); showToast(newStatus === 'PAUSED' ? 'Subscription paused.' : 'Subscription resumed.', 'info'); }
      else { showToast('Failed to update. Try again.', 'error'); }
    } catch { showToast('Network error.', 'error'); } finally { setSubActionLoading(false); }
  }

  function signOut() {
    setLocalSession(null);
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => router.replace('/'));
  }

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#050507,#060610)' }}>
      <div aria-live="polite" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  const hasActiveSub = sub && sub.status !== 'CANCELLED';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507 0%,#060610 100%)', color: 'white', position: 'relative' }}>
      {toastEl}
      <ContinueDesignBanner/>
      {/* Background atmosphere */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.04) 0%, transparent 60%)', top: '-5%', left: '55%' }} />
        <div style={{ position: 'absolute', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.035) 0%, transparent 65%)', bottom: '10%', left: '-8%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      {/* Navbar */}
      <header role="banner" style={{ position: 'sticky', top: 0, zIndex: 50, height: 58, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 8, background: 'rgba(5,5,7,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.35rem', fontWeight: 400, letterSpacing: '0.04em', marginRight: 16, color: '#fff' }}>
          STYLX<span style={{ color: '#00E5C8' }}>.</span>
        </span>

        <button onClick={() => router.push('/design')} aria-label="Open Design Studio" style={navBtn('teal')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,200,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,200,0.07)'; }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><path d="M11 2l3 3-9 9H2v-3z"/><path d="M9 4l3 3"/></svg>
          Design Studio
        </button>

        <button onClick={() => router.push('/catalog')} aria-label="Open Catalog" style={navBtn('indigo')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,153,255,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,153,255,0.07)'; }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
          Catalog
        </button>

        <div style={{ flex: 1 }} />

        {session.type === 'guest' && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.7)' }}>Guest</span>
        )}
        {session.type === 'user' && session.role === 'ARTIST' && (
          <button onClick={() => router.push('/artist')} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.25)', color: '#00E5C8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={12} height={12} aria-hidden="true"><path d="M2 14c2-4 5-9 6-9s.5 2-.5 3c-1.5 1.5 2 2 3-1 .8-2.4 1-4 1-4"/><circle cx="13" cy="3.5" r="1"/></svg>
            Artist Studio
          </button>
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
        {session.type === 'user' && session.role === 'OWNER' && (
          <Link href="/admin" aria-label="Open admin panel" style={{ fontSize: '0.74rem', fontWeight: 900, padding: '7px 13px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(0,229,200,0.16),rgba(0,153,255,0.1))', border: '1px solid rgba(0,229,200,0.38)', color: '#00E5C8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 8px 24px rgba(0,229,200,0.12)' }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" width={13} height={13} aria-hidden="true"><circle cx="7" cy="7" r="2.2"/><path d="M7 1.5v2M7 10.5v2M1.5 7h2M10.5 7h2M3.2 3.2l1.4 1.4M9.4 9.4l1.4 1.4M3.2 10.8l1.4-1.4M9.4 4.6l1.4-1.4"/></svg>
            Admin Panel
          </Link>
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
        <section aria-label="Quick actions" className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: '3.5rem' }}>
          {/* Design Studio card */}
          <button onClick={() => router.push('/design')} className="scan-card holo-card" style={{ padding: '2rem', borderRadius: 20, cursor: 'pointer', textAlign: 'left', background: 'linear-gradient(135deg,rgba(0,229,200,0.06),rgba(0,229,200,0.015))', border: '1px solid rgba(0,229,200,0.16)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,229,200,0.42)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 60px rgba(0,229,200,0.12), 0 0 0 1px rgba(0,229,200,0.1)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,229,200,0.16)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
            {/* Ghost label */}
            <div style={{ position: 'absolute', bottom: -8, right: 8, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '5rem', color: 'rgba(0,229,200,0.05)', letterSpacing: '0.02em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>01</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,229,200,0.1)', border: '1px solid rgba(0,229,200,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#00E5C8' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={20} height={20} aria-hidden="true"><path d="M14 2l4 4L6 18H2v-4z"/><path d="M12 4l4 4"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.75rem', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 7 }}>Design Studio</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.36)', lineHeight: 1.6 }}>Design from scratch - your text, your photos, your shirt</div>
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
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,153,255,0.1)', border: '1px solid rgba(0,153,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0099FF' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={20} height={20} aria-hidden="true"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="12" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="12" width="6" height="6" rx="1.5"/><rect x="12" y="12" width="6" height="6" rx="1.5"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.75rem', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 7 }}>Browse Catalog</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.36)', lineHeight: 1.6 }}>Pick from ready-made designs - tees, hoodies, socks and more</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, color: '#0099FF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Browse collection
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#0099FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </button>
        </section>

        {/* Hot right now - direct path from home to a purchase */}
        <section aria-label="Hot right now" style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.6rem', fontWeight: 400, letterSpacing: '0.04em', margin: 0 }}>Hot right now</h2>
            <Link href="/catalog" style={{ fontSize: '0.68rem', fontWeight: 800, color: '#00E5C8', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>View all</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            {CATALOG_DESIGNS.filter(d => d.badge === 'bestseller' || d.badge === 'new').slice(0, 4).map(d => (
              <Link key={d.id} href={`/catalog/${d.id}`} style={{ display: 'block', padding: '1rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: d.svg.replace(/currentColor/g, 'rgba(255,255,255,0.75)').replace('<svg ', '<svg width="52" height="52" ') }} />
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#00E5C8', marginTop: 3 }}>${displayPrice(d.price).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Premium subscription section ── */}
        <section aria-label="Monthly subscription box" className="glow-animated" style={{ borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(0,229,200,0.18)', background: 'linear-gradient(135deg,rgba(0,229,200,0.04) 0%,rgba(0,153,255,0.025) 50%,rgba(123,97,255,0.02) 100%)' }}>
          {/* Top accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,#00E5C8,#0099FF,#7B61FF)', backgroundSize: '200% 100%', animation: 'gradient-move 4s ease infinite' }} />

          <div style={{ padding: '2rem 2rem 1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.22)', color: '#00E5C8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={9} height={9} aria-hidden="true"><path d="M5 1l1.3 2.7 3 .4-2.2 2.1.5 3L5 7.8 2.4 9.2l.5-3L.7 4.1l3-.4z"/></svg>
                  Monthly Box
                </div>
                <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, letterSpacing: '0.025em', lineHeight: 1.1, marginBottom: 6 }}>
                  3 pieces, curated for your style
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 440 }}>
                  A monthly style box built around your taste. Reserve your spot now - nothing is charged until your first box is confirmed.
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '3rem', fontWeight: 400, letterSpacing: '0.02em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>${MONTHLY}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>per month once boxes ship - cancel anytime</div>
              </div>
            </div>

            {/* Product types */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {ALL_TYPES.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                  {PRODUCT_TYPE_LABELS[t]}
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>from ${PRODUCT_BASE_PRICE[t]}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Surprise every month', icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={11} height={11} aria-hidden="true"><rect x="1" y="5" width="12" height="8" rx="1.5"/><path d="M7 5v8M7 5c0-1.5 1.5-3 3-2.5M7 5c0-1.5-1.5-3-3-2.5M1 8h12"/></svg> },
                { label: 'Curated styles',       icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={11} height={11} aria-hidden="true"><path d="M1 3h9v7H1zM10 5l3 2v3h-3V5z"/><circle cx="3.5" cy="11" r="1"/><circle cx="11" cy="11" r="1"/></svg> },
                { label: 'Pause anytime',         icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={11} height={11} aria-hidden="true"><rect x="3" y="2" width="3" height="10" rx="1"/><rect x="8" y="2" width="3" height="10" rx="1"/></svg> },
                { label: 'Billed monthly',        icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={11} height={11} aria-hidden="true"><rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M1 6h12"/></svg> },
              ].map(f => (
                <span key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ color: '#00E5C8', display: 'flex' }}>{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>

            {/* ── Active subscription state ── */}
            {hasActiveSub && (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#10B981', fontWeight: 800, marginBottom: 3 }}><svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5L9.5 3.5" /></svg>You&apos;re subscribed{sub!.status === 'PAUSED' ? ' (paused)' : ''}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                    Next style review: {new Date(sub!.nextShipmentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={togglePause} disabled={subActionLoading} style={{ padding: '6px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: subActionLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, cursor: subActionLoading ? 'default' : 'pointer', opacity: subActionLoading ? 0.5 : 1, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {sub!.status === 'PAUSED'
                      ? <><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={10} height={10} aria-hidden="true"><path d="M3 2l7 4-7 4z"/></svg> Resume</>
                      : <><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={10} height={10} aria-hidden="true"><rect x="2.5" y="2" width="3" height="8" rx="0.8"/><rect x="6.5" y="2" width="3" height="8" rx="0.8"/></svg> Pause</>
                    }
                  </button>
                  <button onClick={cancelSub} disabled={subActionLoading} style={{ padding: '6px 14px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: '0.72rem', fontWeight: 700, cursor: subActionLoading ? 'default' : 'pointer', opacity: subActionLoading ? 0.5 : 1, transition: 'opacity 0.15s' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* ── Success message ── */}
            {subSuccess && !showForm && (
              <div role="status" aria-live="polite" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true"><path d="M4 10l5 5 7-7"/></svg>
                </div>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>You&apos;re in!</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Your style plan is saved. You can review or pause it anytime.</div>
              </div>
            )}

            {/* ── CTA / Form ── */}
            {!hasActiveSub && !subSuccess && session.type === 'guest' && (
              <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, fontSize: '0.78rem', color: 'rgba(245,158,11,0.75)', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#F59E0B', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link> to subscribe
              </div>
            )}

            {!hasActiveSub && !subSuccess && session.type === 'user' && !showForm && (
              <button onClick={() => setShowForm(true)} style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,229,200,0.25)', transition: 'all 0.15s' }}>
                Reserve my box - ${MONTHLY}/month
              </button>
            )}

            {/* Subscribe form */}
            {showForm && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                <div>
                  <div style={LS}>Your style</div>
                  <div className="rsp-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {STYLES.map(s => (
                      <button key={s.id} aria-pressed={selStyle === s.id} onClick={() => setSelStyle(s.id)} style={{ padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${selStyle === s.id ? s.color + '66' : 'rgba(255,255,255,0.07)'}`, background: selStyle === s.id ? s.color + '12' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                        <div style={{ marginBottom: 6, color: selStyle === s.id ? s.color : 'rgba(255,255,255,0.4)', display: 'flex' }}>{STYLE_ICONS[s.id]}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selStyle === s.id ? 'white' : 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={LS}>Products I want</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {ALL_TYPES.map(t => (
                      <button key={t} aria-pressed={selTypes.includes(t)} onClick={() => toggleType(t)} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid', borderColor: selTypes.includes(t) ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.08)', background: selTypes.includes(t) ? 'rgba(0,229,200,0.08)' : 'transparent', color: selTypes.includes(t) ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.13s' }}>
                        {PRODUCT_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={LS}>Default size</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['XS','S','M','L','XL','XXL'].map(s => (
                      <button key={s} aria-pressed={prefSize === s} onClick={() => setPrefSize(s)} style={{ width: 44, height: 44, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${prefSize === s ? '#00E5C8' : 'rgba(255,255,255,0.08)'}`, background: prefSize === s ? 'rgba(0,229,200,0.1)' : 'rgba(255,255,255,0.02)', color: prefSize === s ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.78rem', transition: 'all 0.13s' }}>{s}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={subscribe} disabled={!selStyle || submitting} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: selStyle && !submitting ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.06)', color: selStyle && !submitting ? '#050507' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.88rem', cursor: selStyle && !submitting ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                    {submitting ? 'Subscribing...' : `Confirm - $${MONTHLY}/month`}
                  </button>
                  <button onClick={() => setShowForm(false)} style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
                </div>

                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" width={9} height={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}} aria-hidden="true"><rect x="2.5" y="4.5" width="5" height="4.5" rx="0.8"/><path d="M3.5 4.5V3a1.5 1.5 0 013 0v1.5"/></svg>Style plan renews monthly - Pause or cancel anytime - No hidden fees
                </p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

function navBtn(accent: 'teal' | 'indigo'): React.CSSProperties {
  const c = accent === 'teal'
    ? { bg: 'rgba(0,229,200,0.07)', border: 'rgba(0,229,200,0.22)', color: 'rgba(0,229,200,0.85)' }
    : { bg: 'rgba(0,153,255,0.07)', border: 'rgba(0,153,255,0.22)', color: 'rgba(0,153,255,0.85)' };
  return { padding: '6px 16px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 };
}

const LS: React.CSSProperties = { display: 'block', fontSize: '0.59rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 };
