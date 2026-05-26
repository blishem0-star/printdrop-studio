import Link from 'next/link';
import TShirtMockup from '@/components/TShirtMockup';
import Footer from '@/components/Footer';

const STEPS = [
  { n: '01', icon: '👕', title: 'Pick your shirt', body: 'Choose color, size, and fit. 8 premium colors, 100% cotton.' },
  { n: '02', icon: '🎨', title: 'Choose a design', body: 'Browse the catalog, use AI prompts, or upload your own photo.' },
  { n: '03', icon: '🚀', title: 'We print & ship', body: 'DTG premium printing. At your door in 72 hours.' },
];

type Preview = { color: string; emoji: string; rotate: string; top: string; left?: string; right?: string };
const PREVIEWS: Preview[] = [
  { color: '#0d0d0d', emoji: '🌌', rotate: '-6deg', top: '8%', left: '2%' },
  { color: '#1a2744', emoji: '🏙️', rotate: '8deg', top: '55%', right: '3%' },
  { color: '#1e3a2f', emoji: '🌿', rotate: '4deg', top: '12%', right: '4%' },
];

const STATS = [
  { v: '50K+', l: 'Shirts printed' },
  { v: '4.9 ★', l: 'Average rating' },
  { v: '72h', l: 'Delivery' },
  { v: '100%', l: 'Satisfaction' },
];

export default function Home() {
  return (
    <main>
      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', paddingTop: 60, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {/* Background glows */}
        <div className="glow-dot" style={{ width: 600, height: 600, background: '#FF4D1C', top: '20%', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="glow-dot" style={{ width: 400, height: 400, background: '#8B5CF6', top: '60%', left: '10%', opacity: 0.15 }} />

        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

        {/* Floating shirts — decorative */}
        {PREVIEWS.map((p, i) => (
          <div key={i} className="hidden lg:block" style={{
            position: 'absolute', top: p.top, left: p.left, right: p.right,
            transform: `rotate(${p.rotate})`,
            animation: `float-y ${4.5 + i * 0.6}s ease-in-out ${i * 0.8}s infinite`,
            opacity: 0.45, pointerEvents: 'none',
          }}>
            <TShirtMockup color={p.color} emoji={p.emoji} size="sm" />
          </div>
        ))}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.5rem', maxWidth: 840, margin: '0 auto' }}>
          <div className="tag" style={{ marginBottom: 28 }}>✦ Premium Custom Printing</div>

          <h1 className="display" style={{ marginBottom: 24 }}>
            Wear what you<br />
            <span className="g-text">imagine</span>
          </h1>

          <p className="subheading" style={{ maxWidth: 480, margin: '0 auto 40px' }}>
            Design a custom t-shirt in 3 steps. Browse 50+ designs,
            generate with AI, or bring your own photo. Delivered in 72 hours.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/design" className="btn btn-primary btn-lg">
              Open Design Studio
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/catalog" className="btn btn-ghost btn-lg">Browse catalog</Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'center', marginTop: 64 }}>
            {STATS.map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{s.v}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll line */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,77,28,0.6), transparent)' }} />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: '6rem 1.5rem', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="tag" style={{ marginBottom: 16 }}>How it works</div>
          <h2 className="heading">3 steps to your door</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '1rem', position: 'relative' }}>
          {/* Connecting line */}
          <div style={{ position: 'absolute', top: 48, left: '16%', right: '16%', height: 1, background: 'linear-gradient(to right, #FF4D1C44, #8B5CF644)', pointerEvents: 'none' }} className="hidden md:block" />

          {STEPS.map((s, i) => (
            <div key={i} className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: -13, left: 20,
                background: i === 0 ? '#FF4D1C' : i === 1 ? '#8B5CF6' : '#10B981',
                color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                letterSpacing: '0.06em',
              }}>STEP {s.n}</div>

              <div style={{ fontSize: 40, marginBottom: 16, marginTop: 8 }}>{s.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/design" className="btn btn-primary">
            Start now — it&apos;s free to design
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="tag" style={{ marginBottom: 14 }}>FAQ</div>
          <h2 className="heading">Common questions</h2>
        </div>
        {[
          {
            q: 'How long does delivery take?',
            a: 'Your shirt ships within 24 hours of placing your order. Standard delivery is 2–3 business days (72 hours total). Express 1-day shipping is available at checkout.',
          },
          {
            q: 'How good is the print quality?',
            a: 'We use Direct-to-Garment (DTG) printing at 300 DPI. Colors are vivid, wash-resistant, and tested to last 50+ machine washes without fading.',
          },
          {
            q: "What's your return policy?",
            a: 'If your shirt arrives with a printing defect or is not what you ordered, we\'ll reprint it or give you a full refund — no questions asked. Contact us within 30 days of delivery.',
          },
        ].map(({ q, a }) => (
          <details key={q} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
              {q}
              <span style={{ color: 'rgba(255,77,28,0.7)', fontSize: 18, fontWeight: 400, flexShrink: 0, marginLeft: 16 }}>+</span>
            </summary>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: 1.7, marginTop: '0.875rem', paddingRight: '2rem' }}>{a}</p>
          </details>
        ))}
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '4rem 1.5rem 6rem' }}>
        <div style={{
          maxWidth: 680, margin: '0 auto', textAlign: 'center',
          border: '1px solid rgba(255,77,28,0.15)',
          borderRadius: 28, padding: '3.5rem 2rem',
          background: 'linear-gradient(135deg, rgba(255,77,28,0.05), rgba(139,92,246,0.05))',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="glow-dot" style={{ width: 300, height: 300, background: '#FF4D1C', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.08 }} />
          <h2 className="heading" style={{ marginBottom: 14 }}>Ready to create?</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: '0.9rem' }}>
            Join 50,000+ people who print with us. No account required.
          </p>
          <Link href="/design" className="btn btn-primary btn-lg">Open Design Studio →</Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
