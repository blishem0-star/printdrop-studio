import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STYLX.AI - Describe it. Wear it.',
    short_name: 'STYLX.AI',
    description: 'AI-powered custom shirt design and printing.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050507',
    theme_color: '#050507',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  };
}
