'use client';
import { useEffect } from 'react';
import type { DesignDocument, DesignSlot } from '@/lib/studio/types';

type LegacyDesign = {
  layers?: unknown[];
  colorId?: string;
  sizeVal?: string;
  printBg?: string;
};

type Options = {
  hasContent: boolean;
  buildDocument: () => DesignDocument;
  restoreDocument: (doc: Partial<DesignDocument>) => void;
  onLegacyLoad: (d: LegacyDesign) => void;
  onSlotsLoad: (slots: DesignSlot[]) => void;
  /** State the auto-save should react to (layers, uploads, color, ...). */
  deps: unknown[];
};

// Auto-saves the working design to localStorage and restores it (plus saved
// design slots) on mount. Legacy pre-v1 payloads go through onLegacyLoad.
export function useStudioPersistence(opts: Options) {
  const { hasContent, buildDocument, restoreDocument, onLegacyLoad, onSlotsLoad, deps } = opts;

  // Auto-save
  useEffect(()=>{
    if(!hasContent) return;
    try{localStorage.setItem('pd_design',JSON.stringify(buildDocument()));}catch{}
  },deps); // eslint-disable-line

  // Load saved design + saved slots on mount (deferred to avoid setState cascades)
  useEffect(()=>{
    const t=setTimeout(()=>{
      try{
        const slots=localStorage.getItem('pd_design_slots');
        if(slots){const parsed=JSON.parse(slots);if(Array.isArray(parsed))onSlotsLoad(parsed);}
      }catch{}
      try{
        const raw=localStorage.getItem('pd_design'); if(!raw) return;
        const d=JSON.parse(raw);
        if(d.version===1) restoreDocument(d);
        else onLegacyLoad(d);
      }catch{}
    },0);
    return()=>clearTimeout(t);
  },[]); // eslint-disable-line react-hooks/exhaustive-deps
}
