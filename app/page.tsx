'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Phase = 'hero' | 'generating' | 'results' | 'auth';
type AuthMode = 'signup' | 'signin';
type RegisterRole = 'USER' | 'ARTIST';

const PROMPT_EXAMPLES = [
  'Minimalist black cat, Japanese ink style',
  'Retro 80s sunset with palm trees',
  'Abstract geometric wolf, neon colors',
  'Space astronaut floating in galaxy',
  'Vintage band tee with distressed texture',
  'Lo-fi city night scene, warm tones',
];

const MOCK_SHIRTS = [
  { id: 'a', shirtColor: '#0a0a0d', shirtColor2: '#12121a', label: 'Dark Geo', style: 'geo' },
  { id: 'b', shirtColor: '#f2f0eb', shirtColor2: '#e5e3de', label: 'Ivory Type', style: 'type' },
  { id: 'c', shirtColor: '#0f172a', shirtColor2: '#1e293b', label: 'Night Wave', style: 'wave' },
];

function ShirtMockup({ shirt, prompt }: { shirt: typeof MOCK_SHIRTS[0]; prompt: string }) {
  const isDark = shirt.shirtColor.startsWith('#0') || shirt.shirtColor.startsWith('#1');
  const ink = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const inkDim = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const accent = isDark ? '#00E5C8' : '#0055AA';
  const words = prompt.split(' ').slice(0, 3);

  return (
    <svg viewBox="0 0 220 260" width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`shirt${shirt.id}`} x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor={shirt.shirtColor} />
          <stop offset="100%" stopColor={shirt.shirtColor2} />
        </linearGradient>
        <linearGradient id={`sleeve${shirt.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={shirt.shirtColor2} />
          <stop offset="100%" stopColor={shirt.shirtColor} />
        </linearGradient>
        <filter id={`shadow${shirt.id}`}>
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <filter id={`glow${shirt.id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id={`body${shirt.id}`}>
          <path d="M40 65 L8 92 L30 106 L26 242 L194 242 L190 106 L212 92 L180 65 C168 71 150 75 110 75 C70 75 52 71 40 65 Z" />
        </clipPath>
      </defs>

      {/* Shirt body */}
      <path
        d="M40 65 L8 92 L30 106 L26 242 L194 242 L190 106 L212 92 L180 65 C168 71 150 75 110 75 C70 75 52 71 40 65 Z"
        fill={`url(#shirt${shirt.id})`}
        filter={`url(#shadow${shirt.id})`}
      />

      {/* Collar */}
      <path d="M76 65 C80 88 95 102 110 102 C125 102 140 88 144 65" fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="1.5" />

      {/* Fabric highlight */}
      <path d="M40 65 L8 92 L30 106 L26 130" fill="none" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} strokeWidth="8" />

      {/* ── Design area ── */}
      {shirt.style === 'geo' && (
        <g clipPath={`url(#body${shirt.id})`}>
          {/* Concentric hexagons */}
          <polygon points="110,108 128,118 128,138 110,148 92,138 92,118" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.9" />
          <polygon points="110,96 134,110 134,147 110,161 86,147 86,110" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.4" />
          <polygon points="110,84 140,102 140,156 110,174 80,156 80,102" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.2" />
          {/* Center dot */}
          <circle cx="110" cy="128" r="4" fill={accent} opacity="0.8" />
          <circle cx="110" cy="128" r="8" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.3" />
          {/* Diagonal lines */}
          <line x1="92" y1="118" x2="75" y2="105" stroke={accent} strokeWidth="0.7" opacity="0.3" />
          <line x1="128" y1="118" x2="145" y2="105" stroke={accent} strokeWidth="0.7" opacity="0.3" />
          <line x1="92" y1="138" x2="75" y2="151" stroke={accent} strokeWidth="0.7" opacity="0.3" />
          <line x1="128" y1="138" x2="145" y2="151" stroke={accent} strokeWidth="0.7" opacity="0.3" />
          {/* Label */}
          <text x="110" y="186" textAnchor="middle" fill={inkDim} fontSize="6" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="2">{words[0]?.toUpperCase() ?? 'DESIGN'}</text>
        </g>
      )}

      {shirt.style === 'type' && (
        <g clipPath={`url(#body${shirt.id})`}>
          {/* Bold type layout */}
          <text x="110" y="122" textAnchor="middle" fill={ink} fontSize="22" fontFamily="Georgia,serif" fontWeight="900" letterSpacing="-1">
            {words[0]?.toUpperCase().slice(0,6) ?? 'STYLE'}
          </text>
          <line x1="72" y1="128" x2="148" y2="128" stroke={accent} strokeWidth="1.5" />
          <text x="110" y="140" textAnchor="middle" fill={inkDim} fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="600" letterSpacing="3">
            {words.slice(1).join(' ').toUpperCase().slice(0,14) || 'ORIGINAL DESIGN'}
          </text>
          <text x="110" y="160" textAnchor="middle" fill={inkDim} fontSize="5.5" fontFamily="system-ui,sans-serif" letterSpacing="1">STYLX.AI &mdash; 2026</text>
        </g>
      )}

      {shirt.style === 'wave' && (
        <g clipPath={`url(#body${shirt.id})`}>
          {/* Abstract wave pattern */}
          <path d="M72 112 Q86 100 100 112 Q114 124 128 112 Q142 100 152 112" fill="none" stroke={accent} strokeWidth="2" opacity="0.9" />
          <path d="M72 122 Q86 110 100 122 Q114 134 128 122 Q142 110 152 122" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.55" />
          <path d="M72 132 Q86 120 100 132 Q114 144 128 132 Q142 120 152 132" fill="none" stroke={accent} strokeWidth="1" opacity="0.3" />
          <path d="M72 142 Q86 130 100 142 Q114 154 128 142 Q142 130 152 142" fill="none" stroke={accent} strokeWidth="0.7" opacity="0.18" />
          {/* Dot grid */}
          {[88, 100, 112, 124, 136].map(x =>
            [160, 168, 176].map(y => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill={inkDim} />
            ))
          )}
        </g>
      )}
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('hero');
  const [prompt, setPrompt] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<RegisterRole>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedShirt, setSelectedShirt] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { if (localStorage.getItem('pd_session')) router.replace('/home'); } catch { /* ignore */ }
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PROMPT_EXAMPLES.length), 3000);
    return () => clearInterval(t);
  }, []);

  function handleGenerate() {
    if (!prompt.trim()) return;
    setPhase('generating');
    setTimeout(() => {
      setPhase('results');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }, 2600);
  }

  function handleSelectShirt(id: string) {
    setSelectedShirt(id);
    setPhase('auth');
    setTimeout(() => authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }

  function enterAsGuest() {
    try { localStorage.setItem('pd_session', JSON.stringify({ type: 'guest', name: 'Guest' })); } catch { /* ignore */ }
    router.push('/home');
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (authMode === 'signup' && !name) { setError('Please enter your name'); return; }
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const body = authMode === 'signup'
        ? { name, email, password, role: registerRole }
        : { email, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? 'Authentication failed');
        return;
      }
      const user = await res.json() as { id: string; name: string; email: string; role: string };
      localStorage.setItem('pd_session', JSON.stringify({ type: 'user', customerId: user.id, name: user.name, email: user.email, role: user.role }));
      router.push(user.role === 'ARTIST' ? '/artist' : '/home');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#050507', overflowX: 'hidden' }}>

      {/* Navbar */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em', color: '#fff' }}>
            STYLX<span style={{ color: '#00E5C8' }}>.AI</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={enterAsGuest} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer' }}>
              Browse as guest
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7rem 1.5rem 4rem', position: 'relative' }}>

        {/* Background mesh */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.07) 0%, transparent 65%)', top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,153,255,0.07) 0%, transparent 65%)', top: '60%', right: '10%' }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 720, textAlign: 'center' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.2)', marginBottom: '1.75rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5C8', display: 'inline-block', boxShadow: '0 0 8px #00E5C8' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#00E5C8' }}>AI-Powered Design</span>
          </div>

          <h1 style={{ fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.93, marginBottom: '1.25rem', color: '#fff' }}>
            Describe it.<br />
            <span style={{ background: 'linear-gradient(135deg, #00E5C8 0%, #0099FF 50%, #7B61FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Wear it.</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(0.9rem,2vw,1.1rem)', lineHeight: 1.65, marginBottom: '2.5rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
            Type a shirt idea. AI generates it in seconds.<br />Order it printed and shipped in 72 hours.
          </p>

          {/* Prompt input */}
          <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto', marginBottom: '1rem' }}>
            <div style={{
              display: 'flex', gap: 0,
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${phase === 'generating' ? 'rgba(0,229,200,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 16, overflow: 'hidden',
              boxShadow: phase === 'generating' ? '0 0 30px rgba(0,229,200,0.15)' : 'none',
              transition: 'all 0.3s',
            }}>
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && phase === 'hero' && handleGenerate()}
                placeholder={PROMPT_EXAMPLES[placeholderIdx]}
                disabled={phase !== 'hero'}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '1rem', padding: '1rem 1.25rem',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={phase !== 'hero' || !prompt.trim()}
                style={{
                  padding: '0.75rem 1.5rem', margin: '6px', borderRadius: 10, border: 'none',
                  background: phase === 'hero' && prompt.trim() ? 'linear-gradient(135deg, #00E5C8, #0099FF)' : 'rgba(255,255,255,0.06)',
                  color: phase === 'hero' && prompt.trim() ? '#050507' : 'rgba(255,255,255,0.25)',
                  fontWeight: 800, fontSize: '0.9rem', cursor: phase === 'hero' && prompt.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {phase === 'generating' ? 'Generating...' : 'Generate →'}
              </button>
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', letterSpacing: '0.02em' }}>
            No account needed to preview · 50K+ shirts created
          </p>

          {/* Social proof */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {[['72h', 'Delivery'], ['300dpi', 'Print quality'], ['50+', 'Base designs'], ['Free', 'Returns']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{n}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generating animation */}
      {phase === 'generating' && (
        <section style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1rem' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: '#00E5C8',
                animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Generating 3 designs for &ldquo;<span style={{ color: '#00E5C8' }}>{prompt}</span>&rdquo;…</p>
          <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0); opacity:0.4; } 40% { transform:translateY(-10px); opacity:1; } }`}</style>
        </section>
      )}

      {/* Results */}
      {(phase === 'results' || phase === 'auth') && (
        <section ref={resultsRef} style={{ padding: '2rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Generated for</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>&ldquo;{prompt}&rdquo;</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {MOCK_SHIRTS.map((shirt, i) => (
              <div
                key={shirt.id}
                onClick={() => handleSelectShirt(shirt.id)}
                style={{
                  background: selectedShirt === shirt.id ? 'rgba(0,229,200,0.04)' : 'rgba(255,255,255,0.025)',
                  border: `1.5px solid ${selectedShirt === shirt.id ? '#00E5C8' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20, padding: '1.25rem 1.25rem 1rem', cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: selectedShirt === shirt.id ? '0 0 40px rgba(0,229,200,0.12)' : '0 4px 24px rgba(0,0,0,0.3)',
                  animation: `fadeUp 0.4s ease ${i * 0.12}s both`,
                  transform: selectedShirt === shirt.id ? 'translateY(-4px)' : 'none',
                }}
              >
                <ShirtMockup shirt={shirt} prompt={prompt} />
                <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: 3 }}>{shirt.label}</div>
                  <div style={{ fontSize: '0.7rem', color: selectedShirt === shirt.id ? '#00E5C8' : 'rgba(255,255,255,0.28)' }}>
                    {selectedShirt === shirt.id ? '✓ Selected' : 'Tap to select'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {phase === 'results' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginBottom: '1rem' }}>Pick a design to order it →</p>
              <button onClick={enterAsGuest} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Just browse as guest
              </button>
            </div>
          )}
        </section>
      )}

      {/* Auth */}
      {phase === 'auth' && (
        <section ref={authRef} style={{ padding: '1rem 1.5rem 5rem', maxWidth: 460, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden' }}>

            {/* Tab */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['signup', 'signin'] as AuthMode[]).map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setError(''); }} style={{
                  padding: '0.875rem 0.5rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em',
                  background: authMode === m ? 'rgba(0,229,200,0.07)' : 'transparent',
                  color: authMode === m ? '#00E5C8' : 'rgba(255,255,255,0.3)',
                  borderBottom: `2px solid ${authMode === m ? '#00E5C8' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>{m === 'signup' ? 'Create Account' : 'Sign In'}</button>
              ))}
            </div>

            <div style={{ padding: '1.75rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                {authMode === 'signup'
                  ? 'Create a free account to order your design. Ships in 72 hours.'
                  : 'Welcome back. Sign in to continue your order.'}
              </p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.7rem 0.9rem', fontSize: '0.78rem', color: '#F87171', marginBottom: '1rem' }}>{error}</div>
              )}

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {authMode === 'signup' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {([['USER', '🛒 Customer', 'Order shirts'] , ['ARTIST', '🎨 Artist', 'Sell designs']] as [RegisterRole, string, string][]).map(([r, label, desc]) => (
                        <button key={r} type="button" onClick={() => setRegisterRole(r)} style={{
                          padding: '0.7rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          border: `1.5px solid ${registerRole === r ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          background: registerRole === r ? 'rgba(0,229,200,0.06)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.15s',
                        }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: registerRole === r ? '#00E5C8' : 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                    <input
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" required autoComplete="name"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                    />
                  </>
                )}
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" required autoComplete="email"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={authMode === 'signup' ? 'Password (min. 6 chars)' : 'Password'} required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                />
                <button type="submit" disabled={loading} style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00E5C8, #0099FF)',
                  color: loading ? 'rgba(255,255,255,0.3)' : '#050507',
                  fontWeight: 800, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(0,229,200,0.25)',
                  transition: 'all 0.15s', marginTop: 4,
                }}>
                  {loading ? (authMode === 'signup' ? 'Creating account…' : 'Signing in…') : (authMode === 'signup' ? 'Create Account & Order →' : 'Sign In →')}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button onClick={enterAsGuest} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.22)', fontSize: '0.72rem', cursor: 'pointer' }}>
                  Skip for now — continue as guest
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {phase === 'hero' && (
        <section id="how" style={{ padding: '5rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.2)', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#00E5C8' }}>How it works</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.035em', color: '#fff' }}>
              From idea to doorstep
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { n: '01', title: 'Describe', body: 'Type anything. A vibe, a concept, a feeling. Our AI understands it.' },
              { n: '02', title: 'Generate', body: 'See 3 AI-curated shirt designs based on your prompt instantly.' },
              { n: '03', title: 'Customize', body: 'Pick your size, color, and style in our design studio.' },
              { n: '04', title: 'Delivered', body: 'Premium 300 DPI DTG print, at your door in 72 hours.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '1.75rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00E5C8', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>{s.n}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{s.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-0.03em', color: '#fff', marginBottom: '0.5rem' }}>
          STYLX<span style={{ color: '#00E5C8' }}>.AI</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>© 2026 STYLX.AI — Describe it. Wear it.</div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
