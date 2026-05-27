'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_DESIGNS, CATALOG_CATEGORIES, type CatalogDesign } from '@/lib/catalogDesigns';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { submitOrder } from '@/lib/exportDesign';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };
type TextPos = 'top' | 'center' | 'bottom';
type FontStyle = 'bold' | 'script' | 'minimal';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const FONT_CSS: Record<FontStyle, React.CSSProperties> = {
  bold:    { fontWeight: 900, fontStyle: 'normal', letterSpacing: '0.03em' },
  script:  { fontWeight: 600, fontStyle: 'italic', letterSpacing: '0.01em' },
  minimal: { fontWeight: 300, fontStyle: 'normal', letterSpacing: '0.18em' },
};

function SvgPreview({ svg, color, size = 56 }: { svg: string; color: string; size?: number }) {
  const colored = svg.replace(/currentColor/g, color);
  return <div style={{ width: size, height: size, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: colored.replace('<svg ', `<svg width="${size}" height="${size}" `) }} />;
}

function StateSelect({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...style, color: value ? '#fff' : 'rgba(255,255,255,0.28)' }}>
      <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>ST</option>
      {US_STATES.map(s => <option key={s} value={s} style={{ background: '#1a1a1a', color: '#fff' }}>{s}</option>)}
    </select>
  );
}

function DrawerShirt({ design, color, frontText, backText, frontPos, backPos, frontFont, backFont, showBack }: {
  design: CatalogDesign; color: TShirtColor | null;
  frontText: string; backText: string;
  frontPos: TextPos; backPos: TextPos;
  frontFont: FontStyle; backFont: FontStyle;
  showBack: boolean;
}) {
  const bg = color?.hex ?? '#2a2a2a';
  const tc = color?.textColor ?? 'rgba(255,255,255,0.6)';
  const textY = (pos: TextPos) => pos === 'top' ? '30%' : pos === 'bottom' ? '74%' : '67%';
  const activeText = showBack ? backText : frontText;
  const activePos = showBack ? backPos : frontPos;
  const activeFont = showBack ? backFont : frontFont;

  return (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      <svg width="130" height="130" viewBox="0 0 200 200" fill="none">
        <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={bg} stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
      </svg>
      {!showBack && (
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <SvgPreview svg={design.svg} color={tc} size={50} />
        </div>
      )}
      {activeText && (
        <div style={{ position: 'absolute', top: textY(activePos), left: '50%', transform: 'translateX(-50%)', fontSize: '7.5px', color: tc, maxWidth: 90, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...FONT_CSS[activeFont] }}>
          {activeText}
        </div>
      )}
      {showBack && <div style={{ position: 'absolute', bottom: 4, width: '100%', textAlign: 'center', fontSize: '6px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.1em' }}>BACK</div>}
    </div>
  );
}

function ShirtCard({ design, selected, onClick }: { design: CatalogDesign; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', border: `1.5px solid ${selected ? '#6366F1' : hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`, background: selected ? 'rgba(99,102,241,0.06)' : hover ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)', boxShadow: selected ? '0 0 24px rgba(99,102,241,0.2)' : hover ? '0 8px 32px rgba(0,0,0,0.3)' : 'none', transform: hover ? 'translateY(-3px)' : 'none' }}>
      {design.badge && <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontSize: '0.5rem', fontWeight: 800, padding: '3px 7px', borderRadius: 999, background: design.badge === 'bestseller' ? '#FF4D1C' : design.badge === 'new' ? '#10B981' : '#8B5CF6', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{design.badge}</div>}
      {selected && <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>✓</div>}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 200 200" fill="none"><path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill="#2a2a2a" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/></svg>
          <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}><SvgPreview svg={design.svg} color="rgba(255,255,255,0.75)" size={48} /></div>
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
  const [showBack, setShowBack] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontPos, setFrontPos] = useState<TextPos>('center');
  const [backPos, setBackPos] = useState<TextPos>('center');
  const [frontFont, setFrontFont] = useState<FontStyle>('bold');
  const [backFont, setBackFont] = useState<FontStyle>('bold');

  const [drawerStep, setDrawerStep] = useState<'customize' | 'delivery'>('customize');
  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [shipState, setShipState] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
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
      if (saved) { const s = JSON.parse(saved); setShipStreet(s.street ?? ''); setShipCity(s.city ?? ''); setShipZip(s.zip ?? ''); setShipState(s.state ?? ''); }
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
    setSelected(d); setColor(null); setSize(null);
    setFrontText(''); setBackText(''); setShowBack(false);
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
        design: { title: selected.title, emoji: '🎨', customText: [frontText, backText].filter(Boolean).join(' | ') || undefined, colorHex: color.hex, colorName: color.name, size, price: selected.price, svgDataUrl },
      });
      if (result) {
        if (saveAddress) {
          try { localStorage.setItem('pd_shipping', JSON.stringify({ street: shipStreet, city: shipCity, zip: shipZip, state: shipState })); } catch { /* ignore */ }
        }
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

      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, background: 'rgba(8,8,8,0.96)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer' }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 18 }}>🎨</span>
        <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em' }}>Catalog</span>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{CATALOG_DESIGNS.length} designs</span>
        <div style={{ flex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search designs..." style={{ ...inp, width: 200, padding: '0.45rem 0.75rem', fontSize: '0.78rem', borderRadius: 8 }} />
      </header>

      <div style={{ position: 'sticky', top: 56, zIndex: 45, background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem 2rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATALOG_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: catFilter === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)', background: catFilter === c ? 'rgba(99,102,241,0.1)' : 'transparent', color: catFilter === c ? '#818CF8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{c}</button>
        ))}
      </div>

      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1.25rem' }}>
        {filtered.map(d => <ShirtCard key={d.id} design={d} selected={selected?.id === d.id} onClick={() => openDesign(d)} />)}
        {filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.88rem' }}>No designs found</div>}
      </div>

      {/* Drawer */}
      <div ref={drawerRef} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 60, background: '#0f0f0f', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', transform: selected ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', boxShadow: selected ? '-24px 0 60px rgba(0,0,0,0.5)' : 'none' }}>
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
                {/* Preview + front/back toggle */}
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.25rem 1rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <DrawerShirt design={selected} color={color} frontText={frontText} backText={backText} frontPos={frontPos} backPos={backPos} frontFont={frontFont} backFont={backFont} showBack={showBack} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(['front', 'back'] as const).map(side => (
                        <button key={side} onClick={() => setShowBack(side === 'back')} style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid', borderColor: (showBack ? side === 'back' : side === 'front') ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)', background: (showBack ? side === 'back' : side === 'front') ? 'rgba(99,102,241,0.08)' : 'transparent', color: (showBack ? side === 'back' : side === 'front') ? '#818CF8' : 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {side === 'front' ? '👕 Front' : '↩️ Back'}
                          {(side === 'front' ? frontText : backText) && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818CF8', display: 'inline-block' }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  {/* Color */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <div style={lbl}>Shirt Color {color && <span style={{ fontWeight: 500, textTransform: 'none' }}>— {color.name}</span>}</div>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {SHIRT_COLORS.map(c => <button key={c.id} title={c.name} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: c.hex, cursor: 'pointer', outline: color?.id === c.id ? '3px solid #6366F1' : '2px solid rgba(255,255,255,0.07)', outlineOffset: 3, transition: 'all 0.15s', transform: color?.id === c.id ? 'scale(1.2)' : 'scale(1)' }} />)}
                    </div>
                  </div>
                  {/* Size */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <div style={lbl}>Size {size && <span style={{ fontWeight: 500, textTransform: 'none' }}>— {size}</span>}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {SHIRT_SIZES.map(s => <button key={s} onClick={() => setSize(s)} style={{ width: 42, height: 42, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${size === s ? '#6366F1' : 'rgba(255,255,255,0.08)'}`, background: size === s ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)', color: size === s ? '#818CF8' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s' }}>{s}</button>)}
                    </div>
                  </div>
                  {/* Text */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    <div style={lbl}>Text — {showBack ? 'Back' : 'Front'} <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                    <input
                      value={showBack ? backText : frontText}
                      onChange={e => showBack ? setBackText(e.target.value) : setFrontText(e.target.value)}
                      maxLength={28} placeholder="e.g. YOUR NAME..."
                      style={inp}
                    />
                    {(showBack ? backText : frontText) && (
                      <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <div style={lbl}>Position</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(['top', 'center', 'bottom'] as TextPos[]).map(p => (
                              <button key={p} onClick={() => showBack ? setBackPos(p) : setFrontPos(p)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${(showBack ? backPos : frontPos) === p ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: (showBack ? backPos : frontPos) === p ? 'rgba(99,102,241,0.07)' : 'transparent', color: (showBack ? backPos : frontPos) === p ? '#818CF8' : 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}>{p}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={lbl}>Font</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {([['bold','BOLD'],['script','Script'],['minimal','minimal']] as [FontStyle,string][]).map(([f, label]) => (
                              <button key={f} onClick={() => showBack ? setBackFont(f) : setFrontFont(f)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${(showBack ? backFont : frontFont) === f ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: (showBack ? backFont : frontFont) === f ? 'rgba(99,102,241,0.07)' : 'transparent', color: (showBack ? backFont : frontFont) === f ? '#818CF8' : 'rgba(255,255,255,0.35)', fontSize: f === 'bold' ? '0.7rem' : '0.72rem', fontWeight: f === 'bold' ? 900 : f === 'script' ? 600 : 300, fontStyle: f === 'script' ? 'italic' : 'normal', letterSpacing: f === 'minimal' ? '0.12em' : 0 }}>{label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
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
                  {/* Recap */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.12)', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                      <svg width="56" height="56" viewBox="0 0 200 200" fill="none"><path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={color?.hex ?? '#2a2a2a'} stroke="rgba(255,255,255,0.1)" strokeWidth="3"/></svg>
                      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}><SvgPreview svg={selected.svg} color={color?.textColor ?? '#fff'} size={22} /></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{selected.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{color?.name} · Size {size}</div>
                      {(frontText || backText) && <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{[frontText && `Front: "${frontText}"`, backText && `Back: "${backText}"`].filter(Boolean).join(' · ')}</div>}
                    </div>
                    <div style={{ fontWeight: 900, color: '#818CF8', flexShrink: 0 }}>${total.toFixed(2)}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><div style={lbl}>Full Name</div><input style={inp} value={shipName} onChange={e => setShipName(e.target.value)} placeholder="Jane Smith" /></div>
                      <div><div style={lbl}>Email</div><input style={inp} type="email" value={shipEmail} onChange={e => setShipEmail(e.target.value)} placeholder="you@example.com" /></div>
                    </div>
                    <div><div style={lbl}>Street Address</div><input style={inp} value={shipStreet} onChange={e => setShipStreet(e.target.value)} placeholder="123 Main St" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px 80px', gap: 10 }}>
                      <div><div style={lbl}>City</div><input style={inp} value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" /></div>
                      <div>
                        <div style={lbl}>State</div>
                        <StateSelect value={shipState} onChange={setShipState} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} />
                      </div>
                      <div><div style={lbl}>ZIP</div><input style={{ ...inp, fontFamily: 'monospace' }} value={shipZip} onChange={e => setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" /></div>
                    </div>

                    {/* Save checkbox — only for registered users */}
                    {session.type === 'user' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginTop: 4 }}>
                        <div onClick={() => setSaveAddress(v => !v)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${saveAddress ? '#6366F1' : 'rgba(255,255,255,0.2)'}`, background: saveAddress ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer' }}>
                          {saveAddress && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Save delivery details for next time</span>
                      </label>
                    )}
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
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.55rem 0.75rem', color: '#fff', fontSize: '0.82rem', outline: 'none' };
