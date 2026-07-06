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
    body: 'M62,30 L8,70 L20,88 L50,68 L50,175 L150,175 L150,68 L180,88 L192,70 L138,30 Q120,15 100,18 Q80,15 62,30Z',
    shadeLeft:  'M62,30 L8,70 L20,88 L50,68 L50,175 L60,175 L60,68 L50,68 L20,88 L8,70 L62,30Z',
    shadeRight: 'M138,30 L192,70 L180,88 L150,68 L150,175 L140,175 L140,68 L150,68 L180,88 L192,70 L138,30Z',
  },

  // ── Hoodie (with sleeves + hood) ──────────────────────────────
  HOODIE: {
    body: 'M60,42 L8,72 L20,90 L50,72 L50,182 L150,182 L150,72 L180,90 L192,72 L140,42 Q128,8 100,10 Q72,8 60,42Z',
    shadeLeft:  'M60,42 L8,72 L20,90 L50,72 L50,182 L60,182 L60,72 L50,72 L20,90 L8,72 L60,42Z',
    shadeRight: 'M140,42 L192,72 L180,90 L150,72 L150,182 L140,182 L140,72 L150,72 L180,90 L192,72 L140,42Z',
    // center seam + drawstrings
    detail: 'M100,42 L100,120 M88,52 Q88,62 85,65 M112,52 Q112,62 115,65',
    detailFill: 'none',
  },

  // ── Sleeveless Hoodie (vest) ──────────────────────────────────
  HOODIE_VEST: {
    body: 'M48,42 L35,75 L50,70 L50,182 L150,182 L150,70 L165,75 L152,42 Q130,8 100,10 Q70,8 48,42Z',
    shadeLeft:  'M48,42 L35,75 L50,70 L50,182 L60,182 L60,70 L50,70 L35,75 L48,42Z',
    shadeRight: 'M152,42 L165,75 L150,70 L150,182 L140,182 L140,70 L150,70 L165,75 L152,42Z',
    detail: 'M100,42 L100,130 M88,54 Q88,64 85,67 M112,54 Q112,64 115,67',
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
