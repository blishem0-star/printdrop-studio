'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_DESIGNS, CATALOG_CATEGORIES, type CatalogDesign } from '@/lib/catalogDesigns';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { submitOrder } from '@/lib/exportDesign';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function SvgPreview({ svg, color, size = 56 }: { svg: string; color: string; size?: number }) {
  const colored = svg.replace(/currentColor/g, color);
  return <div style={{ width: size, height: size, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: colored.replace('<svg ', `<svg width="${size}" height="${size}" `) }} />;
}

function ShirtCard({ design, selected, onClick }: { design: CatalogDesign; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
      border: `1.5px solid ${selected ? '#6366F1' : hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
      background: selected ? 'rgba(99,102,241,0.06)' : hover ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
      boxShadow: selected ? '0 0 24px rgba(99,102,241,0.2)' : hover ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
      transform: hover ? 'translateY(-3px)' : 'none',
    }}>
      {design.badge && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontSize: '0.5rem', fontWeight: 800, padding: '3px 7px', borderRadius: 999, background: design.badge === 'bestseller' ? '#FF4D1C' : design.badge === 'new' ? '#10B981' : '#8B5CF6', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{design.badge}</div>
      )}
      {selected && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>✓</div>
      )}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 200 200" fill="none">
            <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill="#2a2a2a" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
          </svg>
          <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <SvgPreview svg={design.svg} color="rgba(255,255,255,0.75)" size={48} />
          </div>
        </div>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: 3 }}>{design.title}</div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{design.category}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: '1rem', color: '#6366F1' }}>${design.price}</span>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>+ ${SHIPPING_PRICE} ship</span>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CatalogDesign | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState<TShirtColor | null>(null);
  const [size, setSize] = useState<TShirtSize | null>(null);
  const [customText, setCustomText] = useState('');
  const [drawerStep, setDrawerStep] = useState<'customize' | 'delivery'>('customize');

  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [shipState, setShipState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      setSession(sess);
      if (sess.name && sess.name !== 'Guest') setShipName(sess.name);
      if (sess.email) setShipEmail(sess.email);
      const saved = localStorage.getItem('pd_shipping');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.street) setShipStreet(s.street);
        if (s.city) setShipCity(s.city);
        if (s.zip) setShipZip(s.zip);
        if (s.state) setShipState(s.state);
      }
    } catch { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (selected && drawerRef.current && !drawerRef.current.contains(e.target as Node)) closeDrawer();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [selected]);

  function openDesign(d: CatalogDesign) {
    setSelected(d); setColor(null); setSize(null); setCustomText('');
    setDrawerStep('customize'); setOrdered(false);
  }
  function closeDrawer() { setSelected(null); }

  const filtered = CATALOG_DESIGNS
    .filter(d => catFilter === 'All' || d.category === catFilter)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase()));

  const total = (selected?.price ?? 0) + SHIPPING_PRICE;
  const customizeDone = color !== null && size !== null;
  const deliveryDone = shipName.trim().length > 1 && shipEmail.includes('@') && shipStreet.trim().length > 3 && shipCity.trim().length > 1 && shipZip.length === 5 && shipState !== '';

  async function handleOrder() {
    if (!selected || !color || !size) return;
    setSubmitting(true);
    try {
      const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(selected.svg.replace(/currentColor/g, color.textColor));
      const result = await submitOrder({
        customerName: shipName, customerEmail: shipEmail,
        shippingName: shipName, shippingAddr: shipStreet,
        shippingCity: shipCity, shippingZip: shipZip, shippingState: shipState, total,
        design: { title: selected.title, emoji: '🎨', customText: customText || undefined, colorHex: color.hex, colorName: color.name, size, price: selected.price, svgDataUrl },
      });
      if (result) {
        try { localStorage.setItem('pd_shipping', JSON.stringify({ street: shipStreet, city: shipCity, zip: shipZip, state: shipState })); } catch { /* ignore */ }
        setOrderId(result.id); setOrdered(true);
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.55rem 0.75rem', color: '#fff', fontSize: '0.82rem', outline: 'none' };

  if (!session) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}><div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>Loading...</div></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      {selected && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(3px)' }} />}

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, background: 'rgba(8,8,8,0.96)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer' }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 18 }}>🎨</span>
        <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em' }}>Catalog</span>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{CATALOG_DESIGNS.length} designs</span>
        <div style={{ flex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search designs..." style={{ ...inp, width: 200, padding: '0.45rem 0.75rem', fontSize: '0.78rem', borderRadius: 8 }} />
      </header>

      {/* Category filter */}
      <div style={{ position: 'sticky', top: 56, zIndex: 45, background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem 2rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATALOG_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: catFilter === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)', background: catFilter === c ? 'rgba(99,102,241,0.1)' : 'transparent', color: catFilter === c ? '#818CF8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1.25rem' }}>
        {filtered.map(d => <ShirtCard key={d.id} design={d} selected={selected?.id === d.id} onClick={() => openDesign(d)} />)}
        {filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.88rem' }}>No designs found</div>}
      </div>

      {/* Drawer */}
      <div ref={drawerRef} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 60, background: '#0f0f0f', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', transform: selected ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', boxShadow: selected ? '-24px 0 60px rgba(0,0,0,0.5)' : 'none' }}>
        {selected && (
          <>
            <div style={{ height: 54, display: 'flex', alignItems: 'center', padding: '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, gap: 10 }}>
              {drawerStep === 'delivery' && !ordered && <button onClick={() => setDrawerStep('customize')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer' }}>←</button>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selected.title}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{ordered ? 'Confirmed' : drawerStep === 'customize' ? 'Step 1 — Customize' : 'Step 2 — Delivery'}</div>
              </div>
              <button onClick={closeDrawer} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {ordered ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '2rem' }}>
                <div style={{ fontSize: 52 }}>🎉</div>
                <div style={{ fontWeight: 900, fontSize: '1.35rem' }}>Order confirmed!</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{selected.title} · {color?.name} · Size {size}</div>
                {orderId && <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', fontFamily: 'monospace' }}>#{orderId.slice(0,8).toUpperCase()}</div>}
                <button onClick={() => { setOrdered(false); setSelected(null); }} style={{ marginTop: 8, padding: '0.75rem 2rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}>Back to catalog</button>
              </div>
            ) : drawerStep === 'customize' ? (
              <>
                {/* Preview */}
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: 130, height: 130 }}>
                    <svg width="130" height="130" viewBox="0 0 200 200" fill="none">
                      <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={color?.hex ?? '#2a2a2a'} stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                    </svg>
                    <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                      <SvgPreview svg={selected.svg} color={color?.textColor ?? 'rgba(255,255,255,0.6)'} size={50} />
                    </div>
                    {customText && <div style={{ position: 'absolute', bottom: '18%', width: '100%', textAlign: 'center', fontSize: '7px', fontWeight: 800, color: color?.textColor ?? '#fff', letterSpacing: '0.05em' }}>{customText}</div>}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={lbl}>Shirt Color {color && <span style={{ fontWeight: 500, textTransform: 'none' }}>— {color.name}</span>}</div>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {SHIRT_COLORS.map(c => <button key={c.id} title={c.name} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: c.hex, cursor: 'pointer', outline: color?.id === c.id ? '3px solid #6366F1' : '2px solid rgba(255,255,255,0.07)', outlineOffset: 3, transition: 'all 0.15s', transform: color?.id === c.id ? 'scale(1.2)' : 'scale(1)' }} />)}
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={lbl}>Size {size && <span style={{ fontWeight: 500, textTransform: 'none' }}>— {size}</span>}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {SHIRT_SIZES.map(s => <button key={s} onClick={() => setSize(s)} style={{ width: 42, height: 42, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${size === s ? '#6366F1' : 'rgba(255,255,255,0.08)'}`, background: size === s ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)', color: size === s ? '#818CF8' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s' }}>{s}</button>)}
                    </div>
                  </div>
                  <div>
                    <div style={lbl}>Custom Text <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                    <input value={customText} onChange={e => setCustomText(e.target.value)} maxLength={22} placeholder="e.g. YOUR NAME..." style={inp} />
                  </div>
                </div>

                <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Total</span>
                    <span style={{ fontWeight: 900, color: '#818CF8', fontSize: '1.05rem' }}>${total.toFixed(2)}</span>
                  </div>
                  <button disabled={!customizeDone} onClick={() => setDrawerStep('delivery')} style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', background: customizeDone ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.05)', color: customizeDone ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.88rem', cursor: customizeDone ? 'pointer' : 'default', boxShadow: customizeDone ? '0 6px 20px rgba(99,102,241,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {!color || !size ? 'Pick color & size' : 'Continue to delivery →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.12)', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                      <svg width="60" height="60" viewBox="0 0 200 200" fill="none"><path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={color?.hex ?? '#2a2a2a'} stroke="rgba(255,255,255,0.1)" strokeWidth="3"/></svg>
                      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}><SvgPreview svg={selected.svg} color={color?.textColor ?? '#fff'} size={24} /></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{selected.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{color?.name} · Size {size}{customText ? ` · "${customText}"` : ''}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: '#818CF8' }}>${total.toFixed(2)}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><div style={lbl}>Full Name</div><input style={inp} value={shipName} onChange={e => setShipName(e.target.value)} placeholder="Jane Smith" /></div>
                      <div><div style={lbl}>Email</div><input style={inp} type="email" value={shipEmail} onChange={e => setShipEmail(e.target.value)} placeholder="you@example.com" /></div>
                    </div>
                    <div><div style={lbl}>Street Address</div><input style={inp} value={shipStreet} onChange={e => setShipStreet(e.target.value)} placeholder="123 Main St" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px 80px', gap: 10 }}>
                      <div><div style={lbl}>City</div><input style={inp} value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" /></div>
                      <div><div style={lbl}>State</div><select value={shipState} onChange={e => setShipState(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer', color: shipState ? '#fff' : 'rgba(255,255,255,0.25)' }}><option value="">ST</option>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div><div style={lbl}>ZIP</div><input style={{ ...inp, fontFamily: 'monospace' }} value={shipZip} onChange={e => setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" /></div>
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
                  <button disabled={!deliveryDone || submitting} onClick={handleOrder} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: deliveryDone && !submitting ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.05)', color: deliveryDone && !submitting ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.9rem', cursor: deliveryDone && !submitting ? 'pointer' : 'default', boxShadow: deliveryDone && !submitting ? '0 6px 20px rgba(99,102,241,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {submitting ? 'Placing order...' : !deliveryDone ? 'Fill in delivery details' : `Send to Print — $${total.toFixed(2)}`}
                  </button>
                  {deliveryDone && <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>{['🔒 Secure', '72h Delivery', 'Free Returns'].map(t => <span key={t} style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>{t}</span>)}</div>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 };
