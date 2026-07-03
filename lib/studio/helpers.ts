import type { Layer } from './types';
import type { TShirtSize } from '@/lib/mockData';

// Pure design-studio helpers. Keep this file free of React and browser APIs.

const SIZE_ORDER: TShirtSize[] = ['XS','S','M','L','XL','XXL'];

// Unisex standard-fit size recommendation from height/weight. Returns null
// for out-of-range inputs so the UI can simply hide the suggestion.
export function recommendShirtSize(heightCm: number, weightKg: number): TShirtSize | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  if (heightCm < 120 || heightCm > 220 || weightKg < 35 || weightKg > 200) return null;
  const hIdx = heightCm < 160 ? 0 : heightCm < 168 ? 1 : heightCm < 176 ? 2 : heightCm < 184 ? 3 : heightCm < 192 ? 4 : 5;
  const wIdx = weightKg < 55 ? 0 : weightKg < 65 ? 1 : weightKg < 75 ? 2 : weightKg < 88 ? 3 : weightKg < 102 ? 4 : 5;
  return SIZE_ORDER[Math.min(5, Math.round((hIdx + wIdx) / 2 + 0.001))];
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function mkLayer(partial: Partial<Layer> & { type: Layer['type']; content: string; x: number; y: number }): Layer {
  return {
    fontSize: 24,
    fontFamily: 'system-ui,sans-serif',
    color: '#ffffff',
    fontWeight: 'bold',
    italic: false,
    rotation: 0,
    opacity: 1,
    letterSpacing: 0,
    strokeColor: '',
    strokeWidth: 0,
    arcAngle: 0,
    textTransform: 'none',
    shadowDx: 2,
    shadowDy: 2,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0.8)',
    glowBlur: 0,
    glowColor: '#00E5C8',
    flipH: false,
    flipV: false,
    hidden: false,
    locked: false,
    gradient: '',
    ...partial,
    id: uid(),
  };
}

export function calcArcPath(cx: number, cy: number, arcAngle: number, contentLen: number, fontSize: number): string {
  const halfW = Math.max((contentLen * fontSize * 0.55) / 2, 22);
  if (Math.abs(arcAngle) < 2) return `M ${cx - halfW},${cy} L ${cx + halfW},${cy}`;
  const bowing = (arcAngle / 80) * halfW * 0.75;
  const r = (halfW * halfW + bowing * bowing) / (2 * Math.abs(bowing));
  const sweep = arcAngle > 0 ? 0 : 1;
  return `M ${cx - halfW},${cy} A ${r},${r} 0 0,${sweep} ${cx + halfW},${cy}`;
}

export function starPoints(s: number) {
  return [...Array(10)].map((_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? s / 2 : s / 5;
    return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
}

// Ready-made templates shown inside the studio.
export const TEMPLATES = [
  {
    id: 'bold-stack',
    name: 'Bold Stack',
    cat: 'Typography',
    preview: ['YOUR', 'NAME'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: 'YOUR', x: 50, y: 32, fontSize: 30, fontFamily: '"Impact","Arial Black",sans-serif', color: c, fontWeight: 'bold', letterSpacing: 5 }),
      mkLayer({ type: 'text', content: 'NAME', x: 50, y: 56, fontSize: 38, fontFamily: '"Impact","Arial Black",sans-serif', color: '#00E5C8', fontWeight: 'bold', letterSpacing: 5 }),
      mkLayer({ type: 'text', content: 'EST. 2025', x: 50, y: 74, fontSize: 10, fontFamily: 'system-ui,sans-serif', color: c, fontWeight: 'normal', letterSpacing: 4, opacity: 0.55 }),
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Mark',
    cat: 'Minimal',
    preview: ['*', 'ORIGINAL'],
    build: (c: string) => [
      mkLayer({ type: 'gfx', content: '*', x: 50, y: 32, fontSize: 36, color: c }),
      mkLayer({ type: 'text', content: 'ORIGINAL', x: 50, y: 60, fontSize: 13, fontFamily: 'system-ui,sans-serif', color: c, fontWeight: 'bold', letterSpacing: 6, opacity: 0.9 }),
      mkLayer({ type: 'text', content: 'EST. 2025', x: 50, y: 75, fontSize: 9, fontFamily: '"Courier New",monospace', color: c, fontWeight: 'normal', letterSpacing: 3, opacity: 0.45 }),
    ],
  },
  {
    id: 'street',
    name: 'Street Style',
    cat: 'Urban',
    preview: ['NO', 'RULES'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: 'NO', x: 50, y: 35, fontSize: 42, fontFamily: '"Impact","Arial Black",sans-serif', color: c, fontWeight: 'bold', letterSpacing: 2, strokeColor: '#00E5C8', strokeWidth: 1 }),
      mkLayer({ type: 'text', content: 'RULES', x: 50, y: 60, fontSize: 32, fontFamily: '"Impact","Arial Black",sans-serif', color: '#00E5C8', fontWeight: 'bold', letterSpacing: 2 }),
      mkLayer({ type: 'text', content: 'STREET EDITION', x: 50, y: 78, fontSize: 9, color: c, opacity: 0.55, letterSpacing: 4 }),
    ],
  },
  {
    id: 'sport',
    name: 'Sport Number',
    cat: 'Sport',
    preview: ['#', '23'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: '#', x: 38, y: 45, fontSize: 20, fontFamily: '"Impact","Arial Black",sans-serif', color: c, fontWeight: 'bold', opacity: 0.5 }),
      mkLayer({ type: 'text', content: '23', x: 56, y: 58, fontSize: 52, fontFamily: '"Impact","Arial Black",sans-serif', color: c, fontWeight: 'bold', strokeColor: '#00E5C8', strokeWidth: 1.5 }),
      mkLayer({ type: 'text', content: 'CHAMPION', x: 50, y: 80, fontSize: 10, fontFamily: 'system-ui,sans-serif', color: c, fontWeight: 'bold', letterSpacing: 5 }),
    ],
  },
  {
    id: 'retro',
    name: 'Retro Vibes',
    cat: 'Vintage',
    preview: ['RETRO', 'VIBES'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: 'RETRO', x: 50, y: 38, fontSize: 28, fontFamily: '"Georgia",serif', color: c, italic: true, fontWeight: 'bold', letterSpacing: 2 }),
      mkLayer({ type: 'text', content: '------', x: 50, y: 50, fontSize: 14, color: c, opacity: 0.35, letterSpacing: 1 }),
      mkLayer({ type: 'text', content: 'VIBES', x: 50, y: 64, fontSize: 24, fontFamily: '"Georgia",serif', color: '#FFD700', italic: true, fontWeight: 'bold', letterSpacing: 2 }),
    ],
  },
  {
    id: 'minimal2',
    name: 'Love Mark',
    cat: 'Minimal',
    preview: ['LOVE'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: 'LOVE', x: 50, y: 48, fontSize: 28, color: '#FF4D1C', fontWeight: 'bold', letterSpacing: 2, opacity: 0.9 }),
      mkLayer({ type: 'text', content: 'MADE WITH CARE', x: 50, y: 75, fontSize: 9, color: c, fontWeight: 'bold', letterSpacing: 4, opacity: 0.5 }),
    ],
  },
  {
    id: 'coordinates',
    name: 'Coordinates',
    cat: 'Typography',
    preview: ['40N', '74W'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: '40 42 N', x: 50, y: 38, fontSize: 18, fontFamily: '"Courier New",monospace', color: c, letterSpacing: 2 }),
      mkLayer({ type: 'text', content: '74 00 W', x: 50, y: 56, fontSize: 18, fontFamily: '"Courier New",monospace', color: '#00E5C8', letterSpacing: 2 }),
      mkLayer({ type: 'text', content: 'NEW YORK CITY', x: 50, y: 74, fontSize: 9, color: c, fontWeight: 'normal', letterSpacing: 5, opacity: 0.4 }),
    ],
  },
  {
    id: 'crown',
    name: 'Royal',
    cat: 'Urban',
    preview: ['CROWN', 'KING'],
    build: (c: string) => [
      mkLayer({ type: 'text', content: 'CROWN', x: 50, y: 32, fontSize: 18, color: '#FFD700', fontWeight: 'bold', letterSpacing: 2 }),
      mkLayer({ type: 'text', content: 'KING', x: 50, y: 58, fontSize: 34, fontFamily: '"Impact","Arial Black",sans-serif', color: c, fontWeight: 'bold', letterSpacing: 6 }),
      mkLayer({ type: 'text', content: 'OF EVERYTHING', x: 50, y: 76, fontSize: 9, color: c, fontWeight: 'normal', letterSpacing: 4, opacity: 0.45 }),
    ],
  },
];
