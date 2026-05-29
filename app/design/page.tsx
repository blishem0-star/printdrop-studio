'use client';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { submitOrder } from '@/lib/exportDesign';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

// ─── Types ───────────────────────────────────────────────────
type Layer = { id: string; type: 'text' | 'gfx'; content: string; x: number; y: number; fontSize: number; fontFamily: string; color: string; fontWeight: 'normal'|'bold'; italic: boolean; rotation: number };
type ImagePos = 'top'|'center'|'bottom'|'full-body'|'full-shirt';
type FontStyle = 'bold'|'script'|'minimal';
type UploadSlot = 'front'|'back'|'chest';
type Session = { type:'guest'|'user'; customerId?:string; name:string; email?:string };

// ─── Constants ───────────────────────────────────────────────
const SVG_W = 200, SVG_H = 230;
const PRINT = { x:60, y:85, w:80, h:105 };
const SHIRT_PATH = 'M32 57 L2 82 L26 97 L21 222 L179 222 L174 97 L198 82 L168 57 L144 72 Q129 30 100 28 Q71 30 56 72 Z';

const IMG_ZONE: Record<ImagePos,{x:number;y:number;w:number;h:number;clip:'body'|'full';slice?:boolean}> = {
  top:          {x:60, y:90, w:80, h:44, clip:'body'},
  center:       {x:60, y:115, w:80, h:50, clip:'body'},
  bottom:       {x:60, y:148, w:80, h:42, clip:'body'},
  'full-body':  {x:60, y:90, w:80, h:110, clip:'body'},
  'full-shirt': {x:20, y:30, w:160, h:190, clip:'full', slice:true},
};
const POS_LABELS: Record<ImagePos,string> = {top:'Top',center:'Center',bottom:'Bottom','full-body':'Full front','full-shirt':'All over'};

const FONTS = [
  {id:'system-ui,sans-serif', label:'Sans'},
  {id:'"Georgia",serif', label:'Serif'},
  {id:'"Courier New",monospace', label:'Mono'},
  {id:'"Impact","Arial Black",sans-serif', label:'Impact'},
];
const EMOJIS = ['🔥','⚡','💀','🎭','🌊','🦁','🎨','🎵','🏆','💎','🌙','⭐','🚀','🎯','🐉','👑','☠','✦','★','◆'];
const TEXT_COLORS = ['#ffffff','#000000','#FF4D1C','#FFD700','#10B981','#6C63FF','#FF69B4','#00BCD4'];
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function uid() { return Math.random().toString(36).slice(2,9); }

// ─── Component ───────────────────────────────────────────────
function DesignStudio() {
  const router = useRouter();

  // Session
  const [session, setSession] = useState<Session|null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      setSession(raw ? JSON.parse(raw) : {type:'guest',name:'Guest'});
    } catch { setSession({type:'guest',name:'Guest'}); }
  }, []);

  // Shirt
  const [color, setColor] = useState<TShirtColor>(SHIRT_COLORS[0]);
  const [size,  setSize]  = useState<TShirtSize|null>(null);
  const [showBack, setShowBack] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Draggable layers
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const layersRef = useRef<Layer[]>(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  const dragging = useRef<{id:string;sx:number;sy:number;ox:number;oy:number}|null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Image uploads
  const [uploads, setUploads] = useState<Record<UploadSlot,string|null>>({front:null,back:null,chest:null});
  const [uploadSlot, setUploadSlot] = useState<UploadSlot>('front');
  const [imgPos, setImgPos] = useState<Record<'front'|'back',ImagePos>>({front:'center',back:'center'});
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileDragging, setFileDragging] = useState(false);

  // AI
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiSvg, setAiSvg] = useState<string|null>(null);

  // Text editor
  const [textInput, setTextInput] = useState('');
  const [fontSize,  setFontSize]  = useState(16);
  const [fontFam,   setFontFam]   = useState(FONTS[0].id);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontWeight,setFontWeight]= useState<'normal'|'bold'>('bold');
  const [italic,    setItalic]    = useState(false);

  // Tabs
  const [rightTab, setRightTab] = useState<'design'|'shirt'|'order'>('design');
  const [designTab, setDesignTab] = useState<'text'|'upload'|'ai'|'gfx'>('text');

  // Order
  const [shipName,  setShipName]  = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet,setShipStreet]= useState('');
  const [shipCity,  setShipCity]  = useState('');
  const [shipZip,   setShipZip]   = useState('');
  const [shipState, setShipState] = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [ordered,   setOrdered]   = useState(false);
  const [orderId,   setOrderId]   = useState<string|null>(null);
  const [orderError,setOrderError]= useState<string|null>(null);
  const { show: showToast, element: toastEl } = useToast();

  // Restore session shipping
  useEffect(() => {
    if (!session) return;
    if (session.name && session.name !== 'Guest') setShipName(session.name);
    if (session.email) setShipEmail(session.email);
    try {
      const s = localStorage.getItem('pd_shipping');
      if (s) { const d=JSON.parse(s); setShipStreet(d.street??''); setShipCity(d.city??''); setShipZip(d.zip??''); setShipState(d.state??''); }
    } catch { /* ignore */ }
  }, [session]);

  // ── Layers ──────────────────────────────────────────────────
  const selLayer = layers.find(l=>l.id===selected)??null;

  function addText() {
    if (!textInput.trim()) return;
    const l: Layer = {id:uid(),type:'text',content:textInput,x:50,y:50,fontSize,fontFamily:fontFam,color:textColor,fontWeight,italic,rotation:0};
    setLayers(p=>[...p,l]); setSelected(l.id); setTextInput('');
  }
  function addGfx(c:string) {
    const l: Layer = {id:uid(),type:'gfx',content:c,x:50,y:45,fontSize:32,fontFamily:'system-ui',color:'#ffffff',fontWeight:'normal',italic:false,rotation:0};
    setLayers(p=>[...p,l]); setSelected(l.id);
  }
  function updateLayer(id:string, patch:Partial<Layer>) {
    setLayers(p=>p.map(l=>l.id===id?{...l,...patch}:l));
  }
  function deleteLayer(id:string) {
    setLayers(p=>p.filter(l=>l.id!==id));
    if(selected===id) setSelected(null);
  }

  // Sync editor when selection changes
  useEffect(() => {
    if (!selLayer || selLayer.type!=='text') return;
    setFontSize(selLayer.fontSize); setFontFam(selLayer.fontFamily);
    setTextColor(selLayer.color); setFontWeight(selLayer.fontWeight); setItalic(selLayer.italic);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag ──────────────────────────────────────────────────
  const onLayerDown = useCallback((e:React.PointerEvent, id:string) => {
    e.stopPropagation();
    setSelected(id);
    const l = layersRef.current.find(x=>x.id===id);
    dragging.current = {id, sx:e.clientX, sy:e.clientY, ox:l?.x??50, oy:l?.y??50};
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    function onMove(e:PointerEvent) {
      if (!dragging.current || !canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      const sx = r.width/SVG_W, sy = r.height/SVG_H;
      const dx = (e.clientX-dragging.current.sx)/sx;
      const dy = (e.clientY-dragging.current.sy)/sy;
      setLayers(p=>p.map(l=>l.id===dragging.current!.id
        ? {...l, x:Math.max(0,Math.min(100,dragging.current!.ox+(dx/PRINT.w)*100)), y:Math.max(0,Math.min(100,dragging.current!.oy+(dy/PRINT.h)*100))}
        : l));
    }
    function onUp() { dragging.current=null; }
    window.addEventListener('pointermove',onMove);
    window.addEventListener('pointerup',onUp);
    return ()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
  }, []);

  useEffect(() => {
    function onKey(e:KeyboardEvent) {
      const notInput = !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement);
      if((e.key==='Delete'||e.key==='Backspace')&&selected&&notInput) deleteLayer(selected);
      if(e.key==='Escape') { setSelected(null); setFullscreen(false); }
      if(selected&&notInput) {
        const step = e.shiftKey ? 5 : 1;
        if(e.key==='ArrowLeft')  { e.preventDefault(); updateLayer(selected, { x: Math.max(0,   (layers.find(l=>l.id===selected)?.x??50) - step) }); }
        if(e.key==='ArrowRight') { e.preventDefault(); updateLayer(selected, { x: Math.min(100, (layers.find(l=>l.id===selected)?.x??50) + step) }); }
        if(e.key==='ArrowUp')    { e.preventDefault(); updateLayer(selected, { y: Math.max(0,   (layers.find(l=>l.id===selected)?.y??50) - step) }); }
        if(e.key==='ArrowDown')  { e.preventDefault(); updateLayer(selected, { y: Math.min(100, (layers.find(l=>l.id===selected)?.y??50) + step) }); }
      }
    }
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload ────────────────────────────────────────────────
  function handleFile(file:File) {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = e => setUploads(p=>({...p,[uploadSlot]:e.target?.result as string}));
    r.readAsDataURL(file);
  }

  // ── AI ────────────────────────────────────────────────────
  function generateAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiProgress(0); setAiSvg(null);
    const iv = setInterval(()=>setAiProgress(p=>p>=90?(clearInterval(iv),90):p+Math.random()*14), 180);
    setTimeout(()=>{
      clearInterval(iv); setAiProgress(100);
      const kw = aiPrompt.toLowerCase();
      const match = CATALOG_DESIGNS.find(d=>kw.includes(d.category.toLowerCase())||kw.includes(d.title.toLowerCase().split(' ')[0]))
        ?? CATALOG_DESIGNS[Math.floor(Math.random()*CATALOG_DESIGNS.length)];
      setAiSvg(match.svg); setAiLoading(false);
    }, 2800);
  }

  // ── Order ─────────────────────────────────────────────────
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipEmail);
  const deliveryDone = shipName.trim().length>1 && emailValid && shipStreet.trim().length>3 && shipCity.trim().length>1 && /^\d{5}$/.test(shipZip) && shipState!=='';
  const canOrder = color && size && deliveryDone;
  const total = 24.99 + SHIPPING_PRICE;

  async function handleOrder() {
    if (!canOrder) return;
    setSubmitting(true); setOrderError(null);
    try {
      const svgDataUrl = aiSvg ? 'data:image/svg+xml;base64,'+btoa(aiSvg.replace(/currentColor/g,color!.textColor)) : uploads.front ?? '';
      const result = await submitOrder({
        customerName:shipName, customerEmail:shipEmail,
        shippingName:shipName, shippingAddr:shipStreet,
        shippingCity:shipCity, shippingZip:shipZip, shippingState:shipState, total,
        design:{title:aiPrompt||'Custom Design',emoji:'✏️',colorHex:color!.hex,colorName:color!.name,size:size!,price:24.99,svgDataUrl},
      });
      if (result) {
        try { localStorage.setItem('pd_shipping',JSON.stringify({street:shipStreet,city:shipCity,zip:shipZip,state:shipState})); } catch{/**/}
        setOrderId(result.id); setOrdered(true);
        showToast('Order placed! 🎉', 'success');
      } else {
        setOrderError('Order failed. Please try again.');
        showToast('Order failed. Please try again.', 'error');
      }
    } catch { setOrderError('Network error. Please try again.'); showToast('Network error. Check your connection.', 'error'); } finally { setSubmitting(false); }
  }

  // ── SVG canvas helpers ─────────────────────────────────────
  const activeImg  = showBack ? uploads.back : uploads.front;
  const activePos  = showBack ? imgPos.back : imgPos.front;
  const zone = IMG_ZONE[activePos];

  function renderLayers(interactive=true) {
    return layers.map(layer => {
      const lx = PRINT.x+(layer.x/100)*PRINT.w;
      const ly = PRINT.y+(layer.y/100)*PRINT.h;
      const isSel = selected===layer.id && interactive;
      const aw = layer.type==='text' ? layer.content.length*layer.fontSize*0.58 : layer.fontSize*1.1;
      const ah = layer.fontSize*1.3;
      return (
        <g key={layer.id} transform={`translate(${lx},${ly}) rotate(${layer.rotation})`}
          style={interactive?{cursor:'move'}:{}}
          onPointerDown={interactive?(e)=>onLayerDown(e,layer.id):undefined}>
          <rect x={-aw/2-4} y={-ah/2-2} width={aw+8} height={ah+4} fill="transparent"/>
          <text textAnchor="middle" dominantBaseline="middle" fontSize={layer.fontSize}
            fill={layer.color} fontFamily={layer.fontFamily} fontWeight={layer.fontWeight}
            fontStyle={layer.italic?'italic':'normal'} style={{userSelect:'none'}}>
            {layer.content}
          </text>
          {isSel && <>
            <rect x={-aw/2-5} y={-ah/2-3} width={aw+10} height={ah+6}
              fill="rgba(0,229,200,0.06)" stroke="#00E5C8" strokeWidth="0.8"
              strokeDasharray="2.5,1.5" rx="2"/>
            {[[-aw/2-5,-ah/2-3],[aw/2+5,-ah/2-3],[-aw/2-5,ah/2+3],[aw/2+5,ah/2+3]].map(([cx,cy],i)=>
              <circle key={i} cx={cx} cy={cy} r="2" fill="#00E5C8"/>)}
          </>}
        </g>
      );
    });
  }

  function ShirtCanvas({w,h,interactive=true}:{w:number;h:number;interactive?:boolean}) {
    const s = w/SVG_W;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${SVG_W} ${SVG_H}`} fill="none">
        <defs>
          <filter id="cs"><feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="rgba(0,0,0,0.7)"/></filter>
          <linearGradient id="cg" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={color.hex} stopOpacity="1"/>
            <stop offset="100%" stopColor={color.hex} stopOpacity="0.88"/>
          </linearGradient>
          <linearGradient id="ch" x1="0.15" y1="0" x2="0.85" y2="0.5">
            <stop offset="0%" stopColor="rgba(255,255,255,0.13)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          <clipPath id="ccb"><rect x="56" y="82" width="88" height="130"/></clipPath>
          <clipPath id="ccf"><path d={SHIRT_PATH}/></clipPath>
        </defs>
        <path d={SHIRT_PATH} fill="url(#cg)" filter="url(#cs)"/>
        <path d={SHIRT_PATH} fill="url(#ch)"/>
        <path d="M32 57 L2 82 L26 97 L21 222 L34 222 L34 97 L26 97 L2 82 L32 57Z" fill="rgba(0,0,0,0.07)"/>
        <path d="M168 57 L198 82 L174 97 L179 222 L166 222 L166 97 L174 97 L198 82 L168 57Z" fill="rgba(0,0,0,0.05)"/>
        <path d="M56 72 Q71 51 100 49 Q129 51 144 72 Q129 59 100 57 Q71 59 56 72Z" fill="rgba(0,0,0,0.2)"/>

        {/* Uploaded image */}
        {activeImg && (
          <image href={activeImg} x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            preserveAspectRatio={zone.slice?'xMidYMid slice':'xMidYMid meet'}
            clipPath={`url(#cc${zone.clip==='full'?'f':'b'})`} opacity="0.95"/>
        )}
        {/* Chest logo */}
        {!showBack && uploads.chest && (
          <image href={uploads.chest} x="66" y="87" width="26" height="26"
            preserveAspectRatio="xMidYMid meet" clipPath="url(#ccb)" opacity="0.95"/>
        )}
        {/* AI SVG */}
        {!showBack && !uploads.front && aiSvg && (
          <g transform="translate(71,93)"
            dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,color.textColor).replace(/<svg[^>]*>/,'').replace('</svg>','').replace(/width="[^"]*"/,'width="58"').replace(/height="[^"]*"/,'height="58"')}}/>
        )}
        {/* Print area guide */}
        {interactive && layers.length===0 && !activeImg && !aiSvg && (
          <rect x={PRINT.x} y={PRINT.y} width={PRINT.w} height={PRINT.h}
            fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)"
            strokeDasharray="3,2" rx="3" strokeWidth="0.7"/>
        )}
        {/* Back label */}
        {showBack && <text x="100" y="170" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="7" fontWeight="700" letterSpacing="3">BACK</text>}
        {renderLayers(interactive)}
      </svg>
    );
  }

  // ── Order success ──────────────────────────────────────────
  if (ordered) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#050507,#060610)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.06) 0%,transparent 60%)',top:'-15%',right:'5%',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,255,0.04) 0%,transparent 65%)',bottom:'0%',left:'-5%',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',maxWidth:380,position:'relative',zIndex:1}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:'2.8rem',fontWeight:400,letterSpacing:'0.04em',marginBottom:8}}>Order placed!</h1>
        <p style={{color:'rgba(255,255,255,0.4)',marginBottom:4}}>{color?.name} · Size {size}</p>
        {orderId && <p style={{color:'rgba(255,255,255,0.15)',fontSize:'0.68rem',fontFamily:'monospace',marginBottom:28}}>#{orderId.slice(0,8).toUpperCase()}</p>}
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={()=>{setOrdered(false);setLayers([]);setAiSvg(null);setUploads({front:null,back:null,chest:null});}} style={{padding:'0.8rem 1.5rem',borderRadius:12,border:'none',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',fontWeight:700,cursor:'pointer'}}>Design another</button>
          <Link href="/catalog" style={{padding:'0.8rem 1.5rem',borderRadius:12,border:'none',background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,textDecoration:'none',display:'inline-flex',alignItems:'center'}}>Browse catalog</Link>
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'linear-gradient(180deg,#050507,#060610)',color:'white',overflow:'hidden'}}>
      {toastEl}

      {/* Fullscreen */}
      {fullscreen && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'radial-gradient(ellipse at 50% 38%,rgba(22,22,32,1) 0%,rgba(4,4,6,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fsIn 0.25s ease'}}
          onClick={()=>setFullscreen(false)}>
          <div style={{filter:'drop-shadow(0 40px 80px rgba(0,0,0,0.9))'}}>
            <ShirtCanvas w={480} h={552} interactive={false}/>
          </div>
          <p style={{marginTop:28,color:'rgba(255,255,255,0.18)',fontSize:'0.72rem',letterSpacing:'0.08em'}}>TAP ANYWHERE TO CLOSE</p>
          <button onClick={e=>{e.stopPropagation();setFullscreen(false);}} style={{position:'absolute',top:24,right:28,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'8px 18px',color:'rgba(255,255,255,0.6)',fontSize:'0.78rem',fontWeight:700,cursor:'pointer'}}>✕ Close</button>
        </div>
      )}

      {/* Header */}
      <header style={{height:52,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',padding:'0 20px',gap:12,background:'rgba(5,5,7,0.92)',backdropFilter:'blur(20px)'}}>
        <Link href="/catalog" style={{color:'rgba(255,255,255,0.25)',fontSize:'0.76rem',textDecoration:'none',fontWeight:600}}>← Back</Link>
        <div style={{width:1,height:16,background:'rgba(255,255,255,0.08)'}}/>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontWeight:400,fontSize:'1.35rem',letterSpacing:'0.06em',lineHeight:1,flex:1,margin:0}}>Design<span style={{color:'#00E5C8'}}>.</span>Studio</h1>
        {layers.length>0 && <span style={{background:'rgba(0,229,200,0.12)',border:'1px solid rgba(0,229,200,0.2)',borderRadius:20,padding:'3px 10px',fontSize:'0.62rem',fontWeight:700,color:'#00E5C8'}}>{layers.length} layer{layers.length!==1?'s':''}</span>}
        <button onClick={()=>setFullscreen(true)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'5px 13px',color:'rgba(255,255,255,0.5)',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.04em'}}>⛶ PREVIEW</button>
      </header>

      {/* Body */}
      <div className="design-body" style={{flex:1,display:'grid',gridTemplateColumns:'1fr 340px',overflow:'hidden',minHeight:0}}>

        {/* ── CANVAS ────────────────────────────────────── */}
        <div style={{background:'radial-gradient(ellipse at 50% 35%,rgba(18,18,28,1) 0%,rgba(5,5,9,1) 100%)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}
          onClick={()=>setSelected(null)}>
          {/* Atmosphere */}
          <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.04) 0%,transparent 60%)',top:'-10%',right:'-5%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,255,0.03) 0%,transparent 65%)',bottom:'-5%',left:'-5%',pointerEvents:'none'}}/>
          {/* Grid */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.035,backgroundImage:'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)',backgroundSize:'36px 36px'}}/>

          {/* Front/Back toggle */}
          <div style={{position:'absolute',top:16,left:16,background:'rgba(0,0,0,0.55)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:3,display:'flex',gap:3,backdropFilter:'blur(8px)'}}>
            {['Front','Back'].map(s=>(
              <button key={s} onClick={e=>{e.stopPropagation();setShowBack(s==='Back');}} style={{padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',background:(s==='Back')===showBack?'rgba(255,255,255,0.1)':'transparent',color:(s==='Back')===showBack?'white':'rgba(255,255,255,0.3)',fontSize:'0.67rem',fontWeight:700,letterSpacing:'0.05em'}}>{s}</button>
            ))}
          </div>

          {/* Fullscreen btn */}
          <button onClick={e=>{e.stopPropagation();setFullscreen(true);}} style={{position:'absolute',top:16,right:16,background:'rgba(0,0,0,0.55)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 13px',color:'rgba(255,255,255,0.55)',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',backdropFilter:'blur(8px)',letterSpacing:'0.04em',transition:'all 0.15s'}}
            onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.15)');(e.currentTarget.style.color='#00E5C8');}}
            onMouseLeave={e=>{(e.currentTarget.style.background='rgba(0,0,0,0.55)');(e.currentTarget.style.color='rgba(255,255,255,0.55)');}}>
            ⛶ FULLSCREEN
          </button>

          {/* Shirt */}
          <div ref={canvasRef} style={{filter:'drop-shadow(0 36px 64px rgba(0,0,0,0.8))',animation:'shirtIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
            <ShirtCanvas w={340} h={391}/>
          </div>

          {/* Selected info bar */}
          {selLayer && (
            <div style={{position:'absolute',bottom:18,background:'rgba(8,8,14,0.92)',border:'1px solid rgba(0,229,200,0.2)',borderRadius:10,padding:'6px 14px',display:'flex',alignItems:'center',gap:10,backdropFilter:'blur(8px)',fontSize:'0.7rem',animation:'fadeUp 0.15s ease'}}>
              <span style={{color:'rgba(255,255,255,0.35)'}}>Selected:</span>
              <span style={{fontWeight:700,color:'#00E5C8',maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selLayer.content}</span>
              <span style={{color:'rgba(255,255,255,0.2)'}}>·</span>
              <span style={{color:'rgba(255,255,255,0.3)'}}>Drag to move · Del to remove</span>
              <button onClick={()=>deleteLayer(selLayer.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,padding:'3px 8px',color:'#f87171',fontSize:'0.62rem',fontWeight:700,cursor:'pointer'}}>✕</button>
            </div>
          )}

          {/* Empty hint */}
          {layers.length===0&&!activeImg&&!aiSvg&&!showBack&&(
            <div style={{position:'absolute',bottom:18,textAlign:'center',pointerEvents:'none',animation:'fadeUp 0.5s ease 0.3s both'}}>
              <p style={{color:'rgba(255,255,255,0.15)',fontSize:'0.7rem',letterSpacing:'0.05em'}}>Add text, graphics, or upload an image →</p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────── */}
        <div style={{borderLeft:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',background:'rgba(5,5,9,0.98)',overflow:'hidden'}}>

          {/* Main tabs */}
          <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
            {([['design','✏','Design'],['shirt','👕','Shirt'],['order','🛒','Order']] as const).map(([id,icon,label])=>(
              <button key={id} onClick={()=>setRightTab(id)} style={{flex:1,padding:'12px 4px',border:'none',background:'none',cursor:'pointer',color:rightTab===id?'white':'rgba(255,255,255,0.28)',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:`2px solid ${rightTab===id?'#00E5C8':'transparent'}`,marginBottom:-1,transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <span style={{fontSize:'0.95rem'}}>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{flex:1,overflowY:'auto',padding:'14px',minHeight:0}}>

            {/* ─ DESIGN TAB ─ */}
            {rightTab==='design' && <>
              {/* Sub-tabs */}
              <div style={{display:'flex',background:'rgba(0,0,0,0.4)',borderRadius:9,padding:3,gap:2,marginBottom:14}}>
                {([['text','✏ Text'],['upload','📁 Upload'],['ai','✨ AI'],['gfx','✦ Graphics']] as const).map(([id,label])=>(
                  <button key={id} role="tab" aria-selected={designTab===id} onClick={()=>setDesignTab(id)} style={{flex:1,padding:'5px 2px',borderRadius:6,border:'none',cursor:'pointer',background:designTab===id?'rgba(255,255,255,0.08)':'transparent',color:designTab===id?'white':'rgba(255,255,255,0.3)',fontSize:'0.6rem',fontWeight:700,transition:'all 0.13s'}}>{label}</button>
                ))}
              </div>

              {/* TEXT */}
              {designTab==='text' && <div style={{display:'flex',flexDirection:'column',gap:13}}>
                <div>
                  <div style={LS}>Your Text</div>
                  <div style={{display:'flex',gap:6}}>
                    <input value={textInput} onChange={e=>setTextInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addText()} placeholder="Type something..." maxLength={40} style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'9px 11px',color:'white',fontSize:'0.83rem',outline:'none'}} onFocus={e=>(e.target.style.borderColor='rgba(0,229,200,0.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.1)')}/>
                    <button onClick={addText} disabled={!textInput.trim()} style={{width:40,borderRadius:9,border:'none',background:textInput.trim()?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.05)',color:textInput.trim()?'#050507':'rgba(255,255,255,0.15)',fontSize:'1.1rem',fontWeight:700,cursor:textInput.trim()?'pointer':'default',transition:'all 0.15s'}}>+</button>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
                    {['YOUR NAME','EST. 2025','ORIGINAL','NO RULES'].map(t=>(
                      <button key={t} onClick={()=>setTextInput(t)} style={{padding:'3px 8px',borderRadius:20,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.35)',fontSize:'0.6rem',fontWeight:700,cursor:'pointer'}}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={LS}>Font</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                    {FONTS.map(f=>(
                      <button key={f.id} onClick={()=>{setFontFam(f.id);if(selected)updateLayer(selected,{fontFamily:f.id});}} style={{padding:'8px',borderRadius:8,cursor:'pointer',background:fontFam===f.id?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.03)',border:`1.5px solid ${fontFam===f.id?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.07)'}`,color:fontFam===f.id?'#00E5C8':'rgba(255,255,255,0.4)',fontSize:'0.75rem',fontWeight:600,fontFamily:f.id,transition:'all 0.13s'}}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Size</span><span style={{color:'#00E5C8'}}>{fontSize}px</span></div>
                  <input type="range" aria-label="Font size" min={8} max={64} value={fontSize} onChange={e=>{const v=+e.target.value;setFontSize(v);if(selected)updateLayer(selected,{fontSize:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
                </div>
                <div>
                  <div style={LS}>Style</div>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>{const n:typeof fontWeight=fontWeight==='bold'?'normal':'bold';setFontWeight(n);if(selected)updateLayer(selected,{fontWeight:n});}} style={{width:42,height:38,borderRadius:8,cursor:'pointer',background:fontWeight==='bold'?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.04)',border:`1.5px solid ${fontWeight==='bold'?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.07)'}`,color:fontWeight==='bold'?'#00E5C8':'rgba(255,255,255,0.35)',fontWeight:'bold',fontSize:'0.9rem',transition:'all 0.13s'}}>B</button>
                    <button onClick={()=>{const n=!italic;setItalic(n);if(selected)updateLayer(selected,{italic:n});}} style={{width:42,height:38,borderRadius:8,cursor:'pointer',background:italic?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.04)',border:`1.5px solid ${italic?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.07)'}`,color:italic?'#00E5C8':'rgba(255,255,255,0.35)',fontStyle:'italic',fontWeight:700,fontSize:'0.9rem',transition:'all 0.13s'}}>I</button>
                  </div>
                </div>
                <div>
                  <div style={LS}>Color</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                    {TEXT_COLORS.map(c=>(
                      <button key={c} onClick={()=>{setTextColor(c);if(selected)updateLayer(selected,{color:c});}} style={{width:28,height:28,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:textColor===c?'2.5px solid #00E5C8':'2px solid rgba(255,255,255,0.08)',outlineOffset:2,transition:'all 0.12s',transform:textColor===c?'scale(1.18)':'scale(1)'}}/>
                    ))}
                    <label style={{width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.12)',fontSize:'0.85rem',position:'relative'}}>
                      +<input type="color" value={textColor} onChange={e=>{setTextColor(e.target.value);if(selected)updateLayer(selected,{color:e.target.value});}} style={{opacity:0,position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%',cursor:'pointer'}}/>
                    </label>
                  </div>
                </div>
                {selLayer && selLayer.type==='text' && (
                  <div style={{background:'rgba(0,229,200,0.05)',border:'1px solid rgba(0,229,200,0.15)',borderRadius:9,padding:10}}>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Rotation</span><span style={{color:'#00E5C8'}}>{selLayer.rotation}°</span></div>
                    <input type="range" aria-label="Rotation" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                  </div>
                )}
              </div>}

              {/* UPLOAD */}
              {designTab==='upload' && <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',gap:5}}>
                  {([['front','👕 Front',uploads.front],['back','↩️ Back',uploads.back],['chest','❤️ Chest',uploads.chest]] as [UploadSlot,string,string|null][]).map(([slot,label,img])=>(
                    <button key={slot} onClick={()=>setUploadSlot(slot)} style={{flex:1,padding:'6px 4px',borderRadius:8,border:'1px solid',borderColor:uploadSlot===slot?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.08)',background:uploadSlot===slot?'rgba(0,229,200,0.07)':'transparent',color:uploadSlot===slot?'#00E5C8':'rgba(255,255,255,0.35)',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                      {label}{img&&<span style={{width:5,height:5,borderRadius:'50%',background:'#10B981',flexShrink:0}}/>}
                    </button>
                  ))}
                </div>
                <div onDragEnter={e=>{e.preventDefault();setFileDragging(true);}} onDragLeave={()=>setFileDragging(false)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setFileDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}} onClick={()=>fileRef.current?.click()}
                  style={{border:`2px dashed ${fileDragging?'rgba(0,229,200,0.5)':uploads[uploadSlot]?'rgba(16,185,129,0.35)':'rgba(255,255,255,0.1)'}`,borderRadius:14,padding:'1.5rem',textAlign:'center',cursor:'pointer',background:fileDragging?'rgba(0,229,200,0.04)':uploads[uploadSlot]?'rgba(16,185,129,0.03)':'rgba(255,255,255,0.01)',transition:'all 0.2s'}}>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value='';}}/>
                  {uploads[uploadSlot]
                    ? <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center'}}><img src={uploads[uploadSlot]!} alt="upload" style={{height:60,maxWidth:120,borderRadius:6,objectFit:'contain'}}/><div style={{textAlign:'left'}}><div style={{fontSize:'0.72rem',color:'#10B981',fontWeight:700}}>✓ Uploaded</div><div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.3)',marginTop:2}}>Click to replace</div></div></div>
                    : <><div style={{fontSize:28,marginBottom:6}}>📁</div><div style={{fontWeight:700,color:'rgba(255,255,255,0.6)',fontSize:'0.8rem',marginBottom:4}}>Drop image here</div><div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.28)'}}>PNG, JPG, SVG · click to browse</div></>}
                </div>
                {uploadSlot!=='chest' && <div>
                  <div style={LS}>Position</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {(Object.keys(POS_LABELS) as ImagePos[]).map(p=>(
                      <button key={p} onClick={()=>setImgPos(prev=>({...prev,[uploadSlot==='front'?'front':'back']:p}))} style={{padding:'4px 10px',borderRadius:999,border:'1px solid',borderColor:imgPos[uploadSlot==='front'?'front':'back']===p?'rgba(0,229,200,0.45)':'rgba(255,255,255,0.08)',background:imgPos[uploadSlot==='front'?'front':'back']===p?'rgba(0,229,200,0.08)':'transparent',color:imgPos[uploadSlot==='front'?'front':'back']===p?'#00E5C8':'rgba(255,255,255,0.35)',fontSize:'0.65rem',fontWeight:600,cursor:'pointer',transition:'all 0.13s'}}>{POS_LABELS[p]}</button>
                    ))}
                  </div>
                </div>}
                {uploads[uploadSlot] && <button onClick={()=>setUploads(p=>({...p,[uploadSlot]:null}))} style={{padding:'7px',borderRadius:9,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.07)',color:'#f87171',fontSize:'0.7rem',fontWeight:700,cursor:'pointer'}}>🗑 Remove image</button>}
              </div>}

              {/* AI */}
              {designTab==='ai' && <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <div style={LS}>Describe your design</div>
                  <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="e.g. A minimalist mountain with bold typography EXPLORE..." rows={4} maxLength={200} style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.09)',borderRadius:10,padding:'10px 12px',color:'#fff',fontSize:'0.82rem',outline:'none',resize:'none',fontFamily:'inherit',lineHeight:1.6}}/>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button onClick={generateAI} disabled={!aiPrompt.trim()||aiLoading} style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:aiPrompt.trim()&&!aiLoading?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.06)',color:aiPrompt.trim()&&!aiLoading?'#050507':'rgba(255,255,255,0.2)',fontWeight:800,fontSize:'0.82rem',cursor:aiPrompt.trim()&&!aiLoading?'pointer':'default',transition:'all 0.2s'}}>
                    {aiLoading?`Generating... ${Math.round(aiProgress)}%`:aiSvg?'↻ Regenerate':'✨ Generate'}
                  </button>
                </div>
                {aiLoading && <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:999,overflow:'hidden'}}><div style={{height:'100%',width:`${aiProgress}%`,background:'linear-gradient(90deg,#00E5C8,#0099FF)',borderRadius:999,transition:'width 0.2s'}}/></div>}
                {aiSvg && !aiLoading && <div style={{padding:'10px',background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:10,display:'flex',gap:10,alignItems:'center'}}><div style={{width:48,height:48,background:'rgba(255,255,255,0.03)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:36,height:36}} dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,'rgba(255,255,255,0.7)').replace('<svg ','<svg width="36" height="36" ')}}/></div><div><div style={{fontSize:'0.68rem',color:'#10B981',fontWeight:700}}>✓ Design ready</div><div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.4)',marginTop:2}}>Showing on shirt preview</div></div><button aria-label="Clear AI design" onClick={()=>setAiSvg(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.2)',cursor:'pointer',fontSize:16}}>×</button></div>}
                <div>
                  <div style={LS}>Inspiration</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {['Minimalist mountain','Neon dragon','Bold street art','Abstract waves','Vintage logo'].map(p=>(
                      <button key={p} onClick={()=>setAiPrompt(p)} style={{padding:'4px 9px',borderRadius:20,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.35)',fontSize:'0.62rem',fontWeight:600,cursor:'pointer'}}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>}

              {/* GRAPHICS */}
              {designTab==='gfx' && <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <div style={LS}>Emoji & Icons</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5}}>
                    {EMOJIS.map(e=>(
                      <button key={e} onClick={()=>addGfx(e)} style={{padding:'9px 2px',borderRadius:9,cursor:'pointer',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'1.25rem',transition:'all 0.12s',lineHeight:1}}
                        onMouseEnter={x=>{(x.currentTarget.style.background='rgba(0,229,200,0.12)');(x.currentTarget.style.transform='scale(1.12)');}}
                        onMouseLeave={x=>{(x.currentTarget.style.background='rgba(255,255,255,0.04)');(x.currentTarget.style.transform='scale(1)');}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                {selLayer && (
                  <div style={{background:'rgba(0,229,200,0.05)',border:'1px solid rgba(0,229,200,0.15)',borderRadius:9,padding:10}}>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Size</span><span style={{color:'#00E5C8'}}>{selLayer.fontSize}px</span></div>
                    <input type="range" aria-label="Font size" min={12} max={80} value={selLayer.fontSize} onChange={e=>updateLayer(selLayer.id,{fontSize:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                    <div style={{marginTop:8,...LS,display:'flex',justifyContent:'space-between'}}><span>Rotation</span><span style={{color:'#00E5C8'}}>{selLayer.rotation}°</span></div>
                    <input type="range" aria-label="Rotation" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                  </div>
                )}
              </div>}
            </>}

            {/* ─ SHIRT TAB ─ */}
            {rightTab==='shirt' && <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <div>
                <div style={LS}>Color — {color.name}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
                  {SHIRT_COLORS.map(c=>(
                    <button key={c.id} title={c.name} aria-label={`Select color: ${c.name}`} aria-pressed={color.id===c.id} onClick={()=>setColor(c)} style={{width:38,height:38,borderRadius:'50%',border:'none',background:c.hex,cursor:'pointer',outline:color.id===c.id?'3px solid #00E5C8':'2px solid rgba(255,255,255,0.09)',outlineOffset:3,boxShadow:color.id===c.id?`0 0 16px ${c.hex}aa`:'none',transition:'all 0.15s',transform:color.id===c.id?'scale(1.15)':'scale(1)'}}/>
                  ))}
                </div>
              </div>
              <div>
                <div style={LS}>Size {size&&<span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:500}}>— {size}</span>}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {SHIRT_SIZES.map(s=>(
                    <button key={s} onClick={()=>setSize(s)} style={{width:48,height:48,borderRadius:10,cursor:'pointer',border:`1.5px solid ${size===s?'#00E5C8':'rgba(255,255,255,0.08)'}`,background:size===s?'rgba(0,229,200,0.12)':'rgba(255,255,255,0.02)',color:size===s?'#00E5C8':'rgba(255,255,255,0.4)',fontWeight:800,fontSize:'0.82rem',transition:'all 0.15s',transform:size===s?'scale(1.08)':'scale(1)'}}>{s}</button>
                  ))}
                </div>
                <p style={{marginTop:7,fontSize:'0.6rem',color:'rgba(255,255,255,0.2)'}}>Unisex · 100% ring-spun cotton · Pre-shrunk</p>
              </div>
            </div>}

            {/* ─ ORDER TAB ─ */}
            {rightTab==='order' && <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {(!color||!size) && (
                <div style={{padding:'10px',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,fontSize:'0.72rem',color:'rgba(245,158,11,0.8)'}}>
                  ⚠ Select color & size in the Shirt tab first
                </div>
              )}
              {/* Order summary */}
              <div style={{background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:'12px',marginBottom:2}}>
                <div style={{fontSize:'0.6rem',fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Summary</div>
                {[['Custom shirt',`$24.99`],['Shipping',`$${SHIPPING_PRICE.toFixed(2)}`]].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:'0.78rem'}}>
                    <span style={{color:'rgba(255,255,255,0.4)'}}>{k}</span><span style={{color:'rgba(255,255,255,0.7)'}}>{v}</span>
                  </div>
                ))}
                <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'7px 0'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:900}}>
                  <span>Total</span><span style={{color:'#00E5C8'}}>${total.toFixed(2)}</span>
                </div>
              </div>
              {/* Form */}
              <div className="rsp-1col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div><div style={LS}>Full Name</div><input style={INP} name="name" autoComplete="name" value={shipName} onChange={e=>setShipName(e.target.value)} placeholder="Jane Smith" maxLength={80}/></div>
                <div><div style={LS}>Email</div><input style={INP} type="email" name="email" autoComplete="email" value={shipEmail} onChange={e=>setShipEmail(e.target.value)} placeholder="you@example.com" maxLength={120}/></div>
              </div>
              <div><div style={LS}>Street Address</div><input style={INP} name="street-address" autoComplete="street-address" value={shipStreet} onChange={e=>setShipStreet(e.target.value)} placeholder="123 Main St" maxLength={120}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 60px 76px',gap:8}}>
                <div><div style={LS}>City</div><input style={INP} name="city" autoComplete="address-level2" value={shipCity} onChange={e=>setShipCity(e.target.value)} placeholder="New York" maxLength={60}/></div>
                <div><div style={LS}>State</div>
                  <select value={shipState} onChange={e=>setShipState(e.target.value)} style={{...INP,appearance:'none',cursor:'pointer',color:shipState?'#fff':'rgba(255,255,255,0.25)'}}>
                    <option value="">ST</option>
                    {US_STATES.map(s=><option key={s} value={s} style={{background:'#1a1a1a'}}>{s}</option>)}
                  </select>
                </div>
                <div><div style={LS}>ZIP</div><input style={{...INP,fontFamily:'monospace'}} name="postal-code" autoComplete="postal-code" inputMode="numeric" value={shipZip} onChange={e=>setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001"/></div>
              </div>
              <div style={{padding:'8px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.12)',borderRadius:8,fontSize:'0.67rem',color:'rgba(245,158,11,0.6)',lineHeight:1.5}}>
                🔒 Stripe/PayPal coming soon — demo mode active
              </div>
              {orderError && <div role="alert" aria-live="assertive" style={{padding:'8px 10px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,fontSize:'0.72rem',color:'#f87171',fontWeight:600}}>⚠ {orderError}</div>}
            </div>}
          </div>

          {/* Layers list */}
          {layers.length>0 && (
            <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'9px 12px',flexShrink:0,maxHeight:150,overflowY:'auto'}}>
              <div style={{fontSize:'0.55rem',fontWeight:700,color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>LAYERS ({layers.length})</div>
              {[...layers].reverse().map(l=>(
                <div key={l.id} onClick={()=>setSelected(l.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 7px',borderRadius:7,cursor:'pointer',background:selected===l.id?'rgba(0,229,200,0.09)':'rgba(255,255,255,0.03)',border:`1px solid ${selected===l.id?'rgba(0,229,200,0.22)':'rgba(255,255,255,0.04)'}`,marginBottom:3,transition:'all 0.12s'}}>
                  <span style={{fontSize:'0.7rem',width:14,textAlign:'center'}}>{l.type==='text'?'T':l.content}</span>
                  <span style={{flex:1,fontSize:'0.68rem',fontWeight:600,color:selected===l.id?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.content}</span>
                  <button aria-label="Remove layer" onClick={e=>{e.stopPropagation();deleteLayer(l.id);}} style={{width:18,height:18,borderRadius:4,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.04)',color:'#f87171',fontSize:'0.65rem',cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Order CTA */}
          <div style={{padding:'11px 13px',borderTop:'1px solid rgba(255,255,255,0.07)',background:'rgba(5,5,7,0.95)',flexShrink:0}}>
            {canOrder ? (
              <button onClick={handleOrder} disabled={submitting} style={{width:'100%',padding:'13px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,fontSize:'0.87rem',cursor:submitting?'default':'pointer',boxShadow:'0 6px 20px rgba(0,229,200,0.25)',transition:'all 0.15s',opacity:submitting?0.7:1}}>
                {submitting?'⏳ Placing order...':(`Place Order — $${total.toFixed(2)}`)}
              </button>
            ) : (
              <div style={{textAlign:'center',fontSize:'0.7rem',color:'rgba(255,255,255,0.2)',padding:'10px 0'}}>
                {!size ? 'Select color & size → Order tab' : 'Fill delivery details in Order tab'}
              </div>
            )}
            <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:7}}>
              {['🔒 Secure','⚡ 72h delivery','↩️ Free returns'].map(b=><span key={b} style={{fontSize:'0.55rem',color:'rgba(255,255,255,0.14)',fontWeight:600}}>{b}</span>)}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fsIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        @keyframes shirtIn{from{opacity:0;transform:scale(0.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input[type=range]{height:3px;border-radius:999px}
        input[type=range]::-webkit-slider-thumb{width:14px;height:14px}
        textarea:focus,input:focus{outline:none}
        select option{background:#111;color:white}
        @media(max-width:680px){
          .design-body{grid-template-columns:1fr!important;grid-template-rows:auto 1fr;overflow:auto!important;}
          .design-body>div:first-child{height:320px;flex-shrink:0;}
          .design-body>div:last-child{border-left:none!important;border-top:1px solid rgba(255,255,255,0.07);}
        }
      `}</style>
    </div>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#050507,#060610)',color:'rgba(255,255,255,0.18)',fontSize:'0.82rem'}}>Loading...</div>}>
      <DesignStudio/>
    </Suspense>
  );
}

const LS: React.CSSProperties = {display:'block',fontSize:'0.59rem',fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6};
const INP: React.CSSProperties = {width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.09)',borderRadius:9,padding:'8px 10px',color:'#fff',fontSize:'0.82rem',outline:'none'};
