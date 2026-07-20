import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'STYLX unisex t-shirt size chart - chest and length in inches, with simple fit advice.',
  alternates: { canonical: `${SITE_URL}/size-guide` },
};

// Standard US unisex tee measurements (garment, laid flat).
const SIZES = [
  ['XS', '31-34', '16.5', '26'],
  ['S',  '34-37', '18',   '27'],
  ['M',  '38-41', '20',   '28'],
  ['L',  '42-45', '22',   '29'],
  ['XL', '46-49', '24',   '30'],
  ['XXL','50-53', '26',   '31'],
];

export default function SizeGuidePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff' }}>
      <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.2rem', color: '#fff', textDecoration: 'none', letterSpacing: '0.05em' }}>STYLX<span style={{ color: '#00E5C8' }}>.</span></Link>
      </header>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '2.6rem', letterSpacing: '0.04em', margin: '0 0 8px' }}>Size Guide</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 26 }}>
          Standard US unisex fit, true to size. If you are between sizes, size up for a relaxed fit or down for a fitted look. Custom-printed items are not returnable for size, so a minute here saves a headache later.
        </p>
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,229,200,0.06)' }}>
                {['Size', 'Fits chest (in)', 'Garment width (in)', 'Garment length (in)'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00E5C8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZES.map(([s, chest, w, l]) => (
                <tr key={s} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 900 }}>{s}</td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.7)' }}>{chest}</td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.7)' }}>{w}</td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.7)' }}>{l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', lineHeight: 1.7, marginTop: 16 }}>
          How to measure: wrap a tape around the fullest part of your chest, keeping it level. Garment width is measured armpit to armpit laid flat (roughly half your chest measurement).
        </p>
        <p style={{ marginTop: 22 }}>
          <Link href="/design" style={{ color: '#00E5C8', fontSize: '0.82rem', fontWeight: 800, textDecoration: 'none' }}>Not sure? The studio can recommend a size from your height and weight &rarr;</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
