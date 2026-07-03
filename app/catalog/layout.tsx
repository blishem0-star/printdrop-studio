import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Designs',
  description: 'Explore 50+ premium AI-designed shirt styles - urban, minimal, nature, vintage and more. Filter by category and customize any design.',
  keywords: ['custom shirt designs', 'ai shirt catalog', 'browse t-shirts', 'premium shirt designs', 'custom tees'],
  openGraph: {
    title: 'Browse Designs - STYLX.AI',
    description: 'Explore 50+ premium AI-designed shirt styles. Filter, customize, and order in minutes.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://stylx.ai/catalog',
  },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
