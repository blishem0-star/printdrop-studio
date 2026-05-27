'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_DESIGNS, CATALOG_CATEGORIES, type CatalogDesign } from '@/lib/catalogDesigns';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { submitOrder } from '@/lib/exportDesign';
import { OWNER_EMAIL } from '@/lib/owner';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function DesignPreview({ svg, color, size = 56 }: { svg: string; color: string; size?: number }) {
  const colored = svg.replace(/currentColor/g, color);
  return (
    <div
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: colored.replace('<svg ', `<svg width="${size}" height="${size}" `) }}
    />
  );
}

function ShirtMini({ color, design, textColor }: { color: TShirtColor | null; design: CatalogDesign | null; textColor: string }) {
  const bg = color?.hex ?? '#222';
  return (
    <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="90" height="90" viewBox="0 0 200 200" fill="none">
        <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={bg} stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
      </svg>
      {design && color && (
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <DesignPreview svg={design.svg} color={textColor} size={34} />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Catalog state
  const [catFilter, setCatFilter] = useState('All');
  const [design, setDesign] = useState<CatalogDesign | null>(null);
  const [color, setColor] = useState<TShirtColor | null>(null);
  const [size, setSize] = useState<TShirtSize | null>(null);
  const [customText, setCustomText] = useState('');

  // Delivery state
  const [step, setStep] = useState<'pick' | 'delivery'>('pick');
  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [shipState, setShipState] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      setSession(sess);
      if (sess.name && sess.name !== 'Guest') setShipName(sess.name);
      if (sess.email) setShipEmail(sess.email);
    } catch { router.replace('/'); }
  }, [router]);

  // Close drawer on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [drawerOpen]);

  function openCatalog() {
    setStep('pick');
    setOrdered(false);
    setDrawerOpen(true);
  }

  function signOut() {
    try { localStorage.removeItem('pd_session'); } catch { /* ignore */ }
    router.replace('/');
  }

  const filtered = CATALOG_DESIGNS.filter(d => catFilter === 'All' || d.category === catFilter);
  const total = (design?.price ?? 0) + SHIPPING_PRICE;
  const customizeDone = design !== null && color !== null && size !== null;
  const deliveryDone = shipName.trim().length > 1 && shipEmail.includes('@')
    && shipStreet.trim().length > 3 && shipCity.trim().length > 1
    && shipZip.length === 5 && shipState !== '';

  async function handleOrder() {
    if (!design || !color || !size) return;
    setSubmitting(true);
    try {
      const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(design.svg.replace(/currentColor/g, color.textColor));
      const result = await submitOrder({
        customerName: shipName, customerEmail: shipEmail,
        shippingName: shipName, shippingAddr: shipStreet,
        shippingCity: shipCity, shippingZip: shipZip, shippingState: shipState,
        total,
        design: {
          title: design.title, emoji: '🎨',
          customText: customText || undefined,
          colorHex: color.hex, colorName: color.name,
          size, price: design.price, svgDataUrl,
        },
      });
      if (result) { setOrderId(result.id); setOrdered(true); }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  const inputCss: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, padding: '0.55rem 0.75rem',
    color: '#fff', fontSize: '0.82rem', outline: 'none',
  };

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>

      {/* ── Overlay ── */}
      {drawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 58, display: 'flex', alignItems: 'center',
        padding: '0 2rem', gap: 8,
        background: 'rgba(8,8,8,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <span style={{ fontSize: 20, marginRight: 4 }}>🖨</span>
        <span style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.04em', marginRight: 16 }}>PrintDrop</span>

        {/* Nav links */}
        <button
          onClick={() => router.push('/studio/custom')}
          style={{
            padding: '6px 16px', borderRadius: 10, border: '1px solid rgba(255,77,28,0.25)',
            background: 'rgba(255,77,28,0.07)', color: 'rgba(255,140,64,0.9)',
            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.07)'; }}
        >✏️ Create your shirt</button>

        <button
          onClick={openCatalog}
          style={{
            padding: '6px 16px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)',
            background: 'rgba(99,102,241,0.07)', color: 'rgba(129,140,248,0.9)',
            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; }}
        >🎨 Catalog</button>

        <div style={{ flex: 1 }} />

        {/* Right side */}
        {session.type === 'guest' && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            color: 'rgba(245,158,11,0.7)',
          }}>Guest</span>
        )}
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{session.name}</span>

        {session.email === OWNER_EMAIL && (
          <a href="/admin" style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8,
            background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.22)',
            color: 'rgba(255,140,64,0.85)', textDecoration: 'none', transition: 'all 0.15s',
          }}>⚙ Admin</a>
        )}

        <button onClick={signOut} style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
        }}>Sign out</button>
      </header>

      {/* ── Main content (empty for now) ── */}
      <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        {/* placeholder — content coming soon */}
      </main>

      {/* ── Catalog Drawer ── */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 480, zIndex: 60,
          background: '#0f0f0f',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: drawerOpen ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', padding: '0 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>🎨</span>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.03em' }}>Catalog</span>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8',
          }}>From $15.99</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setDrawerOpen(false)} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {ordered ? (
          /* Success state */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: '2rem' }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.04em' }}>Order confirmed!</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{design?.title} · {color?.name} · Size {size}</div>
            {orderId && <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.68rem', fontFamily: 'monospace' }}>#{orderId.slice(0,8).toUpperCase()}</div>}
            <button onClick={() => { setOrdered(false); setDesign(null); setColor(null); setSize(null); setCustomText(''); setStep('pick'); }} style={{
              marginTop: 8, padding: '0.75rem 2rem', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem',
            }}>Order another →</button>
          </div>
        ) : step === 'pick' ? (
          <>
            {/* Scrollable pick area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>

              {/* Category filter */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                {CATALOG_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{
                    padding: '3px 11px', borderRadius: 999, border: '1px solid',
                    borderColor: catFilter === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)',
                    background: catFilter === c ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: catFilter === c ? '#818CF8' : 'rgba(255,255,255,0.3)',
                    fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                  }}>{c}</button>
                ))}
              </div>

              {/* Design grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
                {filtered.map(d => {
                  const sel = design?.id === d.id;
                  return (
                    <button key={d.id} onClick={() => setDesign(d)} style={{
                      position: 'relative', borderRadius: 14, padding: '0.875rem 0.5rem 0.75rem',
                      cursor: 'pointer', textAlign: 'center',
                      border: `1.5px solid ${sel ? '#6366F1' : 'rgba(255,255,255,0.06)'}`,
                      background: sel ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s',
                      transform: sel ? 'scale(1.04)' : 'scale(1)',
                    }}>
                      {d.badge && (
                        <div style={{
                          position: 'absolute', top: -6, left: 6,
                          fontSize: '0.48rem', fontWeight: 800, padding: '2px 5px', borderRadius: 999,
                          background: d.badge === 'bestseller' ? '#FF4D1C' : d.badge === 'new' ? '#10B981' : '#8B5CF6',
                          color: '#fff', textTransform: 'uppercase',
                        }}>{d.badge}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 52, marginBottom: 6 }}>
                        <DesignPreview svg={d.svg} color={sel ? '#818CF8' : 'rgba(255,255,255,0.5)'} size={48} />
                      </div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 2, lineHeight: 1.3 }}>{d.title}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: sel ? '#818CF8' : '#6366F1' }}>${d.price}</div>
                    </button>
                  );
                })}
              </div>

              {/* Color */}
              <div style={{ marginBottom: '1.25rem', opacity: design ? 1 : 0.35, pointerEvents: design ? 'auto' : 'none' }}>
                <div style={labelStyle}>Shirt Color {color && <span style={{ fontWeight: 500, textTransform: 'none', color: 'rgba(255,255,255,0.35)' }}>— {color.name}</span>}</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {SHIRT_COLORS.map(c => (
                    <button key={c.id} title={c.name} onClick={() => setColor(c)} style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none',
                      background: c.hex, cursor: 'pointer',
                      outline: color?.id === c.id ? '3px solid #6366F1' : '2px solid rgba(255,255,255,0.08)',
                      outlineOffset: 3, transition: 'all 0.15s',
                      transform: color?.id === c.id ? 'scale(1.2)' : 'scale(1)',
                    }} />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div style={{ marginBottom: '1.25rem', opacity: design ? 1 : 0.35, pointerEvents: design ? 'auto' : 'none' }}>
                <div style={labelStyle}>Size {size && <span style={{ fontWeight: 500, textTransform: 'none', color: 'rgba(255,255,255,0.35)' }}>— {size}</span>}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SHIRT_SIZES.map(s => (
                    <button key={s} onClick={() => setSize(s)} style={{
                      width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${size === s ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                      background: size === s ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                      color: size === s ? '#818CF8' : 'rgba(255,255,255,0.4)',
                      fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Custom text */}
              <div style={{ opacity: design ? 1 : 0.35, pointerEvents: design ? 'auto' : 'none' }}>
                <div style={labelStyle}>Custom Text <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                <input
                  value={customText} onChange={e => setCustomText(e.target.value)} maxLength={22}
                  placeholder="e.g. YOUR NAME..."
                  style={inputCss}
                />
              </div>
            </div>

            {/* Footer — preview + CTA */}
            <div style={{
              flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {design && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ShirtMini color={color} design={design} textColor={color?.textColor ?? '#fff'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{design.title}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {[color?.name, size ? `Size ${size}` : null].filter(Boolean).join(' · ') || 'Pick color & size'}
                    </div>
                    {customText && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>"{customText}"</div>}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#818CF8' }}>${total.toFixed(2)}</div>
                </div>
              )}
              <button
                disabled={!customizeDone}
                onClick={() => setStep('delivery')}
                style={{
                  width: '100%', height: 46, borderRadius: 12, border: 'none',
                  background: customizeDone ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.05)',
                  color: customizeDone ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 800, fontSize: '0.88rem',
                  cursor: customizeDone ? 'pointer' : 'default',
                  boxShadow: customizeDone ? '0 6px 20px rgba(99,102,241,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {!design ? 'Pick a design' : !color || !size ? 'Pick color & size' : 'Continue to delivery →'}
              </button>
            </div>
          </>
        ) : (
          /* Delivery step */
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              <button onClick={() => setStep('pick')} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                fontSize: '0.75rem', cursor: 'pointer', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>← Back to design</button>

              {/* Order recap */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem',
                background: 'rgba(99,102,241,0.06)', borderRadius: 12,
                border: '1px solid rgba(99,102,241,0.12)', marginBottom: '1.5rem',
              }}>
                <ShirtMini color={color} design={design} textColor={color?.textColor ?? '#fff'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{design?.title}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {color?.name} · Size {size}{customText ? ` · "${customText}"` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 900, color: '#818CF8' }}>${total.toFixed(2)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>Full Name</div>
                    <input style={inputCss} value={shipName} onChange={e => setShipName(e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <div style={labelStyle}>Email</div>
                    <input style={inputCss} type="email" value={shipEmail} onChange={e => setShipEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Street Address</div>
                  <input style={inputCss} value={shipStreet} onChange={e => setShipStreet(e.target.value)} placeholder="123 Main St" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 84px', gap: 10 }}>
                  <div>
                    <div style={labelStyle}>City</div>
                    <input style={inputCss} value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" />
                  </div>
                  <div>
                    <div style={labelStyle}>State</div>
                    <select value={shipState} onChange={e => setShipState(e.target.value)} style={{ ...inputCss, appearance: 'none', cursor: 'pointer', color: shipState ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                      <option value="">ST</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>ZIP</div>
                    <input style={{ ...inputCss, fontFamily: 'monospace' }} value={shipZip} onChange={e => setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
              <button
                disabled={!deliveryDone || submitting}
                onClick={handleOrder}
                style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  background: deliveryDone && !submitting ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.05)',
                  color: deliveryDone && !submitting ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 800, fontSize: '0.9rem',
                  cursor: deliveryDone && !submitting ? 'pointer' : 'default',
                  boxShadow: deliveryDone && !submitting ? '0 6px 20px rgba(99,102,241,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {submitting ? 'Placing order...' : `Place Order — $${total.toFixed(2)}`}
              </button>
              {deliveryDone && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  {['🔒 Secure', '72h Delivery', 'Free Returns'].map(t => (
                    <span key={t} style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7,
};
