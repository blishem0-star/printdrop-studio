'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string; role?: string };
type DesignStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ArtistDesign = {
  id: string; title: string; category: string; price: number;
  svg: string; status: DesignStatus; salesCount: number; totalEarned: number; createdAt: string;
};
type Earnings = {
  totalEarned: number; totalSales: number; approved: number; pending: number;
  designs: { id: string; title: string; status: DesignStatus; salesCount: number; totalEarned: number; price: number }[];
};

const CATEGORIES = ['Nature', 'Urban', 'Abstract', 'Minimal', 'Vintage', 'Sport', 'Music', 'Art'];

const STATUS_STYLE: Record<DesignStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING:  { label: 'Pending Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  APPROVED: { label: 'Approved',       color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  REJECTED: { label: 'Rejected',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
};

export default function ArtistPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<'designs' | 'upload'>('designs');
  const [designs, setDesigns] = useState<ArtistDesign[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loadingDesigns, setLoadingDesigns] = useState(true);

  // Upload form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('29.99');
  const [svgContent, setSvgContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      if (sess.type !== 'user' || sess.role !== 'ARTIST') { router.replace('/home'); return; }
      setSession(sess);
    } catch { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    if (!session?.customerId) return;
    Promise.all([
      fetch(`/api/artist/designs?artistId=${session.customerId}`).then(r => r.json()),
      fetch(`/api/artist/earnings?artistId=${session.customerId}`).then(r => r.json()),
    ]).then(([d, e]) => {
      setDesigns(d);
      setEarnings(e);
    }).catch(() => {}).finally(() => setLoadingDesigns(false));
  }, [session]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        setSvgContent(content);
        setPreviewUrl(`data:image/svg+xml;base64,${btoa(content)}`);
      } else {
        // raster image — store as data URL, wrap in SVG image element
        setSvgContent(content); // store data URL directly
        setPreviewUrl(content);
      }
    };
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }, []);

  async function submitDesign() {
    if (!session?.customerId || !title.trim() || !category || !svgContent.trim()) {
      setSubmitError('Please fill in all fields and upload your design.'); return;
    }
    setSubmitting(true); setSubmitError(''); setSubmitSuccess(false);
    try {
      const res = await fetch('/api/artist/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: session.customerId,
          title: title.trim(), category,
          price: parseFloat(price) || 29.99,
          svg: svgContent,
        }),
      });
      if (!res.ok) { const d = await res.json(); setSubmitError(d.error ?? 'Failed to submit'); return; }
      const newDesign = await res.json();
      setDesigns(prev => [newDesign, ...prev]);
      setTitle(''); setCategory(''); setPrice('29.99'); setSvgContent(''); setPreviewUrl(null);
      setSubmitSuccess(true);
      setTab('designs');
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch { setSubmitError('Network error'); }
    finally { setSubmitting(false); }
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none',
  };
  const lbl: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block' };

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#050507,#060610)' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontFamily: "'Outfit', system-ui, sans-serif" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507 0%,#060610 100%)', position: 'relative' }}>
      {/* Atmosphere */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.05) 0%, transparent 60%)', top: '-8%', right: '5%' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.04) 0%, transparent 65%)', bottom: '5%', left: '-5%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, background: 'rgba(5,5,7,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif" }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.35rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1 }}>Artist<span style={{ color: '#00E5C8' }}>.</span>Studio</span>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,229,200,0.08)', color: '#00E5C8', border: '1px solid rgba(0,229,200,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Artist</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/profile')} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>My Profile</button>
      </header>

      {/* Earnings banner */}
      {earnings && (
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,229,200,0.03)', borderBottom: '1px solid rgba(0,229,200,0.1)', padding: '1.25rem 2rem' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg,#00E5C8,#0099FF,#7B61FF)', position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { label: 'Total Earned', value: `$${earnings.totalEarned.toFixed(2)}`, color: '#00E5C8' },
              { label: 'Total Sales',  value: earnings.totalSales,                    color: '#0099FF' },
              { label: 'Approved',     value: earnings.approved,                      color: '#10B981' },
              { label: 'Pending',      value: earnings.pending,                       color: '#F59E0B' },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0.5rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.8rem', fontWeight: 400, letterSpacing: '0.03em', color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 1 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
          {([['designs', 'My Designs'], ['upload', '+ Upload New']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${tab === t ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.08)'}`, background: tab === t ? 'rgba(0,229,200,0.08)' : 'transparent', color: tab === t ? '#00E5C8' : 'rgba(255,255,255,0.45)', fontFamily: tab === t ? "'Bebas Neue', Impact, sans-serif" : 'inherit', fontSize: tab === t ? '0.95rem' : '0.82rem', letterSpacing: tab === t ? '0.06em' : 'normal', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
              {label}
              {t === 'designs' && designs.length > 0 && <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 700, background: 'rgba(0,229,200,0.12)', padding: '1px 7px', borderRadius: 999, color: '#00E5C8', letterSpacing: '0.04em' }}>{designs.length}</span>}
            </button>
          ))}
        </div>

        {submitSuccess && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, marginBottom: '1.25rem', fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>
            ✓ Design submitted! Our team will review it within 24–48 hours.
          </div>
        )}

        {/* ── My Designs tab ── */}
        {tab === 'designs' && (
          <div>
            {loadingDesigns ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.15)' }}>Loading designs...</div>
            ) : designs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.015)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>No designs yet</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>Upload your first design and start earning 50% on every sale.</div>
                <button onClick={() => setTab('upload')} style={{ padding: '0.75rem 2rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>Upload First Design</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
                {designs.map(d => (
                  <DesignCard key={d.id} design={d} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Upload tab ── */}
        {tab === 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Info note */}
              <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(0,229,200,0.04)', border: '1px solid rgba(0,229,200,0.15)', borderRadius: 12, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                ✦ You earn <strong style={{ color: '#00E5C8' }}>50% of every sale</strong>. Designs go through a quick review before appearing in the catalog.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Design Title *</label><input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Neon Tiger" /></div>
                <div>
                  <label style={lbl}>Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer', color: category ? '#fff' : 'rgba(255,255,255,0.28)' }}>
                    <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a1a', color: '#fff' }}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ maxWidth: 160 }}>
                <label style={lbl}>Your Price (USD) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>$</span>
                  <input style={{ ...inp, paddingLeft: '1.5rem' }} value={price} onChange={e => setPrice(e.target.value)} type="number" min="9.99" max="99.99" step="0.01" />
                </div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>You earn ${((parseFloat(price) || 0) * 0.5).toFixed(2)} per sale</div>
              </div>

              {/* Design upload */}
              <div>
                <label style={lbl}>Design Artwork *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {(['file', 'paste'] as const).map(m => (
                    <button key={m} onClick={() => setUploadMode(m)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: uploadMode === m ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.08)', background: uploadMode === m ? 'rgba(0,229,200,0.08)' : 'transparent', color: uploadMode === m ? '#00E5C8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                      {m === 'file' ? '📁 Upload file' : '📋 Paste SVG code'}
                    </button>
                  ))}
                </div>

                {uploadMode === 'file' ? (
                  <div
                    onDragEnter={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${dragging ? 'rgba(0,229,200,0.5)' : previewUrl ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(0,229,200,0.04)' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}
                  >
                    <input ref={fileRef} type="file" accept=".svg,image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
                    {previewUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
                        <img src={previewUrl} alt="preview" style={{ height: 70, maxWidth: 140, objectFit: 'contain', borderRadius: 8 }} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: 3 }}>✓ Design uploaded</div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Click to replace</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                        <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Drop SVG or image here</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)' }}>SVG, PNG, JPG — max 10MB · or click to browse</div>
                      </>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={svgContent}
                    onChange={e => { setSvgContent(e.target.value); if (e.target.value.trim().startsWith('<svg')) { try { setPreviewUrl(`data:image/svg+xml;base64,${btoa(e.target.value)}`); } catch { setPreviewUrl(null); } } }}
                    placeholder={'<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">\n  <!-- Your design here -->\n</svg>'}
                    rows={8}
                    style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.5 }}
                  />
                )}
              </div>

              {submitError && <div style={{ padding: '0.7rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: '0.78rem', color: '#F87171' }}>{submitError}</div>}

              <button
                onClick={submitDesign}
                disabled={submitting || !title.trim() || !category || !svgContent.trim()}
                style={{ height: 48, borderRadius: 12, border: 'none', background: !submitting && title.trim() && category && svgContent.trim() ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.05)', color: !submitting && title.trim() && category && svgContent.trim() ? '#050507' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.88rem', cursor: !submitting && title.trim() && category && svgContent.trim() ? 'pointer' : 'default', transition: 'all 0.2s', boxShadow: !submitting && title.trim() ? '0 6px 20px rgba(0,229,200,0.25)' : 'none' }}
              >
                {submitting ? 'Submitting...' : 'Submit for Review →'}
              </button>
            </div>

            {/* Preview on shirt */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', textAlign: 'center', position: 'sticky', top: 76 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Preview on shirt</div>
              <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
                <svg width="160" height="160" viewBox="0 0 200 200" fill="none">
                  <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill="#2a2a2a" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                </svg>
                {previewUrl && (
                  <img src={previewUrl} alt="design" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 60, height: 60, objectFit: 'contain', pointerEvents: 'none' }} />
                )}
                {!previewUrl && (
                  <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 28, opacity: 0.2 }}>🎨</div>
                )}
              </div>
              {title && <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>{title}</div>}
              {category && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{category}</div>}
              {price && <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#00E5C8', marginTop: 6 }}>${parseFloat(price || '0').toFixed(2)}</div>}
              {price && <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>You earn ${((parseFloat(price) || 0) * 0.5).toFixed(2)}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DesignCard({ design }: { design: ArtistDesign }) {
  const s = STATUS_STYLE[design.status];
  return (
    <div className="scan-card holo-card" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,229,200,0.2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,229,200,0.15),transparent)' }} />
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 200 200" fill="none">
            <path d="M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z" fill="#2a2a2a" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
          </svg>
          <div style={{ position: 'absolute', top: '32%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            {design.svg.startsWith('<svg') ? (
              <div style={{ width: 42, height: 42 }} dangerouslySetInnerHTML={{ __html: design.svg.replace('<svg ', '<svg width="42" height="42" ') }} />
            ) : (
              <img src={design.svg} alt={design.title} style={{ width: 42, height: 42, objectFit: 'contain' }} />
            )}
          </div>
        </div>
        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.5rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.04em' }}>
          {s.label}
        </span>
      </div>
      <div style={{ padding: '0.875rem' }}>
        <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1rem', letterSpacing: '0.04em', marginBottom: 2 }}>{design.title}</div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{design.category}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.1rem', letterSpacing: '0.03em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>${design.price.toFixed(2)}</span>
          {design.status === 'APPROVED' && (
            <span style={{ fontSize: '0.58rem', color: '#10B981', fontWeight: 700 }}>{design.salesCount} sold · ${design.totalEarned.toFixed(2)}</span>
          )}
        </div>
        {design.status === 'REJECTED' && (
          <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#F87171', padding: '5px 8px', background: 'rgba(239,68,68,0.06)', borderRadius: 6 }}>
            Not approved. Review guidelines and resubmit.
          </div>
        )}
      </div>
    </div>
  );
}
