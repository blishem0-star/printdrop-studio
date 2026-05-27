'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_DESIGNS, CATALOG_CATEGORIES, type CatalogDesign } from '@/lib/catalogDesigns';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { submitOrder } from '@/lib/exportDesign';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function DesignPreview({ svg, color, size = 120 }: { svg: string; color: string; size?: number }) {
  const colored = svg.replace(/currentColor/g, color);
  return (
    <div
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: colored.replace('<svg ', `<svg width="${size}" height="${size}" `) }}
    />
  );
}

function ShirtPreview({ color, textColor, design }: { color: TShirtColor | null; design: CatalogDesign | null; textColor: string }) {
  const bg = color?.hex ?? '#1a1a1a';
  return (
    <div style={{ width: 200, height: 200, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={bg} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      </svg>
      {design && color && (
        <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <DesignPreview svg={design.svg} color={textColor} size={72} />
        </div>
      )}
      {!design && (
        <div style={{ position: 'absolute', color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', top: '55%', textAlign: 'center', width: '100%' }}>
          pick a design
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  const [design, setDesign] = useState<CatalogDesign | null>(null);
  const [color, setColor] = useState<TShirtColor | null>(null);
  const [size, setSize] = useState<TShirtSize | null>(null);
  const [catFilter, setCatFilter] = useState('All');

  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [shipState, setShipState] = useState('');

  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const filtered = CATALOG_DESIGNS.filter(d => catFilter === 'All' || d.category === catFilter);
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
      const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(design.svg.replace(/currentColor/g, color.textColor));
      const result = await submitOrder({
        customerName: shipName, customerEmail: shipEmail,
        shippingName: shipName, shippingAddr: shipStreet,
        shippingCity: shipCity, shippingZip: shipZip, shippingState: shipState,
        total,
        design: {
          title: design.title, emoji: '🎨',
          colorHex: color.hex, colorName: color.name,
          size, price: design.price, svgDataUrl,
        },
      });
      if (result) { setOrderId(result.id); setOrdered(true); }
    } catch { /* handled */ }
    finally { setSubmitting(false); }
  }

  const inputCss: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, padding: '0.6rem 0.8rem',
    color: '#fff', fontSize: '0.85rem', outline: 'none',
  };

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  if (ordered) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>Order confirmed!</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{design?.title} · {color?.name} · Size {size}</p>
        {orderId && <p style={{ color: 'rgba(255,255,255,0.14)', fontSize: '0.68rem', fontFamily: 'monospace', marginBottom: 28 }}>Order #{orderId.slice(0,8).toUpperCase()}</p>}
        <button onClick={() => router.push('/studio')} style={{
          padding: '0.8rem 2rem', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
        }}>← Back to studio</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#080808' }}>

      {/* Header */}
      <header style={{
        height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 1.5rem', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.97)',
      }}>
        <button onClick={() => router.push('/studio')} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
        }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 16 }}>🎨</span>
        <span style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '-0.04em' }}>Ready-Made Designs</span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8',
        }}>From $15.99</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{session.name}</span>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

          {/* 01 — Pick design */}
          <div style={{ marginBottom: '2.5rem' }}>
            <SectionLabel n="01" title="Pick a design" />

            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {CATALOG_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: '4px 12px', borderRadius: 999, border: '1px solid',
                  borderColor: catFilter === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)',
                  background: catFilter === c ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: catFilter === c ? '#818CF8' : 'rgba(255,255,255,0.3)',
                  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}>{c}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '0.7rem' }}>
              {filtered.map(d => {
                const selected = design?.id === d.id;
                return (
                  <button key={d.id} onClick={() => setDesign(d)} style={{
                    position: 'relative', borderRadius: 16, padding: '1rem 0.75rem 0.875rem',
                    cursor: 'pointer', textAlign: 'center',
                    border: `1.5px solid ${selected ? '#6366F1' : 'rgba(255,255,255,0.06)'}`,
                    background: selected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s',
                    boxShadow: selected ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
                    transform: selected ? 'scale(1.04)' : 'scale(1)',
                  }}>
                    {d.badge && (
                      <div style={{
                        position: 'absolute', top: -6, left: 8,
                        fontSize: '0.5rem', fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                        background: d.badge === 'bestseller' ? '#FF4D1C' : d.badge === 'new' ? '#10B981' : '#8B5CF6',
                        color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>{d.badge}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, height: 64 }}>
                      <DesignPreview svg={d.svg} color={selected ? '#818CF8' : 'rgba(255,255,255,0.55)'} size={60} />
                    </div>
                    <div style={{ fontSize: '0.67rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{d.category}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: selected ? '#818CF8' : '#6366F1' }}>${d.price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02 — Color & Size */}
          <div style={{ marginBottom: '2.5rem', opacity: design ? 1 : 0.3, transition: 'opacity 0.25s', pointerEvents: design ? 'auto' : 'none' }}>
            <SectionLabel n="02" title="Color & Size" locked={!design} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              <div>
                <div style={labelStyle}>Shirt Color {color && <span style={{ textTransform: 'none', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>— {color.name}</span>}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SHIRT_COLORS.map(c => (
                    <button key={c.id} title={c.name} onClick={() => setColor(c)} style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', background: c.hex, cursor: 'pointer',
                      outline: color?.id === c.id ? '3px solid #6366F1' : '2px solid rgba(255,255,255,0.08)',
                      outlineOffset: 3, transition: 'all 0.15s',
                      transform: color?.id === c.id ? 'scale(1.18)' : 'scale(1)',
                    }} />
                  ))}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Size {size && <span style={{ textTransform: 'none', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>— {size}</span>}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SHIRT_SIZES.map(s => (
                    <button key={s} onClick={() => setSize(s)} style={{
                      width: 48, height: 48, borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${size === s ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                      background: size === s ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                      color: size === s ? '#818CF8' : 'rgba(255,255,255,0.4)',
                      fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
                      transform: size === s ? 'scale(1.1)' : 'scale(1)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 03 — Delivery */}
          <div style={{ marginBottom: '2.5rem', opacity: customizeDone ? 1 : 0.3, transition: 'opacity 0.25s', pointerEvents: customizeDone ? 'auto' : 'none' }}>
            <SectionLabel n="03" title="Delivery details" locked={!customizeDone} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: 560 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 88px', gap: 10 }}>
                <div>
                  <div style={labelStyle}>City</div>
                  <input style={inputCss} value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" />
                </div>
                <div>
                  <div style={labelStyle}>State</div>
                  <select value={shipState} onChange={e => setShipState(e.target.value)} style={{ ...inputCss, appearance: 'none', cursor: 'pointer', color: shipState ? '#fff' : 'rgba(255,255,255,0.28)' }}>
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

        </div>

        {/* Right panel */}
        <div style={{
          width: 280, flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>

          {/* Preview */}
          <div style={{
            background: 'rgba(0,0,0,0.4)', padding: '1.75rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
          }}>
            <ShirtPreview color={color} design={design} textColor={color?.textColor ?? '#ffffff'} />
          </div>

          {/* Summary */}
          <div style={{ padding: '1.25rem', flexShrink: 0 }}>
            {design ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: color?.hex ?? 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DesignPreview svg={design.svg} color={color?.textColor ?? '#818CF8'} size={28} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>{design.title}</div>
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
                  {[['Design', `$${design.price.toFixed(2)}`], ['Shipping', `$${SHIPPING_PRICE.toFixed(2)}`]].map(([lbl, val]) => (
                    <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{lbl}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Total</span>
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#818CF8' }}>${total.toFixed(2)}</span>
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
                  ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                  : 'rgba(255,255,255,0.05)',
                color: canOrder && !submitting ? '#fff' : 'rgba(255,255,255,0.25)',
                fontWeight: 800, fontSize: '0.85rem',
                cursor: canOrder && !submitting ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: canOrder && !submitting ? '0 6px 20px rgba(99,102,241,0.35)' : 'none',
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

function SectionLabel({ n, title, locked }: { n: string; title: string; locked?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: locked ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.15)',
        border: `1px solid ${locked ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.58rem', fontWeight: 900,
        color: locked ? 'rgba(255,255,255,0.2)' : '#818CF8',
      }}>{n}</div>
      <span style={{
        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: locked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
      }}>{title}</span>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
};
