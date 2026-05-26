import { TESTIMONIALS } from '@/lib/mockData';

export default function Testimonials() {
  return (
    <section style={{
      padding: '5rem 1.5rem',
      background: 'linear-gradient(to bottom, #080808, #0d0d0d, #080808)',
      borderTop: '1px solid #141414',
      borderBottom: '1px solid #141414',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-tag" style={{ margin: '0 auto 1rem' }}>Reviews</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            People love PrintDrop
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: 20,
              padding: '1.75rem',
            }}>
              {/* Stars */}
              <div style={{ color: '#F59E0B', fontSize: 14, marginBottom: 12 }}>★★★★★</div>

              <p style={{ color: '#bbb', lineHeight: 1.7, fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                "{t.text}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF4D1C, #8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 13,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: '#555', fontSize: 12 }}>{t.location}</div>
                  </div>
                </div>
                <div style={{ color: '#333', fontSize: 11, fontWeight: 600 }}>"{t.design}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
