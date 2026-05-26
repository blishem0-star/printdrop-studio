'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DESIGNS, SHIRT_COLORS, SHIRT_SIZES, TShirtColor, TShirtSize,
  BASE_PRICE, SHIPPING_PRICE, Design, CATEGORIES,
} from '@/lib/mockData';
import ShirtViewer3D from '@/components/ShirtViewer3D';
import PhotoToDesign from '@/components/PhotoToDesign';
import GroupOrderModal from '@/components/GroupOrderModal';
import Footer from '@/components/Footer';
import Link from 'next/link';
import StepShell from '@/components/studio/StepShell';
import { Field, LabeledField, Checkmark } from '@/components/studio/FormFields';
import SizeGuideModal from '@/components/SizeGuideModal';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

/* ── main ─────────────────────────────────────────────── */

function DesignStudio() {
  const params = useSearchParams();
  const initId = params.get('id');

  const [color,  setColor]  = useState<TShirtColor | null>(null);
  const [size,   setSize]   = useState<TShirtSize  | null>(null);
  const [design, setDesign] = useState<Design | null>(
    initId ? (DESIGNS.find(d => d.id === initId) ?? null) : null
  );

  const [aiPrompt,     setAiPrompt]     = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);
  const [designTab,    setDesignTab]    = useState<'catalog'|'ai'|'photo'>('catalog');
  const [catFilter,    setCatFilter]    = useState('All');
  const [remixItems,   setRemixItems]   = useState<Design[]|null>(null);
  const [remixLoad,    setRemixLoad]    = useState(false);
  const [showGroup,    setShowGroup]    = useState(false);
  const [ordered,      setOrdered]      = useState(false);
  const [activeStep,   setActiveStep]   = useState(1);
  const [customText,   setCustomText]   = useState('');
  const [showSizeGuide,setShowSizeGuide]= useState(false);
  const [wishlist,     setWishlist]     = useState<string[]>([]);

  // Shipping
  const [shipName,   setShipName]   = useState('');
  const [shipEmail,  setShipEmail]  = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity,   setShipCity]   = useState('');
  const [shipZip,    setShipZip]    = useState('');
  const [shipState,  setShipState]  = useState('');

  // Payment
  const [cardNum,   setCardNum]   = useState('');
  const [cardExp,   setCardExp]   = useState('');
  const [cardCvv,   setCardCvv]   = useState('');
  const [cardName,  setCardName]  = useState('');
  const [payMethod, setPayMethod] = useState<'card'|'apple'|'google'|'paypal'>('card');

  // Completion gates
  const step1Done = color !== null && size !== null;
  const step2Done = design !== null;
  const step3Done = shipName.trim().length > 1
    && shipEmail.includes('@')
    && shipStreet.trim().length > 3
    && shipCity.trim().length > 1
    && shipZip.length === 5
    && shipState !== '';
  const step4Done = payMethod !== 'card' ||
    (cardNum.replace(/\s/g,'').length >= 12 && cardExp.length >= 4 && cardCvv.length >= 3);

  // Load wishlist from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pd_wishlist');
      if (saved) setWishlist(JSON.parse(saved)); // eslint-disable-line react-hooks/set-state-in-effect
    } catch { /* ignore */ }
  }, []);

  function toggleWishlist(id: string) {
    setWishlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { sessionStorage.setItem('pd_wishlist', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  // Auto-advance (step3 via effect; steps 1+2 via event handlers below)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (step3Done) setActiveStep(s => s === 3 ? 4 : s); }, [step3Done]);

  const total = (design?.price ?? BASE_PRICE) + SHIPPING_PRICE;

  function fmtCard(v: string) { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
  function fmtExp(v: string) { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2) + ' / ' + d.slice(2) : d; }

  function handleAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setTimeout(() => { setDesign(DESIGNS[5]); setAiLoading(false); if (activeStep === 2) setActiveStep(3); }, 2000);
  }

  function handleRemix() {
    if (!design) return;
    setRemixLoad(true); setRemixItems(null);
    setTimeout(() => {
      setRemixItems(DESIGNS.filter(d => d.id !== design.id).sort(() => Math.random() - 0.5).slice(0, 4));
      setRemixLoad(false);
    }, 1500);
  }

  function resetStudio() {
    setOrdered(false); setActiveStep(1);
    setColor(null); setSize(null); setDesign(null); setCustomText('');
    setShipName(''); setShipEmail(''); setShipStreet('');
    setShipCity(''); setShipState(''); setShipZip('');
    setCardNum(''); setCardExp(''); setCardCvv(''); setCardName('');
  }

  /* ── Order success ── */
  if (ordered) return (
    <main style={{ paddingTop: 60, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12 }}>Order confirmed!</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 6 }}>
          <strong style={{ color: 'white' }}>{design?.title}</strong> · {color?.name} · Size {size}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', marginBottom: '2.5rem' }}>
          Delivery in <span style={{ color: '#10B981' }}>72 hours</span> · Confirmation sent to {shipEmail}
        </p>
        <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 18, padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.9rem' }}>📸 Earn 10% off your next order</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginBottom: 14 }}>
            Upload a photo wearing your shirt and we&apos;ll send you a discount code.
          </p>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            Upload photo <input type="file" accept="image/*" style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/catalog" className="btn btn-primary">Browse more</Link>
          <button className="btn btn-ghost" onClick={resetStudio}>Create another</button>
        </div>
      </div>
    </main>
  );

  /* ── Studio ── */
  return (
    <main style={{ paddingTop: 60, minHeight: '100vh' }}>
      {showGroup && <GroupOrderModal onClose={() => setShowGroup(false)} />}
      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} selected={size} />}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Design Studio</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', marginTop: 4 }}>Complete each step to unlock the next</p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 4rem', display: 'grid', gap: '2rem', alignItems: 'start' }}
        className="lg:grid-cols-[1fr_360px]">

        {/* ── LEFT: steps ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* ══ STEP 1: Shirt ══ */}
          <StepShell n={1} title="Choose your shirt"
            status={activeStep === 1 ? 'active' : step1Done ? 'done' : 'locked'}
            summary={step1Done ? `${color!.name} · Size ${size}` : undefined}
            onEdit={() => setActiveStep(1)}>

            <div style={{ marginBottom: '1.75rem' }}>
              <div className="label" style={{ marginBottom: 14 }}>
                Select a color
                {color && <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', letterSpacing: 0, fontWeight: 500, marginLeft: 8 }}>— {color.name}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {SHIRT_COLORS.map(c => (
                  <button key={c.id} title={c.name}
                    onClick={() => { setColor(c); if (size !== null && activeStep === 1) setActiveStep(2); }}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', border: 'none', background: c.hex, cursor: 'pointer',
                      outline: color?.id === c.id ? '3px solid #FF4D1C' : '2px solid rgba(255,255,255,0.08)',
                      outlineOffset: 3,
                      boxShadow: color?.id === c.id ? '0 0 18px rgba(255,77,28,0.45)' : 'none',
                      transition: 'all 0.15s',
                      transform: color?.id === c.id ? 'scale(1.1)' : 'scale(1)',
                    }} />
                ))}
              </div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Select a size</span>
                {size && <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>— {size}</span>}
                <button onClick={() => setShowSizeGuide(true)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 9px', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                  📏 Size Guide
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {SHIRT_SIZES.map(s => (
                  <button key={s}
                    onClick={() => { setSize(s); if (color !== null && activeStep === 1) setActiveStep(2); }}
                    style={{
                      minWidth: 56, height: 56, borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${size === s ? '#FF4D1C' : 'rgba(255,255,255,0.08)'}`,
                      background: size === s ? 'rgba(255,77,28,0.12)' : 'rgba(255,255,255,0.02)',
                      color: size === s ? '#FF8C40' : 'rgba(255,255,255,0.4)',
                      fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s',
                      boxShadow: size === s ? '0 0 16px rgba(255,77,28,0.25)' : 'none',
                      transform: size === s ? 'scale(1.05)' : 'scale(1)',
                    }}>{s}</button>
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.72rem' }}>
                Unisex · 100% ring-spun cotton · Pre-shrunk · Machine washable
              </p>
            </div>

            {!step1Done && (
              <p style={{ marginTop: '1.25rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                {!color ? '← Pick a color to continue' : '← Pick a size to continue'}
              </p>
            )}
          </StepShell>

          {/* ══ STEP 2: Design ══ */}
          <StepShell n={2} title="Choose a design"
            status={step1Done ? (activeStep === 2 ? 'active' : step2Done ? 'done' : 'active') : 'locked'}
            summary={step2Done ? `${design!.title} — $${design!.price}` : undefined}
            onEdit={() => { if (step1Done) setActiveStep(2); }}>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 3, marginBottom: '1.5rem', gap: 3, width: 'fit-content' }}>
              {(['catalog','ai','photo'] as const).map((id) => {
                const labels = { catalog: '📋 Catalog', ai: '✦ AI', photo: '📸 Photo' };
                return (
                  <button key={id} onClick={() => setDesignTab(id)} style={{
                    padding: '7px 16px', borderRadius: 9, border: 'none',
                    background: designTab === id ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: designTab === id ? 'white' : 'rgba(255,255,255,0.3)',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{labels[id]}</button>
                );
              })}
            </div>

            {designTab === 'catalog' && (
              <div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCatFilter(c)} style={{
                      padding: '5px 12px', borderRadius: 999, border: '1px solid',
                      borderColor: catFilter === c ? 'rgba(255,77,28,0.5)' : 'rgba(255,255,255,0.07)',
                      background: catFilter === c ? 'rgba(255,77,28,0.08)' : 'transparent',
                      color: catFilter === c ? '#FF8C40' : 'rgba(255,255,255,0.3)',
                      fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}>{c}</button>
                  ))}
                </div>
                {wishlist.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>❤ Saved</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DESIGNS.filter(d => wishlist.includes(d.id)).map(d => (
                        <button key={d.id} onClick={() => { setDesign(d); if (activeStep === 2) setActiveStep(3); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: design?.id === d.id ? 'rgba(255,77,28,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${design?.id === d.id ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          <span>{d.emoji}</span><span>{d.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px,1fr))', gap: '0.6rem' }}>
                  {DESIGNS.filter(d => catFilter === 'All' || d.category === catFilter).map(d => (
                    <div key={d.id} style={{ position: 'relative' }}>
                      <button
                        onClick={() => { setDesign(d); if (activeStep === 2) setActiveStep(3); }}
                        style={{
                          width: '100%', borderRadius: 14, padding: '1rem 0.5rem', cursor: 'pointer', textAlign: 'center',
                          border: `1.5px solid ${design?.id === d.id ? '#FF4D1C' : 'rgba(255,255,255,0.06)'}`,
                          background: design?.id === d.id ? 'rgba(255,77,28,0.09)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.15s',
                          boxShadow: design?.id === d.id ? '0 0 20px rgba(255,77,28,0.2)' : 'none',
                          transform: design?.id === d.id ? 'scale(1.03)' : 'scale(1)',
                        }}>
                        <div style={{ fontSize: 34, marginBottom: 6 }}>{d.emoji}</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{d.title}</div>
                        <div style={{ color: '#FF5C28', fontSize: '0.75rem', fontWeight: 800 }}>${d.price}</div>
                      </button>
                      <button onClick={() => toggleWishlist(d.id)} style={{
                        position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%',
                        background: wishlist.includes(d.id) ? 'rgba(255,77,28,0.2)' : 'rgba(0,0,0,0.5)',
                        border: `1px solid ${wishlist.includes(d.id) ? 'rgba(255,77,28,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        color: wishlist.includes(d.id) ? '#FF6B3D' : 'rgba(255,255,255,0.3)',
                        fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>♥</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {designTab === 'ai' && (
              <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: '1.5rem' }}>
                <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '1rem', fontSize: '0.9rem' }}>✦ Describe your design</div>
                <textarea className="input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
                  placeholder="e.g. A lone wolf under a neon moon, cyberpunk style..." />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0.75rem 0' }}>
                  {['Minimalist logo','Retro sunset','Abstract art','Bold type'].map(h => (
                    <button key={h} onClick={() => setAiPrompt(h)} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 999, color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', padding: '4px 10px', cursor: 'pointer',
                    }}>+ {h}</button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleAI} disabled={aiLoading || !aiPrompt.trim()}
                  style={{ opacity: aiLoading || !aiPrompt.trim() ? 0.4 : 1 }}>
                  {aiLoading ? '✦ Generating...' : '✦ Generate'}
                </button>
                {design && designTab === 'ai' && !aiLoading && (
                  <p style={{ color: '#10B981', fontSize: '0.78rem', marginTop: 10 }}>✓ Design ready: {design.title}</p>
                )}
              </div>
            )}

            {designTab === 'photo' && (
              <PhotoToDesign onDesignGenerated={(emoji, label) => {
                setDesign({ ...DESIGNS[5], emoji, title: label });
                if (activeStep === 2) setActiveStep(3);
              }} />
            )}

            {/* Custom text on shirt */}
            <div style={{ marginTop: '1.25rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>✏ Custom text on shirt (optional)</div>
              <div style={{ position: 'relative' }}>
                <input className="input" value={customText} onChange={e => setCustomText(e.target.value)} maxLength={22}
                  placeholder="e.g. YOUR NAME, EST. 2025..."
                  style={{ paddingRight: customText ? 48 : 14, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: '0.85rem' }} />
                {customText && (
                  <button onClick={() => setCustomText('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: 2 }}>×</button>
                )}
              </div>
              {customText && <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Appears on the shirt — visible in the 3D preview</p>}
            </div>

            {design && (
              <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: remixItems ? 12 : 0 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>✦ Remix variations</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleRemix} disabled={remixLoad}>
                    {remixLoad ? '...' : 'Generate →'}
                  </button>
                </div>
                {remixItems && !remixLoad && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 4 }}>
                    {remixItems.map((d, i) => (
                      <button key={d.id} onClick={() => setDesign(d)} style={{
                        borderRadius: 10, padding: '0.75rem 0.25rem',
                        border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                      }}>
                        <div style={{ fontSize: 26 }}>{d.emoji}</div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                          {(['Darker','Neon','Minimal','Retro'] as const)[i]}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!step2Done && (
              <p style={{ marginTop: '1.25rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                ← Select a design to continue
              </p>
            )}
          </StepShell>

          {/* ══ STEP 3: Delivery ══ */}
          <StepShell n={3} title="Delivery"
            status={step1Done && step2Done ? (activeStep === 3 ? 'active' : step3Done ? 'done' : 'active') : 'locked'}
            summary={step3Done ? `${shipName} · ${shipCity}, ${shipState} ${shipZip}` : undefined}
            onEdit={() => { if (step1Done && step2Done) setActiveStep(3); }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Contact panel */}
              <div style={{ borderRadius: 18, background: 'linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden' }}>
                <div style={{ height: 2, background: 'linear-gradient(90deg,#FF4D1C,#FF9A00,transparent)' }} />
                <div style={{ padding: '1rem 1.25rem 0.875rem', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,rgba(255,77,28,0.3),rgba(255,154,0,0.15))', border: '1px solid rgba(255,77,28,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✉</div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>Contact Info</div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>Where we send your tracking number</div>
                  </div>
                  {shipName.trim().length > 1 && shipEmail.includes('@') && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>✓</div>
                  )}
                </div>
                <div className="studio-2col" style={{ padding: '1.125rem 1.25rem' }}>
                  <LabeledField label="Full Name" value={shipName} onChange={setShipName} valid={shipName.trim().length > 1} placeholder="Jane Smith" />
                  <LabeledField label="Email Address" type="email" value={shipEmail} onChange={setShipEmail} valid={shipEmail.includes('@') && shipEmail.includes('.')} placeholder="you@example.com" />
                </div>
              </div>

              {/* Address panel */}
              <div style={{ borderRadius: 18, background: 'linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden' }}>
                <div style={{ height: 2, background: 'linear-gradient(90deg,#6C63FF,#8B5CF6,transparent)' }} />
                <div style={{ padding: '1rem 1.25rem 0.875rem', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,rgba(108,99,255,0.3),rgba(139,92,246,0.15))', border: '1px solid rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📍</div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>Shipping Address</div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>Delivering within the United States 🇺🇸</div>
                  </div>
                  {shipStreet.length > 3 && shipCity.length > 1 && shipState && shipZip.length === 5 && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>✓</div>
                  )}
                </div>
                <div style={{ padding: '1.125rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <LabeledField label="Street Address" value={shipStreet} onChange={setShipStreet} valid={shipStreet.trim().length > 3} placeholder="123 Main St, Apt 4B" />
                  <div className="studio-3col">
                    <LabeledField label="City" value={shipCity} onChange={setShipCity} valid={shipCity.trim().length > 1} placeholder="New York" />
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>State</div>
                      <div style={{ position: 'relative' }}>
                        <select value={shipState} onChange={e => setShipState(e.target.value)} style={{
                          width: '100%', appearance: 'none',
                          background: 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${shipState ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 10, padding: '0.65rem 1.75rem 0.65rem 0.75rem',
                          color: shipState ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)',
                          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', outline: 'none',
                          transition: 'border-color 0.15s',
                        }}>
                          <option value="">ST</option>
                          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {!shipState && <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'rgba(255,255,255,0.25)', fontSize:9 }}>▾</div>}
                        {shipState && <Checkmark />}
                      </div>
                    </div>
                    <LabeledField label="ZIP" value={shipZip} onChange={v => setShipZip(v.replace(/\D/g,'').slice(0,5))} valid={shipZip.length === 5} placeholder="10001" mono />
                  </div>
                </div>
              </div>

              <button onClick={() => setShowGroup(true)} style={{
                padding: '0.875rem 1.25rem', borderRadius: 14, cursor: 'pointer',
                background: 'linear-gradient(135deg,rgba(139,92,246,0.06),rgba(139,92,246,0.02))',
                border: '1px dashed rgba(139,92,246,0.22)',
                color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 16 }}>👥</span>
                Group order — everyone picks their size
                <span style={{ fontSize: '0.58rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: 999, fontWeight: 800, letterSpacing: '0.06em' }}>TEAM</span>
              </button>
            </div>
          </StepShell>

          {/* ══ STEP 4: Payment ══ */}
          <StepShell n={4} title="Payment"
            status={step3Done ? (activeStep === 4 ? 'active' : step4Done ? 'done' : 'active') : 'locked'}
            summary={step4Done ? (payMethod === 'card' ? `Card ···· ${cardNum.replace(/\s/g,'').slice(-4)}` : payMethod) : undefined}
            onEdit={() => { if (step3Done) setActiveStep(4); }}>

            <div className="studio-4col" style={{ marginBottom: '1.75rem' }}>
              {([
                { id: 'card',   bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', accent: '#6C63FF', icon: '💳', label: 'Card' },
                { id: 'apple',  bg: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)', accent: '#fff',    icon: '',    label: 'Apple Pay' },
                { id: 'google', bg: 'linear-gradient(135deg,#1a2a1a,#1f3a1f)', accent: '#34A853', icon: 'G',   label: 'Google Pay' },
                { id: 'paypal', bg: 'linear-gradient(135deg,#001a3a,#003087)', accent: '#009CDE', icon: 'P',   label: 'PayPal' },
              ] as const).map(m => {
                const active = payMethod === m.id;
                return (
                  <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
                    borderRadius: 14, padding: '1rem 0.5rem', cursor: 'pointer',
                    background: active ? m.bg : 'rgba(255,255,255,0.025)',
                    border: `1.5px solid ${active ? m.accent + '60' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.2s', boxShadow: active ? `0 8px 24px ${m.accent}22` : 'none',
                    transform: active ? 'scale(1.03)' : 'scale(1)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: m.id === 'card' ? 22 : 16, fontWeight: 900, color: active ? m.accent : 'rgba(255,255,255,0.25)', marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', lineHeight: 1.3 }}>{m.label}</div>
                  </button>
                );
              })}
            </div>

            {payMethod === 'card' && (
              <div>
                <div style={{ borderRadius: 18, padding: '1.5rem', background: 'linear-gradient(135deg,#1a1040,#0d0720,#1a0a30)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: 140 }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(108,99,255,0.15)' }} />
                  <div style={{ position: 'absolute', bottom: -30, left: 30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,77,28,0.08)' }} />
                  <div style={{ width: 36, height: 28, borderRadius: 6, marginBottom: '1.25rem', background: 'linear-gradient(135deg,#c8a44a,#f0d080)', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 16, color: 'rgba(255,255,255,0.85)' }}>
                    {cardNum || '•••• •••• •••• ••••'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Card holder</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em' }}>{cardName || 'YOUR NAME'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Expires</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>{cardExp || 'MM / YY'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field label="Name on card" value={cardName} onChange={setCardName} valid={cardName.trim().length > 2} />
                  <Field label="Card number" value={cardNum} onChange={v => setCardNum(fmtCard(v))} valid={cardNum.replace(/\s/g,'').length >= 16} mono />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="MM / YY" value={cardExp} onChange={v => setCardExp(fmtExp(v))} valid={cardExp.length >= 7} mono />
                    <Field label="CVC" value={cardCvv} onChange={v => setCardCvv(v.replace(/\D/g,'').slice(0,4))} valid={cardCvv.length >= 3} mono />
                  </div>
                </div>
              </div>
            )}

            {payMethod !== 'card' && (
              <div style={{ borderRadius: 16, padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {payMethod === 'apple' ? '' : payMethod === 'google' ? '🟢' : '🔵'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {payMethod === 'apple' ? 'Apple Pay' : payMethod === 'google' ? 'Google Pay' : 'PayPal'} selected
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: 6 }}>
                  You&apos;ll be redirected to complete payment
                </p>
              </div>
            )}

            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.68rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>🔒</span> 256-bit SSL encryption · Demo only — no real payment
            </p>
          </StepShell>
        </div>

        {/* ── RIGHT: preview panel ── */}
        <div style={{ position: 'sticky', top: 76 }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, overflow: 'hidden' }}>

            {/* 3D viewer */}
            <div style={{ background: 'rgba(0,0,0,0.45)', padding: '2rem 1.5rem 1.5rem', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {color ? (
                <ShirtViewer3D color={color.hex} textColor={color.textColor} emoji={design?.emoji} label={design?.title} customText={customText || undefined} />
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>👕</div>
                  <p style={{ fontSize: '0.78rem' }}>Select a color to see your shirt</p>
                </div>
              )}
            </div>

            {/* Order summary card */}
            {design && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(160deg,rgba(255,77,28,0.06),rgba(139,92,246,0.04))', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: `radial-gradient(circle at 35% 35%,${color?.hex ?? '#333'}cc,${color?.hex ?? '#111'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `0 6px 20px ${color?.hex ?? '#000'}55`, border: '1px solid rgba(255,255,255,0.1)' }}>{design.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{design.title}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {[color?.name, size ? `Size ${size}` : null, 'DTG Print'].filter(Boolean).map((t, i) => (
                        <span key={i} style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: i === 2 ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#FF6B3D,#FF9A00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${design.price.toFixed(2)}</div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>per shirt</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {[{ icon:'⚡',t:'72h',sub:'Delivery'},{icon:'🎨',t:'300DPI',sub:'Quality'},{icon:'♻️',t:'Carbon',sub:'Neutral'},{icon:'↩️',t:'Free',sub:'Returns'}].map((b,i,arr) => (
                    <div key={b.t} style={{ padding: '0.75rem 0.25rem', textAlign: 'center', borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ fontSize: 13 }}>{b.icon}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{b.t}</div>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)' }}>{b.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price + CTA */}
            <div style={{ padding: '1.5rem' }}>
              {!design && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
                  {[{ label: 'Color', value: color?.name }, { label: 'Size', value: size }, { label: 'Design', value: null }].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                      {value ? <span style={{ fontWeight: 600 }}>{value}</span> : <span style={{ color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>Not selected</span>}
                    </div>
                  ))}
                </div>
              )}

              {design && (
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {[['Design', `$${design.price.toFixed(2)}`], ['Shipping', `$${SHIPPING_PRICE.toFixed(2)}`]].map(([label, val], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Total</span>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#FF5C28' }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary"
                disabled={!step1Done || !step2Done || !step3Done || !step4Done}
                onClick={() => setOrdered(true)}
                style={{ width: '100%', height: 52, fontSize: '0.9rem', borderRadius: 14, justifyContent: 'center', opacity: step1Done && step2Done && step3Done && step4Done ? 1 : 0.3, pointerEvents: step1Done && step2Done && step3Done && step4Done ? 'auto' : 'none' }}>
                {!step1Done ? 'Complete Step 1 first' :
                 !step2Done ? 'Complete Step 2 first' :
                 !step3Done ? 'Add delivery details' :
                 !step4Done ? 'Add payment info' :
                 `Place Order — $${total.toFixed(2)}`}
              </button>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.875rem', justifyContent: 'center' }}>
                {['🔒 Secure', '72h Delivery', '100% Quality'].map(b => (
                  <span key={b} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </main>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: 100, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>Loading...</div>}>
      <DesignStudio />
    </Suspense>
  );
}
