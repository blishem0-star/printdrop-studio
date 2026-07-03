'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ShirtMockup from '@/components/ShirtMockup';

type Phase = 'hero' | 'generating' | 'results' | 'auth';
type AuthMode = 'signup' | 'signin';
type RegisterRole = 'USER' | 'ARTIST';

const PROMPT_EXAMPLES = [
  'Minimalist black cat, Japanese ink style',
  'Retro 80s sunset with palm trees',
  'Abstract geometric wolf, neon colors',
  'Space astronaut floating in galaxy',
  'Vintage band tee with distressed texture',
];

const SHIRTS = [
  { id: 'a', base: '#0c0c12', dark: '#06060a', accent: '#00E5C8', label: 'Dark Geo',   style: 'geo'  },
  { id: 'b', base: '#f0ede6', dark: '#d8d5ce', accent: '#1a4fff', label: 'Ivory Type', style: 'type' },
  { id: 'c', base: '#0e1929', dark: '#090f18', accent: '#8b5cf6', label: 'Night Wave', style: 'wave' },
];

const CARD_MSGS = [
  ['Initializing...', 'Neural synthesis...', 'Style transfer...', 'Color grading...', 'Rendering...'],
  ['Loading weights...', 'Prompt encoding...', 'Visual pass 1/3...', 'Detail pass 2/3...', 'Finalizing...'],
  ['Analyzing mood...', 'Texture mapping...', 'Compositing...', 'Sharpening...', 'Rendering...'],
];

const MAIN_MSGS = ['Analyzing prompt...','Loading model...','Rendering layers...','Applying textures...','Finalizing...'];

function eased(elapsed: number, total: number) {
  const t = Math.min(elapsed / total, 1);
  return Math.min((1 - Math.pow(1 - t, 3)) * 99, 99);
}

/* ── Realistic shirt SVG ────────────────────────────────────────── */
function ShirtSVG({ shirt, prompt }: { shirt: typeof SHIRTS[0]; prompt: string }) {
  const isDark = shirt.base.startsWith('#0') || shirt.base.startsWith('#1');
  const ink   = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)';
  const inkDim = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';
  const ac   = shirt.accent;
  const words = prompt.trim().split(/\s+/);

  return (
    <div role="img" aria-label={`${shirt.label} custom shirt design${prompt ? ` - ${prompt}` : ''}`} style={{ position: 'relative', width: '100%', aspectRatio: '360 / 445', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ShirtMockup colorHex={shirt.base} size={330} style={{ width: '92%', height: 'auto' }} />
      <svg viewBox="0 0 160 160" width="42%" height="42%" style={{ position: 'absolute', top: '31%', left: '50%', transform: 'translate(-50%,-50%)', overflow: 'visible' }} aria-hidden="true">
        {shirt.style === 'geo' && (
          <>
            <polygon points="80,34 108,50 108,82 80,98 52,82 52,50" fill="none" stroke={ac} strokeWidth="3" opacity="0.95" />
            <polygon points="80,20 120,43 120,89 80,112 40,89 40,43" fill="none" stroke={ac} strokeWidth="1.5" opacity="0.4" />
            <circle cx="80" cy="66" r="6" fill={ac} opacity="0.92" />
            <text x="80" y="132" textAnchor="middle" fill={inkDim} fontSize="9" fontFamily="system-ui" fontWeight="800" letterSpacing="3">{words[0]?.toUpperCase().slice(0,8)}</text>
          </>
        )}
        {shirt.style === 'type' && (
          <>
            <text x="80" y="64" textAnchor="middle" fill={ink} fontSize="30" fontFamily="Georgia,serif" fontWeight="900">{words[0]?.toUpperCase().slice(0,6) ?? 'STYLE'}</text>
            <line x1="28" y1="75" x2="132" y2="75" stroke={ac} strokeWidth="3" />
            <text x="80" y="94" textAnchor="middle" fill={inkDim} fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="3">{words.slice(1,3).join(' ').toUpperCase().slice(0,14) || 'ORIGINAL DESIGN'}</text>
          </>
        )}
        {shirt.style === 'wave' && (
          <>
            <path d="M 26 48 Q 48 34 70 48 Q 92 62 114 48 Q 136 34 152 48" fill="none" stroke={ac} strokeWidth="4" opacity="0.95" />
            <path d="M 26 66 Q 48 52 70 66 Q 92 80 114 66 Q 136 52 152 66" fill="none" stroke={ac} strokeWidth="2.6" opacity="0.55" />
            <path d="M 26 84 Q 48 70 70 84 Q 92 98 114 84 Q 136 70 152 84" fill="none" stroke={ac} strokeWidth="1.8" opacity="0.28" />
          </>
        )}
      </svg>
    </div>
  );

  // Shirt path: proper flat-lay T silhouette
  const shirtPath = 'M 122,14 C 107,30 88,60 80,82 L 8,56 L 0,86 L 0,168 L 80,152 L 80,432 L 280,432 L 280,152 L 360,168 L 360,86 L 352,56 L 280,82 C 272,60 253,30 238,14 Q 222,54 200,68 Q 178,54 162,34 Q 145,18 122,14 Z';

  return (
    <svg viewBox="0 0 360 445" width="100%" role="img" aria-label={`${shirt.label} custom shirt design${prompt ? ` - ${prompt}` : ''}`} style={{ display: 'block', filter: 'drop-shadow(0 18px 32px rgba(0,0,0,0.55))' }}>
      <defs>
        {/* Side-to-side gradient for 3D depth */}
        <linearGradient id={`sf${shirt.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={shirt.dark} />
          <stop offset="18%"  stopColor={shirt.base} />
          <stop offset="82%"  stopColor={shirt.base} />
          <stop offset="100%" stopColor={shirt.dark} />
        </linearGradient>
        {/* Top-bottom gradient (shirt is lighter at chest, darker at hem) */}
        <linearGradient id={`sv${shirt.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </linearGradient>
        <clipPath id={`cp${shirt.id}`}>
          <rect x="108" y="118" width="144" height="180" rx="2" />
        </clipPath>
      </defs>

      {/* Main shirt */}
      <path d={shirtPath} fill={`url(#sf${shirt.id})`} />
      {/* Depth overlay */}
      <path d={shirtPath} fill={`url(#sv${shirt.id})`} />

      {/* Sleeve inner shadows */}
      <path d="M 0 86 L 80 152 L 80 168 L 0 168 Z" fill="rgba(0,0,0,0.18)" />
      <path d="M 360 86 L 280 152 L 280 168 L 360 168 Z" fill="rgba(0,0,0,0.18)" />

      {/* Collar inside shadow */}
      <path d="M 122,14 Q 145,18 162,34 Q 178,54 200,68 Q 222,54 238,14 Q 225,42 218,58 Q 208,78 200,84 Q 192,78 182,58 Q 175,42 165,32 Q 148,20 136,20 Z" fill="rgba(0,0,0,0.2)" />

      {/* Collar stitching */}
      <path d="M 122,14 Q 145,18 162,34 Q 178,54 200,68 Q 222,54 238,14" fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="2" />

      {/* Fabric folds */}
      <path d="M 168,180 Q 166,300 165,432" stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill="none" />
      <path d="M 195,175 Q 196,300 197,432" stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />

      {/* Center chest highlight */}
      <path d="M 185,100 L 215,100 L 220,430 L 180,430 Z" fill="rgba(255,255,255,0.025)" />

      {/* ── Print design ── */}
      <g clipPath={`url(#cp${shirt.id})`}>
        {shirt.style === 'geo' && (
          <>
            <polygon points="180,145 205,158 205,184 180,197 155,184 155,158" fill="none" stroke={ac} strokeWidth="2" opacity="0.95" />
            <polygon points="180,131 212,149 212,195 180,213 148,195 148,149" fill="none" stroke={ac} strokeWidth="0.9" opacity="0.4" />
            <polygon points="180,117 219,140 219,206 180,229 141,206 141,140" fill="none" stroke={ac} strokeWidth="0.45" opacity="0.18" />
            <circle cx="180" cy="171" r="5" fill={ac} opacity="0.92" />
            <line x1="155" y1="158" x2="134" y2="143" stroke={ac} strokeWidth="0.7" opacity="0.32" />
            <line x1="205" y1="158" x2="226" y2="143" stroke={ac} strokeWidth="0.7" opacity="0.32" />
            <line x1="155" y1="184" x2="134" y2="199" stroke={ac} strokeWidth="0.7" opacity="0.32" />
            <line x1="205" y1="184" x2="226" y2="199" stroke={ac} strokeWidth="0.7" opacity="0.32" />
            <text x="180" y="246" textAnchor="middle" fill={inkDim} fontSize="6" fontFamily="system-ui" fontWeight="800" letterSpacing="3">
              {words[0]?.toUpperCase().slice(0,8)}
            </text>
          </>
        )}
        {shirt.style === 'type' && (
          <>
            <text x="180" y="158" textAnchor="middle" fill={ink} fontSize="26" fontFamily="Georgia,serif" fontWeight="900" letterSpacing="-1">
              {words[0]?.toUpperCase().slice(0,6) ?? 'STYLE'}
            </text>
            <line x1="130" y1="166" x2="230" y2="166" stroke={ac} strokeWidth="2" />
            <text x="180" y="180" textAnchor="middle" fill={inkDim} fontSize="7.5" fontFamily="system-ui" fontWeight="700" letterSpacing="4">
              {words.slice(1,3).join(' ').toUpperCase().slice(0,14) || 'ORIGINAL DESIGN'}
            </text>
            <text x="180" y="205" textAnchor="middle" fill={inkDim} fontSize="5.5" fontFamily="system-ui" letterSpacing="2">STYLX.AI &mdash; 2026</text>
          </>
        )}
        {shirt.style === 'wave' && (
          <>
            <path d="M 128 148 Q 148 136 168 148 Q 188 160 208 148 Q 228 136 244 148" fill="none" stroke={ac} strokeWidth="2.5" opacity="0.95" />
            <path d="M 128 162 Q 148 150 168 162 Q 188 174 208 162 Q 228 150 244 162" fill="none" stroke={ac} strokeWidth="1.8" opacity="0.55" />
            <path d="M 128 176 Q 148 164 168 176 Q 188 188 208 176 Q 228 164 244 176" fill="none" stroke={ac} strokeWidth="1.2" opacity="0.28" />
            <path d="M 128 190 Q 148 178 168 190 Q 188 202 208 190 Q 228 178 244 190" fill="none" stroke={ac} strokeWidth="0.8" opacity="0.14" />
            {[140,158,176,194,212,230].map(x =>
              [212,222,232,242].map(y => (
                <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill={inkDim} />
              ))
            )}
          </>
        )}
      </g>

      {/* Size tag at hem */}
      <rect x="172" y="420" width="16" height="10" rx="2" fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} />
    </svg>
  );
}

/* ── Liquid fill progress card ───────────────────────────────────── */
function LiquidCard({
  shirt, prompt, progress, ready, msgIdx,
  onClick, selected
}: {
  shirt: typeof SHIRTS[0];
  prompt: string;
  progress: number;
  ready: boolean;
  msgIdx: number;
  onClick: () => void;
  selected: boolean;
}) {
  const ac = shirt.accent;
  const msgs = CARD_MSGS[SHIRTS.indexOf(shirt)];

  return (
    <div
      onClick={ready ? onClick : undefined}
      role={ready ? 'button' : undefined}
      tabIndex={ready ? 0 : undefined}
      aria-pressed={selected}
      onKeyDown={ready ? e => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        aspectRatio: '3 / 4',
        background: '#08080f',
        border: `1.5px solid ${selected ? ac : ready ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: selected ? `0 0 50px ${ac}30` : '0 8px 40px rgba(0,0,0,0.5)',
        transition: 'border-color 0.4s, box-shadow 0.4s, transform 0.3s',
        transform: selected ? 'translateY(-6px) scale(1.01)' : 'none',
        cursor: ready ? 'pointer' : 'default',
      }}
    >
      {/* ── Liquid fill (rising tide) ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${progress}%`,
        transition: 'height 0.12s ease-out',
        zIndex: 1,
        overflow: 'hidden',
      }}>
        {/* Wave surface (double-wide SVG sliding) */}
        <div style={{
          position: 'absolute', top: -28, left: 0,
          width: '200%', height: 32,
          animation: 'waveSlide 2.8s linear infinite',
        }}>
          <svg viewBox="0 0 800 32" preserveAspectRatio="none" width="100%" height="100%">
            <path
              d="M0,16 C66,4 133,28 200,16 C266,4 333,28 400,16 C466,4 533,28 600,16 C666,4 733,28 800,16 L800,32 L0,32 Z"
              fill={ac} fillOpacity="0.55"
            />
            <path
              d="M0,20 C80,10 160,30 240,20 C320,10 400,30 480,20 C560,10 640,30 720,20 C800,10 800,20 800,20 L800,32 L0,32 Z"
              fill={ac} fillOpacity="0.25"
            />
          </svg>
        </div>
        {/* Fill body */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, top: 10,
          background: `linear-gradient(to top, ${ac}50, ${ac}20)`,
        }} />
      </div>

      {/* Radial glow at liquid surface */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: `${progress - 15}%`,
        height: '30%',
        background: `radial-gradient(ellipse 70% 60% at 50% 100%, ${ac}28, transparent)`,
        zIndex: 2, pointerEvents: 'none',
        transition: 'bottom 0.12s ease-out',
      }} />

      {/* Shirt (always rendered, revealed on ready) */}
      <div style={{
        position: 'absolute', inset: '8% 5%',
        opacity: ready ? 1 : 0,
        transform: ready ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(10px)',
        transition: 'opacity 0.7s ease 0.05s, transform 0.7s ease 0.05s',
        zIndex: 3,
      }}>
        <ShirtSVG shirt={shirt} prompt={prompt} />
      </div>

      {/* Progress overlay (hidden when ready) */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '3.8rem', fontWeight: 900, lineHeight: 1,
            letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums',
            color: '#fff',
            textShadow: `0 0 40px ${ac}cc, 0 2px 20px rgba(0,0,0,0.9)`,
          }}>
            {Math.round(progress)}<span style={{ fontSize: '1.4rem', opacity: 0.6 }}>%</span>
          </div>
          <div style={{
            fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.05em', fontWeight: 600,
            textShadow: '0 1px 8px rgba(0,0,0,0.9)',
          }}>
            {msgs[Math.min(msgIdx, msgs.length - 1)]}
          </div>
        </div>
      )}

      {/* Bottom progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, zIndex: 5, background: 'rgba(0,0,0,0.4)',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${ac}88, ${ac})`,
          transition: 'width 0.12s ease-out',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)',
            animation: 'shimBar 1.3s linear infinite',
          }} />
        </div>
      </div>

      {/* Ready: label + selection indicator */}
      {ready && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
          padding: '0.75rem 1rem',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.05rem', letterSpacing: '0.05em', color: '#fff' }}>{shirt.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: selected ? ac : 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {selected && <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5L9.5 3.5" /></svg>}
              {selected ? 'Selected' : 'Tap to select'}
            </div>
          </div>
          {selected && (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="#050507" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3L13 5" /></svg></div>
          )}
        </div>
      )}

      {/* Flash on completion */}
      {ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, borderRadius: 20,
          background: 'white', pointerEvents: 'none',
          animation: 'flashIn 0.55s ease forwards',
        }} />
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase]         = useState<Phase>('hero');
  const [prompt, setPrompt]       = useState('');
  const [phIdx, setPhIdx]         = useState(0);
  const [authMode, setAuthMode]   = useState<AuthMode>('signup');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [role, setRole]           = useState<RegisterRole>('USER');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState<string | null>(null);
  const [mainPct, setMainPct]     = useState(0);
  const [cardPct, setCardPct]     = useState([0, 0, 0]);
  const [cardReady, setCardReady] = useState([false, false, false]);
  const cardsRef  = useRef<HTMLDivElement>(null);
  const authRef   = useRef<HTMLDivElement>(null);
  const rafRef    = useRef(0);
  const startRef  = useRef(0);

  useEffect(() => {
    try { if (localStorage.getItem('pd_session')) router.replace('/home'); } catch { /**/ }
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PROMPT_EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, []);

  function generate() {
    if (!prompt.trim()) return;
    setPhase('generating');
    setMainPct(0); setCardPct([0, 0, 0]); setCardReady([false, false, false]);
    startRef.current = performance.now();
    const TOTAL = 3400;
    const THRESHOLDS = [80, 91, 100];

    function tick(now: number) {
      const el = now - startRef.current;
      const mp = eased(el, TOTAL);
      setMainPct(mp);
      setCardPct(THRESHOLDS.map(th => Math.min(100, (mp / th) * 100)));
      setCardReady(THRESHOLDS.map(th => mp >= th));

      if (el >= TOTAL + 250) {
        setMainPct(100); setCardPct([100, 100, 100]); setCardReady([true, true, true]);
        setTimeout(() => {
          setPhase('results');
          setTimeout(() => cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
        }, 500);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    setTimeout(() => cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function selectShirt(id: string) {
    setSelected(id); setPhase('auth');
    setTimeout(() => authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }

  function enterGuest() {
    try { localStorage.setItem('pd_session', JSON.stringify({ type: 'guest', name: 'Guest' })); } catch { /**/ }
    router.push('/home');
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    if (authMode === 'signup' && !name.trim()) { setError('Name required'); return; }
    if (!email || !password) { setError('Fill in all fields'); return; }
    if (authMode === 'signup' && password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(authMode === 'signup' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'signup' ? { name, email, password, role } : { email, password }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError((d as {error?:string}).error ?? 'Failed'); return; }
      const u = await res.json() as {id:string;name:string;email:string;role:string};
      localStorage.setItem('pd_session', JSON.stringify({ type:'user', customerId:u.id, name:u.name, email:u.email, role:u.role }));
      router.push(u.role === 'ARTIST' ? '/artist' : '/home');
    } catch { setError('Network error'); } finally { setLoading(false); }
  }

  const msgIdx = Math.min(Math.floor((mainPct / 100) * MAIN_MSGS.length), MAIN_MSGS.length - 1);

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #050507 0%, #060610 100%)', overflowX: 'hidden' }}>

      {/* ── Background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.07) 0%, transparent 60%)', top: '10%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'orb1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.06) 0%, transparent 65%)', bottom: '15%', right: '5%', animation: 'orb2 28s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,97,255,0.05) 0%, transparent 65%)', top: '55%', left: '3%' }} />
        {/* Scan lines */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)', opacity: 0.35 }} />
        {/* Floating scan line sweep */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,229,200,0.18), rgba(0,153,255,0.12), transparent)', animation: 'scan-line 12s linear infinite', animationDelay: '2s' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.12), rgba(0,229,200,0.1), transparent)', animation: 'scan-line 18s linear infinite', animationDelay: '7s' }} />
        {/* Particles */}
        <div className="particle" style={{ width: 4, height: 4, top: '25%', left: '15%', '--dur': '7s', '--delay': '0s' } as React.CSSProperties} />
        <div className="particle" style={{ width: 3, height: 3, top: '60%', left: '82%', '--dur': '9s', '--delay': '2s' } as React.CSSProperties} />
        <div className="particle" style={{ width: 5, height: 5, top: '40%', left: '72%', '--dur': '6s', '--delay': '4s' } as React.CSSProperties} />
        <div className="particle" style={{ width: 3, height: 3, top: '75%', left: '28%', '--dur': '8s', '--delay': '1.5s' } as React.CSSProperties} />
        <div className="particle" style={{ width: 4, height: 4, top: '15%', left: '88%', '--dur': '11s', '--delay': '3s' } as React.CSSProperties} />
      </div>

      {/* ── Navbar ── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 58, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,7,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#00E5C8,#0099FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#050507' }}>S</div>
            <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.3rem', fontWeight: 400, color: '#fff', letterSpacing: '0.04em' }}>STYLX<span style={{ color: '#00E5C8' }}>.AI</span></span>
          </div>
          <button onClick={enterGuest} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', cursor: 'pointer' }}>Browse as guest</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7rem 1.5rem 5rem', textAlign: 'center' }}>

        <div style={{ animation: 'up 0.5s ease 0.1s both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(0,229,200,0.07)', border: '1px solid rgba(0,229,200,0.2)', marginBottom: '1.75rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5C8', boxShadow: '0 0 8px #00E5C8', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00E5C8' }}>AI-Powered Fashion Tech</span>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(5.5rem, 16vw, 13rem)', fontWeight: 400, letterSpacing: '0.025em', lineHeight: 0.88, marginBottom: '1.2rem' }}>
          <span style={{ display: 'block', color: '#fff', animation: 'up 0.5s ease 0.2s both' }}>Describe it.</span>
          <span className="glitch-in" style={{ display: 'block', background: 'linear-gradient(135deg,#00E5C8 0%,#0099FF 45%,#7B61FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animationDelay: '0.4s' }}>Wear it.</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(0.9rem,2vw,1.05rem)', lineHeight: 1.7, maxWidth: 440, marginBottom: '2.5rem', animation: 'up 0.5s ease 0.3s both' }}>
          Type any idea, choose a direction, and turn it into a clean apparel order request in minutes.
        </p>

        {/* ── Prompt input ── */}
        <div style={{ width: '100%', maxWidth: 600, animation: 'up 0.5s ease 0.4s both' }}>
          <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${phase === 'generating' ? '#00E5C8' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, overflow: 'hidden', boxShadow: phase === 'generating' ? '0 0 30px rgba(0,229,200,0.18)' : 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }}>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && phase === 'hero' && generate()}
              placeholder={PROMPT_EXAMPLES[phIdx]}
              disabled={phase !== 'hero'}
              maxLength={200}
              aria-label="Describe your shirt design"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '1rem', padding: '1rem 1.2rem', fontFamily: 'inherit' }}
            />
            {prompt.length > 160 && <span aria-live="polite" style={{ fontSize: '0.6rem', color: prompt.length > 190 ? '#f87171' : 'rgba(255,255,255,0.3)', alignSelf: 'center', paddingRight: 8, flexShrink: 0 }}>{200 - prompt.length}</span>}
            <button
              onClick={generate}
              aria-label={phase === 'generating' ? `Generating - ${Math.round(mainPct)}%` : 'Generate shirt designs'}
              disabled={phase !== 'hero' || !prompt.trim()}
              className={phase === 'hero' && prompt.trim() ? 'btn-holo' : ''}
              style={{ margin: '6px', padding: '0 1.4rem', borderRadius: 10, border: 'none', background: phase === 'hero' && prompt.trim() ? undefined : 'rgba(255,255,255,0.06)', color: phase === 'hero' && prompt.trim() ? undefined : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.9rem', cursor: phase === 'hero' && prompt.trim() ? 'pointer' : 'default', transition: 'all 0.2s', minWidth: 120 }}
            >
              {phase === 'generating'
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}><path d="M8 1.5a6.5 6.5 0 1 1-6.4 5.4" /></svg>{Math.round(mainPct)}%</span>
                : <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Generate<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', marginTop: '0.6rem' }}>No account needed &mdash; preview free &middot; built for fast product decisions</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: '3.5rem', animation: 'up 0.5s ease 0.5s both', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          {[['3 min','Start'],['300dpi','Artwork'],['50K+','Ideas'],['Ready','Review']].map(([n,l], i) => (
            <div key={l} style={{ textAlign: 'center', padding: '1rem 1.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(1.4rem,3vw,2.2rem)', fontWeight: 400, letterSpacing: '0.04em', background: 'linear-gradient(135deg,#fff 40%,rgba(0,229,200,0.85))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Generation + Results ── */}
      {(phase === 'generating' || phase === 'results' || phase === 'auth') && (
        <section ref={cardsRef} style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 5rem', maxWidth: 960, margin: '0 auto' }}>

          {/* Main progress bar */}
          {phase === 'generating' && (
            <div style={{ marginBottom: '2.5rem', textAlign: 'center', animation: 'up 0.4s ease both' }}>
              <div style={{ fontSize: 'clamp(3rem,8vw,5.5rem)', fontWeight: 900, letterSpacing: '-0.06em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
                {Math.round(mainPct)}<span style={{ fontSize: '38%', WebkitTextFillColor: 'rgba(0,200,180,0.65)', opacity: 0.8 }}>%</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginBottom: '1.25rem', letterSpacing: '0.04em' }}>{MAIN_MSGS[msgIdx]}</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', maxWidth: 500, margin: '0 auto 1.25rem' }}>
                <div style={{ height: '100%', width: `${mainPct}%`, background: 'linear-gradient(90deg,#00E5C8,#0099FF,#7B61FF)', borderRadius: 999, transition: 'width 0.15s ease-out', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)', animation: 'shimBar 1.2s linear infinite' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
                {SHIRTS.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: cardReady[i] ? s.accent : 'rgba(255,255,255,0.28)', transition: 'color 0.3s' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cardReady[i] ? s.accent : 'rgba(255,255,255,0.12)', boxShadow: cardReady[i] ? `0 0 10px ${s.accent}` : 'none', transition: 'all 0.4s' }} />
                    {s.label} {cardReady[i] ? <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M2.5 6.5l2.5 2.5L9.5 3.5" /></svg> : `${Math.round(cardPct[i])}%`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt label (results/auth) */}
          {(phase === 'results' || phase === 'auth') && (
            <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'up 0.4s ease both' }}>
              <div style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                Generated for: <strong style={{ color: '#fff' }}>&ldquo;{prompt}&rdquo;</strong>
              </div>
            </div>
          )}

          {/* ── 3 Liquid cards ── */}
          <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
            {SHIRTS.map((shirt, i) => (
              <LiquidCard
                key={shirt.id}
                shirt={shirt}
                prompt={prompt}
                progress={cardPct[i]}
                ready={cardReady[i]}
                msgIdx={Math.min(Math.floor((cardPct[i] / 100) * CARD_MSGS[i].length), CARD_MSGS[i].length - 1)}
                onClick={() => selectShirt(shirt.id)}
                selected={selected === shirt.id}
              />
            ))}
          </div>

          {phase === 'results' && (
            <div style={{ textAlign: 'center', animation: 'up 0.4s ease 0.2s both' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>Select a design above to order it</p>
              <button onClick={enterGuest} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}>Just browse as guest</button>
            </div>
          )}
        </section>
      )}

      {/* ── Auth ── */}
      {phase === 'auth' && (
        <section ref={authRef} style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 5rem', maxWidth: 440, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden', animation: 'up 0.4s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['signup','signin'] as AuthMode[]).map(m => (
                <button key={m} role="tab" aria-selected={authMode === m} onClick={() => { setAuthMode(m); setError(''); }} style={{ padding: '0.875rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', background: authMode === m ? 'rgba(0,229,200,0.07)' : 'transparent', color: authMode === m ? '#00E5C8' : 'rgba(255,255,255,0.3)', borderBottom: `2px solid ${authMode === m ? '#00E5C8' : 'transparent'}`, transition: 'all 0.15s' }}>
                  {m === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              ))}
            </div>
            <div style={{ padding: '1.75rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {authMode === 'signup' ? 'Create a free account to save and submit your order request.' : 'Welcome back - continue your order.'}
              </p>
              {error && <div role="alert" aria-live="assertive" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.75rem', color: '#F87171', marginBottom: '1rem' }}>{error}</div>}
              <form onSubmit={submitAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {authMode === 'signup' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['USER','ARTIST'] as RegisterRole[]).map(r => (
                        <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} style={{ padding: '0.65rem', borderRadius: 9, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${role === r ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)'}`, background: role === r ? 'rgba(0,229,200,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: role === r ? '#00E5C8' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {r === 'USER'
                              ? <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={12} height={12} aria-hidden="true"><path d="M1 3h9v7H1zM10 5l3 2v3h-3V5z"/><circle cx="3.5" cy="11" r="1"/><circle cx="11" cy="11" r="1"/></svg>
                              : <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={12} height={12} aria-hidden="true"><path d="M2 12c2-4 4.5-8 5.5-8s.5 2-.5 2.5c-1.5 1.5 2 2 2.5-1 .7-2 1-3.5 1-3.5"/><circle cx="11" cy="3" r="1"/></svg>
                            }
                            {r === 'USER' ? 'Customer' : 'Artist'}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{r === 'USER' ? 'Order shirts' : 'Sell designs'}</div>
                        </button>
                      ))}
                    </div>
                    <label htmlFor="auth-name" className="sr-only">Your name</label>
                    <input id="auth-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoComplete="name" maxLength={80} style={{ background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'0.7rem 0.9rem', color:'#fff', fontSize:'0.875rem', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' as const }} />
                  </>
                )}
                <label htmlFor="auth-email" className="sr-only">Email</label>
                <input id="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required autoComplete="email" maxLength={120} style={{ background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'0.7rem 0.9rem', color:'#fff', fontSize:'0.875rem', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' as const }} />
                <div style={{ position: 'relative' }}>
                  <label htmlFor="auth-password" className="sr-only">Password</label>
                  <input id="auth-password" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} maxLength={128} aria-describedby={authMode === 'signup' ? 'pwd-hint' : undefined} style={{ background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'0.7rem 2.8rem 0.7rem 0.9rem', color:'#fff', fontSize:'0.875rem', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' as const }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', fontSize:'0.75rem', fontWeight:700, padding:'2px 4px' }}>{showPwd ? 'HIDE' : 'SHOW'}</button>
                </div>
                {authMode === 'signup' && password && (
                  <div id="pwd-hint" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[8, 12, 16].map(n => (
                      <div key={n} style={{ flex: 1, height: 3, borderRadius: 999, background: password.length >= n ? (n === 8 ? '#F59E0B' : n === 12 ? '#3B82F6' : '#10B981') : 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }} />
                    ))}
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', marginLeft: 4, whiteSpace: 'nowrap' }}>
                      {password.length < 8 ? 'Too short' : password.length < 12 ? 'Weak' : password.length < 16 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ height:46, borderRadius:11, border:'none', background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00E5C8,#0099FF)', color: loading ? 'rgba(255,255,255,0.3)' : '#050507', fontWeight:800, fontSize:'0.9rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(0,229,200,0.25)', transition:'all 0.15s', marginTop:4 }}>
                  {loading ? 'Loading...' : authMode === 'signup' ? 'Create Account & Order' : 'Sign In'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button onClick={enterGuest} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', fontSize:'0.7rem', cursor:'pointer' }}>Skip &mdash; continue as guest</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Marquee strip ── */}
      {phase === 'hero' && (
        <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(90deg, rgba(0,229,200,0.025), rgba(0,153,255,0.015), rgba(123,97,255,0.02))' }}>
          <div style={{ display: 'flex', animation: 'marquee 28s linear infinite', willChange: 'transform' }}>
            {[0, 1].map(copy => (
              <div key={copy} style={{ display: 'flex', flexShrink: 0, alignItems: 'center', padding: '0.75rem 0' }}>
                {['GUIDED DESIGN', '300 DPI ARTWORK', 'ORDER REQUESTS', 'DESIGN REVIEW', 'UNLIMITED STYLES', 'CUSTOM SIZING', 'PREMIUM MOCKUPS', 'CREATOR READY'].map((item, j) => (
                  <span key={j} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '0.82rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', paddingLeft: '1.75rem', paddingRight: '0.875rem', whiteSpace: 'nowrap' }}>{item}</span>
                    <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: '#00E5C8', opacity: 0.5 }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      {phase === 'hero' && (
        <section id="how" style={{ position: 'relative', zIndex: 1, padding: '4rem 1.5rem 7rem', maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: '3.5rem' }}>
            <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(3rem,7vw,6rem)', fontWeight: 400, letterSpacing: '0.025em', lineHeight: 0.9, background: 'linear-gradient(135deg,#fff 35%,rgba(0,229,200,0.85))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>The Process</h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.12), transparent)' }} />
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '0.75rem', letterSpacing: '0.15em', color: '#00E5C8', opacity: 0.7 }}>04 STEPS</div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', t: 'Describe', b: 'Type a vibe, a concept, a feeling. AI understands context and nuance.', accent: '#00E5C8' },
              { n: '02', t: 'Generate', b: 'Watch 3 unique shirt designs appear in real-time, tailored to your prompt.', accent: '#0099FF' },
              { n: '03', t: 'Customize', b: 'Fine-tune size, color, and layout in our design studio.', accent: '#7B61FF' },
              { n: '04', t: 'Request', b: 'Submit a clean order request with your artwork, size, color, and delivery details.', accent: '#00E5C8' },
            ].map((s, i) => (
              <div key={s.n} className="scan-card rsp-1col" style={{
                display: 'grid', gridTemplateColumns: '5rem 1fr auto',
                alignItems: 'center', gap: '2rem',
                padding: '1.75rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                animation: `up 0.5s ease ${0.1 + i * 0.1}s both`,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(2.8rem,5vw,4rem)', fontWeight: 400, color: s.accent, opacity: 0.25, lineHeight: 1, letterSpacing: '0.02em' }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(1.6rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, color: '#fff', marginBottom: '0.35rem' }}>{s.t}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: 480 }}>{s.b}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent, boxShadow: `0 0 12px ${s.accent}`, opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer role="contentinfo" style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.75rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.15rem', letterSpacing: '0.05em', color: '#fff', marginBottom: '0.4rem' }}>STYLX<span style={{ color: '#00E5C8' }}>.AI</span></div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.66rem' }}>&copy; 2026 STYLX.AI &mdash; Describe it. Wear it.</div>
      </footer>

      <style>{`
        @keyframes up        { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes marquee   { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes waveSlide { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes shimBar   { from { transform:translateX(-100%); } to { transform:translateX(250%); } }
        @keyframes flashIn   { 0% { opacity:.35; } 50% { opacity:.12; } 100% { opacity:0; } }
        @keyframes pulse     { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.5); } }
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes orb1      { 0%,100% { transform:translate(-50%,-50%) scale(1); } 50% { transform:translate(-48%,-52%) scale(1.06); } }
        @keyframes orb2      { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08) translate(-3%,3%); } }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
