import type { TShirtSize } from '@/lib/mockData';

// Design-studio domain types. Extracted from app/design/page.tsx so the
// component file holds only stateful UI logic.

export type Layer = {
  id: string;
  type: 'text'|'gfx'|'shape';
  content: string;
  x: number; y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal'|'bold';
  italic: boolean;
  rotation: number;
  opacity: number;
  letterSpacing: number;
  strokeColor: string;
  strokeWidth: number;
  arcAngle: number;
  textTransform: 'none'|'uppercase'|'lowercase';
  shadowDx: number;
  shadowDy: number;
  shadowBlur: number;
  shadowColor: string;
  glowBlur: number;
  glowColor: string;
  flipH: boolean;
  flipV: boolean;
  hidden: boolean;
  locked: boolean;
  gradient: string; // key of GRADIENT_PRESETS, '' = solid color
};

export type ImagePos = 'top'|'center'|'bottom'|'full-body'|'full-shirt';
export type UploadSlot = 'front'|'back'|'chest';
export type Session = { type:'guest'|'user'; customerId?:string; name:string; email?:string };
export type ActiveTool = 'templates'|'text'|'upload'|'ai'|'shapes'|'shirt'|'order';
export type DesignSlot = { id:string; name:string; savedAt:number; layers:Layer[]; colorId:string; sizeVal:TShirtSize|null; printBg:string|null };
