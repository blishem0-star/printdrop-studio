const STEPS = [
  {
    num: '01',
    icon: '👕',
    title: 'Pick Your Shirt',
    desc: 'Choose from 8 premium colors and 6 sizes. Unisex fit, 100% cotton, pre-shrunk for a perfect feel every time.',
    color: '#FF4D1C',
  },
  {
    num: '02',
    icon: '🎨',
    title: 'Choose a Design',
    desc: 'Browse our curated library or let our AI generate a one-of-a-kind design from your description.',
    color: '#8B5CF6',
  },
  {
    num: '03',
    icon: '📦',
    title: 'We Print & Ship',
    desc: 'Your order goes straight to our print partners. Premium DTG printing, shipped to your door in 72 hours.',
    color: '#10B981',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '6rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div className="section-tag" style={{ margin: '0 auto 1rem' }}>How it works</div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
          From idea to doorstep<br />
          <span className="gradient-text">in 3 simple steps</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', position: 'relative' }}>
        {/* Connector line - desktop */}
        <div style={{
          position: 'absolute', top: 60, left: '16%', right: '16%', height: 1,
          background: 'linear-gradient(to right, #FF4D1C, #8B5CF6, #10B981)',
          opacity: 0.3,
        }} className="hidden md:block" />

        {STEPS.map((step, i) => (
          <div key={i} className="card-hover" style={{
            background: '#111',
            border: '1px solid #1e1e1e',
            borderRadius: 20,
            padding: '2rem',
            position: 'relative',
          }}>
            {/* Step number */}
            <div style={{
              position: 'absolute', top: -16, left: 24,
              background: step.color,
              color: 'white', fontWeight: 800, fontSize: 12,
              padding: '4px 12px', borderRadius: 100,
              letterSpacing: '0.05em',
            }}>
              STEP {step.num}
            </div>

            <div style={{ fontSize: 48, marginBottom: 16, marginTop: 8 }}>{step.icon}</div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
              {step.title}
            </h3>
            <p style={{ color: '#777', lineHeight: 1.7, fontSize: '0.9rem' }}>{step.desc}</p>

            {/* Accent line */}
            <div style={{ marginTop: 20, height: 3, borderRadius: 2, background: `linear-gradient(to right, ${step.color}, transparent)`, width: 60 }} />
          </div>
        ))}
      </div>
    </section>
  );
}
