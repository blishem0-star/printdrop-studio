'use client';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { submitOrder } from '@/lib/exportDesign';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────
type Layer = {
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
  fillColor?: string; // for shapes with separate fill
};
type ImagePos = 'top'|'center'|'bottom'|'full-body'|'full-shirt';
type UploadSlot = 'front'|'back'|'chest';
type Session = { type:'guest'|'user'; customerId?:string; name:string; email?:string };
type ActiveTool = 'templates'|'text'|'upload'|'ai'|'shapes'|'shirt'|'order';

// ─── Constants ────────────────────────────────────────────────
const SVG_W = 200, SVG_H = 230;
const PRINT = { x:60, y:85, w:80, h:105 };
const SHIRT_PATH = 'M30 58 C18 65,2 79,2 82 L26 97 C23 140,21 182,21 221 L179 221 C179 182,177 140,174 97 L198 82 C198 79,182 65,170 58 L144 72 Q130 28,100 26 Q70 28,56 72 Z';

const IMG_ZONE: Record<ImagePos,{x:number;y:number;w:number;h:number;clip:'body'|'full';slice?:boolean}> = {
  top:          {x:60,y:90,  w:80,h:44, clip:'body'},
  center:       {x:60,y:115, w:80,h:50, clip:'body'},
  bottom:       {x:60,y:148, w:80,h:42, clip:'body'},
  'full-body':  {x:60,y:90,  w:80,h:110,clip:'body'},
  'full-shirt': {x:20,y:30,  w:160,h:190,clip:'full',slice:true},
};
const POS_LABELS: Record<ImagePos,string> = {top:'Top',center:'Center',bottom:'Bottom','full-body':'Full front','full-shirt':'All over'};

const FONTS = [
  {id:'system-ui,sans-serif',              label:'Sans',    preview:'Aa'},
  {id:'"Georgia",serif',                   label:'Serif',   preview:'Aa'},
  {id:'"Courier New",monospace',           label:'Mono',    preview:'Aa'},
  {id:'"Impact","Arial Black",sans-serif', label:'Impact',  preview:'AA'},
  {id:"'Bebas Neue',Impact,sans-serif",    label:'Display', preview:'AA'},
  {id:'"Playfair Display",Georgia,serif',  label:'Elegant', preview:'Aa'},
];

const SHAPES_LIB = [
  {char:'★', label:'Star'},    {char:'♥', label:'Heart'},  {char:'◆', label:'Diamond'},
  {char:'●', label:'Circle'},  {char:'■', label:'Square'}, {char:'▲', label:'Triangle'},
  {char:'✦', label:'Sparkle'}, {char:'✚', label:'Cross'},  {char:'☾', label:'Moon'},
  {char:'∞', label:'Infinity'},{char:'⬡', label:'Hex'},    {char:'⚡', label:'Bolt'},
  {char:'↑', label:'Arrow'},   {char:'⊕', label:'Target'}, {char:'☀', label:'Sun'},
  {char:'❋', label:'Flower'},  {char:'⌘', label:'Cmd'},    {char:'⟁', label:'Tri2'},
];

const EMOJIS_LIB = [
  '🔥','⚡','💀','🎭','🌊','🦁','🎨','🎵','🏆','💎',
  '🌙','⭐','🚀','🎯','🐉','👑','✊','🎪','🌈','🦋',
  '🐺','🦅','🐆','🌺','🍂','🦊','🐉','🌊','⛰','🌴',
];

const TEXT_COLORS = ['#ffffff','#000000','#FF4D1C','#FFD700','#10B981','#6C63FF','#FF69B4','#00BCD4','#F97316','#8B5CF6','#EF4444','#06B6D4'];
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function uid() { return Math.random().toString(36).slice(2,9); }

function mkLayer(partial: Partial<Layer> & {type:Layer['type'];content:string;x:number;y:number}): Layer {
  return {
    fontSize:24, fontFamily:'system-ui,sans-serif', color:'#ffffff',
    fontWeight:'bold', italic:false, rotation:0,
    opacity:1, letterSpacing:0, strokeColor:'', strokeWidth:0,
    ...partial,
    id: uid(),
  };
}

// ─── Templates ────────────────────────────────────────────────
const TEMPLATES = [
  {
    id:'bold-stack', name:'Bold Stack', cat:'Typography', preview:['YOUR','NAME'],
    build:(c:string) => [
      mkLayer({type:'text',content:'YOUR',  x:50,y:32,fontSize:30,fontFamily:'"Impact","Arial Black",sans-serif',color:c,fontWeight:'bold',letterSpacing:5}),
      mkLayer({type:'text',content:'NAME',  x:50,y:56,fontSize:38,fontFamily:'"Impact","Arial Black",sans-serif',color:'#00E5C8',fontWeight:'bold',letterSpacing:5}),
      mkLayer({type:'text',content:'EST. 2025',x:50,y:74,fontSize:10,fontFamily:'system-ui,sans-serif',color:c,fontWeight:'normal',letterSpacing:4,opacity:0.55}),
    ],
  },
  {
    id:'minimal', name:'Minimal Icon', cat:'Minimal', preview:['✦','ORIGINAL'],
    build:(c:string) => [
      mkLayer({type:'gfx', content:'✦', x:50,y:32,fontSize:36,color:c}),
      mkLayer({type:'text',content:'ORIGINAL',x:50,y:60,fontSize:13,fontFamily:'system-ui,sans-serif',color:c,fontWeight:'bold',letterSpacing:6,opacity:0.9}),
      mkLayer({type:'text',content:'EST. 2025',x:50,y:75,fontSize:9,fontFamily:'"Courier New",monospace',color:c,fontWeight:'normal',letterSpacing:3,opacity:0.45}),
    ],
  },
  {
    id:'street', name:'Street Style', cat:'Urban', preview:['NO','RULES'],
    build:(c:string) => [
      mkLayer({type:'text',content:'NO',   x:50,y:35,fontSize:42,fontFamily:'"Impact","Arial Black",sans-serif',color:c,fontWeight:'bold',letterSpacing:2,strokeColor:'#00E5C8',strokeWidth:1}),
      mkLayer({type:'text',content:'RULES',x:50,y:60,fontSize:32,fontFamily:'"Impact","Arial Black",sans-serif',color:'#00E5C8',fontWeight:'bold',letterSpacing:2}),
      mkLayer({type:'gfx', content:'★',   x:50,y:78,fontSize:14,color:c,opacity:0.5}),
    ],
  },
  {
    id:'sport', name:'Sport Number', cat:'Sport', preview:['#','23'],
    build:(c:string) => [
      mkLayer({type:'text',content:'#',  x:38,y:45,fontSize:20,fontFamily:'"Impact","Arial Black",sans-serif',color:c,fontWeight:'bold',opacity:0.5}),
      mkLayer({type:'text',content:'23', x:56,y:58,fontSize:52,fontFamily:'"Impact","Arial Black",sans-serif',color:c,fontWeight:'bold',strokeColor:'#00E5C8',strokeWidth:1.5}),
      mkLayer({type:'text',content:'CHAMPION',x:50,y:80,fontSize:10,fontFamily:'system-ui,sans-serif',color:c,fontWeight:'bold',letterSpacing:5}),
    ],
  },
  {
    id:'retro', name:'Retro Vibes', cat:'Vintage', preview:['RETRO','VIBES'],
    build:(c:string) => [
      mkLayer({type:'text',content:'RETRO', x:50,y:38,fontSize:28,fontFamily:'"Georgia",serif',color:c,italic:true,fontWeight:'bold',letterSpacing:2}),
      mkLayer({type:'text',content:'——————',x:50,y:50,fontSize:14,color:c,opacity:0.35,letterSpacing:1}),
      mkLayer({type:'text',content:'VIBES', x:50,y:64,fontSize:24,fontFamily:'"Georgia",serif',color:'#FFD700',italic:true,fontWeight:'bold',letterSpacing:2}),
    ],
  },
  {
    id:'minimal2', name:'Just a Symbol', cat:'Minimal', preview:['♥'],
    build:(c:string) => [
      mkLayer({type:'gfx',content:'♥',x:50,y:48,fontSize:56,color:'#FF4D1C',opacity:0.9}),
      mkLayer({type:'text',content:'MADE WITH LOVE',x:50,y:75,fontSize:9,color:c,fontWeight:'bold',letterSpacing:4,opacity:0.5}),
    ],
  },
  {
    id:'coordinates', name:'Coordinates', cat:'Typography', preview:['40°N','74°W'],
    build:(c:string) => [
      mkLayer({type:'text',content:'40°42\'N',x:50,y:38,fontSize:18,fontFamily:'"Courier New",monospace',color:c,letterSpacing:2}),
      mkLayer({type:'text',content:'74°00\'W',x:50,y:56,fontSize:18,fontFamily:'"Courier New",monospace',color:'#00E5C8',letterSpacing:2}),
      mkLayer({type:'text',content:'NEW YORK CITY',x:50,y:74,fontSize:9,color:c,fontWeight:'normal',letterSpacing:5,opacity:0.4}),
    ],
  },
  {
    id:'crown', name:'Royal', cat:'Urban', preview:['♛','KING'],
    build:(c:string) => [
      mkLayer({type:'gfx',content:'♛',x:50,y:32,fontSize:32,color:'#FFD700'}),
      mkLayer({type:'text',content:'KING',x:50,y:58,fontSize:34,fontFamily:'"Impact","Arial Black",sans-serif',color:c,fontWeight:'bold',letterSpacing:6}),
      mkLayer({type:'text',content:'OF EVERYTHING',x:50,y:76,fontSize:9,color:c,fontWeight:'normal',letterSpacing:4,opacity:0.45}),
    ],
  },
];

// ─── Component ────────────────────────────────────────────────
function DesignStudio() {
  const router = useRouter();

  const [session, setSession] = useState<Session|null>(null);
  useEffect(() => {
    try { const raw=localStorage.getItem('pd_session'); setSession(raw?JSON.parse(raw):{type:'guest',name:'Guest'}); }
    catch { setSession({type:'guest',name:'Guest'}); }
  }, []);

  const whiteColor = SHIRT_COLORS.find(c=>c.id==='white')??SHIRT_COLORS[1];
  const [color,    setColor]    = useState<TShirtColor>(whiteColor);
  const [size,     setSize]     = useState<TShirtSize|null>(null);
  const [showBack, setShowBack] = useState(false);
  const [fullscreen,setFullscreen]=useState(false);

  // Layers + history for undo/redo
  const [layers,   setLayers]   = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const layersRef = useRef<Layer[]>(layers);
  useEffect(()=>{ layersRef.current=layers; },[layers]);
  const dragging = useRef<{id:string;sx:number;sy:number;ox:number;oy:number}|null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  // History
  const historyRef = useRef<Layer[][]>([[]]);
  const histIdxRef = useRef(0);
  function pushHistory(newLayers: Layer[]) {
    historyRef.current = historyRef.current.slice(0, histIdxRef.current+1);
    historyRef.current.push(JSON.parse(JSON.stringify(newLayers)));
    histIdxRef.current = historyRef.current.length-1;
  }
  function undo() {
    if(histIdxRef.current>0){ histIdxRef.current--; setLayers(JSON.parse(JSON.stringify(historyRef.current[histIdxRef.current]))); setSelected(null); }
  }
  function redo() {
    if(histIdxRef.current<historyRef.current.length-1){ histIdxRef.current++; setLayers(JSON.parse(JSON.stringify(historyRef.current[histIdxRef.current]))); }
  }
  function setLayersWithHistory(newLayers: Layer[]) {
    pushHistory(newLayers);
    setLayers(newLayers);
  }

  // Uploads
  const [uploads,    setUploads]    = useState<Record<UploadSlot,string|null>>({front:null,back:null,chest:null});
  const [uploadSlot, setUploadSlot] = useState<UploadSlot>('front');
  const [imgPos,     setImgPos]     = useState<Record<'front'|'back',ImagePos>>({front:'center',back:'center'});
  const [imgOpacity, setImgOpacity] = useState<Record<UploadSlot,number>>({front:1,back:1,chest:1});
  const fileRef = useRef<HTMLInputElement>(null);
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

  // Active tool + shapes tab
  const [activeTool, setActiveTool] = useState<ActiveTool>('templates');
  const [shapesTab,  setShapesTab]  = useState<'shapes'|'emoji'>('shapes');

  // Order
  const [qty,       setQty]      = useState(1);
  const [shipName,  setShipName] = useState('');
  const [shipEmail, setShipEmail]= useState('');
  const [shipStreet,setShipStreet]=useState('');
  const [shipCity,  setShipCity] = useState('');
  const [shipZip,   setShipZip]  = useState('');
  const [shipState, setShipState]= useState('');
  const [submitting,setSubmitting]=useState(false);
  const [ordered,   setOrdered]  = useState(false);
  const [orderId,   setOrderId]  = useState<string|null>(null);
  const [orderError,setOrderError]=useState<string|null>(null);
  const {show:showToast,element:toastEl}=useToast();

  useEffect(()=>{
    if(!session) return;
    if(session.name&&session.name!=='Guest') setShipName(session.name);
    if(session.email) setShipEmail(session.email);
    try{ const s=localStorage.getItem('pd_shipping'); if(s){const d=JSON.parse(s);setShipStreet(d.street??'');setShipCity(d.city??'');setShipZip(d.zip??'');setShipState(d.state??'');} }catch{}
  },[session]);

  useEffect(()=>{ setTextColor(color.textColor); },[color]);

  // ── Layer ops ────────────────────────────────────────────────
  const selLayer = layers.find(l=>l.id===selected)??null;

  function addText() {
    if(!textInput.trim()) return;
    const l=mkLayer({type:'text',content:textInput,x:50,y:50,fontSize,fontFamily:fontFam,color:textColor,fontWeight,italic,letterSpacing:letterSp,strokeColor:strokeCol,strokeWidth:strokeW,opacity:layerOpacity});
    setLayersWithHistory([...layers,l]); setSelected(l.id); setTextInput('');
  }
  function addGfx(c:string) {
    const l=mkLayer({type:'gfx',content:c,x:50,y:45,fontSize:34,color:color.textColor,opacity:layerOpacity});
    setLayersWithHistory([...layers,l]); setSelected(l.id);
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

  // Sync editor when selection changes
  useEffect(()=>{
    if(!selLayer||selLayer.type!=='text') return;
    setFontSize(selLayer.fontSize); setFontFam(selLayer.fontFamily);
    setTextColor(selLayer.color); setFontWeight(selLayer.fontWeight);
    setItalic(selLayer.italic); setLetterSp(selLayer.letterSpacing??0);
    setStrokeCol(selLayer.strokeColor??''); setStrokeW(selLayer.strokeWidth??0);
    setLayerOpacity(selLayer.opacity??1);
  },[selected]); // eslint-disable-line

  // ── Drag ─────────────────────────────────────────────────────
  const onLayerDown=useCallback((e:React.PointerEvent,id:string)=>{
    e.stopPropagation(); setSelected(id);
    const l=layersRef.current.find(x=>x.id===id);
    dragging.current={id,sx:e.clientX,sy:e.clientY,ox:l?.x??50,oy:l?.y??50};
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  },[]);

  useEffect(()=>{
    function onMove(e:PointerEvent){
      if(!dragging.current||!canvasRef.current) return;
      const r=canvasRef.current.getBoundingClientRect();
      const sx=r.width/SVG_W,sy=r.height/SVG_H;
      const dx=(e.clientX-dragging.current.sx)/sx,dy=(e.clientY-dragging.current.sy)/sy;
      setLayers(p=>p.map(l=>l.id===dragging.current!.id
        ?{...l,x:Math.max(0,Math.min(100,dragging.current!.ox+(dx/PRINT.w)*100)),y:Math.max(0,Math.min(100,dragging.current!.oy+(dy/PRINT.h)*100))}:l));
    }
    function onUp(){dragging.current=null;}
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
    return()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
  },[]);

  useEffect(()=>{
    function h(e:BeforeUnloadEvent){if(layersRef.current.length>0)e.preventDefault();}
    window.addEventListener('beforeunload',h); return()=>window.removeEventListener('beforeunload',h);
  },[]);

  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      const notInput=!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement);
      if((e.metaKey||e.ctrlKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();undo();return;}
      if((e.metaKey||e.ctrlKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();redo();return;}
      if((e.key==='Delete'||e.key==='Backspace')&&selected&&notInput){deleteLayer(selected);return;}
      if(e.key==='Escape'){setSelected(null);setFullscreen(false);return;}
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

  // ── Upload ───────────────────────────────────────────────────
  function handleFile(file:File){
    if(!file.type.startsWith('image/')) return;
    const r=new FileReader(); r.onload=e=>setUploads(p=>({...p,[uploadSlot]:e.target?.result as string})); r.readAsDataURL(file);
  }

  // ── AI ───────────────────────────────────────────────────────
  function generateAI(){
    if(!aiPrompt.trim()) return;
    setAiLoading(true); setAiProgress(0); setAiSvg(null);
    const iv=setInterval(()=>setAiProgress(p=>p>=90?(clearInterval(iv),90):p+Math.random()*14),180);
    setTimeout(()=>{
      clearInterval(iv); setAiProgress(100);
      const kw=aiPrompt.toLowerCase();
      const match=CATALOG_DESIGNS.find(d=>kw.includes(d.category.toLowerCase())||kw.includes(d.title.toLowerCase().split(' ')[0]))
        ??CATALOG_DESIGNS[Math.floor(Math.random()*CATALOG_DESIGNS.length)];
      setAiSvg(match.svg); setAiLoading(false);
    },2800);
  }

  // ── Order ────────────────────────────────────────────────────
  const emailValid=  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipEmail);
  const deliveryDone=shipName.trim().length>1&&emailValid&&shipStreet.trim().length>3&&shipCity.trim().length>1&&/^\d{5}$/.test(shipZip)&&shipState!=='';
  const canOrder=    color&&size&&deliveryDone;
  const shirtPrice=  24.99*qty;
  const total=       shirtPrice+SHIPPING_PRICE;

  async function handleOrder(){
    if(!canOrder) return;
    setSubmitting(true); setOrderError(null);
    try{
      const svgDataUrl=aiSvg?'data:image/svg+xml;base64,'+btoa(aiSvg.replace(/currentColor/g,color!.textColor)):uploads.front??'';
      const result=await submitOrder({
        customerName:shipName,customerEmail:shipEmail,shippingName:shipName,shippingAddr:shipStreet,
        shippingCity:shipCity,shippingZip:shipZip,shippingState:shipState,total,
        design:{title:aiPrompt||'Custom Design',emoji:'✏️',colorHex:color!.hex,colorName:color!.name,size:size!,price:shirtPrice,svgDataUrl},
      });
      if(result){
        try{localStorage.setItem('pd_shipping',JSON.stringify({street:shipStreet,city:shipCity,zip:shipZip,state:shipState}));}catch{}
        setOrderId(result.id); setOrdered(true); showToast('Order placed! 🎉','success');
      } else { setOrderError('Order failed.'); showToast('Order failed.','error'); }
    }catch{setOrderError('Network error.');showToast('Network error.','error');}finally{setSubmitting(false);}
  }

  // ── SVG helpers ──────────────────────────────────────────────
  const activeImg=showBack?uploads.back:uploads.front;
  const activePos=showBack?imgPos.back:imgPos.front;
  const zone=     IMG_ZONE[activePos];
  const isLight=  color.id==='white'||color.id==='sand';

  function renderLayers(interactive=true){
    return layers.map(layer=>{
      const lx=PRINT.x+(layer.x/100)*PRINT.w, ly=PRINT.y+(layer.y/100)*PRINT.h;
      const isSel=selected===layer.id&&interactive;
      const aw=layer.type==='text'?layer.content.length*layer.fontSize*0.58:layer.fontSize*1.15;
      const ah=layer.fontSize*1.3;
      const ls=layer.letterSpacing??0;
      return (
        <g key={layer.id} transform={`translate(${lx},${ly}) rotate(${layer.rotation})`}
          opacity={layer.opacity??1}
          style={interactive?{cursor:'move'}:{}}
          onPointerDown={interactive?e=>onLayerDown(e,layer.id):undefined}>
          <rect x={-aw/2-6} y={-ah/2-3} width={aw+12} height={ah+6} fill="transparent"/>
          <text textAnchor="middle" dominantBaseline="middle"
            fontSize={layer.fontSize} fill={layer.color}
            fontFamily={layer.fontFamily} fontWeight={layer.fontWeight}
            fontStyle={layer.italic?'italic':'normal'}
            letterSpacing={ls>0?ls:undefined}
            stroke={layer.strokeColor||undefined}
            strokeWidth={layer.strokeWidth||undefined}
            paintOrder={layer.strokeWidth?'stroke fill':undefined}
            style={{userSelect:'none'}}>
            {layer.content}
          </text>
          {isSel&&<>
            <rect x={-aw/2-6} y={-ah/2-4} width={aw+12} height={ah+8}
              fill="rgba(0,229,200,0.06)" stroke="#00E5C8" strokeWidth="0.8" strokeDasharray="2.5,1.5" rx="2"/>
            {[[-aw/2-6,-ah/2-4],[aw/2+6,-ah/2-4],[-aw/2-6,ah/2+4],[aw/2+6,ah/2+4]].map(([cx,cy],i)=>
              <circle key={i} cx={cx} cy={cy} r="2.2" fill="#00E5C8"/>)}
          </>}
        </g>
      );
    });
  }

  function ShirtCanvas({w,h,interactive=true}:{w:number;h:number;interactive?:boolean}){
    return (
      <svg width={w} height={h} viewBox={`0 0 ${SVG_W} ${SVG_H}`} fill="none" style={{overflow:'visible'}}>
        <defs>
          <filter id="ss" x="-30%" y="-10%" width="160%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="rgba(0,0,0,0.45)"/>
            <feDropShadow dx="0" dy="4"  stdDeviation="8"  floodColor="rgba(0,0,0,0.25)"/>
          </filter>
          <filter id="pb"><feGaussianBlur stdDeviation="6"/></filter>
          <linearGradient id="sg" x1="0.18" y1="0" x2="0.82" y2="1">
            <stop offset="0%"   stopColor={color.hex} stopOpacity="1"/>
            <stop offset="100%" stopColor={color.hex} stopOpacity="0.92"/>
          </linearGradient>
          <linearGradient id="sh" x1="0.12" y1="0" x2="0.88" y2="0.55">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.22)"/>
            <stop offset="45%"  stopColor="rgba(255,255,255,0.04)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id="sp" cx="48%" cy="18%" r="65%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.12)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
          <clipPath id="ccb"><rect x="56" y="82" width="88" height="130"/></clipPath>
          <clipPath id="ccf"><path d={SHIRT_PATH}/></clipPath>
        </defs>
        <ellipse cx="100" cy="227" rx="68" ry="6" fill="rgba(0,0,0,0.28)" filter="url(#pb)"/>
        <path d={SHIRT_PATH} fill="url(#sg)" filter="url(#ss)"/>
        <path d="M30 58 C18 65,2 79,2 82 L26 97 L30 97 C28 80,20 68,30 58Z" fill="rgba(0,0,0,0.07)"/>
        <path d="M170 58 C182 65,198 79,198 82 L174 97 L170 97 C172 80,180 68,170 58Z" fill="rgba(0,0,0,0.06)"/>
        <path d="M56 72 Q70 52,100 50 Q130 52,144 72 Q130 60,100 58 Q70 60,56 72Z" fill="rgba(0,0,0,0.18)"/>
        <line x1="35" y1="100" x2="25" y2="220" stroke="rgba(0,0,0,0.05)" strokeWidth="1.2"/>
        <line x1="165" y1="100" x2="175" y2="220" stroke="rgba(0,0,0,0.04)" strokeWidth="1.2"/>
        <line x1="22" y1="218" x2="178" y2="218" stroke="rgba(0,0,0,0.07)" strokeWidth="1"/>
        <path d={SHIRT_PATH} fill="url(#sh)"/>
        <path d={SHIRT_PATH} fill="url(#sp)"/>
        {printBg&&<rect x={PRINT.x} y={PRINT.y} width={PRINT.w} height={PRINT.h} fill={printBg} rx="3" clipPath="url(#ccb)"/>}
        {activeImg&&<image href={activeImg} x={zone.x} y={zone.y} width={zone.w} height={zone.h} preserveAspectRatio={zone.slice?'xMidYMid slice':'xMidYMid meet'} clipPath={`url(#cc${zone.clip==='full'?'f':'b'})`} opacity={imgOpacity[showBack?'back':'front']}/>}
        {!showBack&&uploads.chest&&<image href={uploads.chest} x="66" y="87" width="26" height="26" preserveAspectRatio="xMidYMid meet" clipPath="url(#ccb)" opacity={imgOpacity.chest}/>}
        {!showBack&&!uploads.front&&aiSvg&&<g transform="translate(71,93)" dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,color.textColor).replace(/<svg[^>]*>/,'').replace('</svg>','').replace(/width="[^"]*"/,'width="58"').replace(/height="[^"]*"/,'height="58"')}}/>}
        {interactive&&layers.length===0&&!activeImg&&!aiSvg&&!printBg&&(
          <rect x={PRINT.x} y={PRINT.y} width={PRINT.w} height={PRINT.h} fill={isLight?'rgba(0,0,0,0.02)':'rgba(255,255,255,0.03)'} stroke={isLight?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.22)'} strokeDasharray="3,2" rx="3" strokeWidth="0.85"/>
        )}
        {showBack&&<text x="100" y="170" textAnchor="middle" fill={isLight?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.18)'} fontSize="7" fontWeight="700" letterSpacing="3">BACK</text>}
        {renderLayers(interactive)}
      </svg>
    );
  }

  // ── Order success ─────────────────────────────────────────────
  if(ordered) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#050507,#060610)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.07) 0%,transparent 60%)',top:'-15%',right:'5%',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',maxWidth:400,position:'relative',zIndex:1,padding:'0 24px'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(0,229,200,0.1)',border:'1px solid rgba(0,229,200,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,margin:'0 auto 20px',boxShadow:'0 0 40px rgba(0,229,200,0.15)'}}>🎉</div>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:'3rem',fontWeight:400,letterSpacing:'0.05em',marginBottom:8,lineHeight:1}}>Order Placed!</h1>
        <p style={{color:'rgba(255,255,255,0.45)',marginBottom:4}}>{color?.name} · Size {size} · Qty {qty}</p>
        {orderId&&<p style={{color:'rgba(255,255,255,0.15)',fontSize:'0.68rem',fontFamily:'monospace',marginBottom:10}}>#{orderId.slice(0,8).toUpperCase()}</p>}
        <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.3)',marginBottom:28,lineHeight:1.6}}>Track it on your <Link href="/profile" style={{color:'#00E5C8',textDecoration:'none'}}>profile</Link>.</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={()=>{setOrdered(false);setLayers([]);setAiSvg(null);setUploads({front:null,back:null,chest:null});setPrintBg(null);}} style={{padding:'0.85rem 1.5rem',borderRadius:12,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.75)',fontWeight:700,cursor:'pointer'}}>Design another</button>
          <Link href="/catalog" style={{padding:'0.85rem 1.8rem',borderRadius:12,background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,textDecoration:'none',display:'inline-flex',alignItems:'center'}}>Browse catalog →</Link>
        </div>
      </div>
    </div>
  );

  const sideTools: {id:ActiveTool;icon:string;label:string}[] = [
    {id:'templates',icon:'⊞', label:'Templates'},
    {id:'text',     icon:'T',  label:'Text'},
    {id:'upload',   icon:'↑',  label:'Upload'},
    {id:'ai',       icon:'✦',  label:'AI'},
    {id:'shapes',   icon:'◆',  label:'Shapes'},
  ];

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'#070709',color:'white',overflow:'hidden'}}>
      {toastEl}

      {/* Fullscreen */}
      {fullscreen&&(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'radial-gradient(ellipse at 50% 38%,rgba(14,14,24,1) 0%,rgba(4,4,6,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fsIn 0.25s ease'}} onClick={()=>setFullscreen(false)}>
          <div style={{filter:'drop-shadow(0 60px 120px rgba(0,0,0,0.9))'}}>
            <ShirtCanvas w={520} h={598} interactive={false}/>
          </div>
          <p style={{marginTop:32,color:'rgba(255,255,255,0.12)',fontSize:'0.65rem',letterSpacing:'0.14em',textTransform:'uppercase'}}>Click anywhere to close</p>
          <button onClick={e=>{e.stopPropagation();setFullscreen(false);}} style={{position:'absolute',top:24,right:28,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 20px',color:'rgba(255,255,255,0.5)',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'}}>✕ Close</button>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{height:50,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 16px 0 12px',gap:12,background:'rgba(7,7,9,0.98)',backdropFilter:'blur(24px)',position:'relative',zIndex:20}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(0,229,200,0.55) 35%,rgba(0,153,255,0.35) 65%,transparent)'}}/>
        <Link href="/catalog" style={{color:'rgba(255,255,255,0.28)',fontSize:'0.67rem',textDecoration:'none',fontWeight:700,letterSpacing:'0.06em',transition:'color 0.15s',textTransform:'uppercase',flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.65)')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.28)')}>← Catalog</Link>
        <div style={{width:1,height:14,background:'rgba(255,255,255,0.08)',flexShrink:0}}/>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontWeight:400,fontSize:'1.42rem',letterSpacing:'0.1em',lineHeight:1,margin:0,flex:1}}>DESIGN<span style={{color:'#00E5C8'}}>.</span>STUDIO</h1>

        {/* Undo/Redo */}
        <div style={{display:'flex',gap:3}}>
          {([['↩','Undo (Ctrl+Z)',undo],['↪','Redo (Ctrl+Y)',redo]] as [string,string,()=>void][]).map(([icon,title,fn])=>(
            <button key={icon} title={title} onClick={fn} style={{width:30,height:30,borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.35)',fontSize:'0.85rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
              onMouseEnter={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.08)');(e.currentTarget.style.color='rgba(255,255,255,0.7)');}}
              onMouseLeave={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.03)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');}}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 9px 3px 5px',borderRadius:20,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',cursor:'pointer'}} onClick={()=>setActiveTool('shirt')}>
            <span style={{width:14,height:14,borderRadius:'50%',background:color.hex,display:'inline-block',outline:'1px solid rgba(255,255,255,0.15)',outlineOffset:1,flexShrink:0}}/>
            <span style={{fontSize:'0.62rem',fontWeight:600,color:'rgba(255,255,255,0.4)'}}>{color.name}</span>
          </div>
          {size?<div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(0,229,200,0.22)',background:'rgba(0,229,200,0.07)',fontSize:'0.62rem',fontWeight:700,color:'#00E5C8',cursor:'pointer'}} onClick={()=>setActiveTool('shirt')}>{size}</div>
            :<div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)',fontSize:'0.62rem',fontWeight:600,color:'rgba(255,255,255,0.2)',cursor:'pointer'}} onClick={()=>setActiveTool('shirt')}>+ Size</div>}
          {layers.length>0&&<div style={{padding:'3px 9px',borderRadius:20,border:'1px solid rgba(0,229,200,0.16)',background:'rgba(0,229,200,0.05)',fontSize:'0.6rem',fontWeight:700,color:'rgba(0,229,200,0.7)'}}>{layers.length}L</div>}
        </div>

        <button onClick={()=>setFullscreen(true)} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:9,padding:'5px 13px',color:'rgba(255,255,255,0.35)',fontSize:'0.64rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',transition:'all 0.15s',flexShrink:0}}
          onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.09)');(e.currentTarget.style.borderColor='rgba(0,229,200,0.28)');(e.currentTarget.style.color='#00E5C8');}}
          onMouseLeave={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.04)');(e.currentTarget.style.borderColor='rgba(255,255,255,0.09)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');}}>
          ⛶ PREVIEW
        </button>
      </header>

      {/* ── 3-PANEL ──────────────────────────────────────────────── */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'64px 1fr 340px',overflow:'hidden',minHeight:0}}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
        <div style={{background:'rgba(5,5,8,1)',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0',gap:1,zIndex:10}}>
          {sideTools.map(t=>(
            <button key={t.id} title={t.label} onClick={()=>setActiveTool(t.id)}
              style={{width:48,height:50,borderRadius:12,border:'none',cursor:'pointer',background:activeTool===t.id?'rgba(0,229,200,0.12)':'transparent',color:activeTool===t.id?'#00E5C8':'rgba(255,255,255,0.28)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,transition:'all 0.15s',position:'relative'}}
              onMouseEnter={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='rgba(255,255,255,0.06)');(e.currentTarget.style.color='rgba(255,255,255,0.65)');}}}
              onMouseLeave={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='transparent');(e.currentTarget.style.color='rgba(255,255,255,0.28)');}}}
            >
              {activeTool===t.id&&<div style={{position:'absolute',left:0,top:'22%',bottom:'22%',width:2,borderRadius:'0 2px 2px 0',background:'#00E5C8'}}/>}
              <span style={{fontSize:t.id==='text'?'0.9rem':'0.82rem',fontWeight:t.id==='text'?900:700,fontFamily:t.id==='text'?'Georgia,serif':'inherit',lineHeight:1}}>{t.icon}</span>
              <span style={{fontSize:'0.46rem',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase'}}>{t.label}</span>
            </button>
          ))}
          <div style={{width:32,height:1,background:'rgba(255,255,255,0.07)',margin:'6px 0'}}/>
          {([{id:'shirt' as ActiveTool,icon:'👕',label:'Shirt'},{id:'order' as ActiveTool,icon:'🛒',label:'Order'}]).map(t=>(
            <button key={t.id} title={t.label} onClick={()=>setActiveTool(t.id)}
              style={{width:48,height:50,borderRadius:12,border:'none',cursor:'pointer',background:activeTool===t.id?'rgba(0,229,200,0.12)':'transparent',color:activeTool===t.id?'#00E5C8':'rgba(255,255,255,0.28)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,transition:'all 0.15s',position:'relative'}}
              onMouseEnter={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='rgba(255,255,255,0.06)');(e.currentTarget.style.color='rgba(255,255,255,0.65)');}}}
              onMouseLeave={e=>{if(activeTool!==t.id){(e.currentTarget.style.background='transparent');(e.currentTarget.style.color='rgba(255,255,255,0.28)');}}}
            >
              {activeTool===t.id&&<div style={{position:'absolute',left:0,top:'22%',bottom:'22%',width:2,borderRadius:'0 2px 2px 0',background:'#00E5C8'}}/>}
              {t.id==='order'&&canOrder&&<div style={{position:'absolute',top:8,right:8,width:6,height:6,borderRadius:'50%',background:'#00E5C8',boxShadow:'0 0 5px rgba(0,229,200,0.9)'}}/>}
              <span style={{fontSize:'1rem',lineHeight:1}}>{t.icon}</span>
              <span style={{fontSize:'0.46rem',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase'}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── CANVAS ───────────────────────────────────────────── */}
        <div style={{background:'radial-gradient(ellipse at 50% 35%,rgba(13,13,22,1) 0%,rgba(5,5,8,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}} onClick={()=>setSelected(null)}>
          <div style={{position:'absolute',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.04) 0%,transparent 60%)',top:'-20%',right:'-5%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',width:360,height:360,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,255,0.03) 0%,transparent 65%)',bottom:'-10%',left:'-5%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.018,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
          {[[0,0,'Top','Left'],[0,1,'Top','Right'],[1,0,'Bottom','Left'],[1,1,'Bottom','Right']].map(([,c,v,h],i)=>(
            <div key={i} style={{position:'absolute',...(v==='Top'?{top:14}:{bottom:12}),...(h==='Left'?{left:14}:{right:14}),width:18,height:18,borderTop:v==='Top'?'1px solid rgba(0,229,200,0.18)':'none',borderBottom:v==='Bottom'?'1px solid rgba(0,229,200,0.18)':'none',borderLeft:h==='Left'?'1px solid rgba(0,229,200,0.18)':'none',borderRight:h==='Right'?'1px solid rgba(0,229,200,0.18)':'none',pointerEvents:'none'}}/>
          ))}

          {/* Front/Back */}
          <div style={{position:'absolute',top:14,left:14,background:'rgba(5,5,8,0.9)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:11,padding:3,display:'flex',gap:2,backdropFilter:'blur(14px)',zIndex:5}}>
            {['Front','Back'].map(s=>(
              <button key={s} aria-pressed={(s==='Back')===showBack} onClick={e=>{e.stopPropagation();setShowBack(s==='Back');}}
                style={{padding:'5px 13px',borderRadius:8,border:'none',cursor:'pointer',background:(s==='Back')===showBack?'rgba(0,229,200,0.13)':'transparent',color:(s==='Back')===showBack?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.07em',transition:'all 0.15s'}}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={e=>{e.stopPropagation();setFullscreen(true);}} style={{position:'absolute',top:14,right:14,background:'rgba(5,5,8,0.9)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:11,padding:'5px 13px',color:'rgba(255,255,255,0.35)',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',backdropFilter:'blur(14px)',letterSpacing:'0.06em',transition:'all 0.15s',zIndex:5}}
            onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.1)');(e.currentTarget.style.color='#00E5C8');}}
            onMouseLeave={e=>{(e.currentTarget.style.background='rgba(5,5,8,0.9)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');}}>
            ⛶ FULLSCREEN
          </button>

          {/* Shirt */}
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',flex:1,width:'100%'}}>
            <div style={{position:'absolute',width:380,height:420,borderRadius:'50%',background:`radial-gradient(ellipse,${color.hex}0c 0%,transparent 60%)`,pointerEvents:'none',filter:'blur(24px)'}}/>
            <div ref={canvasRef} role="img" aria-label="Shirt design canvas" style={{position:'relative',filter:`drop-shadow(0 45px 90px rgba(0,0,0,0.55))`,animation:'shirtIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',zIndex:2}}>
              <ShirtCanvas w={390} h={449}/>
            </div>
            {selLayer&&(
              <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',background:'rgba(4,4,7,0.95)',border:'1px solid rgba(0,229,200,0.25)',borderRadius:12,padding:'7px 15px',display:'flex',alignItems:'center',gap:10,backdropFilter:'blur(16px)',fontSize:'0.67rem',animation:'fadeUp 0.15s ease',whiteSpace:'nowrap',zIndex:6}}>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:'0.55rem',letterSpacing:'0.1em'}}>SELECTED</span>
                <span style={{fontWeight:700,color:'#00E5C8',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis'}}>{selLayer.content}</span>
                <span style={{color:'rgba(255,255,255,0.1)'}}>·</span>
                <button onClick={e=>{e.stopPropagation();duplicateLayer(selLayer.id);}} style={{background:'rgba(0,229,200,0.08)',border:'1px solid rgba(0,229,200,0.18)',borderRadius:6,padding:'3px 8px',color:'#00E5C8',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>⊕ Copy</button>
                <button onClick={e=>{e.stopPropagation();deleteLayer(selLayer.id);}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,padding:'3px 8px',color:'#f87171',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>✕ Del</button>
              </div>
            )}
            {layers.length===0&&!activeImg&&!aiSvg&&!showBack&&!printBg&&(
              <div style={{position:'absolute',bottom:8,textAlign:'center',pointerEvents:'none',animation:'fadeUp 0.5s ease 0.4s both'}}>
                <p style={{color:'rgba(255,255,255,0.1)',fontSize:'0.63rem',letterSpacing:'0.12em',textTransform:'uppercase'}}>Choose a template or use the tools →</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────── */}
        <div style={{borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',background:'rgba(8,8,12,1)',overflow:'hidden'}}>
          <div style={{height:44,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 14px',gap:6}}>
            <span style={{fontSize:'0.57rem',fontWeight:700,color:'rgba(255,255,255,0.18)',letterSpacing:'0.14em',textTransform:'uppercase',flex:1}}>
              {activeTool==='templates'&&'QUICK START'}
              {activeTool==='text'&&'TEXT & TYPOGRAPHY'}
              {activeTool==='upload'&&'UPLOAD IMAGE'}
              {activeTool==='ai'&&'AI GENERATOR'}
              {activeTool==='shapes'&&'SHAPES & ICONS'}
              {activeTool==='shirt'&&'SHIRT SETTINGS'}
              {activeTool==='order'&&'PLACE ORDER'}
            </span>
            {activeTool==='text'&&layers.length>0&&<span style={{fontSize:'0.56rem',color:'rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.04)',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(255,255,255,0.06)'}}>{layers.length} layers</span>}
            {activeTool==='order'&&canOrder&&<span style={{fontSize:'0.56rem',color:'rgba(0,229,200,0.7)',fontWeight:700}}>ready ✓</span>}
          </div>

          <div ref={panelRef} style={{flex:1,overflowY:'auto',minHeight:0}}>

            {/* ═══ TEMPLATES ══════════════════════════════════ */}
            {activeTool==='templates'&&(
              <div style={{padding:'14px 14px 0'}}>
                <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.3)',marginBottom:12,lineHeight:1.5}}>Start with a pre-built design, then customize it.</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                  {TEMPLATES.map(tpl=>(
                    <button key={tpl.id} onClick={()=>{applyTemplate(tpl);setActiveTool('text');}}
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
                        <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.3)'}}>{tpl.cat} · {tpl.build('').length} layers</div>
                      </div>
                      <span style={{marginLeft:'auto',fontSize:'0.65rem',color:'rgba(255,255,255,0.2)'}}>→</span>
                    </button>
                  ))}
                </div>
                <button onClick={()=>{setLayersWithHistory([]);setSelected(null);}} style={{width:'100%',padding:'9px',borderRadius:10,border:'1px solid rgba(255,255,255,0.07)',background:'transparent',color:'rgba(255,255,255,0.22)',fontSize:'0.65rem',fontWeight:600,cursor:'pointer',letterSpacing:'0.04em',transition:'all 0.15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.22)')}>
                  Start from scratch →
                </button>
                <div style={{height:16}}/>
              </div>
            )}

            {/* ═══ TEXT ═══════════════════════════════════════ */}
            {activeTool==='text'&&(
              <div style={{padding:'14px'}}>
                {/* Input */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',gap:7,marginBottom:8}}>
                    <input aria-label="Text" value={textInput} onChange={e=>setTextInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addText()} placeholder="Type your text..." maxLength={40}
                      style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'10px 13px',color:'white',fontSize:'0.9rem',outline:'none',fontFamily:fontFam,fontWeight:fontWeight==='bold'?'bold':'normal',fontStyle:italic?'italic':'normal',transition:'border-color 0.15s'}}
                      onFocus={e=>(e.target.style.borderColor='rgba(0,229,200,0.55)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.1)')}/>
                    <button onClick={addText} disabled={!textInput.trim()} style={{width:44,height:44,borderRadius:10,border:'none',background:textInput.trim()?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.06)',color:textInput.trim()?'#050507':'rgba(255,255,255,0.15)',fontSize:'1.25rem',fontWeight:700,cursor:textInput.trim()?'pointer':'default',transition:'all 0.15s',flexShrink:0}}>+</button>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {['YOUR NAME','EST. 2025','ORIGINAL','NO RULES','MADE IN','100%'].map(t=>(
                      <button key={t} onClick={()=>setTextInput(t)} style={{padding:'3px 9px',borderRadius:20,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.3)',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.04em',transition:'all 0.12s'}}
                        onMouseEnter={e=>{(e.currentTarget.style.borderColor='rgba(0,229,200,0.32)');(e.currentTarget.style.color='rgba(0,229,200,0.8)');}}
                        onMouseLeave={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)');(e.currentTarget.style.color='rgba(255,255,255,0.3)');}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div style={{marginBottom:14}}>
                  <div style={LS}>Font</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                    {FONTS.map(f=>(
                      <button key={f.id} aria-pressed={fontFam===f.id} onClick={()=>{setFontFam(f.id);if(selected)updateLayer(selected,{fontFamily:f.id});}}
                        style={{padding:'8px 10px',borderRadius:8,cursor:'pointer',background:fontFam===f.id?'rgba(0,229,200,0.09)':'rgba(255,255,255,0.02)',border:`1px solid ${fontFam===f.id?'rgba(0,229,200,0.3)':'rgba(255,255,255,0.06)'}`,color:fontFam===f.id?'#00E5C8':'rgba(255,255,255,0.38)',transition:'all 0.13s',display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                        <span style={{fontFamily:f.id,fontSize:'0.8rem',fontWeight:600}}>{f.label}</span>
                        <span style={{fontFamily:f.id,fontSize:'0.78rem',opacity:0.55}}>{f.preview}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size + Style */}
                <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,marginBottom:14,alignItems:'end'}}>
                  <div>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Size</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{fontSize}px</span></div>
                    <input type="range" min={8} max={72} value={fontSize} onChange={e=>{const v=+e.target.value;setFontSize(v);if(selected)updateLayer(selected,{fontSize:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
                  </div>
                  <div>
                    <div style={LS}>Style</div>
                    <div style={{display:'flex',gap:4}}>
                      <button aria-pressed={fontWeight==='bold'} onClick={()=>{const n:typeof fontWeight=fontWeight==='bold'?'normal':'bold';setFontWeight(n);if(selected)updateLayer(selected,{fontWeight:n});}}
                        style={{width:36,height:34,borderRadius:7,cursor:'pointer',background:fontWeight==='bold'?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.04)',border:`1.5px solid ${fontWeight==='bold'?'rgba(0,229,200,0.32)':'rgba(255,255,255,0.08)'}`,color:fontWeight==='bold'?'#00E5C8':'rgba(255,255,255,0.3)',fontWeight:'bold',fontSize:'0.88rem',transition:'all 0.13s'}}>B</button>
                      <button aria-pressed={italic} onClick={()=>{const n=!italic;setItalic(n);if(selected)updateLayer(selected,{italic:n});}}
                        style={{width:36,height:34,borderRadius:7,cursor:'pointer',background:italic?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.04)',border:`1.5px solid ${italic?'rgba(0,229,200,0.32)':'rgba(255,255,255,0.08)'}`,color:italic?'#00E5C8':'rgba(255,255,255,0.3)',fontStyle:'italic',fontWeight:700,fontSize:'0.88rem',transition:'all 0.13s'}}>I</button>
                    </div>
                  </div>
                </div>

                {/* Letter spacing */}
                <div style={{marginBottom:14}}>
                  <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Letter Spacing</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{letterSp}</span></div>
                  <input type="range" min={-2} max={20} value={letterSp} onChange={e=>{const v=+e.target.value;setLetterSp(v);if(selected)updateLayer(selected,{letterSpacing:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
                </div>

                {/* Color */}
                <div style={{marginBottom:14}}>
                  <div style={LS}>Color</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                    {TEXT_COLORS.map(c=>(
                      <button key={c} aria-pressed={textColor===c} onClick={()=>{setTextColor(c);if(selected)updateLayer(selected,{color:c});}}
                        style={{width:28,height:28,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:textColor===c?'2.5px solid #00E5C8':'2px solid rgba(255,255,255,0.1)',outlineOffset:2,transition:'all 0.12s',transform:textColor===c?'scale(1.2)':'scale(1)'}}/>
                    ))}
                    <label style={{width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1.5px dashed rgba(255,255,255,0.2)',fontSize:'0.8rem',position:'relative',color:'rgba(255,255,255,0.5)'}}>
                      +<input type="color" aria-hidden tabIndex={-1} value={textColor} onChange={e=>{setTextColor(e.target.value);if(selected)updateLayer(selected,{color:e.target.value});}} style={{opacity:0,position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%',cursor:'pointer'}}/>
                    </label>
                  </div>
                </div>

                {/* Outline / stroke */}
                <div style={{marginBottom:14}}>
                  <div style={LS}>Outline (Stroke)</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',flex:1}}>
                      {['','#000000','#ffffff','#00E5C8','#FFD700','#FF4D1C'].map(c=>(
                        <button key={c||'none'} aria-pressed={strokeCol===c} onClick={()=>{setStrokeCol(c);if(selected)updateLayer(selected,{strokeColor:c,strokeWidth:c&&strokeW===0?1.5:strokeW});}}
                          style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${strokeCol===c?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:c||'transparent',cursor:'pointer',transition:'all 0.12s',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',color:'rgba(255,255,255,0.4)'}}>
                          {!c&&'○'}
                        </button>
                      ))}
                    </div>
                    {strokeCol&&(
                      <div style={{width:60}}>
                        <div style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.25)',marginBottom:2}}>{strokeW}px</div>
                        <input type="range" min={0.5} max={5} step={0.5} value={strokeW||1.5} onChange={e=>{const v=+e.target.value;setStrokeW(v);if(selected)updateLayer(selected,{strokeWidth:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opacity */}
                <div style={{marginBottom:14}}>
                  <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Opacity</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{Math.round(layerOpacity*100)}%</span></div>
                  <input type="range" min={0.1} max={1} step={0.05} value={layerOpacity} onChange={e=>{const v=+e.target.value;setLayerOpacity(v);if(selected)updateLayer(selected,{opacity:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
                </div>

                {/* Rotation */}
                {selLayer&&(
                  <div style={{background:'rgba(0,229,200,0.04)',border:'1px solid rgba(0,229,200,0.1)',borderRadius:10,padding:'10px 12px',marginBottom:14}}>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Rotation</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{selLayer.rotation}°</span></div>
                    <input type="range" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                  </div>
                )}

                {/* Layers */}
                {layers.length>0&&(
                  <div>
                    <div style={LS}>Layers ({layers.length})</div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      {[...layers].reverse().map((l,ri)=>{
                        const realIdx=layers.length-1-ri;
                        return (
                          <div key={l.id} onClick={()=>setSelected(l.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 8px',borderRadius:9,cursor:'pointer',background:selected===l.id?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',border:`1px solid ${selected===l.id?'rgba(0,229,200,0.2)':'rgba(255,255,255,0.04)'}`,transition:'all 0.12s'}}>
                            <span style={{fontSize:'0.7rem',width:14,textAlign:'center',flexShrink:0,opacity:l.opacity}}>{l.type==='text'?'T':l.content}</span>
                            <span style={{flex:1,fontSize:'0.7rem',fontWeight:600,color:selected===l.id?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.content}</span>
                            <div style={{display:'flex',gap:2,flexShrink:0}}>
                              <button aria-label="Move up" onClick={e=>{e.stopPropagation();moveLayer(l.id,'up');}} style={{width:16,height:16,borderRadius:3,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.3)',fontSize:'0.5rem',cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>↑</button>
                              <button aria-label="Move down" onClick={e=>{e.stopPropagation();moveLayer(l.id,'down');}} style={{width:16,height:16,borderRadius:3,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.3)',fontSize:'0.5rem',cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>↓</button>
                              <button aria-label="Duplicate" onClick={e=>{e.stopPropagation();duplicateLayer(l.id);}} style={{width:16,height:16,borderRadius:3,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'rgba(0,229,200,0.5)',fontSize:'0.5rem',cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>⊕</button>
                              <button aria-label="Delete" onClick={e=>{e.stopPropagation();deleteLayer(l.id);}} style={{width:16,height:16,borderRadius:3,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'#f87171',fontSize:'0.6rem',cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ UPLOAD ═════════════════════════════════════ */}
            {activeTool==='upload'&&(
              <div style={{padding:'14px'}}>
                <div style={{display:'flex',gap:4,marginBottom:12}}>
                  {(['front','back','chest'] as UploadSlot[]).map(slot=>(
                    <button key={slot} aria-pressed={uploadSlot===slot} onClick={()=>setUploadSlot(slot)}
                      style={{flex:1,padding:'8px 4px',borderRadius:9,border:'1px solid',borderColor:uploadSlot===slot?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.07)',background:uploadSlot===slot?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',color:uploadSlot===slot?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.65rem',fontWeight:700,cursor:'pointer',transition:'all 0.13s',display:'flex',alignItems:'center',justifyContent:'center',gap:4,textTransform:'capitalize'}}>
                      {slot}{uploads[slot]&&<span style={{width:4,height:4,borderRadius:'50%',background:'#10B981'}}/>}
                    </button>
                  ))}
                </div>
                <div onDragEnter={e=>{e.preventDefault();setFileDragging(true);}} onDragLeave={()=>setFileDragging(false)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setFileDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}} onClick={()=>fileRef.current?.click()}
                  style={{border:`2px dashed ${fileDragging?'rgba(0,229,200,0.6)':uploads[uploadSlot]?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:14,padding:uploads[uploadSlot]?'1.2rem':'2.5rem 1rem',textAlign:'center',cursor:'pointer',background:fileDragging?'rgba(0,229,200,0.05)':uploads[uploadSlot]?'rgba(16,185,129,0.02)':'rgba(255,255,255,0.01)',transition:'all 0.2s',marginBottom:12}}>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value='';}}/>
                  {uploads[uploadSlot]?<div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center'}}><img src={uploads[uploadSlot]!} alt="upload" style={{height:60,maxWidth:110,borderRadius:8,objectFit:'contain'}}/><div><div style={{fontSize:'0.72rem',color:'#10B981',fontWeight:700}}>✓ Uploaded</div><div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.25)',marginTop:3}}>Click to replace</div></div></div>
                    :<><div style={{fontSize:32,marginBottom:8,opacity:0.4}}>📁</div><div style={{fontWeight:700,color:'rgba(255,255,255,0.5)',fontSize:'0.82rem',marginBottom:5}}>Drop image here</div><div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.22)'}}>PNG · JPG · SVG · WEBP</div></>}
                </div>
                {uploadSlot!=='chest'&&(
                  <div style={{marginBottom:12}}>
                    <div style={LS}>Position</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                      {(Object.keys(POS_LABELS) as ImagePos[]).map(p=>(
                        <button key={p} aria-pressed={imgPos[uploadSlot==='front'?'front':'back']===p} onClick={()=>setImgPos(prev=>({...prev,[uploadSlot==='front'?'front':'back']:p}))}
                          style={{padding:'7px 10px',borderRadius:8,border:'1px solid',borderColor:imgPos[uploadSlot==='front'?'front':'back']===p?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.07)',background:imgPos[uploadSlot==='front'?'front':'back']===p?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',color:imgPos[uploadSlot==='front'?'front':'back']===p?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.65rem',fontWeight:600,cursor:'pointer',transition:'all 0.13s',textAlign:'center'}}>
                          {POS_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{marginBottom:12}}>
                  <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Image Opacity</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{Math.round(imgOpacity[uploadSlot]*100)}%</span></div>
                  <input type="range" min={0.1} max={1} step={0.05} value={imgOpacity[uploadSlot]} onChange={e=>setImgOpacity(p=>({...p,[uploadSlot]:+e.target.value}))} style={{width:'100%',accentColor:'#00E5C8'}}/>
                </div>
                {uploads[uploadSlot]&&<button onClick={()=>setUploads(p=>({...p,[uploadSlot]:null}))} style={{width:'100%',padding:'8px',borderRadius:9,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.07)',color:'#f87171',fontSize:'0.7rem',fontWeight:700,cursor:'pointer'}}>🗑 Remove image</button>}
              </div>
            )}

            {/* ═══ AI ═════════════════════════════════════════ */}
            {activeTool==='ai'&&(
              <div style={{padding:'14px'}}>
                <div style={{background:'linear-gradient(135deg,rgba(0,229,200,0.06),rgba(0,153,255,0.05))',border:'1px solid rgba(0,229,200,0.12)',borderRadius:14,padding:'14px',marginBottom:14}}>
                  <div style={{fontSize:'0.6rem',color:'#00E5C8',fontWeight:700,letterSpacing:'0.1em',marginBottom:6}}>✦ AI DESIGN GENERATOR</div>
                  <div style={{fontSize:'0.73rem',color:'rgba(255,255,255,0.35)',lineHeight:1.6}}>Describe your idea and AI will match the best design from the catalog.</div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={LS}>Your idea</div>
                  <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="e.g. A minimalist mountain peak with bold EXPLORE typography..." rows={4} maxLength={200}
                    style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.09)',borderRadius:11,padding:'11px 13px',color:'#fff',fontSize:'0.82rem',outline:'none',resize:'none',fontFamily:'inherit',lineHeight:1.65,transition:'border-color 0.15s'}}
                    onFocus={e=>(e.target.style.borderColor='rgba(0,229,200,0.45)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
                  {aiPrompt.length>160&&<span style={{fontSize:'0.58rem',color:aiPrompt.length>190?'#f87171':'rgba(255,255,255,0.25)',textAlign:'right',display:'block',marginTop:3}}>{200-aiPrompt.length} left</span>}
                </div>
                <button onClick={generateAI} disabled={!aiPrompt.trim()||aiLoading}
                  style={{width:'100%',padding:'12px',borderRadius:11,border:'none',background:aiPrompt.trim()&&!aiLoading?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.06)',color:aiPrompt.trim()&&!aiLoading?'#050507':'rgba(255,255,255,0.18)',fontWeight:800,fontSize:'0.85rem',cursor:aiPrompt.trim()&&!aiLoading?'pointer':'default',transition:'all 0.2s',marginBottom:10}}>
                  {aiLoading?`Generating... ${Math.round(aiProgress)}%`:aiSvg?'↻ Regenerate':'✦ Generate Design'}
                </button>
                {aiLoading&&<div style={{height:2,background:'rgba(255,255,255,0.05)',borderRadius:999,overflow:'hidden',marginBottom:10}}><div style={{height:'100%',width:`${aiProgress}%`,background:'linear-gradient(90deg,#00E5C8,#0099FF)',borderRadius:999,transition:'width 0.2s'}}/></div>}
                {aiSvg&&!aiLoading&&(
                  <div style={{padding:'11px',background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:11,display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
                    <div style={{width:44,height:44,background:'rgba(255,255,255,0.03)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <div style={{width:34,height:34}} dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,'rgba(255,255,255,0.7)').replace('<svg ','<svg width="34" height="34" ')}}/>
                    </div>
                    <div><div style={{fontSize:'0.68rem',color:'#10B981',fontWeight:700}}>✓ Applied to shirt</div><div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.32)',marginTop:2}}>Showing on preview</div></div>
                    <button onClick={()=>setAiSvg(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.2)',cursor:'pointer',fontSize:18}}>×</button>
                  </div>
                )}
                <div>
                  <div style={LS}>Inspiration</div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {['Minimalist mountain peak','Neon cyberpunk dragon','Bold street art letters','Abstract geometric waves','Vintage 80s sunset logo','Japanese wave pattern'].map(p=>(
                      <button key={p} onClick={()=>setAiPrompt(p)} style={{padding:'8px 11px',borderRadius:9,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.35)',fontSize:'0.72rem',cursor:'pointer',transition:'all 0.12s',textAlign:'left'}}
                        onMouseEnter={e=>{(e.currentTarget.style.borderColor='rgba(0,229,200,0.28)');(e.currentTarget.style.color='rgba(255,255,255,0.65)');(e.currentTarget.style.background='rgba(0,229,200,0.04)');}}
                        onMouseLeave={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');(e.currentTarget.style.background='rgba(255,255,255,0.03)');}}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SHAPES ═════════════════════════════════════ */}
            {activeTool==='shapes'&&(
              <div style={{padding:'14px'}}>
                {/* Sub-tabs */}
                <div style={{display:'flex',background:'rgba(0,0,0,0.4)',borderRadius:10,padding:3,gap:2,marginBottom:14}}>
                  {(['shapes','emoji'] as const).map(t=>(
                    <button key={t} onClick={()=>setShapesTab(t)} style={{flex:1,padding:'6px',borderRadius:7,border:'none',cursor:'pointer',background:shapesTab===t?'rgba(0,229,200,0.1)':'transparent',color:shapesTab===t?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.13s'}}>
                      {t==='shapes'?'◆ Shapes':'😀 Emoji'}
                    </button>
                  ))}
                </div>

                {shapesTab==='shapes'&&(
                  <div>
                    <div style={LS}>Geometric Shapes</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:16}}>
                      {SHAPES_LIB.map(s=>(
                        <button key={s.char} title={s.label} onClick={()=>addGfx(s.char)}
                          style={{padding:'14px 8px',borderRadius:10,cursor:'pointer',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',transition:'all 0.12s',display:'flex',flexDirection:'column',alignItems:'center',gap:5}}
                          onMouseEnter={x=>{(x.currentTarget.style.background='rgba(0,229,200,0.09)');(x.currentTarget.style.borderColor='rgba(0,229,200,0.25)');(x.currentTarget.style.transform='scale(1.04)');}}
                          onMouseLeave={x=>{(x.currentTarget.style.background='rgba(255,255,255,0.03)');(x.currentTarget.style.borderColor='rgba(255,255,255,0.07)');(x.currentTarget.style.transform='scale(1)');}}>
                          <span style={{fontSize:'1.5rem',lineHeight:1,color:'rgba(255,255,255,0.85)'}}>{s.char}</span>
                          <span style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.3)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {shapesTab==='emoji'&&(
                  <div>
                    <div style={LS}>Emoji Library</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5,marginBottom:14}}>
                      {EMOJIS_LIB.map(e=>(
                        <button key={e} onClick={()=>addGfx(e)}
                          style={{padding:'10px 2px',borderRadius:9,cursor:'pointer',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'1.3rem',lineHeight:1,transition:'all 0.12s'}}
                          onMouseEnter={x=>{(x.currentTarget.style.background='rgba(0,229,200,0.1)');(x.currentTarget.style.transform='scale(1.14)');}}
                          onMouseLeave={x=>{(x.currentTarget.style.background='rgba(255,255,255,0.03)');(x.currentTarget.style.transform='scale(1)');}}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected shape controls */}
                {selLayer&&(
                  <div style={{background:'rgba(0,229,200,0.04)',border:'1px solid rgba(0,229,200,0.12)',borderRadius:10,padding:'11px 12px'}}>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Scale</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{selLayer.fontSize}px</span></div>
                    <input type="range" min={12} max={80} value={selLayer.fontSize} onChange={e=>updateLayer(selLayer.id,{fontSize:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Rotate</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{selLayer.rotation}°</span></div>
                    <input type="range" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Opacity</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{Math.round((selLayer.opacity??1)*100)}%</span></div>
                    <input type="range" min={0.1} max={1} step={0.05} value={selLayer.opacity??1} onChange={e=>updateLayer(selLayer.id,{opacity:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
                    <div style={LS}>Color</div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      {TEXT_COLORS.slice(0,8).map(c=>(
                        <button key={c} onClick={()=>updateLayer(selLayer.id,{color:c})} style={{width:24,height:24,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:selLayer.color===c?'2px solid #00E5C8':'2px solid transparent',outlineOffset:2,transition:'all 0.12s'}}/>
                      ))}
                    </div>
                  </div>
                )}

                {/* Print area background */}
                <div style={{marginTop:14}}>
                  <div style={LS}>Print Area Background</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                    <button onClick={()=>setPrintBg(null)} style={{width:28,height:28,borderRadius:6,border:`1.5px solid ${!printBg?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',color:'rgba(255,255,255,0.4)'}}>✕</button>
                    {['#000000','#ffffff','#FF4D1C','#FFD700','#10B981','#0099FF','#6C63FF','#FF69B4'].map(c=>(
                      <button key={c} onClick={()=>setPrintBg(c)} style={{width:28,height:28,borderRadius:6,border:`1.5px solid ${printBg===c?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:c,cursor:'pointer',transition:'all 0.12s',transform:printBg===c?'scale(1.15)':'scale(1)'}}/>
                    ))}
                    <label style={{width:28,height:28,borderRadius:6,cursor:'pointer',background:`${printBg||'rgba(255,255,255,0.06)'}`,border:'1.5px dashed rgba(255,255,255,0.2)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'rgba(255,255,255,0.5)'}}>
                      +<input type="color" aria-hidden tabIndex={-1} value={printBg||'#ffffff'} onChange={e=>setPrintBg(e.target.value)} style={{opacity:0,position:'absolute',inset:0,cursor:'pointer'}}/>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SHIRT ══════════════════════════════════════ */}
            {activeTool==='shirt'&&(
              <div style={{padding:'14px'}}>
                <div style={{marginBottom:18}}>
                  <div style={LS}>Color — <span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:600,fontSize:'0.72rem'}}>{color.name}</span></div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:7}}>
                    {SHIRT_COLORS.map(c=>(
                      <button key={c.id} title={c.name} aria-pressed={color.id===c.id} onClick={()=>setColor(c)}
                        style={{aspectRatio:'1',borderRadius:11,border:`2px solid ${color.id===c.id?'#00E5C8':'rgba(255,255,255,0.06)'}`,background:c.hex,cursor:'pointer',transition:'all 0.15s',transform:color.id===c.id?'scale(1.06)':'scale(1)',boxShadow:color.id===c.id?`0 0 20px ${c.hex}55,inset 0 1px 0 rgba(255,255,255,0.15)`:`inset 0 1px 0 rgba(255,255,255,0.12)`,display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:4,position:'relative'}}>
                        {color.id===c.id&&<span style={{fontSize:'0.55rem',fontWeight:700,color:c.textColor,opacity:0.7}}>✓</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
                    {SHIRT_COLORS.map(c=>(
                      <div key={c.id} onClick={()=>setColor(c)} style={{textAlign:'center',fontSize:'0.5rem',color:color.id===c.id?'rgba(0,229,200,0.85)':'rgba(255,255,255,0.2)',fontWeight:color.id===c.id?700:400,cursor:'pointer',lineHeight:1.3}}>{c.name.split(' ').slice(-1)[0]}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={LS}>Size {size&&<span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:600,fontSize:'0.72rem'}}>— {size}</span>}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                    {SHIRT_SIZES.map(s=>(
                      <button key={s} aria-pressed={size===s} onClick={()=>setSize(s)}
                        style={{width:50,height:50,borderRadius:12,cursor:'pointer',border:`2px solid ${size===s?'#00E5C8':'rgba(255,255,255,0.08)'}`,background:size===s?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.02)',color:size===s?'#00E5C8':'rgba(255,255,255,0.35)',fontWeight:800,fontSize:'0.82rem',transition:'all 0.15s',transform:size===s?'scale(1.06)':'scale(1)',boxShadow:size===s?'0 0 16px rgba(0,229,200,0.18)':'none'}}>{s}</button>
                    ))}
                  </div>
                  <p style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.18)',letterSpacing:'0.03em',lineHeight:1.6}}>Unisex · 100% ring-spun cotton · Pre-shrunk · Standard fit · True to size</p>
                </div>
              </div>
            )}

            {/* ═══ ORDER ══════════════════════════════════════ */}
            {activeTool==='order'&&(
              <div style={{padding:'14px'}}>
                {!size&&<div style={{padding:'11px 13px',background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.18)',borderRadius:12,fontSize:'0.72rem',color:'rgba(245,158,11,0.8)',marginBottom:14,lineHeight:1.5}}>⚠ <button onClick={()=>setActiveTool('shirt')} style={{background:'none',border:'none',color:'#F59E0B',fontWeight:700,cursor:'pointer',textDecoration:'underline',padding:0,fontSize:'0.72rem'}}>Select a shirt size</button> before ordering.</div>}

                {/* Quantity */}
                <div style={{marginBottom:14}}>
                  <div style={LS}>Quantity</div>
                  <div style={{display:'flex',gap:5}}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setQty(n)}
                        style={{width:44,height:44,borderRadius:10,cursor:'pointer',border:`1.5px solid ${qty===n?'#00E5C8':'rgba(255,255,255,0.08)'}`,background:qty===n?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.02)',color:qty===n?'#00E5C8':'rgba(255,255,255,0.35)',fontWeight:800,fontSize:'0.85rem',transition:'all 0.15s',transform:qty===n?'scale(1.06)':'scale(1)'}}>{n}</button>
                    ))}
                  </div>
                </div>

                <div style={{background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)',padding:'12px 13px',marginBottom:13}}>
                  <div style={{fontSize:'0.57rem',fontWeight:700,color:'rgba(255,255,255,0.2)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:9}}>Order Summary</div>
                  {[
                    [`Custom shirt × ${qty}`,`$${(24.99*qty).toFixed(2)}`],
                    [`Shipping`,`$${SHIPPING_PRICE.toFixed(2)}`],
                    ...(size?[[`${color.name} / Size ${size}`, '']]:[]),
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:'0.77rem'}}>
                      <span style={{color:'rgba(255,255,255,0.38)'}}>{k}</span>
                      {v&&<span style={{color:'rgba(255,255,255,0.65)',fontWeight:600}}>{v}</span>}
                    </div>
                  ))}
                  <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'9px 0'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:900}}>
                    <span>Total</span><span style={{color:'#00E5C8',fontSize:'1.05rem'}}>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{marginBottom:10}}>
                  <div style={LS}>Delivery Details</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div><label htmlFor="ds-name" style={LS}>Full Name</label><input id="ds-name" style={INP} autoComplete="name" value={shipName} onChange={e=>setShipName(e.target.value)} placeholder="Jane Smith" maxLength={80}/></div>
                      <div><label htmlFor="ds-email" style={LS}>Email</label><input id="ds-email" style={INP} type="email" autoComplete="email" value={shipEmail} onChange={e=>setShipEmail(e.target.value)} placeholder="you@example.com" maxLength={120}/></div>
                    </div>
                    <div><label htmlFor="ds-street" style={LS}>Street Address</label><input id="ds-street" style={INP} autoComplete="street-address" value={shipStreet} onChange={e=>setShipStreet(e.target.value)} placeholder="123 Main St" maxLength={120}/></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 58px 72px',gap:8}}>
                      <div><label htmlFor="ds-city" style={LS}>City</label><input id="ds-city" style={INP} autoComplete="address-level2" value={shipCity} onChange={e=>setShipCity(e.target.value)} placeholder="New York" maxLength={60}/></div>
                      <div><label htmlFor="ds-state" style={LS}>State</label><select id="ds-state" value={shipState} onChange={e=>setShipState(e.target.value)} style={{...INP,appearance:'none' as const,cursor:'pointer',color:shipState?'#fff':'rgba(255,255,255,0.22)'}}><option value="">ST</option>{US_STATES.map(s=><option key={s} value={s} style={{background:'#1a1a1a'}}>{s}</option>)}</select></div>
                      <div><label htmlFor="ds-zip" style={LS}>ZIP</label><input id="ds-zip" style={{...INP,fontFamily:'monospace'}} autoComplete="postal-code" inputMode="numeric" value={shipZip} onChange={e=>setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001"/></div>
                    </div>
                  </div>
                </div>
                <div style={{padding:'8px 10px',background:'rgba(245,158,11,0.04)',border:'1px solid rgba(245,158,11,0.1)',borderRadius:8,fontSize:'0.63rem',color:'rgba(245,158,11,0.5)',marginBottom:10}}>🔒 Stripe/PayPal coming soon — demo mode</div>
                {orderError&&<div role="alert" style={{padding:'9px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:8,fontSize:'0.7rem',color:'#f87171',fontWeight:600,marginBottom:10}}>⚠ {orderError}</div>}
              </div>
            )}

            <div style={{height:80}}/>
          </div>

          {/* ─── STICKY CTA ──────────────────────────────────── */}
          <div style={{padding:'11px 13px',borderTop:'1px solid rgba(255,255,255,0.07)',background:'rgba(7,7,10,0.98)',backdropFilter:'blur(20px)',flexShrink:0,position:'relative'}}>
            <div style={{position:'absolute',top:0,left:'25%',right:'25%',height:'1px',background:'linear-gradient(90deg,transparent,rgba(0,229,200,0.18),transparent)',transform:'translateY(-1px)'}}/>
            {canOrder?(
              <button onClick={handleOrder} disabled={submitting}
                style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,fontSize:'0.9rem',cursor:submitting?'default':'pointer',boxShadow:'0 6px 28px rgba(0,229,200,0.3)',transition:'all 0.15s',opacity:submitting?0.7:1,letterSpacing:'0.02em'}}
                onMouseEnter={e=>{if(!submitting)(e.currentTarget.style.boxShadow='0 8px 38px rgba(0,229,200,0.48)');}}
                onMouseLeave={e=>{(e.currentTarget.style.boxShadow='0 6px 28px rgba(0,229,200,0.3)');}}>
                {submitting?'⏳ Placing order...':`Place Order — $${total.toFixed(2)}`}
              </button>
            ):(
              <button onClick={()=>setActiveTool('order')}
                style={{width:'100%',padding:'14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.2)',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',letterSpacing:'0.02em',transition:'all 0.15s'}}
                onMouseEnter={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.14)');(e.currentTarget.style.color='rgba(255,255,255,0.5)');(e.currentTarget.style.background='rgba(255,255,255,0.04)');}}
                onMouseLeave={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)');(e.currentTarget.style.color='rgba(255,255,255,0.2)');(e.currentTarget.style.background='rgba(255,255,255,0.02)');}}>
                {!size?'Select shirt size to continue →':'Complete order details →'}
              </button>
            )}
            <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:8}}>
              {['🔒 Secure','⚡ 72h shipping','↩️ Free returns'].map(b=>(
                <span key={b} style={{fontSize:'0.53rem',color:'rgba(255,255,255,0.12)',fontWeight:600,letterSpacing:'0.04em'}}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fsIn    { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shirtIn { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        input[type=range]{height:3px;border-radius:999px;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{width:15px;height:15px}
        textarea:focus,input:focus,select:focus{outline:none}
        select option{background:#111;color:white}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}
        @media(max-width:760px){
          .design-body{grid-template-columns:1fr!important;grid-template-rows:auto 1fr auto;overflow:auto!important;}
        }
      `}</style>
    </div>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#070709',color:'rgba(255,255,255,0.18)',fontSize:'0.72rem',letterSpacing:'0.16em',textTransform:'uppercase'}}>Loading Studio...</div>}>
      <DesignStudio/>
    </Suspense>
  );
}

const LS: React.CSSProperties  = {display:'block',fontSize:'0.57rem',fontWeight:700,color:'rgba(255,255,255,0.24)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:5};
const INP: React.CSSProperties = {width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.09)',borderRadius:9,padding:'9px 11px',color:'#fff',fontSize:'0.8rem',outline:'none',transition:'border-color 0.15s'};
