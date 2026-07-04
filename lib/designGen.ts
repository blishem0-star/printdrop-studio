// Procedural shirt-design generator. Composes real, print-ready line-art
// SVGs (200x200, currentColor) from per-category motif pools, so the catalog
// can grow automatically in whatever categories customers demand.
// When OPENAI_API_KEY arrives this module stays the fallback and QA baseline;
// an AI path can slot in behind the same generateDesign() signature.

export type GeneratedDesign = { title: string; category: string; svg: string; price: number };

// Deterministic RNG so a seed reproduces the exact same design (testable).
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T,>(r: Rng, arr: T[]) => arr[Math.floor(r() * arr.length)];
const rnd = (r: Rng, min: number, max: number) => min + r() * (max - min);
const ri = (r: Rng, min: number, max: number) => Math.round(rnd(r, min, max));

// --- Motifs: each returns SVG inner markup centered around (100,100) -------

const motifs: Record<string, ((r: Rng) => string)[]> = {
  Nature: [
    r => { // mountain range
      const peaks = ri(r, 2, 3); let out = '';
      for (let i = 0; i < peaks; i++) {
        const cx = 60 + i * ri(r, 35, 45), w = ri(r, 40, 65), h = ri(r, 55, 85), base = 145;
        out += `<polygon points="${cx},${base - h} ${cx + w / 2},${base} ${cx - w / 2},${base}" fill="none" stroke="currentColor" stroke-width="${i === 0 ? 4 : 3}"${i ? ` opacity="0.${ri(r, 4, 7)}"` : ''}/>`;
      }
      return out + `<line x1="40" y1="145" x2="160" y2="145" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>`;
    },
    r => { // waves
      let out = ''; const rows = ri(r, 2, 3);
      for (let i = 0; i < rows; i++) {
        const y = 85 + i * ri(r, 20, 26), a = ri(r, 16, 26);
        out += `<path d="M25,${y} Q47,${y - a} 70,${y} Q92,${y + a} 115,${y} Q137,${y - a} 160,${y} Q170,${y + a / 2} 175,${y}" fill="none" stroke="currentColor" stroke-width="${4 - i}" stroke-linecap="round"${i ? ` opacity="0.${8 - i * 2}"` : ''}/>`;
      }
      return out;
    },
    r => { // sun / moon over horizon
      const cx = ri(r, 80, 120), cy = ri(r, 70, 90), rad = ri(r, 22, 32);
      const rays = r() > 0.5;
      let out = `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="currentColor" stroke-width="4"/>`;
      if (rays) for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        out += `<line x1="${(cx + Math.cos(a) * (rad + 8)).toFixed(1)}" y1="${(cy + Math.sin(a) * (rad + 8)).toFixed(1)}" x2="${(cx + Math.cos(a) * (rad + 16)).toFixed(1)}" y2="${(cy + Math.sin(a) * (rad + 16)).toFixed(1)}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
      }
      return out + `<path d="M35,148 Q100,${ri(r, 132, 142)} 165,148" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.55"/>`;
    },
  ],
  Urban: [
    r => { // skyline
      let out = ''; let x = 40;
      const n = ri(r, 3, 4);
      for (let i = 0; i < n; i++) {
        const w = ri(r, 22, 34), h = ri(r, 45, 95);
        out += `<rect x="${x}" y="${145 - h}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="3.5"/>`;
        for (let wy = 145 - h + 10; wy < 137; wy += 13) out += `<line x1="${x + 5}" y1="${wy}" x2="${x + w - 5}" y2="${wy}" stroke="currentColor" stroke-width="1.8" opacity="0.5"/>`;
        x += w + ri(r, 6, 12);
      }
      return out + `<line x1="32" y1="145" x2="168" y2="145" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
    },
    r => { // arrows / motion
      const y = ri(r, 90, 110); let out = '';
      for (let i = 0; i < 3; i++) {
        const off = i * 16 - 16;
        out += `<path d="M${52 + off},${y - 24 + i * 24} L${132 + off},${y - 24 + i * 24} M${118 + off},${y - 34 + i * 24} L${132 + off},${y - 24 + i * 24} L${118 + off},${y - 14 + i * 24}" fill="none" stroke="currentColor" stroke-width="${3.5 - i * 0.5}" stroke-linecap="round" stroke-linejoin="round"${i ? ` opacity="0.${8 - i * 3}"` : ''}/>`;
      }
      return out;
    },
    r => { // bolt in frame
      const rot = ri(r, -8, 8);
      return `<g transform="rotate(${rot} 100 100)"><rect x="55" y="55" width="90" height="90" rx="10" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M108,68 L86,105 L100,105 L92,132 L118,95 L103,95 Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/></g>`;
    },
  ],
  Abstract: [
    r => { // orbiting ellipses
      const tilt = ri(r, -40, 40);
      return `<ellipse cx="100" cy="100" rx="${ri(r, 52, 68)}" ry="${ri(r, 18, 28)}" fill="none" stroke="currentColor" stroke-width="3" transform="rotate(${tilt} 100 100)"/><ellipse cx="100" cy="100" rx="${ri(r, 52, 68)}" ry="${ri(r, 18, 28)}" fill="none" stroke="currentColor" stroke-width="2.5" transform="rotate(${tilt + ri(r, 50, 80)} 100 100)" opacity="0.6"/><circle cx="100" cy="100" r="${ri(r, 12, 20)}" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="${ri(r, 130, 155)}" cy="${ri(r, 65, 85)}" r="${ri(r, 3, 6)}" fill="currentColor"/>`;
    },
    r => { // concentric polygons
      const sides = pick(r, [3, 5, 6]); let out = '';
      for (let ring = 0; ring < 3; ring++) {
        const rad = 28 + ring * 20, rot = ri(r, 0, 60);
        const pts = Array.from({ length: sides }, (_, i) => {
          const a = rot * Math.PI / 180 - Math.PI / 2 + (i * 2 * Math.PI) / sides;
          return `${(100 + Math.cos(a) * rad).toFixed(1)},${(100 + Math.sin(a) * rad).toFixed(1)}`;
        }).join(' ');
        out += `<polygon points="${pts}" fill="none" stroke="currentColor" stroke-width="${3.5 - ring}"${ring ? ` opacity="0.${8 - ring * 3}"` : ''}/>`;
      }
      return out;
    },
    r => { // scattered shards
      let out = ''; const n = ri(r, 3, 4);
      for (let i = 0; i < n; i++) {
        const cx = rnd(r, 65, 135), cy = rnd(r, 65, 135), s = rnd(r, 14, 30), rot = ri(r, 0, 90);
        out += `<rect x="${(cx - s / 2).toFixed(1)}" y="${(cy - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="${i === 0 ? 3.5 : 2.5}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"${i ? ` opacity="0.${ri(r, 4, 7)}"` : ''}/>`;
      }
      return out;
    },
  ],
  Minimal: [
    r => { // single stroke circle + dot
      const rad = ri(r, 34, 46);
      return `<circle cx="100" cy="100" r="${rad}" fill="none" stroke="currentColor" stroke-width="${pick(r, [2.5, 3.5])}"/><circle cx="${100 + pick(r, [-1, 1]) * ri(r, 12, rad - 8)}" cy="${100 + pick(r, [-1, 1]) * ri(r, 0, 18)}" r="${ri(r, 4, 7)}" fill="currentColor"/>`;
    },
    r => { // balanced lines
      let out = ''; const n = ri(r, 3, 5);
      for (let i = 0; i < n; i++) {
        const y = 70 + i * ri(r, 14, 18), w = ri(r, 40, 100);
        out += `<line x1="${100 - w / 2}" y1="${y}" x2="${100 + w / 2}" y2="${y}" stroke="currentColor" stroke-width="${i === ri(r, 0, n - 1) ? 5 : 2.5}" stroke-linecap="round"${i % 2 ? ` opacity="0.${ri(r, 4, 8)}"` : ''}/>`;
      }
      return out;
    },
    r => { // dot grid with one accent
      let out = ''; const ax = ri(r, 0, 2), ay = ri(r, 0, 2);
      for (let gx = 0; gx < 3; gx++) for (let gy = 0; gy < 3; gy++) {
        const accent = gx === ax && gy === ay;
        out += `<circle cx="${72 + gx * 28}" cy="${72 + gy * 28}" r="${accent ? 8 : 4.5}" ${accent ? 'fill="currentColor"' : `fill="currentColor" opacity="0.${ri(r, 3, 6)}"`}/>`;
      }
      return out;
    },
  ],
  Vintage: [
    r => { // badge ring with star
      const rad = ri(r, 40, 50);
      let star = '';
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 === 0 ? 16 : 7;
        star += `${(100 + Math.cos(a) * rr).toFixed(1)},${(100 + Math.sin(a) * rr).toFixed(1)} `;
      }
      return `<circle cx="100" cy="100" r="${rad}" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="100" cy="100" r="${rad - 8}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.6"/><polygon points="${star.trim()}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`;
    },
    r => { // sunset stripes in arch
      let out = `<path d="M55,135 A45,45 0 0 1 145,135 Z" fill="none" stroke="currentColor" stroke-width="4"/>`;
      for (let i = 1; i <= ri(r, 3, 4); i++) out += `<line x1="${55 + i * 6}" y1="${135 - i * 14}" x2="${145 - i * 6}" y2="${135 - i * 14}" stroke="currentColor" stroke-width="${4 - i * 0.6}" opacity="0.${9 - i * 2}"/>`;
      return out + `<line x1="45" y1="135" x2="155" y2="135" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
    },
    r => { // winged emblem
      const spokes = ri(r, 6, 8); let out = `<circle cx="100" cy="100" r="26" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="100" cy="100" r="8" fill="none" stroke="currentColor" stroke-width="3"/>`;
      for (let i = 0; i < spokes; i++) {
        const a = (i * 2 * Math.PI) / spokes;
        out += `<line x1="${(100 + Math.cos(a) * 8).toFixed(1)}" y1="${(100 + Math.sin(a) * 8).toFixed(1)}" x2="${(100 + Math.cos(a) * 26).toFixed(1)}" y2="${(100 + Math.sin(a) * 26).toFixed(1)}" stroke="currentColor" stroke-width="2.5"/>`;
      }
      return out + `<path d="M66,96 Q40,84 32,96 Q44,106 66,104 M134,96 Q160,84 168,96 Q156,106 134,104" fill="none" stroke="currentColor" stroke-width="3" opacity="0.7"/>`;
    },
  ],
};

const TITLES: Record<string, string[][]> = {
  Nature:   [['Wild', 'High', 'North', 'Golden', 'Silent'], ['Ridge', 'Tide', 'Summit', 'Horizon', 'Pines']],
  Urban:    [['Night', 'Metro', 'Steel', 'Neon', 'Concrete'], ['District', 'Motion', 'Circuit', 'Blocks', 'Signal']],
  Abstract: [['Silent', 'Prism', 'Vector', 'Phase', 'Echo'], ['Field', 'Orbit', 'Form', 'Shift', 'Array']],
  Minimal:  [['Pure', 'Single', 'Quiet', 'Bare', 'Still'], ['Mark', 'Point', 'Line', 'Balance', 'Space']],
  Vintage:  [['Classic', 'Retro', 'Heritage', 'Old-School', 'Original'], ['Emblem', 'Sunset', 'Motor', 'Badge', 'Union']],
};

export const GENERATABLE_CATEGORIES = Object.keys(motifs);

export function generateDesign(category: string, seed: number): GeneratedDesign | null {
  const pool = motifs[category];
  if (!pool) return null;
  const r = mulberry32(seed);
  const inner = pick(r, pool)(r);
  const [firsts, seconds] = TITLES[category];
  const title = `${pick(r, firsts)} ${pick(r, seconds)}`;
  const price = pick(r, [16.99, 17.99, 18.99, 19.99, 21.99]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${inner}</svg>`;
  return { title, category, svg, price };
}

/** Generate n distinct designs (unique titles) for a category. */
export function generateBatch(category: string, n: number, seedBase = Date.now()): GeneratedDesign[] {
  const out: GeneratedDesign[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < n && i < n * 12; i++) {
    const d = generateDesign(category, seedBase + i * 7919);
    if (!d) break;
    if (seen.has(d.title)) continue;
    seen.add(d.title);
    out.push(d);
  }
  return out;
}
