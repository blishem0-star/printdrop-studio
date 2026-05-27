'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { submitOrder } from '@/lib/exportDesign';
import { OWNER_EMAIL } from '@/lib/owner';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };
type TextPos = 'center' | 'top' | 'bottom';
type FontStyle = 'bold' | 'script' | 'minimal';
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const FONT_CSS: Record<FontStyle, React.CSSProperties> = {
  bold:    { fontWeight: 900, fontStyle: 'normal', letterSpacing: '0.04em' },
  script:  { fontWeight: 600, fontStyle: 'italic', letterSpacing: '0.02em' },
  minimal: { fontWeight: 300, fontStyle: 'normal', letterSpacing: '0.18em' },
};

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: done ? 12 : '0.75rem', fontWeight: 800,
        background: done ? '#10B981' : active ? '#FF4D1C' : 'rgba(255,255,255,0.06)',
        color: done || active ? '#fff' : 'rgba(255,255,255,0.25)',
        border: `2px solid ${done ? '#10B981' : active ? '#FF4D1C' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.25s',
      }}>{done ? '✓' : n}</div>
      <span style={{ fontSize: '0.72rem', fontWeight: active ? 700 : 500, color: active ? 'rgba(255,255,255,0.9)' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{label}</span>
    </div>
  );
}

function ShirtPreview({
  color, designSvg, designColor, uploadedImg,
  frontText, backText, frontPos, backPos, frontFont, backFont,
  showBack,
}: {
  color: TShirtColor | null; designSvg?: string | null; designColor?: string; uploadedImg?: string | null;
  frontText: string; backText: string;
  frontPos: TextPos; backPos: TextPos;
  frontFont: FontStyle; backFont: FontStyle;
  showBack: boolean;
}) {
  const bg = color?.hex ?? '#1e1e1e';
  const tc = color?.textColor ?? '#ffffff';

  const textY = (pos: TextPos) => pos === 'top' ? '28%' : pos === 'bottom' ? '75%' : '65%';
  const designY = frontText && frontPos === 'top' ? '52%' : '42%';

  const activeText = showBack ? backText : frontText;
  const activePos = showBack ? backPos : frontPos;
  const activeFont = showBack ? backFont : frontFont;

  return (
    <div style={{ position: 'relative', width: 180, height: 180 }}>
      <svg width="180" height="180" viewBox="0 0 200 200" fill="none">
        <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill={bg} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      </svg>

      {!showBack && uploadedImg && (
        <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', opacity: 0.92 }}>
          <img src={uploadedImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {!showBack && !uploadedImg && designSvg && (
        <div style={{ position: 'absolute', top: designY, left: '50%', transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: 60, height: 60 }} dangerouslySetInnerHTML={{ __html: designSvg.replace(/currentColor/g, designColor ?? tc).replace('<svg ', '<svg width="60" height="60" ') }} />
        </div>
      )}

      {activeText && (
        <div style={{
          position: 'absolute', top: textY(activePos), left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8px', color: tc, maxWidth: 100, textAlign: 'center',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          ...FONT_CSS[activeFont],
        }}>{activeText}</div>
      )}

      {showBack && (
        <div style={{ position: 'absolute', bottom: 6, width: '100%', textAlign: 'center', fontSize: '6px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.1em' }}>BACK</div>
      )}
    </div>
  );
}

export default function CustomPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(1);

  // Step 1
  const [mode, setMode] = useState<'upload' | 'ai'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Step 2
  const [color, setColor] = useState<TShirtColor | null>(null);
  const [size, setSize] = useState<TShirtSize | null>(null);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontPos, setFrontPos] = useState<TextPos>('center');
  const [backPos, setBackPos] = useState<TextPos>('center');
  const [frontFont, setFrontFont] = useState<FontStyle>('bold');
  const [backFont, setBackFont] = useState<FontStyle>('bold');
  const [showBack, setShowBack] = useState(false);

  // Step 3
  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [shipState, setShipState] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // Step 4
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
      if (saved) {
        const s = JSON.parse(saved);
        if (s.street) { setShipStreet(s.street); setShipCity(s.city); setShipZip(s.zip); setShipState(s.state); }
      }
    } catch { router.replace('/'); }
  }, [router]);

  const handleFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  function generateAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiProgress(0); setGeneratedSvg(null);
    const interval = setInterval(() => {
      setAiProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 12;
      });
    }, 180);
    setTimeout(() => {
      clearInterval(interval); setAiProgress(100);
      const keywords = aiPrompt.toLowerCase();
      const match = CATALOG_DESIGNS.find(d =>
        keywords.includes(d.category.toLowerCase()) ||
        keywords.includes(d.title.toLowerCase().split(' ')[0])
      ) ?? CATALOG_DESIGNS[Math.floor(Math.random() * CATALOG_DESIGNS.length)];
      setGeneratedSvg(match.svg);
      setAiLoading(false);
    }, 2800);
  }

  const designApproved = mode === 'ai' ? generatedSvg !== null : uploadedImage !== null;
  const step2Done = color !== null && size !== null;
  const deliveryDone = shipName.trim().length > 1 && shipEmail.includes('@') && shipStreet.trim().length > 3 && shipCity.trim().length > 1 && shipZip.length === 5 && shipState !== '';

  const total = 24.99 + SHIPPING_PRICE;

  async function handleOrder() {
    if (!color || !size) return;
    setSubmitting(true);
    try {
      const designDataUrl = mode === 'ai' && generatedSvg
        ? 'data:image/svg+xml;base64,' + btoa(generatedSvg.replace(/currentColor/g, color.textColor))
        : uploadedImage ?? '';
      const result = await submitOrder({
        customerName: shipName, customerEmail: shipEmail,
        shippingName: shipName, shippingAddr: shipStreet,
        shippingCity: shipCity, shippingZip: shipZip, shippingState: shipState, total,
        design: {
          title: aiPrompt || 'Custom Upload', emoji: '✏️',
          customText: [frontText, backText].filter(Boolean).join(' | ') || undefined,
          colorHex: color.hex, colorName: color.name, size, price: 24.99,
          svgDataUrl: designDataUrl,
        },
      });
      if (result) {
        if (saveAddress) { try { localStorage.setItem('pd_shipping', JSON.stringify({ street: shipStreet, city: shipCity, zip: shipZip, state: shipState })); } catch { /* ignore */ } }
        setOrderId(result.id); setOrdered(true);
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 };

  if (!session) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}><div style={{ color: 'rgba(255,255,255,0.1)' }}>Loading...</div></div>;

  if (ordered) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>Order confirmed!</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{color?.name} · Size {size}</p>
        {orderId && <p style={{ color: 'rgba(255,255,255,0.14)', fontSize: '0.68rem', fontFamily: 'monospace', marginBottom: 28 }}>#{orderId.slice(0,8).toUpperCase()}</p>}
        <button onClick={() => router.push('/home')} style={{ padding: '0.8rem 2rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#FF4D1C,#FF8C40)', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>← Back to home</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#080808' }}>

      {/* Header */}
      <header style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 1.75rem', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.97)' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer' }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '-0.03em' }}>✏️ Create your shirt</span>
        <div style={{ flex: 1 }} />
        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {[['Design', 1], ['Customize', 2], ['Delivery', 3], ['Payment', 4]].map(([label, n], i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <StepDot n={n as number} label={label as string} active={step === n} done={step > (n as number)} />
              {i < 3 && <div style={{ width: 24, height: 1, background: step > (n as number) ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)' }} />}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {session.email === OWNER_EMAIL && <a href="/admin" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.22)', color: 'rgba(255,140,64,0.85)', textDecoration: 'none' }}>⚙ Admin</a>}
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left — scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ maxWidth: 620 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Design your shirt</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>Upload your artwork or let AI generate a design from your description.</p>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
                {(['ai', 'upload'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '0.875rem', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${mode === m ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.07)'}`, background: mode === m ? 'rgba(255,77,28,0.07)' : 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{m === 'ai' ? '✨' : '📁'}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: mode === m ? '#fff' : 'rgba(255,255,255,0.6)', marginBottom: 3 }}>{m === 'ai' ? 'Generate with AI' : 'Upload image'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{m === 'ai' ? 'Describe your design, AI creates it' : 'PNG, JPG, SVG — your own artwork'}</div>
                  </button>
                ))}
              </div>

              {mode === 'ai' ? (
                <div>
                  <div style={lbl}>Describe your design</div>
                  <textarea
                    value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. A minimalist mountain landscape at sunset with bold typography saying EXPLORE..."
                    rows={4}
                    style={{ ...inp, resize: 'none', lineHeight: 1.6, fontFamily: 'inherit' }}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generateAI(); }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                    <button
                      onClick={generateAI}
                      disabled={!aiPrompt.trim() || aiLoading}
                      style={{ padding: '0.75rem 1.75rem', borderRadius: 12, border: 'none', background: aiPrompt.trim() && !aiLoading ? 'linear-gradient(135deg,#FF4D1C,#FF8C40)' : 'rgba(255,255,255,0.06)', color: aiPrompt.trim() && !aiLoading ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: 800, fontSize: '0.88rem', cursor: aiPrompt.trim() && !aiLoading ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                      {aiLoading ? `Generating... ${Math.round(aiProgress)}%` : generatedSvg ? '🔄 Regenerate' : '✨ Generate Design'}
                    </button>
                    {aiLoading && (
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${aiProgress}%`, background: 'linear-gradient(90deg,#FF4D1C,#FF8C40)', borderRadius: 999, transition: 'width 0.2s' }} />
                      </div>
                    )}
                  </div>

                  {generatedSvg && !aiLoading && (
                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 60, height: 60 }} dangerouslySetInnerHTML={{ __html: generatedSvg.replace(/currentColor/g, 'rgba(255,255,255,0.75)').replace('<svg ', '<svg width="60" height="60" ') }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginBottom: 4 }}>✓ Design generated</div>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Ready to print. You can regenerate or continue to step 2.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  ref={dropRef}
                  onDragEnter={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${dragging ? 'rgba(255,77,28,0.5)' : uploadedImage ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(255,77,28,0.04)' : uploadedImage ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }} />
                  {uploadedImage ? (
                    <div>
                      <img src={uploadedImage} alt="uploaded" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 10, marginBottom: 12 }} />
                      <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>✓ Image uploaded — click to replace</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                      <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Drop your image here</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>PNG, JPG, SVG up to 10MB · or click to browse</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div style={{ maxWidth: 580 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Customize your shirt</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>Pick a color, size, and optional text for front and back.</p>

              {/* Color */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={lbl}>Shirt Color {color && <span style={{ fontWeight: 500, textTransform: 'none' }}>— {color.name}</span>}</div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {SHIRT_COLORS.map(c => <button key={c.id} title={c.name} onClick={() => setColor(c)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: c.hex, cursor: 'pointer', outline: color?.id === c.id ? '3px solid #FF4D1C' : '2px solid rgba(255,255,255,0.08)', outlineOffset: 3, transition: 'all 0.15s', transform: color?.id === c.id ? 'scale(1.2)' : 'scale(1)' }} />)}
                </div>
              </div>

              {/* Size */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={lbl}>Size {size && <span style={{ fontWeight: 500, textTransform: 'none' }}>— {size}</span>}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {SHIRT_SIZES.map(s => <button key={s} onClick={() => setSize(s)} style={{ width: 50, height: 50, borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${size === s ? '#FF4D1C' : 'rgba(255,255,255,0.08)'}`, background: size === s ? 'rgba(255,77,28,0.1)' : 'rgba(255,255,255,0.02)', color: size === s ? '#FF8C40' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s', transform: size === s ? 'scale(1.1)' : 'scale(1)' }}>{s}</button>)}
                </div>
              </div>

              {/* Text tabs */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
                  {(['front', 'back'] as const).map(side => (
                    <button key={side} onClick={() => setShowBack(side === 'back')} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: (showBack ? side === 'back' : side === 'front') ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.08)', background: (showBack ? side === 'back' : side === 'front') ? 'rgba(255,77,28,0.07)' : 'transparent', color: (showBack ? side === 'back' : side === 'front') ? '#FF8C40' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                      {side === 'front' ? '👕 Front' : '↩️ Back'}
                      {(side === 'front' ? frontText : backText) && <span style={{ marginLeft: 5, width: 5, height: 5, borderRadius: '50%', background: '#FF4D1C', display: 'inline-block' }} />}
                    </button>
                  ))}
                </div>

                {!showBack ? (
                  <TextOptions text={frontText} setText={setFrontText} pos={frontPos} setPos={setFrontPos} font={frontFont} setFont={setFrontFont} side="Front" inp={inp} lbl={lbl} />
                ) : (
                  <TextOptions text={backText} setText={setBackText} pos={backPos} setPos={setBackPos} font={backFont} setFont={setBackFont} side="Back" inp={inp} lbl={lbl} />
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Delivery details</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
                {session.type === 'user' && shipStreet ? 'We found your saved address. Confirm or edit.' : 'Enter your shipping address.'}
              </p>

              {session.type === 'user' && shipStreet && !addressConfirmed && (
                <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>{shipName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{shipStreet}, {shipCity}, {shipState} {shipZip}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{shipEmail}</div>
                  </div>
                  <button onClick={() => setAddressConfirmed(true)} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}>Confirm ✓</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><div style={lbl}>Full Name</div><input style={inp} value={shipName} onChange={e => setShipName(e.target.value)} placeholder="Jane Smith" /></div>
                  <div><div style={lbl}>Email</div><input style={inp} type="email" value={shipEmail} onChange={e => setShipEmail(e.target.value)} placeholder="you@example.com" /></div>
                </div>
                <div><div style={lbl}>Street Address</div><input style={inp} value={shipStreet} onChange={e => setShipStreet(e.target.value)} placeholder="123 Main St, Apt 4B" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 12 }}>
                  <div><div style={lbl}>City</div><input style={inp} value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" /></div>
                  <div>
                    <div style={lbl}>State</div>
                    <select value={shipState} onChange={e => setShipState(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer', color: shipState ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                      <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>ST</option>
                      {US_STATES.map(s => <option key={s} value={s} style={{ background: '#1a1a1a', color: '#fff' }}>{s}</option>)}
                    </select>
                  </div>
                  <div><div style={lbl}>ZIP</div><input style={{ ...inp, fontFamily: 'monospace' }} value={shipZip} onChange={e => setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" /></div>
                </div>
                {session.type === 'user' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginTop: 4 }}>
                    <div onClick={() => setSaveAddress((v: boolean) => !v)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${saveAddress ? '#FF4D1C' : 'rgba(255,255,255,0.2)'}`, background: saveAddress ? '#FF4D1C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer' }}>
                      {saveAddress && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Save delivery details for next time</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div style={{ maxWidth: 520 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Payment</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>Review your order and confirm. Payment via secure external provider — your card details are never stored with us.</p>

              {/* Order summary */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>Order Summary</div>
                {[['Custom shirt design', `$24.99`], ['Shipping', `$${SHIPPING_PRICE.toFixed(2)}`]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                  <span>Total</span>
                  <span style={{ color: '#FF5C28', fontSize: '1.1rem' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping recap */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Ships to</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{shipName}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{shipStreet}, {shipCity}, {shipState} {shipZip}</div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.75rem', color: 'rgba(245,158,11,0.7)', lineHeight: 1.6 }}>
                🔒 Payment integration coming soon — Stripe / PayPal will be connected here. Click "Place Order" to record your order now.
              </div>
            </div>
          )}
        </div>

        {/* Right — sticky shirt preview */}
        <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, gap: 12 }}>
            <ShirtPreview
              color={color} showBack={showBack && step === 2}
              designSvg={mode === 'ai' ? (generatedSvg ?? null) : null}
              uploadedImg={mode === 'upload' ? uploadedImage : null}
              frontText={frontText} backText={backText}
              frontPos={frontPos} backPos={backPos}
              frontFont={frontFont} backFont={backFont}
            />
            {step === 2 && (frontText || backText) && (
              <button onClick={() => setShowBack(v => !v)} style={{ fontSize: '0.65rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '3px 10px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                {showBack ? 'View front ↩' : 'View back →'}
              </button>
            )}
          </div>

          <div style={{ padding: '1.25rem', flex: 1 }}>
            {color && <div style={{ marginBottom: 8, fontSize: '0.78rem' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>Color: </span>{color.name}</div>}
            {size && <div style={{ marginBottom: 8, fontSize: '0.78rem' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>Size: </span>{size}</div>}
            {designApproved && <div style={{ marginBottom: 8, fontSize: '0.78rem', color: '#10B981' }}>✓ Design ready</div>}
            {frontText && <div style={{ marginBottom: 4, fontSize: '0.72rem' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Front: </span>{frontText}</div>}
            {backText && <div style={{ marginBottom: 4, fontSize: '0.72rem' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Back: </span>{backText}</div>}
          </div>

          {/* Navigation buttons */}
          <div style={{ padding: '0 1.25rem 1.25rem', flexShrink: 0 }}>
            {step < 4 && (
              <button
                disabled={
                  (step === 1 && !designApproved) ||
                  (step === 2 && !step2Done) ||
                  (step === 3 && !deliveryDone)
                }
                onClick={() => setStep(s => s + 1)}
                style={{
                  width: '100%', height: 46, borderRadius: 12, border: 'none',
                  background: (step === 1 && designApproved) || (step === 2 && step2Done) || (step === 3 && deliveryDone)
                    ? 'linear-gradient(135deg,#FF4D1C,#FF8C40)'
                    : 'rgba(255,255,255,0.05)',
                  color: (step === 1 && designApproved) || (step === 2 && step2Done) || (step === 3 && deliveryDone)
                    ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 800, fontSize: '0.88rem',
                  cursor: (step === 1 && designApproved) || (step === 2 && step2Done) || (step === 3 && deliveryDone) ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: (step === 1 && designApproved) || (step === 2 && step2Done) || (step === 3 && deliveryDone) ? '0 6px 20px rgba(255,77,28,0.3)' : 'none',
                }}
              >
                {step === 1 ? (!designApproved ? (mode === 'ai' ? 'Generate a design first' : 'Upload an image first') : 'Approve & Continue →')
                  : step === 2 ? (!step2Done ? 'Pick color & size' : 'Approve & Continue →')
                  : step === 3 ? (!deliveryDone ? 'Fill in all fields' : 'Continue to Payment →')
                  : ''}
              </button>
            )}
            {step === 4 && (
              <button disabled={submitting} onClick={handleOrder} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: !submitting ? 'linear-gradient(135deg,#FF4D1C,#FF8C40)' : 'rgba(255,255,255,0.05)', color: !submitting ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.9rem', cursor: !submitting ? 'pointer' : 'default', boxShadow: !submitting ? '0 6px 20px rgba(255,77,28,0.3)' : 'none', transition: 'all 0.2s' }}>
                {submitting ? 'Placing order...' : `Place Order — $${total.toFixed(2)}`}
              </button>
            )}
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ width: '100%', marginTop: 8, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: 'rgba(255,255,255,0.25)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>← Previous step</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextOptions({ text, setText, pos, setPos, font, setFont, side, inp, lbl }: {
  text: string; setText: (v: string) => void;
  pos: TextPos; setPos: (v: TextPos) => void;
  font: FontStyle; setFont: (v: FontStyle) => void;
  side: string;
  inp: React.CSSProperties;
  lbl: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={lbl}>{side} text <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
        <input value={text} onChange={e => setText(e.target.value)} maxLength={28} placeholder={`e.g. ${side === 'Front' ? 'YOUR NAME' : 'EST. 2025'}`} style={inp} />
      </div>
      {text && (
        <>
          <div>
            <div style={lbl}>Position</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['top', 'center', 'bottom'] as const).map(p => (
                <button key={p} onClick={() => setPos(p)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${pos === p ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.07)'}`, background: pos === p ? 'rgba(255,77,28,0.07)' : 'transparent', color: pos === p ? '#FF8C40' : 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={lbl}>Font style</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['bold', 'BOLD'], ['script', 'Script'], ['minimal', 'minimal']] as const).map(([f, label]) => (
                <button key={f} onClick={() => setFont(f)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${font === f ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.07)'}`, background: font === f ? 'rgba(255,77,28,0.07)' : 'transparent', color: font === f ? '#FF8C40' : 'rgba(255,255,255,0.35)', fontSize: f === 'bold' ? '0.72rem' : f === 'script' ? '0.75rem' : '0.65rem', fontWeight: f === 'bold' ? 900 : f === 'script' ? 600 : 300, fontStyle: f === 'script' ? 'italic' : 'normal', letterSpacing: f === 'minimal' ? '0.15em' : 0 }}>{label}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
