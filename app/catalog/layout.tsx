import type { Metadata } from 'next';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Browse Designs',
  description: 'Hand-picked shirt designs across urban, minimal, nature and vintage styles. Filter by category, customize any design, and order in minutes.',
  keywords: ['custom shirt designs', 'shirt catalog', 'browse t-shirts', 'premium shirt designs', 'custom tees'],
  openGraph: {
    title: 'Browse Designs - STYLX',
    description: 'Hand-picked shirt designs. Filter, customize, and order in minutes.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/catalog`,
  },
};

// ItemList schema so search engines can surface catalog designs with prices.
const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'STYLX shirt designs',
  numberOfItems: CATALOG_DESIGNS.length,
  itemListElement: CATALOG_DESIGNS.slice(0, 20).map((d, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/catalog/${d.id}`,
    name: d.title,
  })),
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      {children}
    </>
  );
}
