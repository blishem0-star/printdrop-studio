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
export type GarmentView = 'front'|'back'|'left'|'right';
export type UploadSlot = 'front'|'back'|'chest'|'leftSleeve'|'rightSleeve';
export type UploadMap = Record<UploadSlot, string | null>;
export type ImageOpacityMap = Record<UploadSlot, number>;
export type ImageFx = 'none'|'gray'|'sepia'|'invert'|'punch';
export type ImageFxMap = Record<UploadSlot, ImageFx>;
export type DesignDocument = {
  version: 1;
  productType: 'tshirt';
  colorId: string;
  colorHex: string;
  colorName: string;
  size: TShirtSize | null;
  activeView: GarmentView;
  layers: Layer[];
  uploads: UploadMap;
  imagePositions: Record<'front'|'back', ImagePos>;
  imageOpacity: ImageOpacityMap;
  imageFx: ImageFxMap;
  printArea?: { x:number; y:number; w:number; h:number };
  printBg: string | null;
  aiPrompt: string;
  aiSvg: string | null;
  updatedAt: string;
};
export type Session = { type:'guest'|'user'; customerId?:string; name:string; email?:string };
export type ActiveTool = 'templates'|'text'|'upload'|'ai'|'shapes'|'shirt'|'order';
export type DesignSlot = { id:string; name:string; savedAt:number; layers:Layer[]; colorId:string; sizeVal:TShirtSize|null; printBg:string|null; document?:DesignDocument };
