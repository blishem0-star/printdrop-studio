import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Design Studio',
  description: 'Create a custom apparel concept, add text or images, refine the layout, and submit a clean order request.',
  keywords: ['design custom shirt', 'online shirt designer', 'custom t-shirt studio', 'shirt design tool', 'print on demand designer'],
  openGraph: {
    title: 'Design Studio - STYLX',
    description: 'Create a custom apparel concept, refine it, and prepare it for review.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/design`,
  },
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
