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
  { id: 'a', shirtColor: '#0a0a0d', shirtColor2: '#12121a', label: 'Dark Geo',   style: 'geo',  accent: '#00E5C8' },
  { id: 'b', shirtColor: '#f2f0eb', shirtColor2: '#e5e3de', label: 'Ivory Type', style: 'type', accent: '#0066FF' },
  { id: 'c', shirtColor: '#0f172a', shirtColor2: '#1e293b', label: 'Night Wave', style: 'wave', accent: '#7B61FF' },
];

const CARD_MESSAGES = [
  ['Initializing model…', 'Neural synthesis…',  'Style transfer…',   'Color grading…',   'Rendering…'],
  ['Loading weights…',   'Prompt encoding…',    'Visual pass 1/3…',  'Detail pass 2/3…', 'Finalizing…'],
  ['Analyzing mood…',    'Texture mapping…',    'Compositing…',      'Sharpening…',      'Rendering…'],
];

const MAIN_STAGES = [
  { at: 0,  msg: 'Analyzing prompt…' },
  { at: 18, msg: 'Loading style model…' },
  { at: 42, msg: 'Rendering design layers…' },
  { at: 68, msg: 'Applying textures…' },
  { at: 88, msg: 'Finalizing artwork…' },
];

// Easing: fast start, slow crawl to 99
function easeProgress(elapsed: number, total: number): number {
  const t = Math.min(elapsed / total, 1);
  const p = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  return Math.min(p * 99, 99);
}

function ShirtMockup({ shirt, prompt }: { shirt: typeof MOCK_SHIRTS[0]; prompt: string }) {
  const isDark = shirt.shirtColor.startsWith('#0') || shirt.shirtColor.startsWith('#1');
  const ink = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const inkDim = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
  const ac = shirt.accent;
  const words = prompt.trim().split(' ');

  return (
    <svg viewBox="0 0 220 260" width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg${shirt.id}`} x1="0%" y1="0%" x2="55%" y2="100%">
          <stop offset="0%" stopColor={shirt.shirtColor} />
          <stop offset="100%" stopColor={shirt.shirtColor2} />
        </linearGradient>
        <filter id={`sd${shirt.id}`}>
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <clipPath id={`sc${shirt.id}`}>
          <path d="M40 65 L8 92 L30 106 L26 242 L194 242 L190 106 L212 92 L180 65 C168 71 150 75 110 75 C70 75 52 71 40 65 Z" />
        </clipPath>
      </defs>
      <path d="M40 65 L8 92 L30 106 L26 242 L194 242 L190 106 L212 92 L180 65 C168 71 150 75 110 75 C70 75 52 71 40 65 Z"
        fill={`url(#sg${shirt.id})`} filter={`url(#sd${shirt.id})`} />
      <path d="M76 65 C80 88 95 102 110 102 C125 102 140 88 144 65" fill="none"
        stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="1.5" />
      <path d="M40 65 L8 92 L30 120" fill="none"
        stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} strokeWidth="7" />

      {shirt.style === 'geo' && (
        <g clipPath={`url(#sc${shirt.id})`}>
          <polygon points="110,107 130,118 130,140 110,151 90,140 90,118" fill="none" stroke={ac} strokeWidth="1.8" opacity="0.95" />
          <polygon points="110,94 137,110 137,148 110,164 83,148 83,110" fill="none" stroke={ac} strokeWidth="0.9" opacity="0.4" />
          <polygon points="110,82 144,102 144,156 110,177 76,156 76,102" fill="none" stroke={ac} strokeWidth="0.5" opacity="0.18" />
          <circle cx="110" cy="129" r="4.5" fill={ac} opacity="0.9" />
          <circle cx="110" cy="129" r="9" fill="none" stroke={ac} strokeWidth="0.8" opacity="0.35" />
          <line x1="90" y1="118" x2="73" y2="104" stroke={ac} strokeWidth="0.7" opacity="0.3" />
          <line x1="130" y1="118" x2="147" y2="104" stroke={ac} strokeWidth="0.7" opacity="0.3" />
          <line x1="90" y1="140" x2="73" y2="154" stroke={ac} strokeWidth="0.7" opacity="0.3" />
          <line x1="130" y1="140" x2="147" y2="154" stroke={ac} strokeWidth="0.7" opacity="0.3" />
          <text x="110" y="190" textAnchor="middle" fill={inkDim} fontSize="5.5" fontFamily="system-ui" fontWeight="800" letterSpacing="2.5">
            {words[0]?.toUpperCase().slice(0,8) ?? 'DESIGN'}
          </text>
        </g>
      )}

      {shirt.style === 'type' && (
        <g clipPath={`url(#sc${shirt.id})`}>
          <text x="110" y="120" textAnchor="middle" fill={ink} fontSize="24" fontFamily="Georgia,serif" fontWeight="900" letterSpacing="-1">
            {words[0]?.toUpperCase().slice(0, 6) ?? 'STYLE'}
          </text>
          <line x1="70" y1="127" x2="150" y2="127" stroke={ac} strokeWidth="1.8" />
          <text x="110" y="140" textAnchor="middle" fill={inkDim} fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="3.5">
            {words.slice(1, 3).join(' ').toUpperCase().slice(0, 14) || 'ORIGINAL DESIGN'}
          </text>
          <text x="110" y="158" textAnchor="middle" fill={inkDim} fontSize="5" fontFamily="system-ui" letterSpacing="1.5">STYLX.AI &mdash; 2026</text>
        </g>
      )}

      {shirt.style === 'wave' && (
        <g clipPath={`url(#sc${shirt.id})`}>
          <path d="M70 108 Q87 95 104 108 Q121 121 138 108 Q155 95 165 108" fill="none" stroke={ac} strokeWidth="2.2" opacity="0.95" />
          <path d="M70 120 Q87 107 104 120 Q121 133 138 120 Q155 107 165 120" fill="none" stroke={ac} strokeWidth="1.6" opacity="0.55" />
          <path d="M70 132 Q87 119 104 132 Q121 145 138 132 Q155 119 165 132" fill="none" stroke={ac} strokeWidth="1" opacity="0.28" />
          <path d="M70 144 Q87 131 104 144 Q121 157 138 144 Q155 131 165 144" fill="none" stroke={ac} strokeWidth="0.7" opacity="0.14" />
          {[85, 100, 115, 130, 145].map(x =>
            [162, 170, 178, 186].map(y => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="1.2" fill={inkDim} />
            ))
          )}
        </g>
      )}
    </svg>
  );
}

function GeneratingCard({
  shirt, prompt, progress, messages,
}: {
  shirt: typeof MOCK_SHIRTS[0];
  prompt: string;
  progress: number; // 0-100
  messages: string[];
}) {
  const isDone = progress >= 100;
  const msgIdx = Math.min(Math.floor((progress / 100) * messages.length), messages.length - 1);
  const ac = shirt.accent;

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: `1.5px solid ${isDone ? ac : 'rgba(255,255,255,0.07)'}`, transition: 'border-color 0.5s, box-shadow 0.5s', boxShadow: isDone ? `0 0 40px ${ac}22` : 'none' }}>

      {/* Shirt design (always rendered, revealed on complete) */}
      <div style={{ opacity: isDone ? 1 : 0, transition: 'opacity 0.7s ease 0.1s', transform: isDone ? 'scale(1)' : 'scale(0.96)', transitionProperty: 'opacity, transform' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
          <ShirtMockup shirt={shirt} prompt={prompt} />
        </div>
        <div style={{ textAlign: 'center', padding: '0 1rem 1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: 3 }}>{shirt.label}</div>
          <div style={{ fontSize: '0.7rem', color: ac }}>Tap to select</div>
        </div>
      </div>

      {/* Generation overlay */}
      {!isDone && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {/* Rising tide glow */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${progress * 0.9}%`, background: `linear-gradient(to top, ${ac}28 0%, ${ac}08 70%, transparent 100%)`, transition: 'height 0.25s ease-out', pointerEvents: 'none' }} />

          {/* Ghost shirt silhouette */}
          <div style={{ width: '75%', opacity: 0.06 }}>
            <ShirtMockup shirt={shirt} prompt={prompt} />
          </div>

          {/* Percentage counter */}
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '-0.05em', color: ac, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 40px ${ac}88` }}>
              {Math.round(progress)}<span style={{ fontSize: '1.2rem', opacity: 0.6 }}>%</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', fontWeight: 600 }}>
              {messages[msgIdx]}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ position: 'relative', height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${ac}aa, ${ac})`, transition: 'width 0.2s ease-out', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)', animation: 'shimmerBar 1.4s linear infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* Completion flash */}
      {isDone && <div style={{ position: 'absolute', inset: 0, background: ac, opacity: 0, animation: 'flashReveal 0.5s ease forwards', pointerEvents: 'none', borderRadius: 20 }} />}
    </div>
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

  // Progress states
  const [mainProgress, setMainProgress] = useState(0);
  const [cardProgress, setCardProgress] = useState([0, 0, 0]);
  const [cardsReady, setCardsReady] = useState([false, false, false]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<HTMLDivElement>(null);
  const genStart = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    try { if (localStorage.getItem('pd_session')) router.replace('/home'); } catch { /* ignore */ }
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PROMPT_EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, []);

  function handleGenerate() {
    if (!prompt.trim()) return;
    setPhase('generating');
    setMainProgress(0);
    setCardProgress([0, 0, 0]);
    setCardsReady([false, false, false]);
    genStart.current = Date.now();

    const TOTAL_MS = 3200;
    // Cards complete at these main progress thresholds
    const CARD_THRESHOLDS = [82, 91, 100];

    function tick() {
      const elapsed = Date.now() - genStart.current;
      const mp = easeProgress(elapsed, TOTAL_MS);
      setMainProgress(mp);

      // Derive card progresses
      const cp = CARD_THRESHOLDS.map(thresh => Math.min(100, (mp / thresh) * 100));
      setCardProgress(cp);

      const ready = CARD_THRESHOLDS.map(thresh => mp >= thresh);
      setCardsReady(ready);

      if (elapsed >= TOTAL_MS + 200) {
        setMainProgress(100);
        setCardProgress([100, 100, 100]);
        setCardsReady([true, true, true]);
        setTimeout(() => {
          setPhase('results');
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }, 400);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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
      const body = authMode === 'signup' ? { name, email, password, role: registerRole } : { email, password };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as { error?: string }).error ?? 'Auth failed'); return; }
      const user = await res.json() as { id: string; name: string; email: string; role: string };
      localStorage.setItem('pd_session', JSON.stringify({ type: 'user', customerId: user.id, name: user.name, email: user.email, role: user.role }));
      router.push(user.role === 'ARTIST' ? '/artist' : '/home');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  const mainStageMsg = MAIN_STAGES.reduce((acc, s) => mainProgress >= s.at ? s.msg : acc, MAIN_STAGES[0].msg);

  return (
    <main style={{ minHeight: '100vh', background: '#050507', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', backgroundSize: '56px 56px', animation: 'gridPulse 8s ease-in-out infinite' }} />
        {/* Orb 1 */}
        <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.065) 0%, transparent 65%)', top: '15%', left: '40%', transform: 'translate(-50%,-50%)', animation: 'orbFloat1 18s ease-in-out infinite' }} />
        {/* Orb 2 */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,153,255,0.055) 0%, transparent 65%)', top: '65%', right: '5%', animation: 'orbFloat2 22s ease-in-out infinite' }} />
        {/* Orb 3 */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,97,255,0.045) 0%, transparent 65%)', top: '80%', left: '10%', animation: 'orbFloat3 26s ease-in-out infinite' }} />
        {/* Scanline */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)', pointerEvents: 'none', opacity: 0.4 }} />
      </div>

      {/* ── Navbar ── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #00E5C8, #0099FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#050507' }}>S</div>
            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.03em' }}>STYLX<span style={{ color: '#00E5C8' }}>.AI</span></span>
          </div>
          <button onClick={enterAsGuest} style={{ padding: '7px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>Browse as guest</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem 1.5rem 4rem', textAlign: 'center' }}>

        {/* Watermark text */}
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', fontSize: 'clamp(6rem, 20vw, 16rem)', fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.018)', userSelect: 'none', whiteSpace: 'nowrap', pointerEvents: 'none' }}>STYLX.AI</div>

        <div style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.2)', marginBottom: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5C8', display: 'inline-block', boxShadow: '0 0 10px #00E5C8', animation: 'pulseGlow 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00E5C8' }}>AI-Powered Fashion Tech</span>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(3.2rem, 9vw, 7rem)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: '1.5rem', animation: 'fadeUp 0.6s ease 0.2s both' }}>
          <span style={{ display: 'block', color: '#fff' }}>Describe it.</span>
          <span style={{ display: 'block', background: 'linear-gradient(135deg, #00E5C8 0%, #0099FF 45%, #7B61FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundSize: '200% 200%', animation: 'gradientShift 5s ease infinite' }}>Wear it.</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(0.9rem,2vw,1.1rem)', lineHeight: 1.65, maxWidth: 460, marginBottom: '2.5rem', animation: 'fadeUp 0.6s ease 0.35s both' }}>
          Type any idea. AI generates your shirt in seconds.<br />Premium print. Ships to your door in 72 hours.
        </p>

        {/* Prompt input */}
        <div style={{ width: '100%', maxWidth: 620, animation: 'fadeUp 0.6s ease 0.45s both' }}>
          <div style={{ position: 'relative', display: 'flex', gap: 0, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${phase === 'generating' ? '#00E5C8' : 'rgba(255,255,255,0.1)'}`, borderRadius: 18, overflow: 'hidden', transition: 'border-color 0.3s, box-shadow 0.3s', boxShadow: phase === 'generating' ? '0 0 40px rgba(0,229,200,0.18), inset 0 0 20px rgba(0,229,200,0.04)' : 'none' }}>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && phase === 'hero' && handleGenerate()}
              placeholder={PROMPT_EXAMPLES[placeholderIdx]}
              disabled={phase !== 'hero'}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '1rem', padding: '1.1rem 1.25rem', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleGenerate}
              disabled={phase !== 'hero' || !prompt.trim()}
              style={{ margin: '7px', padding: '0 1.5rem', borderRadius: 11, border: 'none', background: phase === 'hero' && prompt.trim() ? 'linear-gradient(135deg, #00E5C8, #0099FF)' : 'rgba(255,255,255,0.06)', color: phase === 'hero' && prompt.trim() ? '#050507' : 'rgba(255,255,255,0.22)', fontWeight: 800, fontSize: '0.9rem', cursor: phase === 'hero' && prompt.trim() ? 'pointer' : 'default', transition: 'all 0.2s', whiteSpace: 'nowrap', minWidth: 130 }}
            >
              {phase === 'generating' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '0.85rem' }}>⟳</span>
                  {Math.round(mainProgress)}%
                </span>
              ) : 'Generate →'}
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.7rem', marginTop: '0.75rem', letterSpacing: '0.02em' }}>No account needed &mdash; preview free &middot; 50K+ shirts created</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1.5rem, 4vw, 3rem)', marginTop: '3rem', flexWrap: 'wrap', animation: 'fadeUp 0.6s ease 0.55s both' }}>
          {[['72h', 'Delivery'], ['300dpi', 'Print'], ['50+', 'Designs'], ['Free', 'Returns']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>{n}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Generation progress ── */}
      {(phase === 'generating' || phase === 'results' || phase === 'auth') && (
        <section ref={resultsRef} style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 5rem', maxWidth: 1000, margin: '0 auto' }}>

          {/* Main progress bar (only during generating) */}
          {phase === 'generating' && (
            <div style={{ marginBottom: '2.5rem', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 'clamp(3rem,8vw,5rem)', fontWeight: 900, letterSpacing: '-0.06em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(mainProgress)}<span style={{ fontSize: '40%', opacity: 0.6, WebkitTextFillColor: 'rgba(0,229,200,0.6)' }}>%</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: 8, letterSpacing: '0.04em' }}>{mainStageMsg}</div>
              </div>

              {/* Main progress track */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', maxWidth: 600, margin: '0 auto' }}>
                <div style={{ height: '100%', width: `${mainProgress}%`, background: 'linear-gradient(90deg, #00E5C8, #0099FF, #7B61FF)', borderRadius: 999, transition: 'width 0.2s ease-out', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animation: 'shimmerBar 1.2s linear infinite' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {MOCK_SHIRTS.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.72rem', color: cardsReady[i] ? s.accent : 'rgba(255,255,255,0.3)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cardsReady[i] ? s.accent : 'rgba(255,255,255,0.15)', boxShadow: cardsReady[i] ? `0 0 10px ${s.accent}` : 'none', transition: 'all 0.3s' }} />
                    {s.label} {cardsReady[i] ? '✓' : `${Math.round(cardProgress[i])}%`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt label */}
          {(phase === 'results' || phase === 'auth') && (
            <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                Generated for: <strong style={{ color: '#fff' }}>&ldquo;{prompt}&rdquo;</strong>
              </div>
            </div>
          )}

          {/* 3 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {MOCK_SHIRTS.map((shirt, i) => {
              if (phase === 'results' || phase === 'auth') {
                // Results view: interactive selection
                return (
                  <div
                    key={shirt.id}
                    onClick={() => handleSelectShirt(shirt.id)}
                    style={{ background: selectedShirt === shirt.id ? `rgba(0,229,200,0.04)` : 'rgba(255,255,255,0.025)', border: `1.5px solid ${selectedShirt === shirt.id ? shirt.accent : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, padding: '1.25rem 1.25rem 1rem', cursor: 'pointer', transition: 'all 0.25s', boxShadow: selectedShirt === shirt.id ? `0 0 40px ${shirt.accent}22` : '0 4px 24px rgba(0,0,0,0.3)', transform: selectedShirt === shirt.id ? 'translateY(-5px) scale(1.01)' : 'none', animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}
                  >
                    <ShirtMockup shirt={shirt} prompt={prompt} />
                    <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: 3 }}>{shirt.label}</div>
                      <div style={{ fontSize: '0.7rem', color: selectedShirt === shirt.id ? shirt.accent : 'rgba(255,255,255,0.28)' }}>
                        {selectedShirt === shirt.id ? '✓ Selected' : 'Tap to select'}
                      </div>
                    </div>
                  </div>
                );
              }
              // Generating view: progress cards
              return (
                <GeneratingCard
                  key={shirt.id}
                  shirt={shirt}
                  prompt={prompt}
                  progress={cardProgress[i]}
                  messages={CARD_MESSAGES[i]}
                />
              );
            })}
          </div>

          {phase === 'results' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease 0.3s both' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '1rem' }}>Select a design to order it</p>
              <button onClick={enterAsGuest} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}>Just browse as guest</button>
            </div>
          )}
        </section>
      )}

      {/* ── Auth ── */}
      {phase === 'auth' && (
        <section ref={authRef} style={{ position: 'relative', zIndex: 1, padding: '1rem 1.5rem 5rem', maxWidth: 460, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['signup', 'signin'] as AuthMode[]).map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setError(''); }} style={{ padding: '0.875rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', background: authMode === m ? 'rgba(0,229,200,0.07)' : 'transparent', color: authMode === m ? '#00E5C8' : 'rgba(255,255,255,0.3)', borderBottom: `2px solid ${authMode === m ? '#00E5C8' : 'transparent'}`, transition: 'all 0.15s' }}>
                  {m === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              ))}
            </div>
            <div style={{ padding: '1.75rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                {authMode === 'signup' ? 'Create a free account to order. Ships in 72 hours.' : 'Welcome back. Continue your order.'}
              </p>
              {error && <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.7rem 0.9rem', fontSize: '0.78rem', color: '#F87171', marginBottom: '1rem' }}>{error}</div>}
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {authMode === 'signup' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['USER', 'ARTIST'] as RegisterRole[]).map((r) => (
                        <button key={r} type="button" onClick={() => setRegisterRole(r)} style={{ padding: '0.7rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${registerRole === r ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)'}`, background: registerRole === r ? 'rgba(0,229,200,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: registerRole === r ? '#00E5C8' : 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{r === 'USER' ? '🛒 Customer' : '🎨 Artist'}</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{r === 'USER' ? 'Order shirts' : 'Sell designs'}</div>
                        </button>
                      ))}
                    </div>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoComplete="name"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }} />
                  </>
                )}
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required autoComplete="email"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={authMode === 'signup' ? 'Password (min. 6)' : 'Password'} required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }} />
                <button type="submit" disabled={loading} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00E5C8, #0099FF)', color: loading ? 'rgba(255,255,255,0.3)' : '#050507', fontWeight: 800, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 6px 24px rgba(0,229,200,0.25)', transition: 'all 0.15s', marginTop: 4 }}>
                  {loading ? (authMode === 'signup' ? 'Creating…' : 'Signing in…') : (authMode === 'signup' ? 'Create Account & Order →' : 'Sign In →')}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button onClick={enterAsGuest} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.22)', fontSize: '0.72rem', cursor: 'pointer' }}>
                  Skip &mdash; continue as guest
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      {phase === 'hero' && (
        <section id="how" style={{ position: 'relative', zIndex: 1, padding: '4rem 1.5rem 6rem', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.2)', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00E5C8' }}>How it works</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.035em', color: '#fff' }}>From idea to doorstep</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[
              { n: '01', title: 'Describe', body: 'Type anything. A vibe, a concept, a feeling. Our AI understands context.' },
              { n: '02', title: 'Generate', body: 'Watch as 3 AI-curated shirt designs appear in real-time from your prompt.' },
              { n: '03', title: 'Customize', body: 'Pick your design, adjust size, color, and style in our design studio.' },
              { n: '04', title: 'Delivered', body: 'Premium 300 DPI DTG print, at your door in 72 hours. Free returns.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '1.75rem', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,200,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#00E5C8', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{s.n}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.33)', lineHeight: 1.65 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-0.03em', color: '#fff', marginBottom: '0.5rem' }}>STYLX<span style={{ color: '#00E5C8' }}>.AI</span></div>
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.68rem' }}>&copy; 2026 STYLX.AI &mdash; Describe it. Wear it.</div>
      </footer>

      <style>{`
        @keyframes fadeUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gradientShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        @keyframes shimmerBar  { 0% { transform:translateX(-100%); } 100% { transform:translateX(250%); } }
        @keyframes flashReveal { 0% { opacity:0.4; } 40% { opacity:0.15; } 100% { opacity:0; } }
        @keyframes pulseGlow   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
        @keyframes spin        { to { transform:rotate(360deg); } }
        @keyframes gridPulse   { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes orbFloat1   { 0%,100% { transform:translate(-50%,-50%) scale(1); } 33% { transform:translate(-48%,-54%) scale(1.05); } 66% { transform:translate(-52%,-47%) scale(0.97); } }
        @keyframes orbFloat2   { 0%,100% { transform:scale(1) translate(0,0); } 50% { transform:scale(1.1) translate(-3%,4%); } }
        @keyframes orbFloat3   { 0%,100% { transform:translate(0,0); } 50% { transform:translate(4%,-6%); } }
      `}</style>
    </main>
  );
}
