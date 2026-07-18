import { ImageResponse } from 'next/og';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { prisma } from '@/lib/prisma';
import { sanitizeSvg } from '@/lib/sanitizeSvg';
import { displayPrice } from '@/lib/productTypes';

// Dynamic share image per design (master plan D1): when a design link is
// shared on WhatsApp/Facebook/X, the preview shows THAT design - not a
// generic logo card. Node runtime (prisma for artist designs).

export const alt = 'Custom shirt design on STYLX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Resolved = { title: string; category: string; price: number; svg: string; artistName?: string };

async function resolve(id: string): Promise<Resolved | null> {
  if (id.startsWith('artist-')) {
    const d = await prisma.artistDesign.findUnique({
      where: { id: id.slice('artist-'.length), status: 'APPROVED' },
      select: { title: true, category: true, price: true, svg: true, artist: { select: { name: true } } },
    }).catch(() => null);
    if (!d) return null;
    return { title: d.title, category: d.category, price: d.price, svg: d.svg, artistName: d.artist.name };
  }
  const s = CATALOG_DESIGNS.find(d => d.id === id);
  return s ? { title: s.title, category: s.category, price: s.price, svg: s.svg } : null;
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await resolve(id);

  const isSvg = design?.svg.trimStart().startsWith('<');
  const artSrc = design && isSvg
    ? `data:image/svg+xml;utf8,${encodeURIComponent(
        sanitizeSvg(design.svg).replace(/currentColor/g, '#eafffb')
      )}`
    : design && !isSvg ? design.svg : null;

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        background: 'linear-gradient(135deg, #050507 0%, #0a0a18 60%, #050510 100%)',
        fontFamily: 'system-ui, sans-serif', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div style={{
          position: 'absolute', width: 620, height: 620, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,200,0.14) 0%, transparent 60%)',
          top: -140, left: -60, display: 'flex',
        }} />

        {/* Artwork panel */}
        <div style={{ width: 480, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{
            width: 380, height: 440, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {artSrc
              // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires plain img
              ? <img src={artSrc} width={300} height={300} alt="" />
              : <div style={{ display: 'flex', fontSize: 120, fontWeight: 900, color: '#00E5C8' }}>S.</div>}
          </div>
        </div>

        {/* Copy panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 80, gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 24, color: '#00E5C8', fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>
            {design ? design.category : 'Custom apparel'}
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, color: '#ffffff', lineHeight: 1.05, letterSpacing: -1 }}>
            {design ? design.title : 'Design yours'}
          </div>
          {design?.artistName && (
            <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.55)' }}>by {design.artistName}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            {design && (
              <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#ffffff', padding: '8px 22px', borderRadius: 14, background: 'rgba(0,229,200,0.12)', border: '1px solid rgba(0,229,200,0.4)' }}>
                From ${displayPrice(design.price).toFixed(2)}
              </div>
            )}
            <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.5)' }}>Made to order</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 26 }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#ffffff', letterSpacing: -1 }}>STYLX</span>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#00E5C8', letterSpacing: -1 }}>.</span>
            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', marginLeft: 18 }}>Customize it in the studio</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
