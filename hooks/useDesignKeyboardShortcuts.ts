'use client';
import { useEffect } from 'react';
import type { Layer } from '@/lib/studio/types';

type Options = {
  selected: string | null;
  layers: Layer[];
  undo: () => void;
  redo: () => void;
  updateLayer: (id:string, patch:Partial<Layer>) => void;
  deleteLayer: (id:string) => void;
  duplicateLayer: (id:string) => void;
  clearSelection: () => void;
  onEscape: () => void;
};

// Studio keyboard shortcuts: undo/redo, duplicate, delete, arrow nudging,
// Escape to close overlays, and screenshot/print-shortcut suppression.
export function useDesignKeyboardShortcuts(opts: Options) {
  const { selected, layers, undo, redo, updateLayer, deleteLayer, duplicateLayer, clearSelection, onEscape } = opts;
  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      const notInput=!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement);
      const key=e.key.toLowerCase();
      if(e.key==='PrintScreen'||((e.metaKey||e.ctrlKey)&&e.shiftKey&&(key==='s'||key==='4'||key==='5'))||((e.metaKey||e.ctrlKey)&&key==='p')){
        e.preventDefault();
        return;
      }
      if((e.metaKey||e.ctrlKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();undo();return;}
      if((e.metaKey||e.ctrlKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();redo();return;}
      if((e.metaKey||e.ctrlKey)&&e.key==='d'&&selected&&notInput){e.preventDefault();duplicateLayer(selected);return;}
      if((e.key==='Delete'||e.key==='Backspace')&&selected&&notInput){deleteLayer(selected);return;}
      if(e.key==='Escape'){clearSelection();onEscape();return;}
      if(selected&&notInput){
        const s=e.shiftKey?5:1;
        if(e.key==='ArrowLeft') {e.preventDefault();const l=layers.find(x=>x.id===selected);if(l)updateLayer(selected,{x:Math.max(0,l.x-s)});}
        if(e.key==='ArrowRight'){e.preventDefault();const l=layers.find(x=>x.id===selected);if(l)updateLayer(selected,{x:Math.min(100,l.x+s)});}
        if(e.key==='ArrowUp')   {e.preventDefault();const l=layers.find(x=>x.id===selected);if(l)updateLayer(selected,{y:Math.max(0,l.y-s)});}
        if(e.key==='ArrowDown') {e.preventDefault();const l=layers.find(x=>x.id===selected);if(l)updateLayer(selected,{y:Math.min(100,l.y+s)});}
      }
    }
    window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey);
  },[selected,layers]); // eslint-disable-line
}
