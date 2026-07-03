export type CatalogDesign = {
  id: string;
  title: string;
  category: string;
  price: number;
  badge?: 'bestseller' | 'new' | 'trending';
  svg: string;
  artistId?: string;
  artistName?: string;
  originalId?: string;
  productType?: string;
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
  {
    id: 'pine-forest',
    title: 'Pine Forest',
    category: 'Nature',
    price: 18.99,
    badge: 'new',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M60,150 L60,120 M60,120 L45,120 L60,95 L50,95 L62,72 L55,72 L70,45 L85,72 L78,72 L90,95 L80,95 L95,120 L60,120" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M125,150 L125,128 M125,128 L113,128 L125,108 L117,108 L127,88 L121,88 L133,66 L145,88 L139,88 L149,108 L141,108 L153,128 L125,128" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" opacity="0.65"/>
      <line x1="35" y1="150" x2="165" y2="150" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      <circle cx="160" cy="48" r="9" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.45"/>
    </svg>`,
  },
  {
    id: 'desert-sun',
    title: 'Desert Sun',
    category: 'Nature',
    price: 17.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="82" r="30" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M100,38 L100,26 M131,51 L140,42 M144,82 L156,82 M131,113 L140,122 M69,51 L60,42 M56,82 L44,82 M69,113 L60,122" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M30,150 Q65,138 100,150 Q135,162 170,150" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M45,166 Q100,154 155,166" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
    </svg>`,
  },
  {
    id: 'metro-grid',
    title: 'Metro Grid',
    category: 'Urban',
    price: 19.99,
    badge: 'new',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="40" y="70" width="28" height="80" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <rect x="80" y="45" width="32" height="105" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <rect x="124" y="88" width="30" height="62" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <path d="M86,58 h20 M86,72 h20 M86,86 h20 M46,82 h16 M46,96 h16 M130,100 h18 M130,114 h18" stroke="currentColor" stroke-width="2" opacity="0.55"/>
      <line x1="30" y1="150" x2="170" y2="150" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="160" cy="52" r="3" fill="currentColor" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'boombox',
    title: 'Boombox',
    category: 'Urban',
    price: 21.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="35" y="70" width="130" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="4"/>
      <circle cx="70" cy="105" r="20" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <circle cx="70" cy="105" r="7" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <circle cx="130" cy="105" r="20" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <circle cx="130" cy="105" r="7" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <rect x="88" y="80" width="24" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.7"/>
      <path d="M60,70 L75,52 M140,70 L125,52" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'orbit-rings',
    title: 'Orbit',
    category: 'Abstract',
    price: 18.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <ellipse cx="100" cy="100" rx="62" ry="24" fill="none" stroke="currentColor" stroke-width="3" transform="rotate(-18 100 100)"/>
      <ellipse cx="100" cy="100" rx="62" ry="24" fill="none" stroke="currentColor" stroke-width="2.5" transform="rotate(42 100 100)" opacity="0.6"/>
      <circle cx="100" cy="100" r="17" fill="none" stroke="currentColor" stroke-width="4"/>
      <circle cx="152" cy="76" r="5" fill="currentColor"/>
      <circle cx="55" cy="132" r="3.5" fill="currentColor" opacity="0.6"/>
    </svg>`,
  },
  {
    id: 'fragments',
    title: 'Fragments',
    category: 'Abstract',
    price: 19.99,
    badge: 'trending',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <polygon points="100,34 132,62 118,98 82,98 68,62" fill="none" stroke="currentColor" stroke-width="3.5"/>
      <polygon points="66,108 92,112 84,146 56,138" fill="none" stroke="currentColor" stroke-width="3" opacity="0.7"/>
      <polygon points="112,110 142,104 152,138 120,148" fill="none" stroke="currentColor" stroke-width="3" opacity="0.7"/>
      <line x1="100" y1="34" x2="100" y2="98" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
      <line x1="68" y1="62" x2="132" y2="62" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
    </svg>`,
  },
  {
    id: 'one-line-face',
    title: 'One Line',
    category: 'Minimal',
    price: 16.99,
    badge: 'new',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M70,140 Q56,120 60,95 Q64,64 92,56 Q124,48 138,72 Q150,92 138,110 Q128,124 112,122 Q100,120 102,108 Q104,98 116,100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="88" cy="86" r="2.5" fill="currentColor"/>
    </svg>`,
  },
  {
    id: 'dot-matrix',
    title: 'Dot Matrix',
    category: 'Minimal',
    price: 15.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <g fill="currentColor">
        <circle cx="70" cy="70" r="5"/><circle cx="100" cy="70" r="5" opacity="0.75"/><circle cx="130" cy="70" r="5" opacity="0.5"/>
        <circle cx="70" cy="100" r="5" opacity="0.75"/><circle cx="100" cy="100" r="7"/><circle cx="130" cy="100" r="5" opacity="0.75"/>
        <circle cx="70" cy="130" r="5" opacity="0.5"/><circle cx="100" cy="130" r="5" opacity="0.75"/><circle cx="130" cy="130" r="5"/>
      </g>
      <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
    </svg>`,
  },
  {
    id: 'cassette',
    title: 'Cassette',
    category: 'Vintage',
    price: 20.99,
    badge: 'trending',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="38" y="66" width="124" height="72" rx="6" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="52" y="80" width="96" height="24" rx="12" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="76" cy="92" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="124" cy="92" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M62,138 L70,118 L130,118 L138,138" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <line x1="88" y1="92" x2="112" y2="92" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    </svg>`,
  },
  {
    id: 'motor-club',
    title: 'Motor Club',
    category: 'Vintage',
    price: 22.99,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="34" fill="none" stroke="currentColor" stroke-width="4"/>
      <circle cx="100" cy="100" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M100,66 L100,90 M100,110 L100,134 M66,100 L90,100 M110,100 L134,100 M77,77 L92,92 M108,108 L123,123 M123,77 L108,92 M92,108 L77,123" stroke="currentColor" stroke-width="2.5"/>
      <path d="M52,96 Q30,84 24,96 Q34,104 52,104 M148,96 Q170,84 176,96 Q166,104 148,104" fill="none" stroke="currentColor" stroke-width="3" opacity="0.7"/>
    </svg>`,
  },
];
