import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design Studio',
  description: 'Create a custom shirt with AI. Add text, upload images, or describe your idea and let AI generate a unique design. 300 DPI printing, ships in 72 hours.',
  keywords: ['design custom shirt', 'ai shirt designer', 'custom t-shirt studio', 'shirt design tool', 'print on demand designer'],
  openGraph: {
    title: 'Design Studio — STYLX.AI',
    description: 'Create a custom shirt with AI. Describe it, design it, wear it.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://stylx.ai/design',
  },
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
