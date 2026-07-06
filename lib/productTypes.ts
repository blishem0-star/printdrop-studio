export type ProductType = 'TSHIRT' | 'LONG_SLEEVE' | 'HOODIE' | 'HOODIE_VEST' | 'SOCKS';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  TSHIRT:      'T-Shirt',
  LONG_SLEEVE: 'Long Sleeve',
  HOODIE:      'Hoodie',
  HOODIE_VEST: 'Sleeveless Hoodie',
  SOCKS:       'Socks',
};

export const PRODUCT_TYPE_EMOJI: Record<ProductType, string> = {
  TSHIRT:      '👕',
  LONG_SLEEVE: '👔',
  HOODIE:      '🧥',
  HOODIE_VEST: '🦺',
  SOCKS:       '🧦',
};

// Garments the design studio can print on. Socks are catalog-only:
// their print geometry doesn't fit the studio's torso print area.
export const STUDIO_PRODUCTS: ProductType[] = ['TSHIRT', 'LONG_SLEEVE', 'HOODIE', 'HOODIE_VEST'];

export function isProductType(v: unknown): v is ProductType {
  return typeof v === 'string' && v in PRODUCT_TYPE_LABELS;
}

export const PRODUCT_BASE_PRICE: Record<ProductType, number> = {
  TSHIRT:      24.99,
  LONG_SLEEVE: 29.99,
  HOODIE:      49.99,
  HOODIE_VEST: 44.99,
  SOCKS:       12.99,
};

// SVG paths for each product type (viewBox 0 0 200 200)
// Returns an object with the main body path + optional extra paths (hood, pocket etc.)
export const PRODUCT_PATHS: Record<ProductType, {
  body: string;
  shadeLeft?: string;
  shadeRight?: string;
  detail?: string;       // hood seam, pocket, sock toe etc.
  detailFill?: string;
  viewBox?: string;
}> = {
  // ── T-Shirt (short sleeve) ────────────────────────────────────
  TSHIRT: {
    body: 'M60,30 L20,55 L35,75 L50,65 L50,175 L150,175 L150,65 L165,75 L180,55 L140,30 Q120,15 100,18 Q80,15 60,30Z',
    shadeLeft:  'M60,30 L20,55 L35,75 L50,65 L50,175 L60,175 L60,65 L50,65 L35,75 L20,55 L60,30Z',
    shadeRight: 'M140,30 L180,55 L165,75 L150,65 L150,175 L140,175 L140,65 L150,65 L165,75 L180,55 L140,30Z',
  },

  // ── Long Sleeve ───────────────────────────────────────────────
  LONG_SLEEVE: {
    body: 'M63,34 C72,24 85,20 100,21 C115,20 128,24 137,34 C150,40 165,50 178,65 C184,72 184,80 178,86 L162,100 C157,104 151,101 150,94 L148,180 C137,184 119,187 100,187 C81,187 63,184 52,180 L50,94 C49,101 43,104 38,100 L22,86 C16,80 16,72 22,65 C35,50 50,40 63,34 Z',
    shadeLeft:  'M63,34 C50,40 35,50 22,65 C16,72 16,80 22,86 L38,100 C43,104 49,101 50,94 L52,180 C57,182 63,184 70,185 C66,144 65,87 65,47 C64,41 63,37 63,34 Z',
    shadeRight: 'M137,34 C150,40 165,50 178,65 C184,72 184,80 178,86 L162,100 C157,104 151,101 150,94 L148,180 C143,182 137,184 130,185 C134,144 135,87 135,47 C136,41 137,37 137,34 Z',
  },

  // ── Hoodie (with sleeves + hood) ──────────────────────────────
  HOODIE: {
    body: 'M61,47 C66,23 81,12 100,12 C119,12 134,23 139,47 C154,52 170,63 183,78 C188,84 187,92 181,97 L162,112 C157,116 151,112 150,105 L149,184 C136,189 118,192 100,192 C82,192 64,189 51,184 L50,105 C49,112 43,116 38,112 L19,97 C13,92 12,84 17,78 C30,63 46,52 61,47 Z',
    shadeLeft:  'M61,47 C46,52 30,63 17,78 C12,84 13,92 19,97 L38,112 C43,116 49,112 50,105 L51,184 C57,187 65,189 73,190 C69,150 68,91 69,55 C66,53 63,50 61,47 Z',
    shadeRight: 'M139,47 C154,52 170,63 183,78 C188,84 187,92 181,97 L162,112 C157,116 151,112 150,105 L149,184 C143,187 135,189 127,190 C131,150 132,91 131,55 C134,53 137,50 139,47 Z',
    // hood opening, seam, drawstrings, and kangaroo pocket
    detail: 'M74,51 C80,35 89,28 100,28 C111,28 120,35 126,51 C118,45 109,42 100,42 C91,42 82,45 74,51 Z M100,51 L100,124 M86,58 Q86,70 82,75 M114,58 Q114,70 118,75 M76,138 C88,130 112,130 124,138 L119,162 C108,166 92,166 81,162 Z',
    detailFill: 'none',
  },

  // ── Sleeveless Hoodie (vest) ──────────────────────────────────
  HOODIE_VEST: {
    body: 'M57,48 C63,24 80,12 100,12 C120,12 137,24 143,48 C153,55 162,67 168,84 C158,91 151,102 150,118 L148,184 C136,189 118,192 100,192 C82,192 64,189 52,184 L50,118 C49,102 42,91 32,84 C38,67 47,55 57,48 Z',
    shadeLeft:  'M57,48 C47,55 38,67 32,84 C42,91 49,102 50,118 L52,184 C58,187 66,189 75,190 C71,145 70,92 72,56 C66,54 61,51 57,48 Z',
    shadeRight: 'M143,48 C153,55 162,67 168,84 C158,91 151,102 150,118 L148,184 C142,187 134,189 125,190 C129,145 130,92 128,56 C134,54 139,51 143,48 Z',
    detail: 'M74,51 C80,35 89,28 100,28 C111,28 120,35 126,51 C118,45 109,42 100,42 C91,42 82,45 74,51 Z M100,52 L100,132 M87,59 Q87,70 84,75 M113,59 Q113,70 116,75 M78,139 C90,132 110,132 122,139 L118,162 C107,166 93,166 82,162 Z M58,82 C67,92 72,104 72,120 M142,82 C133,92 128,104 128,120',
    detailFill: 'none',
  },

  // ── Socks ──────────────────────────────────────────────────────
  SOCKS: {
    viewBox: '0 0 200 200',
    body: 'M72,12 L72,118 Q72,168 116,168 Q158,168 158,126 L158,108 Q158,88 140,82 L140,12 Z',
    shadeLeft: 'M72,12 L72,118 Q72,168 116,168 Q118,168 120,167 Q90,162 90,118 L90,12 Z',
    detail: 'M72,38 L140,38',
    detailFill: 'none',
  },
};

// Returns the complete SVG string for a product type preview
export function buildProductSvg(
  type: ProductType,
  opts: {
    fill?: string;
    stroke?: string;
    size?: number;
    designContent?: string;  // inner SVG content to place on garment
  } = {}
): string {
  const { fill = '#2a2a2a', stroke = 'rgba(255,255,255,0.12)', size = 200 } = opts;
  const p = PRODUCT_PATHS[type];
  const vb = p.viewBox ?? '0 0 200 200';

  const shading = [
    p.shadeLeft  ? `<path d="${p.shadeLeft}"  fill="rgba(0,0,0,0.07)"/>` : '',
    p.shadeRight ? `<path d="${p.shadeRight}" fill="rgba(0,0,0,0.05)"/>` : '',
  ].join('');

  const detail = p.detail
    ? `<path d="${p.detail}" fill="${p.detailFill ?? 'none'}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round"/>`
    : '';

  return `<svg width="${size}" height="${size}" viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${p.body}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  ${shading}
  ${detail}
  ${opts.designContent ?? ''}
</svg>`;
}
