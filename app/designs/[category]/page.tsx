import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { prisma } from '@/lib/prisma';
import { sanitizeSvg } from '@/lib/sanitizeSvg';

export const revalidate = 3600; // fresh generated designs appear within the hour

// SEO landing pages per category - the pages Google ranks for
// "<category> t-shirt designs". Server-rendered with real product links.
const CATEGORY_COPY: Record<string, { slug: string; title: string; blurb: string }> = {
  nature:   { slug: 'nature',   title: 'Nature T-Shirt Designs',   blurb: 'Mountains, waves, forests and sunlit horizons - clean line-art that wears as well on a trail as it does in the city. Every design prints on soft premium cotton in the color you choose.' },
  urban:    { slug: 'urban',    title: 'Urban T-Shirt Designs',    blurb: 'Skylines, street energy and bold graphic statements. Pick a design as-is or remix it in the studio with your own text and colors.' },
  abstract: { slug: 'abstract', title: 'Abstract T-Shirt Designs', blurb: 'Geometry, orbits and fragments - designs that catch the eye without saying a word. Customize any of them in minutes.' },
  minimal:  { slug: 'minimal',  title: 'Minimal T-Shirt Designs',  blurb: 'One line, one mark, nothing extra. Minimal designs for people who let details speak quietly. Remix any piece with your own twist.' },
  vintage:  { slug: 'vintage',  title: 'Vintage T-Shirt Designs',  blurb: 'Badges, emblems, cassettes and sunset stripes with a worn-in soul. Classic looks, printed fresh to your order.' },
};

const CAT_BY_SLUG = Object.fromEntries(Object.values(CATEGORY_COPY).map(c => [c.slug, c]));
const CANONICAL: Record<string, string> = { nature: 'Nature', urban: 'Urban', abstract: 'Abstract', minimal: 'Minimal', vintage: 'Vintage' };

export function generateStaticParams() {
  return Object.keys(CAT_BY_SLUG).map(category => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const copy = CAT_BY_SLUG[category];
  if (!copy) return { title: 'Designs' };
  return {
    title: copy.title,
    description: copy.blurb,
    alternates: { canonical: `https://stylx.ai/designs/${copy.slug}` },
    openGraph: { title: `${copy.title} - STYLX`, description: copy.blurb, type: 'website' },
  };
}

async function categoryDesigns(cat: string) {
  const statics = CATALOG_DESIGNS.filter(d => d.category === cat);
  const artist = await prisma.artistDesign.findMany({
    where: { status: 'APPROVED', category: cat },
    orderBy: { salesCount: 'desc' },
    take: 24,
    select: { id: true, title: true, price: true, svg: true, badge: true, artist: { select: { name: true } } },
  }).catch(() => []);
  return [
    ...statics.map(d => ({ id: d.id, title: d.title, price: d.price, svg: d.svg, badge: d.badge, artistName: undefined as string | undefined })),
    ...artist.map(d => ({ id: `artist-${d.id}`, title: d.title, price: d.price, svg: d.svg.trimStart().startsWith('<') ? sanitizeSvg(d.svg) : d.svg, badge: d.badge ?? undefined, artistName: d.artist.name as string | undefined })),
  ];
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const copy = CAT_BY_SLUG[category];
  if (!copy) notFound();
  const designs = await categoryDesigns(CANONICAL[category]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.title,
    numberOfItems: designs.length,
    itemListElement: designs.slice(0, 20).map((d, i) => ({
      '@type': 'ListItem', position: i + 1, name: d.title, url: `https://stylx.ai/catalog/${d.id}`,
    })),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507,#060610)', color: '#fff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.2rem', color: '#fff', textDecoration: 'none', letterSpacing: '0.05em' }}>STYLX<span style={{ color: '#00E5C8' }}>.</span></Link>
        <nav style={{ display: 'flex', gap: 12, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {Object.values(CATEGORY_COPY).map(c => (
            <Link key={c.slug} href={`/designs/${c.slug}`} style={{ color: c.slug === category ? '#00E5C8' : 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', textTransform: 'capitalize' }}>{c.slug}</Link>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(0,229,200,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>{designs.length} designs - made to order</div>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: 'clamp(2.6rem,7vw,4.5rem)', letterSpacing: '0.03em', lineHeight: 0.95, margin: '0 0 14px' }}>{copy.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem', lineHeight: 1.7, maxWidth: 560, marginBottom: 34 }}>{copy.blurb}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
          {designs.map(d => (
            <Link key={d.id} href={`/catalog/${d.id}`} style={{ display: 'block', padding: '1.4rem 1rem 1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', textDecoration: 'none', color: 'inherit', textAlign: 'center', position: 'relative' }}>
              {d.badge && <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.5rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: d.badge === 'bestseller' ? '#FF4D1C' : d.badge === 'new' ? '#10B981' : '#8B5CF6', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.badge}</span>}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, minHeight: 64 }} dangerouslySetInnerHTML={{ __html: d.svg.replace(/currentColor/g, 'rgba(255,255,255,0.8)').replace('<svg ', '<svg width="64" height="64" ') }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
              {d.artistName && <div style={{ fontSize: '0.6rem', color: 'rgba(0,153,255,0.7)', marginTop: 2 }}>by {d.artistName}</div>}
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#00E5C8', marginTop: 4 }}>${d.price}</div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 44, textAlign: 'center', padding: '2.2rem 1.5rem', borderRadius: 18, border: '1px solid rgba(0,229,200,0.16)', background: 'rgba(0,229,200,0.03)' }}>
          <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.7rem', letterSpacing: '0.04em', margin: '0 0 8px' }}>Want it your way?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 18px' }}>Open any design in the studio - add your text, photos, and colors. No payment until you approve.</p>
          <Link href="/design" style={{ display: 'inline-block', padding: '0.85rem 2rem', borderRadius: 12, background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontWeight: 900, fontSize: '0.85rem', textDecoration: 'none' }}>Open the studio</Link>
        </div>
      </main>
    </div>
  );
}
