import type { Layer } from './types';
import { TEMPLATES } from './helpers';

// Curated "Looks" - finished template + shirt color + styling combos that
// give a first-time visitor a desirable result in one click, and power the
// Shuffle restyle. Pure module: no React, no browser APIs.

export type Look = {
  id: string;
  name: string;
  templateId: string;   // TEMPLATES id
  colorId: string;      // SHIRT_COLORS id
  gradient?: string;    // GRADIENT_PRESETS key, applied to the hero text layer
  fontFamily?: string;  // override applied to all text layers
};

export const LOOKS: Look[] = [
  { id: 'holo-stack',   name: 'Holo Stack',    templateId: 'bold-stack',    colorId: 'black',    gradient: 'holo' },
  { id: 'royal-gold',   name: 'Royal Gold',    templateId: 'crown',         colorId: 'navy',     gradient: 'gold' },
  { id: 'street-fire',  name: 'Street Fire',   templateId: 'street',        colorId: 'charcoal', gradient: 'fire' },
  { id: 'coords-ice',   name: 'City Ice',      templateId: 'coordinates',   colorId: 'slate',    gradient: 'ice' },
  { id: 'retro-sunset', name: 'Retro Sunset',  templateId: 'retro',         colorId: 'sand',     gradient: 'sunset' },
  { id: 'est-classic',  name: 'Classic Est.',  templateId: 'est-arc',       colorId: 'white' },
  { id: 'gym-toxic',    name: 'Gym Toxic',     templateId: 'gym-club',      colorId: 'black',    gradient: 'toxic' },
  { id: 'coast-badge',  name: 'Coast Badge',   templateId: 'wave-badge',    colorId: 'navy' },
  { id: 'crew-party',   name: 'Party Crew',    templateId: 'birthday-crew', colorId: 'red',      gradient: 'gold' },
  { id: 'clean-mark',   name: 'Clean Mark',    templateId: 'minimal',       colorId: 'white' },
  { id: 'love-sand',    name: 'Love Note',     templateId: 'minimal2',      colorId: 'sand' },
  { id: 'game-number',  name: 'Game Number',   templateId: 'sport',         colorId: 'forest',   gradient: 'gold' },
];

function heroIndex(layers: Layer[]): number {
  let idx = -1, best = -1;
  layers.forEach((l, i) => {
    if (l.type === 'text' && l.fontSize > best) { best = l.fontSize; idx = i; }
  });
  return idx;
}

// Build the finished layer stack for a look. textColor comes from the
// chosen shirt (SHIRT_COLORS[].textColor) so contrast always holds.
export function buildLookLayers(look: Look, textColor: string): Layer[] {
  const tpl = TEMPLATES.find(t => t.id === look.templateId);
  if (!tpl) return [];
  const layers = tpl.build(textColor);
  const hero = heroIndex(layers);
  if (hero >= 0) {
    if (look.gradient) layers[hero] = { ...layers[hero], gradient: look.gradient };
    if (look.fontFamily) layers[hero] = { ...layers[hero], fontFamily: look.fontFamily };
  }
  return layers;
}

// Restyle existing layers with a look, keeping the user's words intact:
// the largest text layer takes the look's gradient, other text layers get
// the shirt-contrast color. Non-text layers are left alone.
export function restyleLayers(layers: Layer[], look: Look, textColor: string): Layer[] {
  const hero = heroIndex(layers);
  return layers.map((l, i) => {
    if (l.type !== 'text') return l;
    const patch: Partial<Layer> = { color: textColor };
    if (look.fontFamily) patch.fontFamily = look.fontFamily;
    if (i === hero) {
      patch.gradient = look.gradient ?? '';
      if (!look.gradient) patch.color = textColor;
    } else {
      patch.gradient = '';
    }
    return { ...l, ...patch };
  });
}

// Random look, never repeating the one just applied.
export function pickShuffleLook(excludeId?: string): Look {
  const pool = LOOKS.filter(l => l.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}
