import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
