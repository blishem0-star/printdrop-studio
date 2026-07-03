import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { prisma } from '@/lib/prisma';
import { sanitizeSvg } from '@/lib/sanitizeSvg';

export const revalidate = 300; // ISR: artist designs refresh every 5 minutes

type ResolvedDesign = {
  id: string;
  title: string;
  category: string;
  price: number;
  svg: string;
  artistName?: string;
  badge?: string;
};

async function resolveDesign(id: string): Promise<ResolvedDesign | null> {
  if (id.startsWith('artist-')) {
    const d = await prisma.artistDesign.findUnique({
      where: { id: id.slice('artist-'.length), status: 'APPROVED' },
      select: { id: true, title: true, category: true, price: true, svg: true, badge: true, artist: { select: { name: true } } },
    });
    if (!d) return null;
    return {
      id, title: d.title, category: d.category, price: d.price,
      svg: d.svg.trimStart().startsWith('<') ? sanitizeSvg(d.svg) : d.svg,
      artistName: d.artist.name, badge: d.badge ?? undefined,
    };
  }
  const s = CATALOG_DESIGNS.find(d => d.id === id);
  return s ? { id: s.id, title: s.title, category: s.category, price: s.price, svg: s.svg, badge: s.badge } : null;
}

export function generateStaticParams() {
  return CATALOG_DESIGNS.map(d => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const design = await resolveDesign(id);
  if (!design) return { title: 'Design not found' };
  const desc = `${design.title} - ${design.category} design${design.artistName ? ` by ${design.artistName}` : ''}. Premium custom print from $${design.price.toFixed(2)}, ready to customize.`;
  return {
    title: design.title,
    description: desc,
    alternates: { canonical: `https://stylx.ai/catalog/${design.id}` },
    openGraph: { title: `${design.title} | STYLX`, description: desc, type: 'website' },
  };
}

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await resolveDesign(id);
  if (!design) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: design.title,
    category: design.category,
    ...(design.artistName && { brand: { '@type': 'Brand', name: design.artistName } }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: design.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      url: `https://stylx.ai/catalog/${design.id}`,
    },
  };

  const isSvgMarkup = design.svg.trimStart().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/catalog" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>Catalog</Link>
      </header>

      <main className="rsp-stack" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem', padding: '3rem 2rem', maxWidth: 1000, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Vogue-spread: one design, monumental */}
        <div style={{ position: 'relative', width: 'min(380px, 80vw)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '2.5rem' }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: 8, left: 14, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '5rem', color: 'rgba(0,229,200,0.05)', letterSpacing: '0.05em', pointerEvents: 'none' }}>{design.category.toUpperCase()}</div>
          {isSvgMarkup ? (
            <div style={{ width: '70%', color: 'rgba(255,255,255,0.85)' }} dangerouslySetInnerHTML={{ __html: design.svg.replace(/currentColor/g, 'rgba(255,255,255,0.85)') }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- user-generated data URL
            <img src={design.svg} alt={design.title} style={{ width: '70%', objectFit: 'contain' }} />
          )}
        </div>

        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(0,229,200,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            {design.category}{design.artistName ? ` - by ${design.artistName}` : ''}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', letterSpacing: '0.03em', lineHeight: 1, margin: '0 0 14px', background: 'linear-gradient(135deg,#fff 40%,rgba(0,229,200,0.85))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {design.title}
          </h1>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', color: '#fff', marginBottom: 20 }}>
            ${design.price.toFixed(2)}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 24 }}>
            A premium print on a soft cotton tee. Pick your color and size, then send your order for review - you only pay once it is approved.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/catalog?design=${encodeURIComponent(design.id)}`} style={{ display: 'inline-block', padding: '0.8rem 2rem', borderRadius: 10, background: '#00E5C8', color: '#03241F', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Order as-is
            </Link>
            {!design.id.startsWith('artist-') && (
              <Link href={`/design?remix=${encodeURIComponent(design.id)}`} style={{ display: 'inline-block', padding: '0.8rem 2rem', borderRadius: 10, border: '1px solid rgba(0,229,200,0.35)', background: 'rgba(0,229,200,0.08)', color: '#00E5C8', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Remix in studio
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
