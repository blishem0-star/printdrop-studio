'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ShirtViewer3D from '@/components/ShirtViewer3D';
import SizeGuideModal from '@/components/SizeGuideModal';
import GroupOrderModal from '@/components/GroupOrderModal';
import Toast from '@/components/Toast';
import {
  DESIGNS, SHIRT_COLORS, SHIRT_SIZES, CATEGORIES,
  SHIPPING_PRICE,
} from '@/lib/mockData';
import { OWNER_EMAIL } from '@/lib/owner';
import type { Design, TShirtColor, TShirtSize } from '@/lib/mockData';
import { buildDesignSvg, saveDesignFile, submitOrder } from '@/lib/exportDesign';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function SectionLabel({ n, title, locked }: { n: string; title: string; locked?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,77,28,0.15)',
        border: `1px solid ${locked ? 'rgba(255,255,255,0.07)' : 'rgba(255,77,28,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.58rem', fontWeight: 900,
        color: locked ? 'rgba(255,255,255,0.2)' : '#FF8C40',
      }}>{n}</div>
      <span style={{
        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: locked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
      }}>{title}</span>
    </div>
  );
}

export default function StudioPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // Design
  const [design, setDesign]       = useState<Design | null>(null);
  const [color, setColor]         = useState<TShirtColor | null>(null);
  const [size, setSize]           = useState<TShirtSize | null>(null);
  const [customText, setCustomText] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [searchQ, setSearchQ]     = useState('');
  const [wishlist, setWishlist]   = useState<string[]>([]);

  // UI
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showGroup, setShowGroup]         = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Order
  const [ordered, setOrdered]   = useState(false);
  const [orderId, setOrderId]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Shipping
  const [shipName, setShipName]     = useState('');
  const [shipEmail, setShipEmail]   = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity]     = useState('');
  const [shipZip, setShipZip]       = useState('');
  const [shipState, setShipState]   = useState('');

  // Auth guard + restore state
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      /* eslint-disable react-hooks/set-state-in-effect */
      setSession(sess);
      if (sess.name && sess.name !== 'Guest') setShipName(sess.name);
      if (sess.email) setShipEmail(sess.email);
      const wl = localStorage.getItem('pd_wishlist');
      if (wl) setWishlist(JSON.parse(wl));
      const saved = localStorage.getItem('pd_studio');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.colorId)   setColor(SHIRT_COLORS.find(c => c.id === s.colorId) ?? null);
        if (s.size)      setSize(s.size);
        if (s.designId)  setDesign(DESIGNS.find(d => d.id === s.designId) ?? null);
        if (s.customText) setCustomText(s.customText);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      router.replace('/');
    }
  }, [router]);

  // Persist studio selections
  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem('pd_studio', JSON.stringify({
        colorId: color?.id, size, designId: design?.id, customText,
      }));
    } catch { /* ignore */ }
  }, [color, size, design, customText, session]);

  function signOut() {
    try { localStorage.removeItem('pd_session'); localStorage.removeItem('pd_studio'); } catch { /* ignore */ }
    router.replace('/');
  }

  function toggleWishlist(id: string) {
    setWishlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('pd_wishlist', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const filteredDesigns = DESIGNS
    .filter(d => catFilter === 'All' || d.category === catFilter)
    .filter(d => !searchQ || d.title.toLowerCase().includes(searchQ.toLowerCase()) || d.tags.some(t => t.includes(searchQ.toLowerCase())));

  const total = (design?.price ?? 0) + SHIPPING_PRICE;
  const customizeDone = design !== null && color !== null && size !== null;
  const deliveryDone = shipName.trim().length > 1 && shipEmail.includes('@')
    && shipStreet.trim().length > 3 && shipCity.trim().length > 1
    && shipZip.length === 5 && shipState !== '';
  const canOrder = customizeDone && deliveryDone;

  async function handleOrder() {
    if (!design || !color || !size) return;
    setSubmitting(true);
    try {
      const svgDataUrl = buildDesignSvg({
        colorHex: color.hex, textColor: color.textColor,
        emoji: design.emoji, label: design.title, customText: customText || undefined,
      });
      const filePath = await saveDesignFile(svgDataUrl);
      const result = await submitOrder({
        customerName: shipName, customerEmail: shipEmail,
        shippingName: shipName, shippingAddr: shipStreet,
        shippingCity: shipCity, shippingZip: shipZip, shippingState: shipState,
        total,
        design: {
          title: design.title, emoji: design.emoji,
          customText: customText || undefined,
          colorHex: color.hex, colorName: color.name,
          size, price: design.price, svgDataUrl,
          filePath: filePath ?? undefined,
        },
      });
      if (result) {
        setOrderId(result.id);
        setOrdered(true);
        try { localStorage.removeItem('pd_studio'); } catch { /* ignore */ }
      } else {
        setToast({ msg: 'Failed to save order. Please try again.', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Unexpected error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const inputCss: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, padding: '0.6rem 0.8rem',
    color: '#fff', fontSize: '0.85rem', outline: 'none',
  };

  // ── Loading ──
  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  // ── Order success ──
  if (ordered) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.5))' }}>🎉</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 10 }}>Order confirmed!</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
          {design?.title} · {color?.name} · Size {size}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.8rem', marginBottom: orderId ? 6 : 24 }}>
          Delivered in <span style={{ color: '#10B981' }}>72 hours</span> · {shipEmail}
        </p>
        {orderId && (
          <p style={{ color: 'rgba(255,255,255,0.14)', fontSize: '0.68rem', fontFamily: 'monospace', marginBottom: 28 }}>
            Order #{orderId.slice(0, 8).toUpperCase()}
          </p>
        )}
        <button onClick={() => {
          setOrdered(false); setDesign(null); setColor(null);
          setSize(null); setCustomText('');
        }} style={{
          padding: '0.8rem 2rem', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg,#FF4D1C,#FF8C40)',
          color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(255,77,28,0.35)',
        }}>
          Design another →
        </button>
      </div>
    </div>
  );

  // ── Main studio ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#080808' }}>

      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} selected={size} />}
      {showGroup && <GroupOrderModal onClose={() => setShowGroup(false)} />}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <header style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.97)',
      }}>
        <span style={{ fontSize: 18 }}>🖨</span>
        <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.04em' }}>PrintDrop</span>
        <div style={{ flex: 1 }} />
        {session.type === 'guest' && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 700,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 999, padding: '2px 8px', color: 'rgba(245,158,11,0.7)',
          }}>Guest</span>
        )}
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{session.name}</span>
        {session.email === OWNER_EMAIL && (
          <a href="/admin" style={{
            fontSize: '0.68rem', fontWeight: 700,
            background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.22)',
            borderRadius: 6, padding: '4px 10px', color: 'rgba(255,140,64,0.85)',
            cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>⚙ Admin</a>
        )}
        <button onClick={signOut} style={{
          fontSize: '0.68rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>Sign out</button>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

          {/* 01 — Pick a design */}
          <div style={{ marginBottom: '2.5rem' }}>
            <SectionLabel n="01" title="Pick a design" />

            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search designs..."
                style={{ ...inputCss, width: 180, padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}
              />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{
                    padding: '4px 11px', borderRadius: 999, border: '1px solid',
                    borderColor: catFilter === c ? 'rgba(255,77,28,0.45)' : 'rgba(255,255,255,0.07)',
                    background: catFilter === c ? 'rgba(255,77,28,0.08)' : 'transparent',
                    color: catFilter === c ? '#FF8C40' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {wishlist.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  ❤ Saved
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {DESIGNS.filter(d => wishlist.includes(d.id)).map(d => (
                    <button key={d.id} onClick={() => setDesign(d)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 9px', borderRadius: 999,
                      background: design?.id === d.id ? 'rgba(255,77,28,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${design?.id === d.id ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600,
                    }}>
                      <span>{d.emoji}</span><span>{d.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px,1fr))', gap: '0.55rem' }}>
              {filteredDesigns.map(d => (
                <div key={d.id} style={{ position: 'relative' }}>
                  <button onClick={() => setDesign(d)} style={{
                    width: '100%', borderRadius: 14, padding: '0.875rem 0.5rem 0.75rem',
                    cursor: 'pointer', textAlign: 'center',
                    border: `1.5px solid ${design?.id === d.id ? '#FF4D1C' : 'rgba(255,255,255,0.06)'}`,
                    background: design?.id === d.id ? 'rgba(255,77,28,0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s',
                    boxShadow: design?.id === d.id ? '0 0 20px rgba(255,77,28,0.18)' : 'none',
                    transform: design?.id === d.id ? 'scale(1.04)' : 'scale(1)',
                  }}>
                    {d.badge && (
                      <div style={{
                        position: 'absolute', top: -6, left: 8,
                        fontSize: '0.5rem', fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                        background: d.badge === 'bestseller' ? '#FF4D1C' : d.badge === 'new' ? '#10B981' : d.badge === 'trending' ? '#8B5CF6' : '#6C63FF',
                        color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>{d.badge}</div>
                    )}
                    <div style={{ fontSize: 30, marginBottom: 5 }}>{d.emoji}</div>
                    <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 3, lineHeight: 1.3 }}>{d.title}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FF5C28' }}>${d.price}</div>
                  </button>
                  <button onClick={() => toggleWishlist(d.id)} style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 20, height: 20, borderRadius: '50%',
                    background: wishlist.includes(d.id) ? 'rgba(255,77,28,0.2)' : 'rgba(0,0,0,0.6)',
                    border: `1px solid ${wishlist.includes(d.id) ? 'rgba(255,77,28,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: wishlist.includes(d.id) ? '#FF6B3D' : 'rgba(255,255,255,0.25)',
                    fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>♥</button>
                </div>
              ))}
              {filteredDesigns.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                  No designs found
                </div>
              )}
            </div>
          </div>

          {/* 02 — Customize */}
          <div style={{ marginBottom: '2.5rem', opacity: design ? 1 : 0.35, transition: 'opacity 0.25s', pointerEvents: design ? 'auto' : 'none' }}>
            <SectionLabel n="02" title="Customize" locked={!design} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Color */}
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Shirt Color {color && <span style={{ textTransform: 'none', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>— {color.name}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SHIRT_COLORS.map(c => (
                    <button key={c.id} title={c.name} onClick={() => setColor(c)} style={{
                      width: 38, height: 38, borderRadius: '50%', border: 'none', background: c.hex, cursor: 'pointer',
                      outline: color?.id === c.id ? '3px solid #FF4D1C' : '2px solid rgba(255,255,255,0.08)',
                      outlineOffset: 3, transition: 'all 0.15s',
                      transform: color?.id === c.id ? 'scale(1.18)' : 'scale(1)',
                      boxShadow: color?.id === c.id ? '0 0 14px rgba(255,77,28,0.45)' : 'none',
                    }} />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Size {size && <span style={{ textTransform: 'none', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>— {size}</span>}</span>
                  <button onClick={() => setShowSizeGuide(true)} style={{
                    marginLeft: 'auto',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, padding: '2px 8px', color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                    textTransform: 'none', letterSpacing: 0,
                  }}>📏 Size guide</button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SHIRT_SIZES.map(s => (
                    <button key={s} onClick={() => setSize(s)} style={{
                      width: 50, height: 50, borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${size === s ? '#FF4D1C' : 'rgba(255,255,255,0.08)'}`,
                      background: size === s ? 'rgba(255,77,28,0.12)' : 'rgba(255,255,255,0.02)',
                      color: size === s ? '#FF8C40' : 'rgba(255,255,255,0.4)',
                      fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
                      transform: size === s ? 'scale(1.1)' : 'scale(1)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Custom text */}
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Custom Text <span style={{ textTransform: 'none', fontWeight: 400, color: 'rgba(255,255,255,0.18)' }}>(optional)</span>
                </div>
                <input
                  value={customText} onChange={e => setCustomText(e.target.value)} maxLength={22}
                  placeholder="e.g. YOUR NAME, EST. 2025..."
                  style={{ ...inputCss, maxWidth: 300 }}
                />
              </div>
            </div>
          </div>

          {/* 03 — Delivery */}
          <div style={{ marginBottom: '2.5rem', opacity: customizeDone ? 1 : 0.3, transition: 'opacity 0.25s', pointerEvents: customizeDone ? 'auto' : 'none' }}>
            <SectionLabel n="03" title="Delivery details" locked={!customizeDone} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: 560 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Full Name</div>
                  <input style={inputCss} value={shipName} onChange={e => setShipName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Email</div>
                  <input style={inputCss} type="email" value={shipEmail} onChange={e => setShipEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Street Address</div>
                <input style={inputCss} value={shipStreet} onChange={e => setShipStreet(e.target.value)} placeholder="123 Main St, Apt 4B" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 88px', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>City</div>
                  <input style={inputCss} value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" />
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>State</div>
                  <select value={shipState} onChange={e => setShipState(e.target.value)} style={{
                    ...inputCss, appearance: 'none', cursor: 'pointer',
                    color: shipState ? '#fff' : 'rgba(255,255,255,0.28)',
                  }}>
                    <option value="">ST</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>ZIP</div>
                  <input style={{ ...inputCss, fontFamily: 'monospace' }} value={shipZip} onChange={e => setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" />
                </div>
              </div>

              <button onClick={() => setShowGroup(true)} style={{
                padding: '0.75rem 1rem', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.2)',
                color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.15s', marginTop: 4,
              }}>
                <span>👥</span>
                Group order — everyone picks their size
                <span style={{ fontSize: '0.55rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.18)', color: '#a78bfa', padding: '2px 7px', borderRadius: 999, fontWeight: 800, letterSpacing: '0.06em', marginLeft: 'auto' }}>TEAM</span>
              </button>
            </div>
          </div>

        </div>

        {/* ── Right panel ── */}
        <div style={{
          width: 295, flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>

          {/* Shirt preview */}
          <div style={{
            background: 'rgba(0,0,0,0.4)', padding: '1.75rem 1rem',
            minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
          }}>
            {color ? (
              <ShirtViewer3D
                color={color.hex} textColor={color.textColor}
                emoji={design?.emoji} label={design?.title}
                customText={customText || undefined}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 50 }}>👕</div>
                <p style={{ fontSize: '0.7rem', marginTop: 8 }}>Select design & color</p>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div style={{ padding: '1.25rem', flexShrink: 0 }}>
            {design ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: color?.hex ?? '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
                  }}>{design.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{design.title}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {[color?.name, size ? `Size ${size}` : null].filter(Boolean).join(' · ') || 'Not configured'}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                  padding: '0.75rem', border: '1px solid rgba(255,255,255,0.04)',
                  marginBottom: '0.875rem',
                }}>
                  {[
                    ['Design', `$${design.price.toFixed(2)}`],
                    ['Shipping', `$${SHIPPING_PRICE.toFixed(2)}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Total</span>
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#FF5C28' }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem 0 1rem' }}>
                Pick a design to see summary
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ padding: '0 1.25rem 1.25rem', marginTop: 'auto', flexShrink: 0 }}>
            <button
              disabled={!canOrder || submitting}
              onClick={handleOrder}
              style={{
                width: '100%', height: 48, borderRadius: 12, border: 'none',
                background: canOrder && !submitting
                  ? 'linear-gradient(135deg, #FF4D1C, #FF8C40)'
                  : 'rgba(255,255,255,0.05)',
                color: canOrder && !submitting ? '#fff' : 'rgba(255,255,255,0.25)',
                fontWeight: 800, fontSize: '0.85rem', cursor: canOrder && !submitting ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: canOrder && !submitting ? '0 6px 20px rgba(255,77,28,0.35)' : 'none',
              }}
            >
              {submitting ? 'Placing order...' :
               !design ? 'Pick a design first' :
               !color || !size ? 'Set color & size' :
               !deliveryDone ? 'Add delivery details' :
               `Place Order — $${total.toFixed(2)}`}
            </button>

            {canOrder && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                {['🔒 Secure', '72h Delivery', 'Free Returns'].map(t => (
                  <span key={t} style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
