'use client';
import { useState, useRef, useCallback, useEffect, useMemo, Suspense } from 'react';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import { PRODUCT_BASE_PRICE, PRODUCT_TYPE_LABELS, STUDIO_PRODUCTS, buildProductSvg, type ProductType } from '@/lib/productTypes';
import { encodeDesignShare, decodeDesignShare } from '@/lib/studio/shareCode';
import { quoteOrder, type PrintSide } from '@/lib/pricing';
import { track } from '@/lib/track';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { buildDesignDocumentSvgDataUrl, submitOrder } from '@/lib/exportDesign';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLocalSession } from '@/lib/useLocalSession';
import { sanitizeSvg } from '@/lib/sanitizeSvg';
import { ShareFan } from '@/components/design/ShareFan';
import { ProductHologram } from '@/components/design/ProductHologram';
import { StudioCanvas } from '@/components/design/StudioCanvas';
import { LS, INP } from '@/components/design/studioStyles';
import { UploadPanel } from '@/components/design/panels/UploadPanel';
import { AiPanel } from '@/components/design/panels/AiPanel';
import { ShapesPanel } from '@/components/design/panels/ShapesPanel';
import { TextPanel } from '@/components/design/panels/TextPanel';
import type { ShippingFields } from '@/components/design/OrderRequestModal';
import { useDesignHistory } from '@/hooks/useDesignHistory';
import { useDesignKeyboardShortcuts } from '@/hooks/useDesignKeyboardShortcuts';
import { useStudioPersistence } from '@/hooks/useStudioPersistence';
import dynamic from 'next/dynamic';

import type { Layer, ImagePos, UploadSlot, Session, ActiveTool, DesignSlot, GarmentView, DesignDocument } from "@/lib/studio/types";
import {
  SVG_W, SVG_H, PRINT, FONTS,
  SIDE_TOOLS, GRADIENT_PRESETS,
} from "@/lib/studio/constants";
import { uid, mkLayer, TEMPLATES, recommendShirtSize } from "@/lib/studio/helpers";
import { LOOKS, buildLookLayers, restyleLayers, pickShuffleLook, type Look } from "@/lib/studio/looks";

// Checkout UI is heavy and only needed once the user finishes designing.
const OrderRequestModal = dynamic(()=>import('@/components/design/OrderRequestModal'),{ssr:false});

// Component
function DesignStudio() {
  const stored = useLocalSession();
  const session = useMemo<Session|null>(
    () => stored === undefined ? null : (stored ?? {type:'guest',name:'Guest'}),
    [stored],
  );

  const whiteColor = SHIRT_COLORS.find(c=>c.id==='white')??SHIRT_COLORS[1];
  const [color,    setColor]    = useState<TShirtColor>(whiteColor);
  const [size,     setSize]     = useState<TShirtSize|null>(null);
  const [garmentView, setGarmentView] = useState<GarmentView>('front');
  const showBack = garmentView === 'back';
  const [productType, setProductType] = useState<ProductType>('TSHIRT');
  const [printAreaOpen, setPrintAreaOpen] = useState(false);
  // Sleeve prints exist only on the t-shirt photo mockup.
  const hasSleeveViews = productType === 'TSHIRT';
  function pickProduct(pt: ProductType) {
    setProductType(pt);
    if (pt !== 'TSHIRT' && (garmentView === 'left' || garmentView === 'right')) setGarmentView('front');
  }
  const [fullscreen,setFullscreen]=useState(false);
  const [compareOpen,setCompareOpen]=useState(false);
  const [everSaved,setEverSaved]=useState(false);
  const [recentColors,setRecentColors]=useState<string[]>([]);
  function trackRecentColor(v:string){ setRecentColors(p=>[v,...p.filter(c=>c!==v)].slice(0,6)); }
  const [fitHeight,setFitHeight]=useState('');
  const [fitWeight,setFitWeight]=useState('');
  const recommendedSize=recommendShirtSize(Number(fitHeight),Number(fitWeight));
  // A share link (?d=...) or catalog remix (?remix=...) takes priority over the locally saved design.
  const [sharedCode]=useState(()=> typeof window==='undefined'?null:new URLSearchParams(window.location.search).get('d'));
  const [remixId]=useState(()=> typeof window==='undefined'?null:new URLSearchParams(window.location.search).get('remix'));

  // Layers + history for undo/redo
  const [layers,   setLayers]   = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const layersRef = useRef<Layer[]>(layers);
  useEffect(()=>{ layersRef.current=layers; },[layers]);
  const dragging = useRef<{id:string;sx:number;sy:number;ox:number;oy:number;mode:'move'|'resize'|'rotate';startFs:number;startRot:number;ccx:number;ccy:number}|null>(null);
  const printDragging = useRef<{sx:number;sy:number;x:number;y:number;w:number;h:number;mode:'move'|'resize'}|null>(null);
  const [snapGuide,setSnapGuide]=useState<{x:boolean;y:boolean}>({x:false,y:false});
  // Drag
  const justDragged=useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  const { undo, redo, setWithHistory: setLayersWithHistory } = useDesignHistory<Layer[]>([], setLayers, {
    onUndo: () => setSelected(null),
  });

  // Uploads
  const [uploads,    setUploads]    = useState<Record<UploadSlot,string|null>>({front:null,back:null,chest:null,leftSleeve:null,rightSleeve:null});
  const [uploadSlot, setUploadSlot] = useState<UploadSlot>('front');
  const [imgPos,     setImgPos]     = useState<Record<'front'|'back',ImagePos>>({front:'center',back:'center'});
  const [imgOpacity, setImgOpacity] = useState<Record<UploadSlot,number>>({front:1,back:1,chest:1,leftSleeve:1,rightSleeve:1});
  const [imgFx,      setImgFx]      = useState<Record<UploadSlot,'none'|'gray'|'sepia'|'invert'|'punch'>>({front:'none',back:'none',chest:'none',leftSleeve:'none',rightSleeve:'none'});
  const [fileDragging,setFileDragging]=useState(false);

  // AI
  const [aiPrompt,  setAiPrompt]  = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress,setAiProgress]=useState(0);
  const [aiSvg,     setAiSvg]     = useState<string|null>(null);

  // Text editor state
  const [textInput,  setTextInput]  = useState('');
  const [fontSize,   setFontSize]   = useState(20);
  const [fontFam,    setFontFam]    = useState(FONTS[0].id);
  const [textColor,  setTextColor]  = useState('#000000');
  const [fontWeight, setFontWeight] = useState<'normal'|'bold'>('bold');
  const [italic,     setItalic]     = useState(false);
  const [letterSp,   setLetterSp]   = useState(0);
  const [strokeCol,  setStrokeCol]  = useState('');
  const [strokeW,    setStrokeW]    = useState(0);
  const [layerOpacity, setLayerOpacity] = useState(1);

  // Print area background
  const [printBg, setPrintBg] = useState<string|null>(null);
  const [printArea,setPrintArea] = useState(PRINT);
  const printAreaRef = useRef(PRINT);
  useEffect(()=>{ printAreaRef.current=printArea; },[printArea]);
  const [designSlots, setDesignSlots] = useState<DesignSlot[]>([]);
  const [lastLookId, setLastLookId] = useState<string|null>(null);

  // Funnel instrumentation (G1): studio_start -> first_layer -> size_picked -> order.
  // first_layer carries a time-to-first-layer bucket; layers restored from
  // persistence within the first moments of mount are not user actions and
  // are excluded so the metric stays honest.
  const studioOpenedAt = useRef(0);
  const firstLayerTracked = useRef(false);
  const sizeTracked = useRef(false);
  useEffect(()=>{ studioOpenedAt.current=Date.now(); track('studio_start',{category:'open'}); },[]);
  useEffect(()=>{
    if(firstLayerTracked.current||layers.length===0) return;
    const elapsed=Date.now()-studioOpenedAt.current;
    firstLayerTracked.current=true;
    if(elapsed<1500) return; // restored session, not a user action
    const bucket=elapsed<10_000?'0-10s':elapsed<30_000?'10-30s':elapsed<60_000?'30-60s':elapsed<180_000?'1-3m':'3m+';
    track('first_layer',{category:bucket});
  },[layers.length]);
  useEffect(()=>{
    if(sizeTracked.current||!size) return;
    sizeTracked.current=true;
    track('size_picked',{category:size});
  },[size]);

  // Active tool + shapes tab
  // Land on ready designs so a new user always has an obvious first step.
  const [activeTool, setActiveTool] = useState<ActiveTool|null>('templates');
  const [shapesTab,  setShapesTab]  = useState<'vector'|'shapes'|'emoji'>('vector');
  function activateTool(tool: ActiveTool) {
    setActiveTool(tool);
    requestAnimationFrame(()=>panelRef.current?.scrollTo({top:0,behavior:'smooth'}));
  }

  // Text effects state (mirrors selected layer)
  const [arcAngle,      setArcAngle]      = useState(0);
  const [textTransform, setTextTransform] = useState<'none'|'uppercase'|'lowercase'>('none');
  const [showAdvancedText,setShowAdvancedText]=useState(false);
  const [collarText,setCollarText]=useState('');
  const [shadowDx,      setShadowDx]      = useState(2);
  const [shadowDy,      setShadowDy]      = useState(2);
  const [shadowBlur,    setShadowBlur]    = useState(0);
  const [shadowColor,   setShadowColor]   = useState('rgba(0,0,0,0.8)');
  const [glowBlur,      setGlowBlur]      = useState(0);
  const [glowColor,     setGlowColor]     = useState('#00E5C8');
  const [hexInput,      setHexInput]      = useState('');

  // Canvas zoom
  const [zoom, setZoom] = useState(1);
  const [previewMode,setPreviewMode]=useState<'edit'|'premium'>('edit');
  const zoomRef = useRef(1);
  useEffect(()=>{ zoomRef.current=zoom; },[zoom]);
  const canvasAreaRef   = useRef<HTMLDivElement>(null);
  const [canvasSize,setCanvasSize] = useState({w:390,h:449});
  const pinchRef = useRef<{d0:number;z0:number}|null>(null);
  // Coarse-pointer (touch) devices get larger hit targets on the canvas handles
  const [isTouch,setIsTouch] = useState(false);
  useEffect(()=>{
    const t=setTimeout(()=>setIsTouch(window.matchMedia('(pointer:coarse)').matches),0);
    return()=>clearTimeout(t);
  },[]);

  useEffect(()=>{
    const el=canvasAreaRef.current;
    if(!el) return;
    const update=()=>{
      const r=el.getBoundingClientRect();
      const reservedX=isTouch?28:80;
      const reservedY=isTouch?118:138;
      const maxW=Math.max(260,r.width-reservedX);
      const maxH=Math.max(300,r.height-reservedY);
      const fitW=Math.min(660,maxW,maxH*(SVG_W/SVG_H));
      const w=Math.round(Math.max(260,fitW));
      setCanvasSize(prev=>prev.w===w?prev:{w,h:Math.round(w*(SVG_H/SVG_W))});
    };
    update();
    const ro=new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize',update);
    return()=>{ro.disconnect();window.removeEventListener('resize',update);};
  },[isTouch]);

  // Order
  const [qty,       setQty]      = useState(1);
  const [shipName,  setShipName] = useState('');
  const [shipEmail, setShipEmail]= useState('');
  const [shipPhone, setShipPhone]= useState('');
  const [shipStreet,setShipStreet]=useState('');
  const [shipCity,  setShipCity] = useState('');
  const [shipZip,   setShipZip]  = useState('');
  const [shipState, setShipState]= useState('');
  const [shipNotes, setShipNotes]= useState('');
  const [saveShipping,setSaveShipping]=useState(true);
  const [couponCode,setCouponCode]=useState('');
  const [couponPct,setCouponPct]=useState(0);
  const [couponBusy,setCouponBusy]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [ordered,   setOrdered]  = useState(false);
  const orderedRef=useRef(false);
  useEffect(()=>{ orderedRef.current=ordered; },[ordered]);
  const [orderId,   setOrderId]  = useState<string|null>(null);
  const [orderError,setOrderError]=useState<string|null>(null);
  const [shareFanOpen,setShareFanOpen]=useState(false);
  const {show:showToast,element:toastEl}=useToast();
  const shipSetters: Record<keyof ShippingFields,(v:string)=>void> = {
    name:setShipName,email:setShipEmail,phone:setShipPhone,street:setShipStreet,
    city:setShipCity,zip:setShipZip,state:setShipState,notes:setShipNotes,
  };
  function onShipField(key:keyof ShippingFields,value:string){ shipSetters[key](value); }

  function buildDesignDocument(): DesignDocument {
    return {
      version: 1,
      productType,
      colorId: color.id,
      colorHex: color.hex,
      colorName: color.name,
      size,
      activeView: garmentView,
      layers: JSON.parse(JSON.stringify(layers)),
      uploads: {...uploads},
      imagePositions: {...imgPos},
      imageOpacity: {...imgOpacity},
      imageFx: {...imgFx},
      printArea: {...printArea},
      printBg,
      aiPrompt,
      aiSvg,
      updatedAt: new Date().toISOString(),
    };
  }

  function restoreDesignDocument(doc: Partial<DesignDocument>) {
    if (doc.productType) {
      const pt = String(doc.productType).toUpperCase();
      if ((STUDIO_PRODUCTS as string[]).includes(pt)) setProductType(pt as ProductType);
    }
    if (Array.isArray(doc.layers)) {
      setLayersWithHistory(JSON.parse(JSON.stringify(doc.layers)));
    }
    if (doc.colorId) {
      const c = SHIRT_COLORS.find(x => x.id === doc.colorId);
      if (c) { setColor(c); setTextColor(c.textColor); }
    }
    if (doc.size) setSize(doc.size);
    if (doc.activeView) setGarmentView(doc.activeView);
    if (doc.uploads) setUploads(prev => ({...prev, ...doc.uploads}));
    if (doc.imagePositions) setImgPos(prev => ({...prev, ...doc.imagePositions}));
    if (doc.imageOpacity) setImgOpacity(prev => ({...prev, ...doc.imageOpacity}));
    if (doc.imageFx) setImgFx(prev => ({...prev, ...doc.imageFx}));
    if (doc.printArea) setPrintArea(doc.printArea);
    if ('printBg' in doc) setPrintBg(doc.printBg ?? null);
    if (typeof doc.aiPrompt === 'string') setAiPrompt(doc.aiPrompt);
    if ('aiSvg' in doc) setAiSvg(doc.aiSvg ?? null);
    setSelected(null);
  }

  useEffect(()=>{
    if(!session) return;
    // deferred prefill avoids synchronous setState cascades in the effect body
    const t=setTimeout(()=>{
      if(session.name&&session.name!=='Guest') setShipName(prev=>prev||session.name);
      if(session.email) setShipEmail(prev=>prev||session.email!);
      try{ const s=localStorage.getItem('pd_shipping'); if(s){const d=JSON.parse(s);setShipPhone(prev=>prev||(d.phone??''));setShipStreet(prev=>prev||(d.street??''));setShipCity(prev=>prev||(d.city??''));setShipZip(prev=>prev||(d.zip??''));setShipState(prev=>prev||(d.state??''));setShipNotes(prev=>prev||(d.notes??''));} }catch{}
    },0);
    return()=>clearTimeout(t);
  },[session]);

  // Shirt color change also resets the text color default (handler, not effect)
  function pickColor(c:TShirtColor){ setColor(c); setTextColor(c.textColor); }

  useStudioPersistence({
    hasContent: layers.length>0 || Object.values(uploads).some(Boolean) || Boolean(aiSvg) || Boolean(printBg),
    buildDocument: buildDesignDocument,
    restoreDocument: restoreDesignDocument,
    onSlotsLoad: setDesignSlots,
    skipDesignLoad: Boolean(sharedCode||remixId),
    onSaved: ()=>setEverSaved(true),
    onLegacyLoad: (d)=>{
      if(Array.isArray(d.layers)&&d.layers.length){setLayersWithHistory(d.layers as Layer[]);}
      if(d.colorId){const c=SHIRT_COLORS.find(x=>x.id===d.colorId);if(c){setColor(c);setTextColor(c.textColor);}}
      if(d.sizeVal)setSize(d.sizeVal as typeof size);
      if(d.printBg)setPrintBg(d.printBg);
    },
    deps: [layers,uploads,imgPos,imgOpacity,imgFx,color.id,size,printBg,printArea,aiPrompt,aiSvg,garmentView,productType],
  });

  // Mouse wheel zoom
  useEffect(()=>{
    const el=canvasAreaRef.current; if(!el) return;
    const onWheel=(e:WheelEvent)=>{
      if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(z=>Math.max(0.5,Math.min(2,+(z-(e.deltaY*0.001)).toFixed(2))));}
    };
    el.addEventListener('wheel',onWheel,{passive:false});
    return()=>el.removeEventListener('wheel',onWheel);
  },[]);

  // Two-finger pinch-to-zoom on touch devices
  useEffect(()=>{
    const el=canvasAreaRef.current; if(!el) return;
    const pts=new Map<number,{x:number;y:number}>();
    const dist=()=>{ const a=[...pts.values()]; return a.length<2?0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); };
    const down=(e:PointerEvent)=>{
      if(e.pointerType!=='touch') return;
      pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===2){ dragging.current=null; pinchRef.current={d0:dist(),z0:zoomRef.current}; }
    };
    const move=(e:PointerEvent)=>{
      if(!pts.has(e.pointerId)) return;
      pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===2&&pinchRef.current){
        e.preventDefault();
        const ratio=dist()/(pinchRef.current.d0||1);
        setZoom(Math.max(0.5,Math.min(2,+(pinchRef.current.z0*ratio).toFixed(2))));
      }
    };
    const up=(e:PointerEvent)=>{ pts.delete(e.pointerId); if(pts.size<2) pinchRef.current=null; };
    el.addEventListener('pointerdown',down);
    el.addEventListener('pointermove',move,{passive:false});
    el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
    return()=>{ el.removeEventListener('pointerdown',down); el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); el.removeEventListener('pointercancel',up); };
  },[]);

  // Layer ops
  const selLayer = layers.find(l=>l.id===selected)??null;

  function fittedFontSize(content:string,type:Layer['type'],desired:number) {
    const area=printAreaRef.current;
    const maxByHeight=area.h*(type==='text'?0.28:0.46);
    const maxByWidth=type==='text'
      ? (area.w*0.9)/Math.max(1,content.length*0.58)
      : area.w*0.62;
    return Math.max(8,Math.min(desired,Math.floor(maxByHeight),Math.floor(maxByWidth)));
  }

  function autoFitLayer(layer:Layer): Layer {
    return {
      ...layer,
      x: Math.max(8,Math.min(92,layer.x)),
      y: Math.max(8,Math.min(92,layer.y)),
      fontSize: fittedFontSize(layer.content,layer.type,layer.fontSize),
    };
  }

  function addText() {
    if(!textInput.trim()) return;
    const l=autoFitLayer(mkLayer({type:'text',content:textInput,x:50,y:50,fontSize,fontFamily:fontFam,color:textColor,fontWeight,italic,letterSpacing:letterSp,strokeColor:strokeCol,strokeWidth:strokeW,opacity:layerOpacity,arcAngle,textTransform,shadowDx,shadowDy,shadowBlur,shadowColor,glowBlur,glowColor}));
    setLayersWithHistory([...layers,l]); setSelected(l.id); setTextInput('');
  }

  function addCollarText(scope:'front'|'full') {
    const content=(collarText || textInput || 'YOUR BRAND').trim();
    if(!content) return;
    setGarmentView('front');
    const l=mkLayer({
      type:'text',content,x:50,y:0,fontSize:scope==='full'?7.8:8.6,
      fontFamily:fontFam,color:textColor,fontWeight,italic,letterSpacing:scope==='full'?1.15:0.75,
      strokeColor:strokeCol,strokeWidth:strokeW,opacity:layerOpacity,
      arcAngle:0,textTransform,shadowDx,shadowDy,shadowBlur,shadowColor,glowBlur,glowColor,
      collarMode:scope,
    });
    setLayersWithHistory([...layers,l]); setSelected(l.id); setCollarText('');
  }

  // Alignment helpers
  function alignLayer(id:string, axis:'x'|'y', val:number){ updateLayer(id,{[axis]:val}); }
  function alignCenter(id:string){ updateLayer(id,{x:50,y:50}); }
  function addGfx(c:string) {
    const l=autoFitLayer(mkLayer({type:'gfx',content:c,x:50,y:45,fontSize:34,color:color.textColor,opacity:layerOpacity}));
    setLayersWithHistory([...layers,l]); setSelected(l.id);
  }
  function addChestSymbol() {
    setGarmentView('front');
    const l=mkLayer({type:'shape',content:'star',x:24,y:14,fontSize:20,color:color.textColor,opacity:1});
    setLayersWithHistory([...layers,l]); setSelected(l.id); activateTool('shapes');
  }
  function addShape(kind:string) {
    const l=autoFitLayer(mkLayer({type:'shape',content:kind,x:50,y:45,fontSize:36,color:color.textColor,opacity:layerOpacity}));
    setLayersWithHistory([...layers,l]); setSelected(l.id);
  }
  function smartFitDesign() {
    const next=layers.map(l=>l.collarMode?l:autoFitLayer(l));
    setLayersWithHistory(next);
    showToast('Design fitted to the print area.','success');
  }
  function applyStudioPreset(kind:'street'|'luxury'|'minimal'|'sport'|'vintage') {
    if(layers.length===0) {
      const starter: Record<typeof kind,string> = {
        street:'NO RULES',
        luxury:'STYLX',
        minimal:'ESSENTIAL',
        sport:'TEAM 01',
        vintage:'ORIGINAL',
      };
      const l=autoFitLayer(mkLayer({type:'text',content:starter[kind],x:50,y:44,fontSize:kind==='minimal'?24:30,fontFamily:fontFam,color:textColor,fontWeight:'bold',italic:false,letterSpacing:kind==='luxury'?4:kind==='sport'?1:2,opacity:1}));
      setLayersWithHistory([l]);
      setSelected(l.id);
    } else {
      const patch: Record<typeof kind,Partial<Layer>> = {
        street:{fontFamily:'"Impact","Arial Black",sans-serif',fontWeight:'bold',letterSpacing:1,gradient:'holo',glowBlur:3,glowColor:'#00E5C8',shadowBlur:2,shadowDx:2,shadowDy:3},
        luxury:{fontFamily:'"Playfair Display",Georgia,serif',fontWeight:'bold',letterSpacing:4,color:'#F8FAFC',gradient:'gold',glowBlur:0,shadowBlur:0,strokeWidth:0},
        minimal:{fontFamily:'system-ui,sans-serif',fontWeight:'bold',letterSpacing:2,color:color.textColor,gradient:'',glowBlur:0,shadowBlur:0,strokeWidth:0,opacity:1},
        sport:{fontFamily:'"Arial Narrow","Helvetica Neue",sans-serif',fontWeight:'bold',letterSpacing:1,color:'#ffffff',strokeColor:'#000000',strokeWidth:1.2,gradient:'',shadowBlur:1,shadowDx:2,shadowDy:2},
        vintage:{fontFamily:'"Georgia",serif',fontWeight:'bold',italic:true,letterSpacing:1,color:'#FFD700',gradient:'',opacity:0.9,shadowBlur:1,shadowDx:2,shadowDy:2},
      };
      const next=layers.map(l=>l.type==='text'?autoFitLayer({...l,...patch[kind]}):l);
      setLayersWithHistory(next);
    }
    showToast(`${kind[0].toUpperCase()+kind.slice(1)} style applied.`, 'success');
  }
  function applySmartFix(kind:'fit'|'center'|'contrast'|'premium'|'collar'|'textsize') {
    if(kind==='fit') { smartFitDesign(); return; }
    if(kind==='textsize') {
      const next=layers.map(l=>l.type==='text'&&!l.collarMode&&l.fontSize<9?{...l,fontSize:10}:l);
      setLayersWithHistory(next);
      showToast('Small text enlarged to a print-safe size.','success');
      return;
    }
    if(kind==='center') {
      if(layers.length===0) return;
      setLayersWithHistory(layers.map(l=>l.collarMode?l:{...l,x:50}));
      showToast('Design centered.', 'success');
      return;
    }
    if(kind==='contrast') {
      const next=layers.map(l=>l.type==='text'||l.type==='shape'||l.type==='gfx'?{...l,color:color.textColor,strokeColor:isLight?'#ffffff':'#000000',strokeWidth:l.type==='text'?0.8:l.strokeWidth}:l);
      setLayersWithHistory(next);
      setTextColor(color.textColor);
      showToast('Contrast improved for this shirt color.', 'success');
      return;
    }
    if(kind==='premium') { applyStudioPreset('luxury'); setPreviewMode('premium'); return; }
    if(kind==='collar') {
      setCollarText(collarText || 'STYLX');
      addCollarText('front');
      showToast('Front collar text added.', 'success');
    }
  }
  function updateLayer(id:string,patch:Partial<Layer>) {
    const next=layers.map(l=>l.id===id?{...l,...patch}:l);
    setLayersWithHistory(next);
  }
  function deleteLayer(id:string) {
    setLayersWithHistory(layers.filter(l=>l.id!==id));
    if(selected===id) setSelected(null);
  }
  function duplicateLayer(id:string) {
    const l=layers.find(x=>x.id===id); if(!l) return;
    const dup={...l,id:uid(),x:Math.min(95,l.x+5),y:Math.min(95,l.y+5)};
    setLayersWithHistory([...layers,dup]); setSelected(dup.id);
  }
  function moveLayer(id:string,dir:'up'|'down') {
    const idx=layers.findIndex(l=>l.id===id); if(idx<0) return;
    const next=[...layers];
    if(dir==='up'&&idx<next.length-1){ [next[idx],next[idx+1]]=[next[idx+1],next[idx]]; }
    if(dir==='down'&&idx>0){ [next[idx],next[idx-1]]=[next[idx-1],next[idx]]; }
    setLayersWithHistory(next);
  }
  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    const newLayers=tpl.build(color.textColor);
    setLayersWithHistory(newLayers); setSelected(null);
  }
  // Starter looks: finished template + shirt color + styling in one click.
  function applyLook(look: Look){
    const c=SHIRT_COLORS.find(x=>x.id===look.colorId)??color;
    setColor(c); setTextColor(c.textColor);
    setLayersWithHistory(buildLookLayers(look,c.textColor));
    setSelected(null); setLastLookId(look.id);
    track('studio_start',{category:'starter-look'});
    showToast(`${look.name} applied - now make it yours`,'success');
  }
  // Shuffle: restyle the current design (or apply a fresh look on an empty
  // canvas) with a random curated combo. Fully undo-safe via history.
  function shuffleLook(){
    const look=pickShuffleLook(lastLookId??undefined);
    const c=SHIRT_COLORS.find(x=>x.id===look.colorId)??color;
    setColor(c); setTextColor(c.textColor);
    const hasText=layers.some(l=>l.type==='text');
    setLayersWithHistory(hasText?restyleLayers(layers,look,c.textColor):buildLookLayers(look,c.textColor));
    setSelected(null); setLastLookId(look.id);
    showToast(`Shuffled: ${look.name}`,'success');
  }

  // My Designs (saved slots, localStorage)
  function persistSlots(next:DesignSlot[]){
    setDesignSlots(next);
    try{localStorage.setItem('pd_design_slots',JSON.stringify(next));}catch{}
  }
  function saveDesignSlot(){
    if(layers.length===0&&!Object.values(uploads).some(Boolean)&&!aiSvg&&!printBg) return;
    const name=`${layers.find(l=>l.type==='text')?.content?.slice(0,18)??'Design'} - ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const doc=buildDesignDocument();
    const slot:DesignSlot={id:uid(),name,savedAt:Date.now(),layers:doc.layers,colorId:color.id,sizeVal:size,printBg,document:doc};
    persistSlots([slot,...designSlots].slice(0,8));
    showToast('Design saved to My Designs!','success');
  }
  function loadDesignSlot(id:string){
    const s=designSlots.find(x=>x.id===id); if(!s) return;
    if(s.document) {
      restoreDesignDocument(s.document);
      showToast(`Loaded "${s.name}"`,'success');
      return;
    }
    setLayersWithHistory(JSON.parse(JSON.stringify(s.layers)));
    const c=SHIRT_COLORS.find(x=>x.id===s.colorId); if(c){setColor(c);setTextColor(c.textColor);}
    if(s.sizeVal)setSize(s.sizeVal);
    setPrintBg(s.printBg); setSelected(null);
    showToast(`Loaded "${s.name}"`,'success');
  }
  function deleteDesignSlot(id:string){
    persistSlots(designSlots.filter(x=>x.id!==id));
  }

  // Sync editor when selection changes (deferred to avoid setState cascades in effect body)
  useEffect(()=>{
    if(!selLayer||selLayer.type!=='text') return;
    const t=setTimeout(()=>{
      setFontSize(selLayer.fontSize); setFontFam(selLayer.fontFamily);
      setTextColor(selLayer.color); setFontWeight(selLayer.fontWeight);
      setItalic(selLayer.italic); setLetterSp(selLayer.letterSpacing??0);
      setStrokeCol(selLayer.strokeColor??''); setStrokeW(selLayer.strokeWidth??0);
      setLayerOpacity(selLayer.opacity??1);
      setArcAngle(selLayer.arcAngle??0);
      setTextTransform(selLayer.textTransform??'none');
      setShadowDx(selLayer.shadowDx??2); setShadowDy(selLayer.shadowDy??2);
      setShadowBlur(selLayer.shadowBlur??0); setShadowColor(selLayer.shadowColor??'rgba(0,0,0,0.8)');
      setGlowBlur(selLayer.glowBlur??0); setGlowColor(selLayer.glowColor??'#00E5C8');
      setHexInput(selLayer.color.replace('#',''));
    },0);
    return()=>clearTimeout(t);
  },[selected]); // eslint-disable-line

  // Drag
  const onLayerDown=useCallback((e:React.PointerEvent,id:string)=>{
    e.stopPropagation(); setSelected(id);
    const l=layersRef.current.find(x=>x.id===id);
    dragging.current={id,sx:e.clientX,sy:e.clientY,ox:l?.x??50,oy:l?.y??50,mode:'move',startFs:l?.fontSize??24,startRot:l?.rotation??0,ccx:0,ccy:0};
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  },[]);

  // Drag
  const onHandleDown=useCallback((e:React.PointerEvent,id:string,mode:'resize'|'rotate')=>{
    e.stopPropagation(); setSelected(id);
    const l=layersRef.current.find(x=>x.id===id);
    const r=canvasRef.current?.getBoundingClientRect();
    if(!l||!r) return;
    const area=printAreaRef.current;
    const ccx=r.x+((area.x+(l.x/100)*area.w)/SVG_W)*r.width;
    const ccy=r.y+((area.y+(l.y/100)*area.h)/SVG_H)*r.height;
    dragging.current={id,sx:e.clientX,sy:e.clientY,ox:l.x,oy:l.y,mode,startFs:l.fontSize,startRot:l.rotation,ccx,ccy};
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  },[]);

  const onPrintAreaDown=useCallback((e:React.PointerEvent,mode:'move'|'resize')=>{
    e.stopPropagation();
    printDragging.current={sx:e.clientX,sy:e.clientY,x:printAreaRef.current.x,y:printAreaRef.current.y,w:printAreaRef.current.w,h:printAreaRef.current.h,mode};
    (e.target as Element).setPointerCapture?.(e.pointerId);
  },[]);

  useEffect(()=>{
    function onMove(e:PointerEvent){
      if(printDragging.current&&canvasRef.current){
        const d=printDragging.current;
        const r=canvasRef.current.getBoundingClientRect();
        const sx=r.width/SVG_W, sy=r.height/SVG_H;
        const dx=(e.clientX-d.sx)/sx, dy=(e.clientY-d.sy)/sy;
        if(d.mode==='move'){
          const x=Math.max(42,Math.min(82,d.x+dx));
          const y=Math.max(66,Math.min(122,d.y+dy));
          setPrintArea(p=>p.x===x&&p.y===y?p:{...p,x,y});
        } else {
          const w=Math.max(46,Math.min(104,d.w+dx));
          const h=Math.max(56,Math.min(128,d.h+dy));
          setPrintArea(p=>p.w===w&&p.h===h?p:{...p,w,h});
        }
        return;
      }
      if(!dragging.current||!canvasRef.current) return;
      const d=dragging.current;

      if(d.mode==='resize'){
        const d0=Math.hypot(d.sx-d.ccx,d.sy-d.ccy)||1;
        const d1=Math.hypot(e.clientX-d.ccx,e.clientY-d.ccy);
        const fs=Math.max(6,Math.min(140,Math.round(d.startFs*(d1/d0))));
        setLayers(p=>p.map(l=>l.id===d.id?{...l,fontSize:fs}:l));
        return;
      }
      if(d.mode==='rotate'){
        const a0=Math.atan2(d.sy-d.ccy,d.sx-d.ccx);
        const a1=Math.atan2(e.clientY-d.ccy,e.clientX-d.ccx);
        let deg=Math.round(d.startRot+(a1-a0)*180/Math.PI);
        deg=((deg+180)%360+360)%360-180; // wrap to -180..180
        for(const s of [-180,-90,0,90,180]) if(Math.abs(deg-s)<5) deg=s===-180?180:s; // magnetic snap
        setLayers(p=>p.map(l=>l.id===d.id?{...l,rotation:deg}:l));
        return;
      }

      const r=canvasRef.current.getBoundingClientRect();
      const sx=r.width/SVG_W,sy=r.height/SVG_H;
      const dx=(e.clientX-d.sx)/sx,dy=(e.clientY-d.sy)/sy;
      const area=printAreaRef.current;
      let nx=Math.max(0,Math.min(100,d.ox+(dx/area.w)*100));
      let ny=Math.max(0,Math.min(100,d.oy+(dy/area.h)*100));
      // Magnetic snap to print-area center, with visual guides
      const gx=Math.abs(nx-50)<1.8, gy=Math.abs(ny-50)<1.8;
      if(gx)nx=50; if(gy)ny=50;
      setSnapGuide(p=>p.x===gx&&p.y===gy?p:{x:gx,y:gy});
      setLayers(p=>p.map(l=>l.id===d.id?{...l,x:nx,y:ny}:l));
    }
    function onUp(){if(dragging.current||printDragging.current)justDragged.current=true;dragging.current=null;printDragging.current=null;setSnapGuide(p=>p.x||p.y?{x:false,y:false}:p);}
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
    return()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
  },[]);

  useEffect(()=>{
    function h(e:BeforeUnloadEvent){if(layersRef.current.length>0&&!orderedRef.current)e.preventDefault();}
    window.addEventListener('beforeunload',h); return()=>window.removeEventListener('beforeunload',h);
  },[]);

  // Restore a design arriving via a shared link or a catalog remix, then clean the URL.
  useEffect(()=>{

    // deferred restore avoids synchronous setState cascades in the effect body
    const t=setTimeout(()=>{
      if(sharedCode){
        const doc=decodeDesignShare(sharedCode);
        if(doc){
          restoreDesignDocument(doc);
          showToast('Shared design loaded - make it yours!','success');
        }
      } else if(remixId){
        const cat=CATALOG_DESIGNS.find(d=>d.id===remixId);
        if(cat){
          setAiSvg(sanitizeSvg(cat.svg));
          setAiPrompt(cat.title);
          setGarmentView('front');
          activateTool('text');
          showToast(`"${cat.title}" loaded - add your text and make it yours!`,'success');
          track('remix',{category:cat.category,designId:cat.id});
        }
      }
      try{
        const idea=localStorage.getItem('pd_landing_prompt');
        if(idea&&!sharedCode&&!remixId){
          localStorage.removeItem('pd_landing_prompt');
          setAiPrompt(idea);
          activateTool('ai');
          showToast('Your idea is loaded - tap Find artwork to match a design.','success');
        }
      }catch{}
      window.history.replaceState({},'',window.location.pathname);
    },0);
    return()=>clearTimeout(t);
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  useDesignKeyboardShortcuts({
    selected, layers, undo, redo, updateLayer, deleteLayer, duplicateLayer,
    clearSelection: ()=>setSelected(null),
    onEscape: ()=>{setFullscreen(false);setCheckoutOpen(false);setShareFanOpen(false);setCompareOpen(false);},
  });

  // Upload
  function handleFile(file:File){
    const allowed = ['image/png','image/jpeg','image/webp'];
    if(!allowed.includes(file.type)) {
      showToast('Use PNG, JPG, or WEBP.','error');
      return;
    }
    if(file.size>180_000) {
      showToast('Image is too large. Use an optimized image under 180KB.','error');
      return;
    }
    const r=new FileReader(); r.onload=e=>setUploads(p=>({...p,[uploadSlot]:e.target?.result as string})); r.readAsDataURL(file);
  }

  //
  // Quick honest lookup: match the idea against catalog artwork.
  function generateAI(){
    if(!aiPrompt.trim()) return;
    setAiLoading(true); setAiProgress(0); setAiSvg(null);
    const iv=setInterval(()=>setAiProgress(p=>Math.min(95,p+22)),120);
    setTimeout(()=>{
      clearInterval(iv); setAiProgress(100);
      const kw=aiPrompt.toLowerCase();
      const match=CATALOG_DESIGNS.find(d=>kw.includes(d.category.toLowerCase())||kw.includes(d.title.toLowerCase().split(' ')[0]))
        ??CATALOG_DESIGNS[Math.floor(Math.random()*CATALOG_DESIGNS.length)];
      setAiSvg(sanitizeSvg(match.svg)); setAiLoading(false);
    },700);
  }

  //
  const emailValid=  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipEmail);
  const phoneValid=  shipPhone.replace(/\D/g,'').length>=7;
  const deliveryDone=shipName.trim().length>1&&emailValid&&phoneValid&&shipStreet.trim().length>3&&shipCity.trim().length>1&&/^\d{5}$/.test(shipZip)&&shipState!=='';
  const canOrder=    color&&size&&deliveryDone;
  // Extra print locations (back/sleeves) carry a per-shirt surcharge.
  const printSides: PrintSide[] = [
    ...(uploads.back?['back' as const]:[]),
    ...(hasSleeveViews&&uploads.leftSleeve?['leftSleeve' as const]:[]),
    ...(hasSleeveViews&&uploads.rightSleeve?['rightSleeve' as const]:[]),
  ];
  const quote=       quoteOrder(PRODUCT_BASE_PRICE[productType],qty,printSides,couponPct);
  const shirtPrice=  quote.subtotal;
  const total=       quote.total;

  async function applyCoupon(){
    if(!couponCode.trim()) return;
    setCouponBusy(true);
    try{
      const r=await fetch('/api/coupon?code='+encodeURIComponent(couponCode.trim()));
      const d=await r.json().catch(()=>null);
      if(d?.valid){ setCouponPct(d.pct); showToast('Coupon applied - '+d.pct+'% off!','success'); }
      else { setCouponPct(0); showToast('That code is not valid.','error'); }
    }catch{ showToast('Could not check the code.','error'); }
    finally{ setCouponBusy(false); }
  }

  async function handleOrder(){
    if(!canOrder) return;
    setSubmitting(true); setOrderError(null);
    try{
      const designDocument=buildDesignDocument();
      const svgDataUrl=buildDesignDocumentSvgDataUrl(designDocument);
      if(svgDataUrl.length>950_000) {
        setOrderError('Design is too large to save. Optimize uploaded images and try again.');
        showToast('Design is too large to save.','error');
        return;
      }
      const result=await submitOrder({
        customerName:shipName,customerEmail:shipEmail,shippingName:shipName,shippingAddr:shipStreet,
        shippingCity:shipCity,shippingZip:shipZip,shippingState:shipState,total,qty,printSides,couponCode:couponPct>0?couponCode.trim():undefined,
        notes:[shipNotes.trim(),shipPhone.trim()?`Phone: ${shipPhone.trim()}`:''].filter(Boolean).join('\n').slice(0,300)||undefined,
        design:{title:aiPrompt||'Custom Design',emoji:'Design',colorHex:color!.hex,colorName:color!.name,size:size!,productType,price:shirtPrice,svgDataUrl},
      });
      if(result.ok){
        if(saveShipping){try{localStorage.setItem('pd_shipping',JSON.stringify({phone:shipPhone,street:shipStreet,city:shipCity,zip:shipZip,state:shipState,notes:shipNotes}));}catch{}}
        setOrderId(result.id); setOrdered(true); showToast('Order request sent!','success');
        track('order',{category:'custom-studio'});
      } else { setOrderError(result.error); showToast(result.error,'error'); }
    }catch{setOrderError('Network error.');showToast('Network error.','error');}finally{setSubmitting(false);}
  }

  async function shareTo(channel:'instagram'|'facebook'|'x'|'whatsapp'){
    // Share links carry the design itself so friends open a live remix, not a blank studio.
    const shareCode = !ordered && layers.length>0
      ? encodeDesignShare({version:1,productType,colorId:color.id,size,activeView:garmentView,layers,printArea,printBg})
      : null;
    const url=typeof window==='undefined'
      ? '/design'
      : ordered && orderId
        ? `${window.location.origin}/orders/${orderId}`
        : shareCode
          ? `${window.location.origin}/design?d=${shareCode}`
          : `${window.location.origin}/design`;
    const text=ordered
      ? `I just designed a custom STYLX shirt${orderId?` #${orderId.slice(0,8).toUpperCase()}`:''}`
      : shareCode
        ? 'Check out the STYLX shirt I designed - open the link to remix it'
        : 'I am designing a custom STYLX shirt';
    const shareUrl=encodeURIComponent(url);
    const shareText=encodeURIComponent(`${text} ${url}`);
    setShareFanOpen(false);
    if(channel==='whatsapp'){
      window.open(`https://wa.me/?text=${shareText}`,'_blank','noopener,noreferrer');
      return;
    }
    if(channel==='facebook'){
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,'_blank','noopener,noreferrer');
      return;
    }
    if(channel==='x'){
      window.open(`https://twitter.com/intent/tweet?text=${shareText}`,'_blank','noopener,noreferrer');
      return;
    }
    try{
      await navigator.clipboard.writeText(`${text} ${url}`);
      showToast('Link copied. Paste it in Instagram.','success');
    }catch{
      showToast('Open Instagram and paste your design link.','success');
    }
    window.open('https://www.instagram.com/','_blank','noopener,noreferrer');
  }

  //
  const activeImg=garmentView==='back'?uploads.back:garmentView==='front'?uploads.front:null;
  const isLight=  color.id==='white'||color.id==='sand';
  const hasDesignContent = layers.length>0 || Object.values(uploads).some(Boolean) || Boolean(aiSvg) || Boolean(printBg);
  const uploadCount = Object.values(uploads).filter(Boolean).length;
  // The single next action that moves the user toward ordering - shown as the
  // primary CTA everywhere so nobody ever wonders "what now?".
  const guidedSteps = [
    {n:'1',title:'Design',desc:'Template, text, or image',done:hasDesignContent,isNext:!hasDesignContent,go:()=>activateTool('templates')},
    {n:'2',title:'Size',desc:'Pick color and size',done:Boolean(size),isNext:hasDesignContent&&!size,go:()=>activateTool('shirt')},
    {n:'3',title:'Order',desc:'Send your request',done:false,isNext:hasDesignContent&&Boolean(size),go:()=>setCheckoutOpen(true)},
  ];
  const nextStep: { label: string; sub: string; go: () => void } =
    !hasDesignContent ? { label: 'Start designing', sub: 'Pick a template or add text', go: () => activateTool('templates') }
    : !size ? { label: 'Pick your size', sub: 'One tap - then you can order', go: () => activateTool('shirt') }
    : { label: `Finish design - $${total.toFixed(2)}`, sub: 'Review and send your request', go: () => setCheckoutOpen(true) };
  const viewHasContent: Record<GarmentView, boolean> = {
    front: layers.length>0 || Boolean(uploads.front) || Boolean(uploads.chest) || Boolean(aiSvg) || Boolean(printBg),
    back: layers.length>0 || Boolean(uploads.back) || Boolean(printBg),
    left: Boolean(uploads.leftSleeve),
    right: Boolean(uploads.rightSleeve),
  };
  const viewLabels: Record<GarmentView,string> = {front:'Front',right:'Right',back:'Back',left:'Left'};
  const selectedLabel = selLayer
    ? (selLayer.type === 'text' ? selLayer.content || 'Text layer' : selLayer.type === 'shape' ? `${selLayer.content} shape` : selLayer.content)
    : 'No layer selected';
  const qualityChecks = [
    {label:'Design content', ok:hasDesignContent, fix:'text'},
    {label:'Shirt size', ok:Boolean(size), fix:'shirt'},
    {label:'Print area fit', ok:layers.every(l=>l.collarMode || (l.x>=8&&l.x<=92&&l.y>=8&&l.y<=92)), fix:'fit'},
    {label:'Strong contrast', ok:layers.length===0 || layers.some(l=>l.gradient || l.strokeWidth>0 || l.color===color.textColor || l.glowBlur>0), fix:'contrast'},
    {label:'Print-safe text size', ok:layers.every(l=>l.type!=='text' || Boolean(l.collarMode) || l.fontSize>=9), fix:'textsize'},
    {label:'Ready preview', ok:previewMode==='premium', fix:'preview'},
  ];
  const qualityScore = Math.round((qualityChecks.filter(c=>c.ok).length / qualityChecks.length) * 100);
  function fixQualityCheck(fix:string){
    if(fix==='text')activateTool('text');
    else if(fix==='shirt')activateTool('shirt');
    else if(fix==='preview')setPreviewMode('premium');
    else applySmartFix(fix as 'fit'|'contrast'|'textsize');
  }
  // Stable handler + data attribute keeps the React Compiler happy (no ref access in render)
  function onQualityFixClick(e: React.MouseEvent<HTMLButtonElement>) {
    fixQualityCheck(e.currentTarget.dataset.fix ?? '');
  }

  const renderShirtCanvas=(w:number,h:number,interactive=true,view:GarmentView=garmentView,idScope?:string)=>(
    <StudioCanvas w={w} h={h} view={view} interactive={interactive} idScope={idScope} productType={productType}
      layers={layers} selected={selected} printArea={printArea} printBg={printBg}
      uploads={uploads} imgPos={imgPos} imgOpacity={imgOpacity} imgFx={imgFx}
      aiSvg={aiSvg} color={color} isLight={isLight} isTouch={isTouch} snapGuide={snapGuide}
      onSelect={setSelected} onLayerDown={onLayerDown} onHandleDown={onHandleDown} onPrintAreaDown={onPrintAreaDown}
      onLayerDoubleClick={id=>{setSelected(id);const l=layers.find(x=>x.id===id);if(l?.type==='text')activateTool('text');}}/>
  );


  if(ordered) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#050507,#060610)',position:'relative',overflow:'hidden'}}>
      {toastEl}
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.07) 0%,transparent 60%)',top:'-15%',right:'5%',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',maxWidth:400,position:'relative',zIndex:1,padding:'0 24px'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(0,229,200,0.1)',border:'1px solid rgba(0,229,200,0.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:'0 0 40px rgba(0,229,200,0.15)'}}>
          <svg viewBox="0 0 32 32" fill="none" stroke="#00E5C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={36} height={36} aria-hidden="true"><path d="M6 16l8 8 12-14"/></svg>
        </div>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:'3rem',fontWeight:400,letterSpacing:'0.05em',marginBottom:8,lineHeight:1}}>Order Request Sent</h1>
        <p style={{color:'rgba(255,255,255,0.45)',marginBottom:4}}>{PRODUCT_TYPE_LABELS[productType]} - {color?.name} - Size {size} - Qty {qty}</p>
        {orderId&&<p style={{color:'rgba(255,255,255,0.15)',fontSize:'0.68rem',fontFamily:'monospace',marginBottom:10}}>#{orderId.slice(0,8).toUpperCase()}</p>}
        <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.62)',marginBottom:18,lineHeight:1.6}}>Track it on your <Link href="/profile" style={{color:'#00E5C8',textDecoration:'none'}}>profile</Link>.</p>
        <div ref={canvasRef} style={{height:210,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18}}>
          {renderShirtCanvas(180,207,false,garmentView)}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}>
          <div style={{position:'relative',display:'inline-flex'}}>
            <button onClick={()=>setShareFanOpen(true)} style={{padding:'0.82rem 1.35rem',borderRadius:12,border:'1px solid rgba(0,229,200,0.28)',background:'linear-gradient(135deg,rgba(0,229,200,0.14),rgba(0,153,255,0.1))',color:'#00E5C8',fontWeight:900,cursor:'pointer',boxShadow:'0 10px 30px rgba(0,229,200,0.12)'}}>Share your design</button>
            <ShareFan open={shareFanOpen} onClose={()=>setShareFanOpen(false)} onShare={shareTo}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <Link href="/catalog" style={{padding:'0.85rem 1.8rem',borderRadius:12,background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,textDecoration:'none',display:'inline-flex',alignItems:'center'}}>Browse catalog</Link>
        </div>
      </div>
    </div>
  );

  //
  return (
    <div className="studio-root" style={{height:'100vh',display:'flex',flexDirection:'column',background:'#070709',color:'white',overflow:'hidden'}}>
      {toastEl}

      {/* Fullscreen */}
      {fullscreen&&(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'radial-gradient(ellipse at 50% 38%,rgba(14,14,24,1) 0%,rgba(4,4,6,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fsIn 0.25s ease'}} onClick={()=>setFullscreen(false)}>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${hasSleeveViews?4:2},minmax(160px,1fr))`,gap:18,width:hasSleeveViews?'min(1080px,92vw)':'min(560px,92vw)',alignItems:'end'}}>
            {((hasSleeveViews?['front','right','back','left']:['front','back']) as GarmentView[]).map(v=>(
              <button key={v} onClick={e=>{e.stopPropagation();setGarmentView(v);}} style={{border:'1px solid rgba(255,255,255,0.08)',background:garmentView===v?'rgba(0,229,200,0.06)':'rgba(255,255,255,0.025)',borderRadius:14,padding:'12px 10px 10px',cursor:'pointer',color:'#fff',filter:'drop-shadow(0 34px 70px rgba(0,0,0,0.55))'}}>
                <div style={{height:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {renderShirtCanvas(240,276,false,v,`fs-${v}`)}
                </div>
                <div style={{fontSize:'0.62rem',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:garmentView===v?'#00E5C8':'rgba(255,255,255,0.42)'}}>{v}</div>
              </button>
            ))}
          </div>
          <p style={{marginTop:24,color:'rgba(255,255,255,0.62)',fontSize:'0.65rem',letterSpacing:'0.14em',textTransform:'uppercase'}}>360 product preview</p>
          <button onClick={e=>{e.stopPropagation();setFullscreen(false);}} style={{position:'absolute',top:24,right:28,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 20px',color:'rgba(255,255,255,0.5)',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'}}>Close</button>
        </div>
      )}

      {/* Compare the current design across every shirt color */}
      {compareOpen&&(
        <div style={{position:'fixed',inset:0,zIndex:9500,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(16px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,animation:'fsIn 0.2s ease'}} onClick={()=>setCompareOpen(false)}>
          <div style={{fontSize:'0.72rem',fontWeight:950,color:'#00E5C8',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:16}}>Pick the color that sells your design</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(140px,1fr))',gap:12,width:'min(920px,94vw)',maxHeight:'78vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            {SHIRT_COLORS.map(c=>(
              <button key={c.id} onClick={()=>{pickColor(c);setCompareOpen(false);showToast(`${c.name} selected.`,'success');}}
                style={{border:`1px solid ${color.id===c.id?'rgba(0,229,200,0.45)':'rgba(255,255,255,0.08)'}`,background:color.id===c.id?'rgba(0,229,200,0.06)':'rgba(255,255,255,0.025)',borderRadius:14,padding:'10px 8px 9px',cursor:'pointer',color:'#fff'}}>
                <div style={{height:150,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <StudioCanvas w={126} h={145} view={garmentView} interactive={false} idScope={`cmp-${c.id}`} productType={productType}
                    layers={layers} selected={null} printArea={printArea} printBg={printBg}
                    uploads={uploads} imgPos={imgPos} imgOpacity={imgOpacity} imgFx={imgFx}
                    aiSvg={aiSvg} color={c} isLight={c.id==='white'||c.id==='sand'} isTouch={false} snapGuide={{x:false,y:false}}/>
                </div>
                <div style={{fontSize:'0.62rem',fontWeight:900,marginTop:4,color:color.id===c.id?'#00E5C8':'rgba(255,255,255,0.66)'}}>{c.name}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>setCompareOpen(false)} style={{marginTop:18,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 20px',color:'rgba(255,255,255,0.5)',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'}}>Close</button>
        </div>
      )}

      {checkoutOpen&&(
        <OrderRequestModal
          onClose={()=>setCheckoutOpen(false)}
          preview={renderShirtCanvas(250,288,false,garmentView)}
          color={color} size={size} qty={qty} setQty={setQty}
          productLabel={PRODUCT_TYPE_LABELS[productType]}
          layersCount={layers.length} uploadCount={uploadCount} total={total} quote={quote}
          qualityScore={qualityScore} hasDesignContent={hasDesignContent}
          sidesSummary={Object.entries(viewHasContent).filter(([,v])=>v).map(([k])=>viewLabels[k as GarmentView]).join(', ')}
          fields={{name:shipName,email:shipEmail,phone:shipPhone,street:shipStreet,city:shipCity,zip:shipZip,state:shipState,notes:shipNotes}}
          onField={onShipField}
          couponCode={couponCode} couponPct={couponPct} couponBusy={couponBusy}
          onCouponChange={v=>{setCouponCode(v);setCouponPct(0);}} onApplyCoupon={applyCoupon}
          saveShipping={saveShipping} setSaveShipping={setSaveShipping}
          orderError={orderError} submitting={submitting} canOrder={Boolean(canOrder)} onSubmit={handleOrder}/>
      )}

      {/* Section */}
      <header style={{height:50,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 16px 0 12px',gap:12,background:'rgba(7,7,9,0.98)',backdropFilter:'blur(24px)',position:'relative',zIndex:20}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(0,229,200,0.55) 35%,rgba(0,153,255,0.35) 65%,transparent)'}}/>
        <Link href="/" style={{color:'rgba(255,255,255,0.62)',fontSize:'0.67rem',textDecoration:'none',fontWeight:700,letterSpacing:'0.06em',transition:'color 0.15s',textTransform:'uppercase',flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.65)')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.28)')}>Back home</Link>
        <div style={{width:1,height:14,background:'rgba(255,255,255,0.08)',flexShrink:0}}/>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontWeight:400,fontSize:'1.42rem',letterSpacing:'0.1em',lineHeight:1,margin:0,flex:1}}>DESIGN<span style={{color:'#00E5C8'}}>.</span>STUDIO</h1>


        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',fontSize:'0.62rem',fontWeight:700,color:'rgba(255,255,255,0.66)',cursor:'pointer'}} onClick={()=>activateTool('shirt')}>{PRODUCT_TYPE_LABELS[productType]}</div>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 9px 3px 5px',borderRadius:20,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',cursor:'pointer'}} onClick={()=>activateTool('shirt')}>
            <span style={{width:14,height:14,borderRadius:'50%',background:color.hex,display:'inline-block',outline:'1px solid rgba(255,255,255,0.15)',outlineOffset:1,flexShrink:0}}/>
            <span style={{fontSize:'0.62rem',fontWeight:600,color:'rgba(255,255,255,0.66)'}}>{color.name}</span>
          </div>
          {size?<div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(0,229,200,0.22)',background:'rgba(0,229,200,0.07)',fontSize:'0.62rem',fontWeight:700,color:'#00E5C8',cursor:'pointer'}} onClick={()=>activateTool('shirt')}>{size}</div>
            :<div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)',fontSize:'0.62rem',fontWeight:600,color:'rgba(255,255,255,0.62)',cursor:'pointer'}} onClick={()=>activateTool('shirt')}>+ Size</div>}
          {layers.length>0&&<div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(0,229,200,0.16)',background:'rgba(0,229,200,0.05)',fontSize:'0.6rem',fontWeight:700,color:'rgba(0,229,200,0.7)'}}>{layers.length}L</div>}
          {everSaved&&<div title='Your design is saved on this device' style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:20,border:'1px solid rgba(16,185,129,0.2)',background:'rgba(16,185,129,0.06)',fontSize:'0.6rem',fontWeight:700,color:'rgba(52,211,153,0.85)'}}><svg viewBox='0 0 12 12' width='9' height='9' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M2 6.5l2.5 2.5L10 3'/></svg>Saved</div>}
        </div>

      </header>

      {/* Section */}
      <div className="studio-commerce-bar" style={{height:52,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',background:'linear-gradient(90deg,rgba(0,229,200,0.055),rgba(6,6,9,0.98) 28%,rgba(0,153,255,0.045))',display:'grid',gridTemplateColumns:'auto 1fr auto',alignItems:'center',gap:12,padding:'0 14px',position:'relative',zIndex:13}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:'0.58rem',fontWeight:900,color:'#00E5C8',letterSpacing:'0.14em',textTransform:'uppercase'}}>Your custom shirt</div>
          <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.72)',fontWeight:900,marginTop:2,whiteSpace:'nowrap'}}>${shirtPrice.toFixed(2)}<span style={{color:'rgba(255,255,255,0.38)',fontWeight:700,fontSize:'0.6rem'}}> + ${SHIPPING_PRICE.toFixed(2)} shipping{qty>1?` - qty ${qty}`:''}</span></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,minWidth:0,overflow:'hidden'}}>
          {[
            'No payment now - request first, pay after approval',
            'Printed on demand',
            'Soft premium cotton tees',
          ].map(t=>(
            <span key={t} style={{padding:'5px 10px',borderRadius:999,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.025)',color:'rgba(255,255,255,0.5)',fontSize:'0.6rem',fontWeight:800,whiteSpace:'nowrap'}}>{t}</span>
          ))}
        </div>
        <div style={{fontSize:'0.6rem',fontWeight:800,color:'rgba(255,255,255,0.35)',whiteSpace:'nowrap'}} title={nextStep.sub}>{nextStep.sub}</div>
      </div>

      <main className="studio-shell" style={{flex:1,display:'grid',gridTemplateColumns:'280px minmax(420px,1fr) 390px',overflow:'hidden',minHeight:0}}>

        {/* Section */}
        <div className="studio-rail" style={{background:'rgba(5,5,8,1)',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',alignItems:'stretch',padding:'12px',gap:7,zIndex:10,overflowY:'auto'}}>
          {SIDE_TOOLS.map(t=>(
            <button key={t.id} title={t.label} onClick={()=>activateTool(t.id)}
              style={{width:'100%',minHeight:68,borderRadius:12,border:'none',cursor:'pointer',background:activeTool===t.id?'rgba(0,229,200,0.12)':'transparent',color:activeTool===t.id?'#00E5C8':'rgba(255,255,255,0.72)',display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:14,padding:'10px 12px',transition:'all 0.15s',position:'relative'}}
              onMouseEnter={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='rgba(255,255,255,0.06)');(e.currentTarget.style.color='rgba(255,255,255,0.82)');}}}
              onMouseLeave={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='transparent');(e.currentTarget.style.color='rgba(255,255,255,0.72)');}}}
            >
              {activeTool===t.id&&<div style={{position:'absolute',left:0,top:'22%',bottom:'22%',width:2,borderRadius:'0 2px 2px 0',background:'#00E5C8'}}/>}
              <span style={{width:34,textAlign:'center',fontSize:t.id==='text'?'1.18rem':'1rem',fontWeight:950,lineHeight:1}}>{t.icon}</span>
              <span style={{minWidth:0}}>
                <span style={{display:'block',fontSize:'0.98rem',fontWeight:950,letterSpacing:'0.01em'}}>{t.label}</span>
                <span style={{display:'block',fontSize:'0.76rem',fontWeight:750,color:'rgba(255,255,255,0.58)',marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.hint}</span>
              </span>
            </button>
          ))}
          <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'6px 0'}}/>
          {([
            {id:'shirt' as ActiveTool, label:'Color & size', hint:'Pick the shirt details', svgPath:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true"><path d="M3 3C2 4 1 5 1 6l2 1c0 3.5-.2 6-.2 8h10.4c0-2-.2-4.5-.2-8L15 6c0-1-1-2-2-3l-2 .8Q8 2,8 2Q8 2,7 2.8z"/></svg>},
          ]).map(t=>(
            <button key={t.id} title={t.label} onClick={()=>activateTool(t.id)}
              style={{width:'100%',minHeight:68,borderRadius:12,border:'none',cursor:'pointer',background:activeTool===t.id?'rgba(0,229,200,0.12)':'transparent',color:activeTool===t.id?'#00E5C8':'rgba(255,255,255,0.72)',display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:14,padding:'10px 12px',transition:'all 0.15s',position:'relative'}}
              onMouseEnter={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='rgba(255,255,255,0.06)');(e.currentTarget.style.color='rgba(255,255,255,0.82)');}}}
              onMouseLeave={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='transparent');(e.currentTarget.style.color='rgba(255,255,255,0.72)');}}}
            >
              {activeTool===t.id&&<div style={{position:'absolute',left:0,top:'22%',bottom:'22%',width:2,borderRadius:'0 2px 2px 0',background:'#00E5C8'}}/>}
              <span style={{width:34,lineHeight:1,display:'flex',justifyContent:'center'}}>{t.svgPath}</span>
              <span style={{minWidth:0}}>
                <span style={{display:'block',fontSize:'0.98rem',fontWeight:950,letterSpacing:'0.01em'}}>{t.label}</span>
                <span style={{display:'block',fontSize:'0.76rem',fontWeight:750,color:'rgba(255,255,255,0.58)',marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Section */}
        <div className="studio-canvas" ref={canvasAreaRef} style={{background:'radial-gradient(ellipse at 50% 35%,rgba(13,13,22,1) 0%,rgba(5,5,8,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}} onClick={()=>{if(justDragged.current){justDragged.current=false;return;}setSelected(null);}}>
          <div style={{position:'absolute',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.04) 0%,transparent 60%)',top:'-20%',right:'-5%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',width:360,height:360,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,255,0.03) 0%,transparent 65%)',bottom:'-10%',left:'-5%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.018,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
          {[['Top','Left'],['Top','Right'],['Bottom','Left'],['Bottom','Right']].map(([v,h],i)=>(
            <div key={i} style={{position:'absolute',...(v==='Top'?{top:14}:{bottom:12}),...(h==='Left'?{left:14}:{right:14}),width:18,height:18,borderTop:v==='Top'?'1px solid rgba(0,229,200,0.18)':'none',borderBottom:v==='Bottom'?'1px solid rgba(0,229,200,0.18)':'none',borderLeft:h==='Left'?'1px solid rgba(0,229,200,0.18)':'none',borderRight:h==='Right'?'1px solid rgba(0,229,200,0.18)':'none',pointerEvents:'none'}}/>
          ))}

          {/* Always-visible garment switcher - picking a product never needs digging in panels */}
          <div className="studio-product-switch" onClick={e=>e.stopPropagation()} style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',display:'flex',gap:2,background:'rgba(4,4,7,0.88)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:3,backdropFilter:'blur(14px)',zIndex:5,boxShadow:'0 8px 30px rgba(0,0,0,0.4)',maxWidth:'calc(100% - 24px)',overflowX:'auto'}}>
            {STUDIO_PRODUCTS.map(pt=>(
              <button key={pt} aria-pressed={productType===pt} title={`${PRODUCT_TYPE_LABELS[pt]} - $${PRODUCT_BASE_PRICE[pt].toFixed(2)}`} onClick={()=>pickProduct(pt)}
                style={{padding:'5px 11px 5px 7px',borderRadius:10,border:'none',background:productType===pt?'linear-gradient(135deg,rgba(0,229,200,0.16),rgba(0,153,255,0.08))':'transparent',color:productType===pt?'#00E5C8':'rgba(255,255,255,0.52)',fontSize:'0.66rem',fontWeight:850,letterSpacing:'0.03em',cursor:'pointer',transition:'all 0.13s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:7,boxShadow:productType===pt?'0 0 20px rgba(0,229,200,0.12), inset 0 1px 0 rgba(255,255,255,0.08)':'none'}}>
                <ProductHologram type={pt} active={productType===pt} colorHex={productType===pt?color.hex:'#f3f4f6'} size={34}/>
                <span style={{display:'grid',gap:1,textAlign:'left'}}>
                  <span>{PRODUCT_TYPE_LABELS[pt]}</span>
                  {productType===pt&&<span style={{fontSize:'0.58rem',fontWeight:800,color:'rgba(0,229,200,0.72)'}}>${PRODUCT_BASE_PRICE[pt].toFixed(2)}</span>}
                </span>
              </button>
            ))}
          </div>

          <button className="studio-fullscreen-btn" onClick={e=>{e.stopPropagation();setFullscreen(true);}} style={{position:'absolute',top:14,right:14,background:'rgba(5,5,8,0.9)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:11,padding:'5px 13px',color:'rgba(255,255,255,0.35)',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',backdropFilter:'blur(14px)',letterSpacing:'0.06em',transition:'all 0.15s',zIndex:5}}
            onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.1)');(e.currentTarget.style.color='#00E5C8');}}
            onMouseLeave={e=>{(e.currentTarget.style.background='rgba(5,5,8,0.9)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');}}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" width={10} height={10} style={{display:'inline-block',verticalAlign:'middle',marginRight:4}} aria-hidden="true"><path d="M1 4V2a1 1 0 011-1h2M8 1h2a1 1 0 011 1v2M11 8v2a1 1 0 01-1 1H8M4 11H2a1 1 0 01-1-1V8"/></svg>FULLSCREEN
          </button>

          {/* Shirt */}
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',flex:1,width:'100%'}}>
            <div style={{position:'absolute',width:380,height:420,borderRadius:'50%',background:`radial-gradient(ellipse,${color.hex}0c 0%,transparent 60%)`,pointerEvents:'none',filter:'blur(24px)'}}/>
            <div ref={canvasRef} role="img" aria-label="Shirt design canvas"
              style={{position:'relative',filter:`drop-shadow(0 45px 90px rgba(0,0,0,0.55))`,animation:'shirtIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',zIndex:2,transform:`scale(${zoom})`,transformOrigin:'center center',transition:'transform 0.15s',touchAction:'none'}}>
              {renderShirtCanvas(canvasSize.w,canvasSize.h,previewMode==='edit')}
            </div>
            {previewMode==='premium'&&(
              <div style={{position:'absolute',top:22,left:'50%',transform:'translateX(-50%)',zIndex:4,padding:'8px 13px',borderRadius:999,border:'1px solid rgba(0,229,200,0.24)',background:'rgba(4,4,7,0.74)',backdropFilter:'blur(14px)',color:'#00E5C8',fontSize:'0.62rem',fontWeight:950,letterSpacing:'0.12em',textTransform:'uppercase',boxShadow:'0 16px 48px rgba(0,0,0,0.35)'}}>Premium product preview</div>
            )}

            {/* Selection bar with alignment tools */}
            {selLayer&&previewMode==='edit'&&(
              <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',background:'rgba(4,4,7,0.96)',border:'1px solid rgba(0,229,200,0.25)',borderRadius:13,padding:'7px 12px',display:'flex',alignItems:'center',gap:7,backdropFilter:'blur(16px)',animation:'fadeUp 0.15s ease',whiteSpace:'nowrap',zIndex:6,boxShadow:'0 4px 24px rgba(0,0,0,0.5)'}}>
                <span style={{color:'rgba(255,255,255,0.62)',fontSize:'0.53rem',letterSpacing:'0.1em'}}>SELECTED</span>
                <span style={{fontWeight:700,color:'#00E5C8',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',fontSize:'0.7rem'}}>{selLayer.content}</span>
                <div style={{width:1,height:14,background:'rgba(255,255,255,0.1)'}}/>
                {/* Alignment */}
                {([['Center','Center','c',0],['Left','Left','x',15],['Right','Right','x',85],['Top','Top','y',15],['Bottom','Bottom','y',85]] as [string,string,'c'|'x'|'y',number][]).map(([icon,label,axis,val])=>(
                  <button key={label} title={label} onClick={e=>{e.stopPropagation();if(axis==='c')alignCenter(selLayer.id);else alignLayer(selLayer.id,axis,val);}} style={{minWidth:42,height:24,padding:'0 6px',borderRadius:5,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.45)',fontSize:'0.56rem',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.12s'}}
                    onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.12)');(e.currentTarget.style.color='#00E5C8');(e.currentTarget.style.borderColor='rgba(0,229,200,0.3)');}}
                    onMouseLeave={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.04)');(e.currentTarget.style.color='rgba(255,255,255,0.45)');(e.currentTarget.style.borderColor='rgba(255,255,255,0.1)');}}>
                    {icon}
                  </button>
                ))}
                <div style={{width:1,height:14,background:'rgba(255,255,255,0.1)'}}/>
                <button title="Flip horizontal" aria-pressed={selLayer.flipH} onClick={e=>{e.stopPropagation();updateLayer(selLayer.id,{flipH:!selLayer.flipH});}} style={{background:selLayer.flipH?'rgba(0,229,200,0.14)':'rgba(255,255,255,0.04)',border:`1px solid ${selLayer.flipH?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.1)'}`,borderRadius:6,padding:'3px 7px',color:selLayer.flipH?'#00E5C8':'rgba(255,255,255,0.45)',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>Flip H</button>
                <button title="Flip vertical" aria-pressed={selLayer.flipV} onClick={e=>{e.stopPropagation();updateLayer(selLayer.id,{flipV:!selLayer.flipV});}} style={{background:selLayer.flipV?'rgba(0,229,200,0.14)':'rgba(255,255,255,0.04)',border:`1px solid ${selLayer.flipV?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.1)'}`,borderRadius:6,padding:'3px 7px',color:selLayer.flipV?'#00E5C8':'rgba(255,255,255,0.45)',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>Flip V</button>
                <div style={{width:1,height:14,background:'rgba(255,255,255,0.1)'}}/>
                <button title="Duplicate (Ctrl+D)" onClick={e=>{e.stopPropagation();duplicateLayer(selLayer.id);}} style={{background:'rgba(0,229,200,0.08)',border:'1px solid rgba(0,229,200,0.18)',borderRadius:6,padding:'3px 7px',color:'#00E5C8',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>Copy</button>
                <button onClick={e=>{e.stopPropagation();deleteLayer(selLayer.id);}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,padding:'3px 7px',color:'#f87171',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>Del</button>
              </div>
            )}

            {/* Zoom controls */}
            <div className="studio-zoom" style={{position:'absolute',bottom:8,right:12,display:'flex',gap:4,background:'rgba(4,4,7,0.85)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:3,backdropFilter:'blur(12px)',zIndex:5}}>
              {([
                {label:'-', aria:'Zoom out', action:()=>setZoom(z=>Math.max(0.5,+(z-0.1).toFixed(1))), compact:true},
                {label:`${Math.round(zoom*100)}%`, aria:'Reset zoom', action:()=>setZoom(1), compact:false},
                {label:'+', aria:'Zoom in', action:()=>setZoom(z=>Math.min(2,+(z+0.1).toFixed(1))), compact:true},
              ] as {label:string;aria:string;action:()=>void;compact:boolean}[]).map(item=>(
                <button key={item.aria} aria-label={item.aria} onClick={e=>{e.stopPropagation();item.action();}} style={{width:item.compact?(isTouch?38:26):(isTouch?52:42),height:isTouch?38:26,borderRadius:7,border:'none',background:'transparent',color:'rgba(255,255,255,0.45)',fontSize:isTouch?'0.85rem':'0.68rem',fontWeight:700,cursor:'pointer',transition:'all 0.12s'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.08)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  {item.label}
                </button>
              ))}
            </div>

            {previewMode==='edit'&&layers.length===0&&!activeImg&&!aiSvg&&!showBack&&!printBg&&(
              <div className="studio-quickstart" onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:8,textAlign:'center',animation:'fadeUp 0.5s ease 0.4s both',zIndex:5,maxWidth:'92%'}}>
                <div style={{display:'flex',gap:7,justifyContent:'center',flexWrap:'wrap'}}>
                  {([['Pick a starter look','templates'],['Add your text','text']] as [string,ActiveTool][]).map(([label,tool])=>(
                    <button key={tool} onClick={()=>activateTool(tool)} style={{padding:'8px 13px',borderRadius:999,border:'1px solid rgba(0,229,200,0.22)',background:'rgba(0,229,200,0.06)',color:'#00E5C8',fontSize:'0.66rem',fontWeight:900,letterSpacing:'0.05em',cursor:'pointer',backdropFilter:'blur(10px)'}}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="canvas-action-bar" onClick={e=>e.stopPropagation()} style={{width:'min(760px,calc(100% - 28px))',display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexWrap:'wrap',padding:'9px 10px',borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(5,5,8,0.82)',backdropFilter:'blur(14px)',borderRadius:'12px 12px 0 0',zIndex:9}}>
            <button onClick={undo} style={{padding:'9px 12px',borderRadius:9,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.035)',color:'rgba(255,255,255,0.7)',fontSize:'0.78rem',fontWeight:800,cursor:'pointer'}}>Undo</button>
            <button onClick={redo} style={{padding:'9px 12px',borderRadius:9,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.035)',color:'rgba(255,255,255,0.7)',fontSize:'0.78rem',fontWeight:800,cursor:'pointer'}}>Redo</button>
            <span title={'Shortcuts: Ctrl+Z undo | Ctrl+Y redo | Ctrl+D duplicate | Del delete | Arrows nudge (Shift = x5) | Double-click text to edit | Esc close'} style={{width:26,height:26,borderRadius:8,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.4)',fontSize:'0.72rem',fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'help'}}>?</span>
            {layers.some(l=>!l.collarMode)&&<button onClick={smartFitDesign} style={{padding:'9px 12px',borderRadius:9,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.045)',color:'rgba(255,255,255,0.78)',fontSize:'0.78rem',fontWeight:900,cursor:'pointer'}}>Smart fit</button>}
            <button onClick={shuffleLook} title="Restyle with a random curated look - undo anytime" style={{padding:'9px 12px',borderRadius:9,border:'1px solid rgba(123,97,255,0.3)',background:'rgba(123,97,255,0.08)',color:'#a794ff',fontSize:'0.78rem',fontWeight:900,cursor:'pointer'}}>Shuffle</button>
            <div style={{position:'relative',display:'inline-flex'}}>
              <button aria-haspopup="menu" onClick={()=>setShareFanOpen(true)} style={{padding:'9px 13px',borderRadius:9,border:'1px solid rgba(0,229,200,0.2)',background:'rgba(0,229,200,0.06)',color:'#00E5C8',fontSize:'0.78rem',fontWeight:900,cursor:'pointer'}}>Share</button>
              <ShareFan open={shareFanOpen} onClose={()=>setShareFanOpen(false)} onShare={shareTo}/>
            </div>
            <button onClick={nextStep.go} title={nextStep.sub} style={{padding:'10px 16px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontSize:'0.82rem',fontWeight:950,cursor:'pointer',boxShadow:'0 8px 28px rgba(0,229,200,0.24)'}}>{nextStep.label}</button>
          </div>

          <div className="studio-bottom-tray" style={{width:'100%',minHeight:118,flexShrink:0,borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(5,5,8,0.92)',backdropFilter:'blur(16px)',display:'grid',gridTemplateColumns:'300px minmax(260px,1fr)',gap:10,padding:'10px 12px',position:'relative',zIndex:8}}>
            <div style={{border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,background:'rgba(255,255,255,0.02)',padding:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:'0.54rem',fontWeight:900,color:'rgba(255,255,255,0.42)',letterSpacing:'0.12em',textTransform:'uppercase'}}>Garment sides</div>
                <div style={{fontSize:'0.52rem',fontWeight:900,color:'rgba(255,255,255,0.26)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{viewLabels[garmentView]}</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:`repeat(${hasSleeveViews?4:2},1fr)`,gap:5}}>
                {((hasSleeveViews?['front','back','left','right']:['front','back']) as GarmentView[]).map(v=>{
                  const slot:UploadSlot = v==='front'?'front':v==='back'?'back':v==='left'?'leftSleeve':'rightSleeve';
                  return (
                    <button key={v} onClick={()=>{setGarmentView(v);setUploadSlot(slot);}} aria-pressed={garmentView===v}
                      style={{minWidth:0,padding:'8px 6px',borderRadius:9,border:`1px solid ${garmentView===v?'rgba(0,229,200,0.36)':'rgba(255,255,255,0.07)'}`,background:garmentView===v?'rgba(0,229,200,0.09)':'rgba(255,255,255,0.02)',color:garmentView===v?'#00E5C8':'rgba(255,255,255,0.44)',cursor:'pointer',textAlign:'center'}}>
                      <span style={{display:'block',fontSize:'0.56rem',fontWeight:900,letterSpacing:'0.06em',textTransform:'uppercase'}}>{viewLabels[v]}</span>
                      <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:viewHasContent[v]?'#10B981':'rgba(255,255,255,0.18)',boxShadow:viewHasContent[v]?'0 0 8px rgba(16,185,129,0.8)':'none',marginTop:5}}/>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,background:'rgba(255,255,255,0.02)',padding:10,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:'0.54rem',fontWeight:900,color:'rgba(255,255,255,0.42)',letterSpacing:'0.12em',textTransform:'uppercase'}}>Layer timeline</div>
                <button disabled={layers.length===0} onClick={()=>setSelected(null)} style={{border:'none',background:'transparent',color:layers.length?'rgba(255,255,255,0.32)':'rgba(255,255,255,0.14)',fontSize:'0.55rem',fontWeight:900,cursor:layers.length?'pointer':'default',letterSpacing:'0.06em',textTransform:'uppercase'}}>Clear</button>
              </div>
              {layers.length===0 ? (
                <div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.28)',fontWeight:700,padding:'10px 0'}}>Add text, an image, or a shape to build the layer stack.</div>
              ) : (
                <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>
                  {[...layers].reverse().map(l=>(
                    <div key={l.id} onClick={()=>setSelected(l.id)} style={{minWidth:190,maxWidth:220,padding:'7px 8px',borderRadius:9,border:`1px solid ${selected===l.id?'rgba(0,229,200,0.28)':'rgba(255,255,255,0.07)'}`,background:selected===l.id?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.025)',color:selected===l.id?'#00E5C8':'rgba(255,255,255,0.52)',cursor:'pointer',textAlign:'left'}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <span style={{width:18,height:18,borderRadius:5,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',color:selected===l.id?'#00E5C8':'rgba(255,255,255,0.5)',fontSize:'0.58rem',fontWeight:900,flexShrink:0}}>{l.type==='text'?'T':l.type==='shape'?'S':'G'}</span>
                        <span style={{flex:1,minWidth:0}}>
                          <span style={{display:'block',fontSize:'0.56rem',fontWeight:900,letterSpacing:'0.08em',textTransform:'uppercase'}}>{l.type}</span>
                          <span style={{display:'block',fontSize:'0.65rem',fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{l.content}</span>
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:4,marginTop:7}}>
                        <button title={l.hidden?'Show':'Hide'} onClick={e=>{e.stopPropagation();updateLayer(l.id,{hidden:!l.hidden});}} style={{height:22,borderRadius:6,border:'1px solid rgba(255,255,255,0.07)',background:l.hidden?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.48)',cursor:'pointer',fontSize:'0.55rem',fontWeight:900}}>{l.hidden?'Off':'On'}</button>
                        <button title={l.locked?'Unlock':'Lock'} onClick={e=>{e.stopPropagation();updateLayer(l.id,{locked:!l.locked});}} style={{height:22,borderRadius:6,border:`1px solid ${l.locked?'rgba(0,229,200,0.28)':'rgba(255,255,255,0.07)'}`,background:l.locked?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.03)',color:l.locked?'#00E5C8':'rgba(255,255,255,0.48)',cursor:'pointer',fontSize:'0.55rem',fontWeight:900}}>{l.locked?'L':'U'}</button>
                        <button title="Move up" onClick={e=>{e.stopPropagation();moveLayer(l.id,'up');}} style={{height:22,borderRadius:6,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.58)',cursor:'pointer',fontSize:'0.55rem',fontWeight:900}}>Up</button>
                        <button title="Move down" onClick={e=>{e.stopPropagation();moveLayer(l.id,'down');}} style={{height:22,borderRadius:6,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.58)',cursor:'pointer',fontSize:'0.55rem',fontWeight:900}}>Dn</button>
                        <button title="Duplicate" onClick={e=>{e.stopPropagation();duplicateLayer(l.id);}} style={{height:22,borderRadius:6,border:'1px solid rgba(0,229,200,0.2)',background:'rgba(0,229,200,0.06)',color:'#00E5C8',cursor:'pointer',fontSize:'0.55rem',fontWeight:900}}>Copy</button>
                        <button title="Delete" onClick={e=>{e.stopPropagation();deleteLayer(l.id);}} style={{height:22,borderRadius:6,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.06)',color:'#f87171',cursor:'pointer',fontSize:'0.55rem',fontWeight:900}}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="studio-properties" style={{borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',background:'linear-gradient(180deg,rgba(10,10,15,1),rgba(6,6,9,1))',overflow:'hidden'}}>
          <div style={{height:50,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 16px',gap:6}}>
            <span style={{fontSize:'0.78rem',fontWeight:900,color:'rgba(255,255,255,0.72)',letterSpacing:'0.06em',textTransform:'uppercase',flex:1}}>
              {!activeTool&&'CHOOSE A STARTING POINT'}
              {activeTool==='templates'&&'READY DESIGNS'}
              {activeTool==='text'&&'ADD TEXT'}
              {activeTool==='upload'&&'UPLOAD IMAGE'}
              {activeTool==='ai'&&'ART IDEAS'}
              {activeTool==='shapes'&&'ICONS & SHAPES'}
              {activeTool==='shirt'&&'COLOR & SIZE'}
              {activeTool==='order'&&'CHECKOUT'}
            </span>
            {activeTool==='text'&&layers.length>0&&<span style={{fontSize:'0.56rem',color:'rgba(255,255,255,0.62)',background:'rgba(255,255,255,0.04)',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(255,255,255,0.06)'}}>{layers.length} layers</span>}
            {activeTool==='order'&&canOrder&&<span style={{fontSize:'0.56rem',color:'rgba(0,229,200,0.7)',fontWeight:700}}>ready</span>}
          </div>

          <div ref={panelRef} style={{flex:1,overflowY:'auto',minHeight:0}}>
            <div style={{padding:'12px 14px 0'}}>
              {/* Power tools appear once there is something to improve - first-time users go straight to templates */}
              {hasDesignContent&&(
              <div style={{border:'1px solid rgba(0,229,200,0.14)',background:'linear-gradient(145deg,rgba(0,229,200,0.055),rgba(255,255,255,0.018))',borderRadius:12,padding:12,marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:'0.72rem',fontWeight:950,color:'#00E5C8',letterSpacing:'0.12em',textTransform:'uppercase'}}>Studio control center</div>
                    <div style={{fontSize:'0.66rem',fontWeight:750,color:'rgba(255,255,255,0.48)',marginTop:3}}>Start, improve, preview, and finish from one place.</div>
                  </div>
                  <button onClick={()=>setPreviewMode(p=>p==='premium'?'edit':'premium')} aria-pressed={previewMode==='premium'}
                    style={{padding:'8px 10px',borderRadius:9,border:`1px solid ${previewMode==='premium'?'rgba(0,229,200,0.42)':'rgba(255,255,255,0.1)'}`,background:previewMode==='premium'?'rgba(0,229,200,0.12)':'rgba(255,255,255,0.035)',color:previewMode==='premium'?'#00E5C8':'rgba(255,255,255,0.72)',fontSize:'0.62rem',fontWeight:950,cursor:'pointer',whiteSpace:'nowrap'}}>Premium preview</button>
                </div>

                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
                  {(['street','luxury','minimal','sport','vintage'] as const).map(p=>(
                    <button key={p} onClick={()=>applyStudioPreset(p)}
                      style={{padding:'6px 12px',borderRadius:999,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.7)',fontSize:'0.62rem',fontWeight:900,cursor:'pointer',textTransform:'capitalize'}}>
                      {p}
                    </button>
                  ))}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'46px 1fr',gap:10,alignItems:'center'}}>
                  <div style={{height:42,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:qualityScore>=80?'rgba(0,229,200,0.11)':'rgba(245,158,11,0.09)',border:`1px solid ${qualityScore>=80?'rgba(0,229,200,0.28)':'rgba(245,158,11,0.2)'}`,color:qualityScore>=80?'#00E5C8':'#fbbf24',fontSize:'0.78rem',fontWeight:950}}>{qualityScore}</div>
                  <div style={{display:'grid',gap:5}}>
                    <div style={{height:4,borderRadius:999,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${qualityScore}%`,background:qualityScore>=80?'linear-gradient(90deg,#00E5C8,#0099FF)':'linear-gradient(90deg,#f59e0b,#00E5C8)',borderRadius:999}}/>
                    </div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      {qualityChecks.every(c=>c.ok)?(
                        <span style={{fontSize:'0.56rem',fontWeight:850,color:'rgba(0,229,200,0.75)'}}>All checks passed - ready to print</span>
                      ):qualityChecks.filter(c=>!c.ok).map(c=>(
                        <button key={c.label} data-fix={c.fix} onClick={onQualityFixClick}
                          style={{padding:'3px 8px',borderRadius:999,border:'1px solid rgba(245,158,11,0.18)',background:'rgba(245,158,11,0.055)',color:'rgba(251,191,36,0.82)',fontSize:'0.52rem',fontWeight:850,cursor:'pointer'}}>
                          Fix {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:12}}>
                {/* eslint-disable-next-line react-hooks/refs -- go() touches panelRef only inside onClick, never during render */}
                {guidedSteps.map(({n,title,desc,done,isNext,go})=>{
                  return (
                    <button key={n} onClick={go}
                      style={{minHeight:62,borderRadius:10,border:`1px solid ${done?'rgba(16,185,129,0.3)':isNext?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.07)'}`,background:done?'rgba(16,185,129,0.06)':isNext?'rgba(0,229,200,0.07)':'rgba(255,255,255,0.025)',color:'rgba(255,255,255,0.68)',cursor:'pointer',padding:'8px 7px',textAlign:'left',position:'relative'}}>
                      <span style={{display:'inline-flex',width:18,height:18,borderRadius:6,alignItems:'center',justifyContent:'center',background:done?'rgba(16,185,129,0.16)':'rgba(0,229,200,0.08)',color:done?'#10B981':'#00E5C8',fontSize:'0.58rem',fontWeight:950,marginBottom:5}}>{done?'OK':n}</span>
                      <span style={{display:'block',fontSize:'0.7rem',fontWeight:950,color:done?'#34d399':isNext?'#00E5C8':'rgba(255,255,255,0.68)'}}>{title}</span>
                      <span style={{display:'block',fontSize:'0.58rem',fontWeight:700,color:'rgba(255,255,255,0.38)',marginTop:2,lineHeight:1.25}}>{done?'Done':desc}</span>
                      {isNext&&<span style={{position:'absolute',top:7,right:8,fontSize:'0.46rem',fontWeight:950,color:'#00E5C8',letterSpacing:'0.08em'}}>NEXT</span>}
                    </button>
                  );
                })}
              </div>

              {!selLayer&&(
                <div style={{padding:'10px 12px',borderRadius:12,border:'1px dashed rgba(255,255,255,0.12)',fontSize:'0.7rem',lineHeight:1.5,color:'rgba(255,255,255,0.42)',marginBottom:12}}>Tap any text, shape, or icon on the shirt to edit it here.</div>
              )}
              {selLayer&&(
              <div style={{border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)',borderRadius:12,overflow:'hidden',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'9px 11px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:'0.72rem',fontWeight:900,color:'rgba(255,255,255,0.54)',letterSpacing:'0.06em'}}>Selected object</div>
                    <div style={{fontSize:'0.88rem',fontWeight:900,color:selLayer?'rgba(255,255,255,0.86)':'rgba(255,255,255,0.42)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:3}}>{selectedLabel}</div>
                  </div>
                  {selLayer&&(
                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                      <button title="Duplicate layer" onClick={()=>duplicateLayer(selLayer.id)} style={{width:28,height:28,borderRadius:7,border:'1px solid rgba(0,229,200,0.22)',background:'rgba(0,229,200,0.07)',color:'#00E5C8',cursor:'pointer',fontWeight:900}}>+</button>
                      <button title="Delete layer" onClick={()=>deleteLayer(selLayer.id)} style={{width:28,height:28,borderRadius:7,border:'1px solid rgba(239,68,68,0.22)',background:'rgba(239,68,68,0.07)',color:'#f87171',cursor:'pointer',fontWeight:900}}>x</button>
                    </div>
                  )}
                </div>
                {selLayer?(
                  <div style={{padding:'10px 11px'}}>
                    {selLayer.type==='text'&&(
                      <label style={{display:'block',fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.42)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:9}}>Edit text
                        <input value={selLayer.content} maxLength={40}
                          onChange={e=>updateLayer(selLayer.id,{content:e.target.value})}
                          style={{...INP,marginTop:4,fontSize:'0.85rem',fontFamily:selLayer.fontFamily,fontWeight:selLayer.fontWeight==='bold'?'bold':'normal'}}/>
                      </label>
                    )}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:9}}>
                      <label style={{fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.42)',letterSpacing:'0.08em',textTransform:'uppercase'}}>X
                        <input value={Math.round(selLayer.x)} onChange={e=>updateLayer(selLayer.id,{x:Math.max(0,Math.min(100,+e.target.value||0))})} type="number" min={0} max={100} style={{...INP,marginTop:4,padding:'7px 8px',fontSize:'0.72rem'}}/>
                      </label>
                      <label style={{fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.42)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Y
                        <input value={Math.round(selLayer.y)} onChange={e=>updateLayer(selLayer.id,{y:Math.max(0,Math.min(100,+e.target.value||0))})} type="number" min={0} max={100} style={{...INP,marginTop:4,padding:'7px 8px',fontSize:'0.72rem'}}/>
                      </label>
                    </div>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Scale</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{selLayer.fontSize}px</span></div>
                    <input type="range" min={6} max={140} value={selLayer.fontSize} onChange={e=>updateLayer(selLayer.id,{fontSize:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Opacity</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{Math.round((selLayer.opacity??1)*100)}%</span></div>
                    <input type="range" min={0.1} max={1} step={0.05} value={selLayer.opacity??1} onChange={e=>updateLayer(selLayer.id,{opacity:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                    <div style={{...LS,display:'flex',justifyContent:'space-between',marginTop:9}}><span>Rotation</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{selLayer.rotation}deg</span></div>
                    <input type="range" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5,marginTop:10}}>
                      {([['Center','c',0],['Left','x',15],['Right','x',85],['Top','y',15],['Bottom','y',85]] as [string,'c'|'x'|'y',number][]).map(([label,axis,val])=>(
                        <button key={label} onClick={()=>axis==='c'?alignCenter(selLayer.id):alignLayer(selLayer.id,axis,val)} style={{padding:'6px 3px',borderRadius:7,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.54)',fontSize:'0.55rem',fontWeight:800,cursor:'pointer'}}>{label}</button>
                      ))}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,marginTop:8}}>
                      {([
                        ['Hide', {hidden:!selLayer.hidden}],
                        ['Lock', {locked:!selLayer.locked}],
                        ['Flip H', {flipH:!selLayer.flipH}],
                        ['Flip V', {flipV:!selLayer.flipV}],
                      ] as [string,Partial<Layer>][]).map(([label,patch])=>(
                        <button key={label} onClick={()=>updateLayer(selLayer.id,patch)} style={{padding:'6px 3px',borderRadius:7,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.54)',fontSize:'0.55rem',fontWeight:800,cursor:'pointer'}}>{label}</button>
                      ))}
                    </div>
                  </div>
                ):null}
              </div>
              )}
            </div>

              {hasDesignContent&&(
              <div style={{border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)',borderRadius:12,overflow:'hidden',marginBottom:12}}>
                <div role="button" tabIndex={0} aria-expanded={printAreaOpen} onClick={()=>setPrintAreaOpen(v=>!v)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setPrintAreaOpen(v=>!v);}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'10px 12px',borderBottom:printAreaOpen?'1px solid rgba(255,255,255,0.06)':'none',cursor:'pointer'}}>
                  <div>
                    <div style={{fontSize:'0.7rem',fontWeight:900,color:'rgba(255,255,255,0.72)',letterSpacing:'0.06em'}}>Print area</div>
                    <div style={{fontSize:'0.64rem',fontWeight:700,color:'rgba(255,255,255,0.36)',marginTop:3}}>{printAreaOpen?'Drag the dashed box on the shirt or fine tune it here.':'Drag the dashed box on the shirt, or open to fine tune.'}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {printAreaOpen&&<button onClick={e=>{e.stopPropagation();setPrintArea(PRINT);}} style={{padding:'6px 9px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.58)',fontSize:'0.68rem',fontWeight:800,cursor:'pointer'}}>Reset</button>}
                    <span aria-hidden="true" style={{color:'rgba(255,255,255,0.4)',fontSize:'0.62rem',transform:printAreaOpen?'rotate(180deg)':'none',transition:'transform 0.15s'}}>▾</span>
                  </div>
                </div>
                {printAreaOpen&&<div style={{padding:'11px 12px',display:'grid',gap:9}}>
                  {([
                    ['X','x',42,82],['Y','y',66,122],['Width','w',46,104],['Height','h',56,128],
                  ] as [string,'x'|'y'|'w'|'h',number,number][]).map(([label,key,min,max])=>(
                    <label key={key} style={{display:'grid',gridTemplateColumns:'58px 1fr 42px',alignItems:'center',gap:8,fontSize:'0.68rem',fontWeight:800,color:'rgba(255,255,255,0.52)'}}>
                      <span>{label}</span>
                      <input type="range" min={min} max={max} value={Math.round(printArea[key])} onChange={e=>setPrintArea(p=>({...p,[key]:+e.target.value}))} style={{width:'100%',accentColor:'#00E5C8'}}/>
                      <span style={{textAlign:'right',color:'#00E5C8'}}>{Math.round(printArea[key])}</span>
                    </label>
                  ))}
                </div>}
              </div>
              )}

            {/* Section */}
            {activeTool==='templates'&&(
              <div style={{padding:'14px 14px 0'}}>
                {/* Section */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:'0.57rem',fontWeight:700,color:'rgba(255,255,255,0.62)',letterSpacing:'0.12em',textTransform:'uppercase'}}>My Designs</span>
                    <button disabled={!hasDesignContent} onClick={saveDesignSlot}
                      style={{padding:'4px 11px',borderRadius:999,border:`1px solid ${hasDesignContent?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.08)'}`,background:hasDesignContent?'rgba(0,229,200,0.08)':'transparent',color:hasDesignContent?'#00E5C8':'rgba(255,255,255,0.2)',fontSize:'0.6rem',fontWeight:700,cursor:hasDesignContent?'pointer':'default'}}>
                      + Save current
                    </button>
                  </div>
                  {designSlots.length===0?(
                    <div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.62)',padding:'8px 0'}}>Designs you save appear here.</div>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {designSlots.map(s=>(
                        <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'0.7rem',fontWeight:700,color:'rgba(255,255,255,0.75)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                            <div style={{fontSize:'0.55rem',color:'rgba(255,255,255,0.62)'}}>{s.layers.length} layers - {new Date(s.savedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                          </div>
                          <button onClick={()=>loadDesignSlot(s.id)} style={{padding:'4px 10px',borderRadius:7,border:'1px solid rgba(0,229,200,0.3)',background:'rgba(0,229,200,0.08)',color:'#00E5C8',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>Load</button>
                          <button aria-label={`Delete ${s.name}`} onClick={()=>deleteDesignSlot(s.id)} style={{width:20,height:20,borderRadius:6,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.06)',color:'#f87171',fontSize:'0.62rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>x</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Starter looks - finished designs, one click to apply */}
                <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.62)',marginBottom:10,lineHeight:1.5}}>Pick a finished look - shirt color and styling included - then make it yours.</div>
                <div className="starter-looks" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:8}}>
                  {LOOKS.map(look=>{
                    const tpl=TEMPLATES.find(t=>t.id===look.templateId);
                    const lc=SHIRT_COLORS.find(c=>c.id===look.colorId);
                    if(!tpl||!lc) return null;
                    const grad=look.gradient?GRADIENT_PRESETS[look.gradient]:null;
                    return (
                      <button key={look.id} onClick={()=>{applyLook(look);activateTool('text');}} aria-label={`Apply look ${look.name}`}
                        style={{padding:'8px 4px 7px',borderRadius:11,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,transition:'all 0.15s'}}
                        onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.06)');(e.currentTarget.style.borderColor='rgba(0,229,200,0.25)');}}
                        onMouseLeave={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.02)');(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)');}}>
                        <span style={{position:'relative',width:52,height:52,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span aria-hidden="true" dangerouslySetInnerHTML={{__html:buildProductSvg('TSHIRT',{fill:lc.hex,size:52})}}/>
                          <span aria-hidden="true" style={{position:'absolute',top:'54%',left:'50%',transform:'translate(-50%,-50%)',display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1,pointerEvents:'none'}}>
                            {tpl.preview.slice(0,2).map((p,i)=>(
                              <span key={i} style={{fontSize:p.length<=2?'0.62rem':'0.4rem',fontWeight:900,fontFamily:'"Impact","Arial Black",sans-serif',letterSpacing:'0.02em',
                                ...(i===0&&grad?{background:`linear-gradient(135deg,${grad.stops.join(',')})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}:{color:lc.textColor,opacity:i===0?0.95:0.6})}}>{p}</span>
                            ))}
                          </span>
                        </span>
                        <span style={{fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.7)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%'}}>{look.name}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={shuffleLook} style={{width:'100%',padding:'9px',borderRadius:10,border:'1px solid rgba(123,97,255,0.3)',background:'rgba(123,97,255,0.07)',color:'#a794ff',fontSize:'0.68rem',fontWeight:800,cursor:'pointer',letterSpacing:'0.04em',marginBottom:14}}>
                  Shuffle - surprise me
                </button>
                <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.62)',marginBottom:12,lineHeight:1.5}}>Or start from a plain template:</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                  {TEMPLATES.map(tpl=>(
                    <button key={tpl.id} onClick={()=>{applyTemplate(tpl);activateTool('text');}}
                      style={{width:'100%',padding:'11px 13px',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)',cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'all 0.15s',textAlign:'left'}}
                      onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.06)');(e.currentTarget.style.borderColor='rgba(0,229,200,0.25)');}}
                      onMouseLeave={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.02)');(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)');}}>
                      {/* Mini preview */}
                      <div style={{width:44,height:50,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,flexShrink:0,overflow:'hidden',padding:2}}>
                        {tpl.preview.map((p,i)=>(
                          <span key={i} style={{fontSize:p.length===1?'1.1rem':'0.45rem',lineHeight:1.1,color:'rgba(255,255,255,0.7)',fontWeight:700,fontFamily:i===0&&p.length>1?'"Impact",sans-serif':'inherit',letterSpacing:p.length>2?'0.04em':'0'}}>{p}</span>
                        ))}
                      </div>
                      <div>
                        <div style={{fontSize:'0.78rem',fontWeight:700,color:'rgba(255,255,255,0.85)',marginBottom:2}}>{tpl.name}</div>
                        <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.62)'}}>{tpl.cat} - {tpl.build('').length} layers</div>
                      </div>
                      <span style={{marginLeft:'auto',fontSize:'0.65rem',color:'rgba(255,255,255,0.62)'}}>Use</span>
                    </button>
                  ))}
                </div>
                <button onClick={()=>{setLayersWithHistory([]);setSelected(null);}} style={{width:'100%',padding:'9px',borderRadius:10,border:'1px solid rgba(255,255,255,0.07)',background:'transparent',color:'rgba(255,255,255,0.62)',fontSize:'0.65rem',fontWeight:600,cursor:'pointer',letterSpacing:'0.04em',transition:'all 0.15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.22)')}>
                  Start from scratch
                </button>
                <div style={{height:16}}/>
              </div>
            )}

            {/* TEXT */}
            {activeTool==='text'&&(
              <TextPanel {...{textInput,setTextInput,addText,collarText,setCollarText,addCollarText,fontFam,setFontFam,fontSize,setFontSize,fontWeight,setFontWeight,italic,setItalic,letterSp,setLetterSp,textColor,setTextColor,hexInput,setHexInput,recentColors,trackRecentColor,strokeCol,setStrokeCol,strokeW,setStrokeW,layerOpacity,setLayerOpacity,textTransform,setTextTransform,arcAngle,setArcAngle,showAdvancedText,setShowAdvancedText,shadowDx,setShadowDx,shadowDy,setShadowDy,shadowBlur,setShadowBlur,shadowColor,setShadowColor,glowBlur,setGlowBlur,glowColor,setGlowColor,selected,selLayer,updateLayer}}/>
            )}

            {/* UPLOAD */}
            {activeTool==='upload'&&(
              <UploadPanel uploadSlot={uploadSlot} setUploadSlot={setUploadSlot} setGarmentView={setGarmentView}
                uploads={uploads} removeUpload={slot=>setUploads(prev=>({...prev,[slot]:null}))}
                imgPos={imgPos} setImgPos={setImgPos} imgOpacity={imgOpacity} setImgOpacity={setImgOpacity}
                imgFx={imgFx} setImgFx={setImgFx} fileDragging={fileDragging}
                setFileDragging={setFileDragging} handleFile={handleFile}/>
            )}

            {/* AI */}
            {activeTool==='ai'&&(
              <AiPanel aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} aiLoading={aiLoading}
                aiProgress={aiProgress} aiSvg={aiSvg} clearAiSvg={()=>setAiSvg(null)} generate={generateAI}/>
            )}

            {/* SHAPES */}
            {activeTool==='shapes'&&(
              <ShapesPanel shapesTab={shapesTab} setShapesTab={setShapesTab} addShape={addShape}
                addGfx={addGfx} selLayer={selLayer} updateLayer={updateLayer}
                printBg={printBg} setPrintBg={setPrintBg} addChestSymbol={addChestSymbol}/>
            )}

            {/* SHIRT */}
            {activeTool==='shirt'&&(
              <div style={{padding:'14px'}}>
                <div style={{marginBottom:18}}>
                  <div style={LS}>Product <span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:600,fontSize:'0.72rem'}}>{PRODUCT_TYPE_LABELS[productType]} - ${PRODUCT_BASE_PRICE[productType].toFixed(2)}</span></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                    {STUDIO_PRODUCTS.map(pt=>(
                      <button key={pt} aria-pressed={productType===pt} onClick={()=>pickProduct(pt)}
                        style={{minHeight:102,padding:'10px 9px',borderRadius:13,border:`2px solid ${productType===pt?'#00E5C8':'rgba(255,255,255,0.07)'}`,background:productType===pt?'linear-gradient(145deg,rgba(0,229,200,0.1),rgba(0,153,255,0.035))':'rgba(255,255,255,0.02)',cursor:'pointer',textAlign:'left',transition:'all 0.15s',display:'grid',gridTemplateColumns:'52px 1fr',alignItems:'center',gap:9,boxShadow:productType===pt?'0 16px 38px rgba(0,229,200,0.1), inset 0 1px 0 rgba(255,255,255,0.08)':'none'}}>
                        <ProductHologram type={pt} active={productType===pt} colorHex={productType===pt?color.hex:'#f5f5f5'} size={52}/>
                        <span>
                          <span style={{display:'block',fontSize:'0.68rem',fontWeight:950,color:productType===pt?'#00E5C8':'rgba(255,255,255,0.68)',lineHeight:1.18}}>{PRODUCT_TYPE_LABELS[pt]}</span>
                          <span style={{display:'block',fontSize:'0.6rem',fontWeight:800,color:productType===pt?'rgba(0,229,200,0.72)':'rgba(255,255,255,0.34)',marginTop:4}}>${PRODUCT_BASE_PRICE[pt].toFixed(2)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {!hasSleeveViews&&<p style={{fontSize:'0.56rem',color:'rgba(255,255,255,0.35)',marginTop:7,lineHeight:1.5}}>Front and back printing on this garment. Sleeve printing is available on the t-shirt.</p>}
                </div>
                <div style={{marginBottom:18}}>
                  <div style={LS}>Color <span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:600,fontSize:'0.72rem'}}>{color.name}</span></div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:7}}>
                    {SHIRT_COLORS.map(c=>(
                      <button key={c.id} title={c.name} aria-pressed={color.id===c.id} onClick={()=>pickColor(c)}
                        style={{aspectRatio:'1',borderRadius:11,border:`2px solid ${color.id===c.id?'#00E5C8':'rgba(255,255,255,0.06)'}`,background:c.hex,cursor:'pointer',transition:'all 0.15s',transform:color.id===c.id?'scale(1.06)':'scale(1)',boxShadow:color.id===c.id?`0 0 20px ${c.hex}55,inset 0 1px 0 rgba(255,255,255,0.15)`:`inset 0 1px 0 rgba(255,255,255,0.12)`,display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:4,position:'relative'}}>
                        {color.id===c.id&&<span style={{fontSize:'0.55rem',fontWeight:700,color:c.textColor,opacity:0.7}}>OK</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
                    {SHIRT_COLORS.map(c=>(
                      <div key={c.id} onClick={()=>pickColor(c)} style={{textAlign:'center',fontSize:'0.5rem',color:color.id===c.id?'rgba(0,229,200,0.85)':'rgba(255,255,255,0.2)',fontWeight:color.id===c.id?700:400,cursor:'pointer',lineHeight:1.3}}>{c.name.split(' ').slice(-1)[0]}</div>
                    ))}
                  </div>
                  <button onClick={()=>setCompareOpen(true)} disabled={layers.length===0&&!printBg}
                    style={{width:'100%',marginTop:9,padding:'9px 10px',borderRadius:10,border:'1px solid rgba(0,229,200,0.2)',background:layers.length>0||printBg?'rgba(0,229,200,0.06)':'rgba(255,255,255,0.02)',color:layers.length>0||printBg?'#00E5C8':'rgba(255,255,255,0.25)',fontSize:'0.7rem',fontWeight:900,cursor:layers.length>0||printBg?'pointer':'default'}}>
                    Compare your design on all colors
                  </button>
                </div>
                <div>
                  <div style={LS}>Size {size&&<span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:600,fontSize:'0.72rem'}}> - {size}</span>}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                    {SHIRT_SIZES.map(s=>(
                      <button key={s} aria-pressed={size===s} onClick={()=>setSize(s)}
                        style={{width:50,height:50,borderRadius:12,cursor:'pointer',border:`2px solid ${size===s?'#00E5C8':'rgba(255,255,255,0.08)'}`,background:size===s?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.02)',color:size===s?'#00E5C8':'rgba(255,255,255,0.35)',fontWeight:800,fontSize:'0.82rem',transition:'all 0.15s',transform:size===s?'scale(1.06)':'scale(1)',boxShadow:size===s?'0 0 16px rgba(0,229,200,0.18)':'none'}}>{s}</button>
                    ))}
                  </div>
                  <p style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.62)',letterSpacing:'0.03em',lineHeight:1.6}}>Unisex - Soft premium cotton - Standard fit - True to size</p>
                  <div style={{marginTop:12,border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,padding:'10px 11px',background:'rgba(255,255,255,0.02)'}}>
                    <div style={{fontSize:'0.66rem',fontWeight:900,color:'rgba(255,255,255,0.68)',marginBottom:7}}>Not sure about the size?</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:8}}>
                      <label style={{fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.42)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Height cm
                        <input type="number" inputMode="numeric" min={120} max={220} value={fitHeight} onChange={e=>setFitHeight(e.target.value)} placeholder="175" style={{...INP,marginTop:4,padding:'7px 8px',fontSize:'0.74rem'}}/>
                      </label>
                      <label style={{fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.42)',letterSpacing:'0.06em',textTransform:'uppercase'}}>Weight kg
                        <input type="number" inputMode="numeric" min={35} max={200} value={fitWeight} onChange={e=>setFitWeight(e.target.value)} placeholder="72" style={{...INP,marginTop:4,padding:'7px 8px',fontSize:'0.74rem'}}/>
                      </label>
                    </div>
                    {recommendedSize&&(
                      <button onClick={()=>setSize(recommendedSize)}
                        style={{width:'100%',padding:'8px 10px',borderRadius:9,border:`1px solid ${size===recommendedSize?'rgba(0,229,200,0.4)':'rgba(0,229,200,0.2)'}`,background:'rgba(0,229,200,0.07)',color:'#00E5C8',fontSize:'0.7rem',fontWeight:900,cursor:'pointer'}}>
                        {size===recommendedSize?`Size ${recommendedSize} selected - great fit`:`We recommend ${recommendedSize} - tap to select`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}


            <div style={{height:80}}/>
          </div>

        </div>
      </main>

      {/* Mobile-only sticky checkout bar (shown via CSS below 760px) */}
      <div className="studio-mobile-cta" style={{display:'none'}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:'0.85rem',fontWeight:950,color:'#fff'}}>${shirtPrice.toFixed(2)}<span style={{fontSize:'0.62rem',fontWeight:700,color:'rgba(255,255,255,0.45)'}}> + ${SHIPPING_PRICE.toFixed(2)} shipping</span></div>
          <div style={{fontSize:'0.56rem',fontWeight:800,color:'rgba(255,255,255,0.4)'}}>{nextStep.sub}</div>
        </div>
        <button onClick={nextStep.go} style={{flexShrink:0,padding:'12px 20px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontSize:'0.8rem',fontWeight:950,letterSpacing:'0.04em',cursor:'pointer',boxShadow:'0 8px 26px rgba(0,229,200,0.3)'}}>{nextStep.label}</button>
      </div>

      <style>{`
        @keyframes fsIn    { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shirtIn { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fanOpen { from{opacity:0;transform:translate(-50%,42px) rotate(0deg) scale(0.45);filter:blur(6px)} to{opacity:1;filter:blur(0)} }
        input[type=range]{height:3px;border-radius:999px;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{width:15px;height:15px}
        textarea:focus,input:focus,select:focus{outline:none}
        select option{background:#111;color:white}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}
        .studio-properties button,.canvas-action-bar button{font-size:0.82rem!important;}
        .studio-properties input,.studio-properties select,.studio-properties textarea{font-size:0.9rem!important;}
        .studio-bottom-tray button{font-size:0.76rem!important;}
        @media(max-width:1180px){
          .share-fan{--fan-scale:0.9;}
          .studio-shell{grid-template-columns:220px minmax(360px,1fr) 340px!important;}
          .studio-bottom-tray{grid-template-columns:180px minmax(240px,280px) minmax(240px,1fr)!important;}
          .studio-commerce-bar{grid-template-columns:160px 1fr auto!important;}
          .studio-commerce-bar button:not(:last-child){display:none!important;}
        }
        @media(max-width:920px){
          .share-fan{--fan-scale:0.76;}
          header{gap:7px!important;padding:0 9px!important;}
          header h1{font-size:1.05rem!important;letter-spacing:0.06em!important;}
          .studio-commerce-bar{grid-template-columns:1fr auto!important;height:auto!important;padding:8px 10px!important;}
          .studio-commerce-bar > div:first-child{display:none!important;}
          .studio-shell{grid-template-columns:160px 1fr!important;grid-template-rows:minmax(460px,1fr) minmax(360px,44vh);overflow:auto!important;}
          .studio-rail{grid-row:1 / span 2;}
          .studio-properties{grid-column:2;grid-row:2;border-left:none!important;border-top:1px solid rgba(255,255,255,0.06)!important;min-height:360px;}
          .studio-canvas{grid-column:2;grid-row:1;min-height:460px;}
          .studio-bottom-tray{grid-template-columns:1fr!important;max-height:190px;overflow:auto;}
          .checkout-modal{grid-template-columns:1fr!important;overflow:auto!important;}
          .checkout-modal > div:first-child{border-right:none!important;border-bottom:1px solid rgba(255,255,255,0.08)!important;}
        }
        @media(min-width:1440px){
          .studio-shell{grid-template-columns:300px minmax(640px,1fr) 420px!important;}
          .share-fan{--fan-scale:1.12;}
        }
        @media(max-width:920px){
          .studio-root{height:100dvh!important;}
        }
        @media(max-width:760px){
          .studio-fullscreen-btn{display:none!important;}
          .studio-mobile-cta{display:flex!important;position:fixed;left:0;right:0;bottom:0;z-index:8000;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(5,5,8,0.96);border-top:1px solid rgba(255,255,255,0.09);backdrop-filter:blur(18px);}
          .studio-properties{padding-bottom:76px!important;}
          .studio-zoom{display:none!important;}
          .studio-quickstart{bottom:10px!important;}
          .share-fan{--fan-scale:0.62;}
          .share-fan-item{width:92px!important;height:92px!important;border-radius:24px!important;}
          .design-body{grid-template-columns:1fr!important;grid-template-rows:auto 1fr auto;overflow:auto!important;}
          .studio-commerce-bar{display:none!important;}
          header > div:nth-of-type(2){display:none!important;}
          .studio-shell{grid-template-columns:1fr!important;grid-template-rows:auto 420px minmax(380px,1fr)!important;}
          .studio-rail{grid-column:1;grid-row:1;flex-direction:row!important;justify-content:center!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;padding:6px!important;overflow-x:auto;}
          .studio-rail > button{width:48px!important;height:44px!important;flex-shrink:0;justify-content:center!important;padding:0!important;}
          .studio-rail > button span:last-child{display:none!important;}
          .studio-rail > div:not(:first-child){display:none!important;}
          .studio-canvas{grid-column:1;grid-row:2;min-height:420px;}
          .studio-properties{grid-column:1;grid-row:3;min-height:380px;}
          .studio-bottom-tray{display:none!important;}
        }
      `}</style>
    </div>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#070709',color:'rgba(255,255,255,0.62)',fontSize:'0.72rem',letterSpacing:'0.16em',textTransform:'uppercase'}}>Loading Studio...</div>}>
      <DesignStudio/>
    </Suspense>
  );
}

