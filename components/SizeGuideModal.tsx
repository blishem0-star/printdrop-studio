'use client';

const SIZES = [
  { size: 'XS',  chest: '32–34"', waist: '26–28"', length: '27"' },
  { size: 'S',   chest: '35–37"', waist: '29–31"', length: '28"' },
  { size: 'M',   chest: '38–40"', waist: '32–34"', length: '29"' },
  { size: 'L',   chest: '41–43"', waist: '35–37"', length: '30"' },
  { size: 'XL',  chest: '44–46"', waist: '38–40"', length: '31"' },
  { size: '2XL', chest: '47–50"', waist: '41–44"', length: '32"' },
];

export default function SizeGuideModal({ onClose, selected }: { onClose: () => void; selected?: string | null }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: '2rem', maxWidth: 460, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>📏 Size Guide</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: 3 }}>Unisex — 100% ring-spun cotton, pre-shrunk</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.7rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Measure flat across the chest under the arms. All measurements in inches.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Size', 'Chest', 'Waist', 'Length'].map(h => (
                <th key={h} style={{
                  padding: '0.55rem 0.75rem', textAlign: h === 'Size' ? 'left' : 'center',
                  fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZES.map(row => {
              const active = selected === row.size;
              return (
                <tr key={row.size} style={{ background: active ? 'rgba(255,77,28,0.07)' : 'transparent' }}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: active ? '#FF8C40' : 'rgba(255,255,255,0.85)' }}>
                      {row.size}
                    </span>
                    {active && (
                      <span style={{ marginLeft: 7, fontSize: '0.58rem', background: 'rgba(255,77,28,0.15)', color: '#FF8C40', padding: '1px 7px', borderRadius: 4, border: '1px solid rgba(255,77,28,0.2)' }}>
                        selected
                      </span>
                    )}
                  </td>
                  {[row.chest, row.waist, row.length].map((v, i) => (
                    <td key={i} style={{
                      padding: '0.75rem', textAlign: 'center',
                      fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontFamily: 'monospace',
                    }}>{v}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{
          marginTop: '1.25rem', padding: '0.875rem 1rem',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
            Between sizes? Size up — our shirts run slightly slim. Free returns if it doesn&apos;t fit.
          </p>
        </div>
      </div>
    </div>
  );
}
