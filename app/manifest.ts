import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STYLX - Describe it. Wear it.',
    short_name: 'STYLX',
    description: 'Custom shirt design and printing, made to order.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050507',
    theme_color: '#050507',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  };
}
