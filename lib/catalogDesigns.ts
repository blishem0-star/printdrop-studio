export type CatalogDesign = {
  id: string;
  title: string;
  category: string;
  price: number;
  badge?: 'bestseller' | 'new' | 'trending';
  svg: string;
};

export const CATALOG_CATEGORIES = ['All', 'Nature', 'Urban', 'Abstract', 'Minimal', 'Vintage'];

export const CATALOG_DESIGNS: CatalogDesign[] = [
  {
    id: 'mountain-geo',
    title: 'Mountain Peaks',
    category: 'Nature',
    price: 19.99,
    badge: 'bestseller',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <polygon points="100,20 160,140 40,140" fill="none" stroke="currentColor" stroke-width="4"/>
      <polygon points="60,80 110,160 10,160" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6"/>
      <polygon points="140,90 185,160 95,160" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6"/>
      <line x1="85" y1="60" x2="115" y2="60" stroke="currentColor" stroke-width="2" opacity="0.4"/>
      <circle cx="150" cy="40" r="12" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.5"/>
    </svg>`,
  },
  {
    id: 'ocean-wave',
    title: 'Ocean Wave',
    category: 'Nature',
    price: 17.99,
    badge: 'trending',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M10,80 Q40,50 70,80 Q100,110 130,80 Q160,50 190,80" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <path d="M10,105 Q40,75 70,105 Q100,135 130,105 Q160,75 190,105" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
      <path d="M10,128 Q40,98 70,128 Q100,158 130,128 Q160,98 190,128" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    </svg>`,
  },
  {
    id: 'city-skyline',
    title: 'City Skyline',
    category: 'Urban',
    price: 21.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="20" y="90" width="20" height="70" fill="currentColor" opacity="0.9"/>
      <rect x="22" y="70" width="16" height="22" fill="currentColor" opacity="0.9"/>
      <rect x="48" y="110" width="18" height="50" fill="currentColor" opacity="0.8"/>
      <rect x="70" y="60" width="22" height="100" fill="currentColor"/>
      <rect x="76" y="45" width="10" height="17" fill="currentColor"/>
      <rect x="96" y="80" width="16" height="80" fill="currentColor" opacity="0.85"/>
      <rect x="116" y="50" width="24" height="110" fill="currentColor"/>
      <rect x="122" y="35" width="12" height="17" fill="currentColor"/>
      <rect x="144" y="75" width="18" height="85" fill="currentColor" opacity="0.8"/>
      <rect x="166" y="95" width="16" height="65" fill="currentColor" opacity="0.7"/>
      <line x1="10" y1="160" x2="190" y2="160" stroke="currentColor" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'geo-diamond',
    title: 'Crystal Form',
    category: 'Abstract',
    price: 18.99,
    badge: 'new',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <polygon points="100,20 160,80 100,180 40,80" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <polygon points="100,20 160,80 100,120 40,80" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
      <line x1="40" y1="80" x2="160" y2="80" stroke="currentColor" stroke-width="2" opacity="0.4"/>
      <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    </svg>`,
  },
  {
    id: 'minimal-circle',
    title: 'Orbit',
    category: 'Minimal',
    price: 15.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="100" cy="100" r="45" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
      <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
      <circle cx="100" cy="30" r="6" fill="currentColor" opacity="0.8"/>
      <circle cx="100" cy="170" r="4" fill="currentColor" opacity="0.5"/>
      <line x1="100" y1="30" x2="100" y2="80" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    </svg>`,
  },
  {
    id: 'retro-sun',
    title: 'Retro Sun',
    category: 'Vintage',
    price: 16.99,
    badge: 'bestseller',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M100,20 L100,50 M100,150 L100,180 M20,100 L50,100 M150,100 L180,100" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M44,44 L64,64 M136,136 L156,156 M156,44 L136,64 M64,136 L44,156" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M60,170 Q100,140 140,170" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'lightning-bolt',
    title: 'Strike',
    category: 'Urban',
    price: 17.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <polygon points="115,20 75,105 105,105 85,180 140,85 108,85" fill="currentColor" opacity="0.9"/>
    </svg>`,
  },
  {
    id: 'infinity-loop',
    title: 'Infinite',
    category: 'Abstract',
    price: 18.99,
    badge: 'new',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M70,100 C70,65 30,55 20,100 C10,145 50,145 70,100 C90,55 150,55 170,100 C190,145 155,145 130,100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'pine-forest',
    title: 'Pine Forest',
    category: 'Nature',
    price: 19.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <polygon points="100,25 130,80 115,80 140,125 120,125 145,165 55,165 80,125 60,125 85,80 70,80" fill="currentColor" opacity="0.9"/>
      <rect x="92" y="165" width="16" height="18" fill="currentColor" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'minimal-arch',
    title: 'The Arch',
    category: 'Minimal',
    price: 15.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M50,165 L50,90 Q50,35 100,35 Q150,35 150,90 L150,165" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
    </svg>`,
  },
];
