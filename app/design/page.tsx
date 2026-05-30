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
type Layer = { id:string; type:'text'|'gfx'; content:string; x:number; y:number; fontSize:number; fontFamily:string; color:string; fontWeight:'normal'|'bold'; italic:boolean; rotation:number };
type ImagePos = 'top'|'center'|'bottom'|'full-body'|'full-shirt';
type UploadSlot = 'front'|'back'|'chest';
type Session = { type:'guest'|'user'; customerId?:string; name:string; email?:string };

// ─── Constants ────────────────────────────────────────────────
const SVG_W = 200, SVG_H = 230;
const PRINT = { x:60, y:85, w:80, h:105 };
const SHIRT_PATH = 'M32 57 L2 82 L26 97 L21 222 L179 222 L174 97 L198 82 L168 57 L144 72 Q129 30 100 28 Q71 30 56 72 Z';

const IMG_ZONE: Record<ImagePos,{x:number;y:number;w:number;h:number;clip:'body'|'full';slice?:boolean}> = {
  top:          {x:60,y:90,  w:80,h:44, clip:'body'},
  center:       {x:60,y:115, w:80,h:50, clip:'body'},
  bottom:       {x:60,y:148, w:80,h:42, clip:'body'},
  'full-body':  {x:60,y:90,  w:80,h:110,clip:'body'},
  'full-shirt': {x:20,y:30,  w:160,h:190,clip:'full',slice:true},
};
const POS_LABELS: Record<ImagePos,string> = {top:'Top',center:'Center',bottom:'Bottom','full-body':'Full front','full-shirt':'All over'};

const FONTS = [
  {id:'system-ui,sans-serif',              label:'Sans'},
  {id:'"Georgia",serif',                   label:'Serif'},
  {id:'"Courier New",monospace',           label:'Mono'},
  {id:'"Impact","Arial Black",sans-serif', label:'Impact'},
];
const EMOJIS = ['🔥','⚡','💀','🎭','🌊','🦁','🎨','🎵','🏆','💎','🌙','⭐','🚀','🎯','🐉','👑','☠','✦','★','◆'];
const TEXT_COLORS = ['#ffffff','#000000','#FF4D1C','#FFD700','#10B981','#6C63FF','#FF69B4','#00BCD4'];
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function uid() { return Math.random().toString(36).slice(2,9); }

// ─── Component ────────────────────────────────────────────────
function DesignStudio() {
  const router = useRouter();

  const [session, setSession] = useState<Session|null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      setSession(raw ? JSON.parse(raw) : {type:'guest',name:'Guest'});
    } catch { setSession({type:'guest',name:'Guest'}); }
  }, []);

  // Default to white so the shirt is immediately visible
  const whiteColor = SHIRT_COLORS.find(c=>c.id==='white') ?? SHIRT_COLORS[1];
  const [color, setColor]       = useState<TShirtColor>(whiteColor);
  const [size,  setSize]        = useState<TShirtSize|null>(null);
  const [showBack, setShowBack] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const [layers, setLayers]     = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const layersRef = useRef<Layer[]>(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  const dragging  = useRef<{id:string;sx:number;sy:number;ox:number;oy:number}|null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  const [uploads, setUploads]       = useState<Record<UploadSlot,string|null>>({front:null,back:null,chest:null});
  const [uploadSlot, setUploadSlot] = useState<UploadSlot>('front');
  const [imgPos, setImgPos]         = useState<Record<'front'|'back',ImagePos>>({front:'center',back:'center'});
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileDragging, setFileDragging] = useState(false);

  const [aiPrompt, setAiPrompt]     = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiSvg, setAiSvg]           = useState<string|null>(null);

  const [textInput,  setTextInput]  = useState('');
  const [fontSize,   setFontSize]   = useState(18);
  const [fontFam,    setFontFam]    = useState(FONTS[0].id);
  const [textColor,  setTextColor]  = useState('#000000');
  const [fontWeight, setFontWeight] = useState<'normal'|'bold'>('bold');
  const [italic,     setItalic]     = useState(false);

  const [designTab,    setDesignTab]    = useState<'text'|'upload'|'ai'|'gfx'>('text');
  const [showOrderForm, setShowOrderForm] = useState(false);

  const [shipName,   setShipName]   = useState('');
  const [shipEmail,  setShipEmail]  = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity,   setShipCity]   = useState('');
  const [shipZip,    setShipZip]    = useState('');
  const [shipState,  setShipState]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ordered,    setOrdered]    = useState(false);
  const [orderId,    setOrderId]    = useState<string|null>(null);
  const [orderError, setOrderError] = useState<string|null>(null);
  const { show: showToast, element: toastEl } = useToast();

  useEffect(() => {
    if (!session) return;
    if (session.name && session.name !== 'Guest') setShipName(session.name);
    if (session.email) setShipEmail(session.email);
    try {
      const s = localStorage.getItem('pd_shipping');
      if (s) { const d=JSON.parse(s); setShipStreet(d.street??''); setShipCity(d.city??''); setShipZip(d.zip??''); setShipState(d.state??''); }
    } catch { /* ignore */ }
  }, [session]);

  // Update text color default when shirt color changes (dark shirt → white text)
  useEffect(() => {
    setTextColor(color.textColor);
  }, [color]);

  // ── Layers ───────────────────────────────────────────────────
  const selLayer = layers.find(l=>l.id===selected)??null;

  function addText() {
    if (!textInput.trim()) return;
    const l: Layer = {id:uid(),type:'text',content:textInput,x:50,y:50,fontSize,fontFamily:fontFam,color:textColor,fontWeight,italic,rotation:0};
    setLayers(p=>[...p,l]); setSelected(l.id); setTextInput('');
  }
  function addGfx(c:string) {
    const l: Layer = {id:uid(),type:'gfx',content:c,x:50,y:45,fontSize:32,fontFamily:'system-ui',color:color.textColor,fontWeight:'normal',italic:false,rotation:0};
    setLayers(p=>[...p,l]); setSelected(l.id);
  }
  function updateLayer(id:string, patch:Partial<Layer>) {
    setLayers(p=>p.map(l=>l.id===id?{...l,...patch}:l));
  }
  function deleteLayer(id:string) {
    setLayers(p=>p.filter(l=>l.id!==id));
    if(selected===id) setSelected(null);
  }

  useEffect(() => {
    if (!selLayer || selLayer.type!=='text') return;
    setFontSize(selLayer.fontSize); setFontFam(selLayer.fontFamily);
    setTextColor(selLayer.color); setFontWeight(selLayer.fontWeight); setItalic(selLayer.italic);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag ─────────────────────────────────────────────────────
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
    function onBeforeUnload(e:BeforeUnloadEvent) { if(layersRef.current.length>0) e.preventDefault(); }
    window.addEventListener('beforeunload',onBeforeUnload);
    return ()=>window.removeEventListener('beforeunload',onBeforeUnload);
  }, []);

  useEffect(() => {
    function onKey(e:KeyboardEvent) {
      const notInput = !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement);
      if((e.key==='Delete'||e.key==='Backspace')&&selected&&notInput) deleteLayer(selected);
      if(e.key==='Escape') { setSelected(null); setFullscreen(false); }
      if(selected&&notInput) {
        const step = e.shiftKey?5:1;
        if(e.key==='ArrowLeft')  { e.preventDefault(); updateLayer(selected,{x:Math.max(0,  (layers.find(l=>l.id===selected)?.x??50)-step)}); }
        if(e.key==='ArrowRight') { e.preventDefault(); updateLayer(selected,{x:Math.min(100,(layers.find(l=>l.id===selected)?.x??50)+step)}); }
        if(e.key==='ArrowUp')    { e.preventDefault(); updateLayer(selected,{y:Math.max(0,  (layers.find(l=>l.id===selected)?.y??50)-step)}); }
        if(e.key==='ArrowDown')  { e.preventDefault(); updateLayer(selected,{y:Math.min(100,(layers.find(l=>l.id===selected)?.y??50)+step)}); }
      }
    }
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload ───────────────────────────────────────────────────
  function handleFile(file:File) {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = e => setUploads(p=>({...p,[uploadSlot]:e.target?.result as string}));
    r.readAsDataURL(file);
  }

  // ── AI ───────────────────────────────────────────────────────
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

  // ── Order ────────────────────────────────────────────────────
  const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipEmail);
  const deliveryDone = shipName.trim().length>1 && emailValid && shipStreet.trim().length>3 && shipCity.trim().length>1 && /^\d{5}$/.test(shipZip) && shipState!=='';
  const canOrder     = color && size && deliveryDone;
  const total        = 24.99 + SHIPPING_PRICE;

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
        setOrderId(result.id); setOrdered(true); showToast('Order placed! 🎉','success');
      } else { setOrderError('Order failed. Please try again.'); showToast('Order failed.','error'); }
    } catch { setOrderError('Network error. Please try again.'); showToast('Network error.','error'); } finally { setSubmitting(false); }
  }

  function switchTab(tab: typeof designTab) {
    setDesignTab(tab);
    setTimeout(()=>{
      if (panelRef.current) {
        const el = panelRef.current.querySelector('[data-design-section]') as HTMLElement;
        if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }, 50);
  }

  // ── SVG helpers ──────────────────────────────────────────────
  const activeImg = showBack ? uploads.back  : uploads.front;
  const activePos = showBack ? imgPos.back   : imgPos.front;
  const zone      = IMG_ZONE[activePos];

  // Determine if shirt is light (needs dark UI elements)
  const isLightShirt = color.id === 'white' || color.id === 'sand';

  function renderLayers(interactive=true) {
    return layers.map(layer => {
      const lx   = PRINT.x+(layer.x/100)*PRINT.w;
      const ly   = PRINT.y+(layer.y/100)*PRINT.h;
      const isSel = selected===layer.id && interactive;
      const aw   = layer.type==='text' ? layer.content.length*layer.fontSize*0.58 : layer.fontSize*1.1;
      const ah   = layer.fontSize*1.3;
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
              fill="rgba(0,229,200,0.06)" stroke="#00E5C8" strokeWidth="0.8" strokeDasharray="2.5,1.5" rx="2"/>
            {[[-aw/2-5,-ah/2-3],[aw/2+5,-ah/2-3],[-aw/2-5,ah/2+3],[aw/2+5,ah/2+3]].map(([cx,cy],i)=>
              <circle key={i} cx={cx} cy={cy} r="2" fill="#00E5C8"/>)}
          </>}
        </g>
      );
    });
  }

  function ShirtCanvas({w,h,interactive=true}:{w:number;h:number;interactive?:boolean}) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${SVG_W} ${SVG_H}`} fill="none">
        <defs>
          <filter id="cs"><feDropShadow dx="0" dy="14" stdDeviation="20" floodColor="rgba(0,0,0,0.5)"/></filter>
          <filter id="platform"><feGaussianBlur stdDeviation="5"/></filter>
          <linearGradient id="cg" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={color.hex} stopOpacity="1"/>
            <stop offset="100%" stopColor={color.hex} stopOpacity="0.9"/>
          </linearGradient>
          {/* Top highlight — simulates studio lighting */}
          <linearGradient id="ch" x1="0.15" y1="0" x2="0.85" y2="0.45">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="60%" stopColor="rgba(255,255,255,0.04)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          {/* Subtle teal spotlight */}
          <radialGradient id="spotlight" cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="rgba(0,229,200,0.06)"/>
            <stop offset="100%" stopColor="rgba(0,229,200,0)"/>
          </radialGradient>
          <clipPath id="ccb"><rect x="56" y="82" width="88" height="130"/></clipPath>
          <clipPath id="ccf"><path d={SHIRT_PATH}/></clipPath>
        </defs>

        {/* Platform shadow */}
        <ellipse cx="100" cy="226" rx="72" ry="7" fill="rgba(0,0,0,0.32)" filter="url(#platform)"/>

        {/* Shirt body */}
        <path d={SHIRT_PATH} fill="url(#cg)" filter="url(#cs)"/>

        {/* Fold shadows on sleeves */}
        <path d="M32 57 L2 82 L26 97 L21 222 L34 222 L34 97 L26 97 L2 82 L32 57Z" fill="rgba(0,0,0,0.08)"/>
        <path d="M168 57 L198 82 L174 97 L179 222 L166 222 L166 97 L174 97 L198 82 L168 57Z" fill="rgba(0,0,0,0.06)"/>

        {/* Collar shadow */}
        <path d="M56 72 Q71 51 100 49 Q129 51 144 72 Q129 59 100 57 Q71 59 56 72Z" fill="rgba(0,0,0,0.22)"/>

        {/* Surface highlight */}
        <path d={SHIRT_PATH} fill="url(#ch)"/>

        {/* Teal spotlight overlay */}
        <path d={SHIRT_PATH} fill="url(#spotlight)"/>

        {/* Side seam hints */}
        <line x1="36" y1="100" x2="26" y2="220" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5"/>
        <line x1="164" y1="100" x2="174" y2="220" stroke="rgba(0,0,0,0.05)" strokeWidth="1.5"/>

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
            fill={isLightShirt?'rgba(0,0,0,0.02)':'rgba(255,255,255,0.03)'}
            stroke={isLightShirt?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.18)'}
            strokeDasharray="3,2" rx="3" strokeWidth="0.8"/>
        )}
        {/* Back label */}
        {showBack && <text x="100" y="170" textAnchor="middle" fill={isLightShirt?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.2)'} fontSize="7" fontWeight="700" letterSpacing="3">BACK</text>}
        {renderLayers(interactive)}
      </svg>
    );
  }

  // ── Order success ─────────────────────────────────────────────
  if (ordered) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#050507,#060610)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.07) 0%,transparent 60%)',top:'-15%',right:'5%',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,255,0.05) 0%,transparent 65%)',bottom:'0%',left:'-5%',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',maxWidth:400,position:'relative',zIndex:1,padding:'0 24px'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(0,229,200,0.1)',border:'1px solid rgba(0,229,200,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,margin:'0 auto 20px',boxShadow:'0 0 40px rgba(0,229,200,0.15)'}}>🎉</div>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:'3rem',fontWeight:400,letterSpacing:'0.05em',marginBottom:8,lineHeight:1}}>Order Placed!</h1>
        <p style={{color:'rgba(255,255,255,0.45)',marginBottom:4}}>{color?.name} · Size {size}</p>
        {orderId && <p style={{color:'rgba(255,255,255,0.15)',fontSize:'0.68rem',fontFamily:'monospace',marginBottom:10}}>#{orderId.slice(0,8).toUpperCase()}</p>}
        <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.3)',marginBottom:28,lineHeight:1.6}}>Your custom shirt is being prepared. Track it on your <Link href="/profile" style={{color:'#00E5C8',textDecoration:'none'}}>profile page</Link>.</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={()=>{setOrdered(false);setLayers([]);setAiSvg(null);setUploads({front:null,back:null,chest:null});}} style={{padding:'0.85rem 1.6rem',borderRadius:12,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.75)',fontWeight:700,cursor:'pointer',fontSize:'0.85rem',transition:'all 0.15s'}}>Design another</button>
          <Link href="/catalog" style={{padding:'0.85rem 1.8rem',borderRadius:12,background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,textDecoration:'none',display:'inline-flex',alignItems:'center',fontSize:'0.85rem'}}>Browse catalog →</Link>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'#050507',color:'white',overflow:'hidden'}}>
      {toastEl}

      {/* Fullscreen */}
      {fullscreen && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'radial-gradient(ellipse at 50% 38%,rgba(16,16,26,1) 0%,rgba(4,4,6,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fsIn 0.25s ease'}}
          onClick={()=>setFullscreen(false)}>
          <div style={{filter:'drop-shadow(0 50px 100px rgba(0,0,0,0.9))'}}>
            <ShirtCanvas w={500} h={575} interactive={false}/>
          </div>
          <p style={{marginTop:32,color:'rgba(255,255,255,0.15)',fontSize:'0.65rem',letterSpacing:'0.14em',textTransform:'uppercase'}}>Click anywhere to close</p>
          <button onClick={e=>{e.stopPropagation();setFullscreen(false);}} style={{position:'absolute',top:24,right:28,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 20px',color:'rgba(255,255,255,0.5)',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'}}>✕ Close</button>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header style={{height:52,flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 20px',gap:14,background:'rgba(5,5,7,0.97)',backdropFilter:'blur(24px)',position:'relative',zIndex:10}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent 0%,rgba(0,229,200,0.5) 40%,rgba(0,153,255,0.3) 70%,transparent 100%)'}}/>

        <Link href="/catalog"
          style={{display:'flex',alignItems:'center',gap:5,color:'rgba(255,255,255,0.28)',fontSize:'0.68rem',textDecoration:'none',fontWeight:700,letterSpacing:'0.06em',transition:'color 0.15s',flexShrink:0,textTransform:'uppercase'}}
          onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.65)')}
          onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.28)')}>
          ← Catalog
        </Link>
        <div style={{width:1,height:16,background:'rgba(255,255,255,0.07)',flexShrink:0}}/>
        <h1 style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontWeight:400,fontSize:'1.5rem',letterSpacing:'0.1em',lineHeight:1,margin:0,flex:1}}>
          DESIGN<span style={{color:'#00E5C8'}}>.</span>STUDIO
        </h1>

        <div style={{display:'flex',gap:7,alignItems:'center'}}>
          {size && (
            <span style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:'3px 10px',fontSize:'0.58rem',fontWeight:700,color:'rgba(255,255,255,0.4)',letterSpacing:'0.06em',display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:color.hex,display:'inline-block',outline:`1px solid rgba(255,255,255,0.15)`,outlineOffset:1}}/>
              {color.name} / {size}
            </span>
          )}
          {layers.length>0 && (
            <span style={{background:'rgba(0,229,200,0.09)',border:'1px solid rgba(0,229,200,0.2)',borderRadius:20,padding:'3px 10px',fontSize:'0.58rem',fontWeight:700,color:'#00E5C8',letterSpacing:'0.07em'}}>
              {layers.length} layer{layers.length!==1?'s':''}
            </span>
          )}
        </div>

        <button onClick={()=>setFullscreen(true)}
          style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'5px 13px',color:'rgba(255,255,255,0.35)',fontSize:'0.65rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',transition:'all 0.15s',flexShrink:0}}
          onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.09)');(e.currentTarget.style.borderColor='rgba(0,229,200,0.25)');(e.currentTarget.style.color='#00E5C8');}}
          onMouseLeave={e=>{(e.currentTarget.style.background='rgba(255,255,255,0.04)');(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');}}>
          ⛶ PREVIEW
        </button>
      </header>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div className="design-body" style={{flex:1,display:'grid',gridTemplateColumns:'1fr 390px',overflow:'hidden',minHeight:0}}>

        {/* ── CANVAS AREA ───────────────────────────────────────── */}
        <div style={{background:'radial-gradient(ellipse at 50% 30%,rgba(12,12,20,1) 0%,rgba(4,4,7,1) 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',gap:0}}
          onClick={()=>setSelected(null)}>

          {/* Ambient orbs */}
          <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.045) 0%,transparent 60%)',top:'-20%',right:'-10%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,100,255,0.035) 0%,transparent 65%)',bottom:'-8%',left:'-5%',pointerEvents:'none'}}/>

          {/* Grid overlay */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.02,backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>

          {/* Corner brackets */}
          <div style={{position:'absolute',top:12,left:12,width:20,height:20,borderTop:'1px solid rgba(0,229,200,0.2)',borderLeft:'1px solid rgba(0,229,200,0.2)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:12,right:12,width:20,height:20,borderTop:'1px solid rgba(0,229,200,0.2)',borderRight:'1px solid rgba(0,229,200,0.2)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:56,left:12,width:20,height:20,borderBottom:'1px solid rgba(0,229,200,0.2)',borderLeft:'1px solid rgba(0,229,200,0.2)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:56,right:12,width:20,height:20,borderBottom:'1px solid rgba(0,229,200,0.2)',borderRight:'1px solid rgba(0,229,200,0.2)',pointerEvents:'none'}}/>

          {/* Front/Back toggle */}
          <div style={{position:'absolute',top:16,left:16,background:'rgba(4,4,7,0.88)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:3,display:'flex',gap:2,backdropFilter:'blur(14px)',zIndex:2}}>
            {['Front','Back'].map(s=>(
              <button key={s} aria-pressed={(s==='Back')===showBack}
                onClick={e=>{e.stopPropagation();setShowBack(s==='Back');}}
                style={{padding:'5px 14px',borderRadius:9,border:'none',cursor:'pointer',background:(s==='Back')===showBack?'rgba(0,229,200,0.13)':'transparent',color:(s==='Back')===showBack?'#00E5C8':'rgba(255,255,255,0.28)',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.07em',transition:'all 0.15s'}}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Fullscreen */}
          <button onClick={e=>{e.stopPropagation();setFullscreen(true);}}
            style={{position:'absolute',top:16,right:16,background:'rgba(4,4,7,0.88)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:'6px 14px',color:'rgba(255,255,255,0.35)',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',backdropFilter:'blur(14px)',letterSpacing:'0.06em',transition:'all 0.15s',zIndex:2}}
            onMouseEnter={e=>{(e.currentTarget.style.background='rgba(0,229,200,0.1)');(e.currentTarget.style.borderColor='rgba(0,229,200,0.25)');(e.currentTarget.style.color='#00E5C8');}}
            onMouseLeave={e=>{(e.currentTarget.style.background='rgba(4,4,7,0.88)');(e.currentTarget.style.borderColor='rgba(255,255,255,0.09)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');}}>
            ⛶ FULLSCREEN
          </button>

          {/* ── SHIRT STAGE ───────────────────────────────── */}
          <div style={{
            position:'relative',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            flex:1,
            width:'100%',
            paddingBottom:8,
          }}>
            {/* Stage card glow */}
            <div style={{position:'absolute',width:360,height:460,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(255,255,255,0.025) 0%,transparent 65%)',pointerEvents:'none'}}/>

            {/* Shirt */}
            <div ref={canvasRef}
              role="img"
              aria-label="Shirt design canvas — drag elements to position them"
              style={{
                position:'relative',
                filter:`drop-shadow(0 40px 80px rgba(0,0,0,0.6)) drop-shadow(0 0 ${isLightShirt?'60px rgba(255,255,255,0.06)':'60px rgba(0,229,200,0.04)'})`,
                animation:'shirtIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                zIndex:1,
              }}>
              <ShirtCanvas w={370} h={426}/>
            </div>

            {/* Selected layer bar */}
            {selLayer && (
              <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',background:'rgba(4,4,7,0.94)',border:'1px solid rgba(0,229,200,0.22)',borderRadius:12,padding:'7px 16px',display:'flex',alignItems:'center',gap:10,backdropFilter:'blur(16px)',fontSize:'0.68rem',animation:'fadeUp 0.15s ease',boxShadow:'0 4px 20px rgba(0,229,200,0.07)',whiteSpace:'nowrap',zIndex:3}}>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:'0.56rem',letterSpacing:'0.1em'}}>SELECTED</span>
                <span style={{fontWeight:700,color:'#00E5C8',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis'}}>{selLayer.content}</span>
                <span style={{color:'rgba(255,255,255,0.1)'}}>·</span>
                <span style={{color:'rgba(255,255,255,0.22)',fontSize:'0.6rem'}}>Drag · Arrow keys · Del</span>
                <button onClick={e=>{e.stopPropagation();deleteLayer(selLayer.id);}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,padding:'3px 9px',color:'#f87171',fontSize:'0.58rem',fontWeight:700,cursor:'pointer'}}>✕</button>
              </div>
            )}
          </div>

          {/* ── QUICK ACTION TOOLBAR ───────────────────────── */}
          <div style={{
            display:'flex',
            gap:6,
            padding:'0 20px 14px',
            flexShrink:0,
            animation:'fadeUp 0.4s ease 0.2s both',
          }}>
            {([
              {id:'text'   as const, icon:'✏', label:'Text'},
              {id:'upload' as const, icon:'📁', label:'Upload'},
              {id:'ai'     as const, icon:'✦', label:'AI Design'},
              {id:'gfx'    as const, icon:'◆', label:'Graphics'},
            ]).map(({id,icon,label}) => (
              <button key={id} onClick={e=>{e.stopPropagation();switchTab(id);}}
                style={{
                  padding:'8px 16px',
                  borderRadius:11,
                  border:`1px solid ${designTab===id?'rgba(0,229,200,0.3)':'rgba(255,255,255,0.08)'}`,
                  background:designTab===id?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.03)',
                  color:designTab===id?'#00E5C8':'rgba(255,255,255,0.4)',
                  fontSize:'0.68rem',
                  fontWeight:700,
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:6,
                  backdropFilter:'blur(10px)',
                  transition:'all 0.15s',
                  letterSpacing:'0.04em',
                }}
                onMouseEnter={e=>{if(designTab!==id){(e.currentTarget.style.borderColor='rgba(255,255,255,0.14)');(e.currentTarget.style.color='rgba(255,255,255,0.65)');}}}
                onMouseLeave={e=>{if(designTab!==id){(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)');(e.currentTarget.style.color='rgba(255,255,255,0.4)');}}}
                >
                <span style={{fontSize:'0.8rem'}}>{icon}</span>{label}
              </button>
            ))}

            {/* Empty state hint */}
            {layers.length===0&&!activeImg&&!aiSvg&&!showBack&&(
              <span style={{display:'flex',alignItems:'center',color:'rgba(255,255,255,0.12)',fontSize:'0.65rem',marginLeft:6,letterSpacing:'0.06em'}}>← start here</span>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────── */}
        <div style={{borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',background:'rgba(7,7,11,1)',overflow:'hidden'}}>
          <div ref={panelRef} style={{flex:1,overflowY:'auto',minHeight:0}}>

            {/* ─── SHIRT ──────────────────────────────────────── */}
            <div style={{padding:'16px 16px 14px'}}>
              <div style={SHEAD}><span style={{opacity:0.45}}>👕</span> SHIRT</div>

              <div style={{marginBottom:16}}>
                <div style={LS}>Color <span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:500,fontSize:'0.72rem'}}>{color.name}</span></div>
                <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
                  {SHIRT_COLORS.map(c=>(
                    <button key={c.id} title={c.name} aria-label={`Color: ${c.name}`} aria-pressed={color.id===c.id} onClick={()=>setColor(c)}
                      style={{
                        width:34, height:34, borderRadius:'50%', border:'none', background:c.hex, cursor:'pointer',
                        outline:color.id===c.id?'3px solid #00E5C8':'2px solid rgba(255,255,255,0.06)',
                        outlineOffset:3,
                        boxShadow:color.id===c.id?`0 0 16px ${c.hex}99,0 0 6px ${c.hex}55`:`inset 0 1px 0 rgba(255,255,255,0.15)`,
                        transition:'all 0.15s',
                        transform:color.id===c.id?'scale(1.18)':'scale(1)',
                      }}/>
                  ))}
                </div>
              </div>

              <div>
                <div style={LS}>Size {size&&<span style={{color:'#00E5C8',textTransform:'none',letterSpacing:0,fontWeight:500,fontSize:'0.72rem'}}>— {size}</span>}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {SHIRT_SIZES.map(s=>(
                    <button key={s} aria-pressed={size===s} onClick={()=>setSize(s)}
                      style={{
                        width:46, height:46, borderRadius:11, cursor:'pointer',
                        border:`1.5px solid ${size===s?'#00E5C8':'rgba(255,255,255,0.07)'}`,
                        background:size===s?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.02)',
                        color:size===s?'#00E5C8':'rgba(255,255,255,0.32)',
                        fontWeight:800, fontSize:'0.78rem', transition:'all 0.15s',
                        transform:size===s?'scale(1.06)':'scale(1)',
                        boxShadow:size===s?'0 0 14px rgba(0,229,200,0.16)':'none',
                      }}>{s}</button>
                  ))}
                </div>
                <p style={{marginTop:7,fontSize:'0.57rem',color:'rgba(255,255,255,0.15)',letterSpacing:'0.04em'}}>Unisex · 100% ring-spun cotton · Pre-shrunk</p>
              </div>
            </div>
            <div style={DIV}/>

            {/* ─── DESIGN ─────────────────────────────────────── */}
            <div style={{padding:'14px 16px 14px'}} data-design-section>
              <div style={SHEAD}><span style={{opacity:0.45}}>✏</span> DESIGN</div>

              {/* Tool tabs */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3,background:'rgba(0,0,0,0.45)',borderRadius:11,padding:3,marginBottom:14}}>
                {([['text','✏','Text'],['upload','📁','Upload'],['ai','✦','AI'],['gfx','◆','GFX']] as const).map(([id,icon,label])=>(
                  <button key={id} role="tab" aria-selected={designTab===id} onClick={()=>setDesignTab(id)}
                    style={{padding:'7px 2px',borderRadius:8,border:'none',cursor:'pointer',background:designTab===id?'rgba(0,229,200,0.1)':'transparent',color:designTab===id?'#00E5C8':'rgba(255,255,255,0.22)',fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.04em',transition:'all 0.13s',display:'flex',flexDirection:'column',alignItems:'center',gap:3,borderBottom:designTab===id?'1px solid rgba(0,229,200,0.28)':'1px solid transparent'}}>
                    <span style={{fontSize:'0.88rem'}}>{icon}</span>
                    <span style={{textTransform:'uppercase'}}>{label}</span>
                  </button>
                ))}
              </div>

              {/* TEXT */}
              {designTab==='text' && (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div>
                    <div style={LS}>Your Text</div>
                    <div style={{display:'flex',gap:6}}>
                      <input aria-label="Text to add" value={textInput} onChange={e=>setTextInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addText()} placeholder="Type something..." maxLength={40}
                        style={{flex:1,...INP}} onFocus={e=>(e.target.style.borderColor='rgba(0,229,200,0.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.08)')}/>
                      <button onClick={addText} disabled={!textInput.trim()}
                        style={{width:42,borderRadius:9,border:'none',background:textInput.trim()?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.05)',color:textInput.trim()?'#050507':'rgba(255,255,255,0.15)',fontSize:'1.2rem',fontWeight:700,cursor:textInput.trim()?'pointer':'default',transition:'all 0.15s',flexShrink:0}}>+</button>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:7}}>
                      {['YOUR NAME','EST. 2025','ORIGINAL','NO RULES'].map(t=>(
                        <button key={t} onClick={()=>setTextInput(t)}
                          style={{padding:'3px 9px',borderRadius:20,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.28)',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.04em',transition:'border-color 0.12s'}}
                          onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(0,229,200,0.3)')}
                          onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={LS}>Font</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                      {FONTS.map(f=>(
                        <button key={f.id} aria-pressed={fontFam===f.id} onClick={()=>{setFontFam(f.id);if(selected)updateLayer(selected,{fontFamily:f.id});}}
                          style={{padding:'8px',borderRadius:8,cursor:'pointer',background:fontFam===f.id?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',border:`1.5px solid ${fontFam===f.id?'rgba(0,229,200,0.32)':'rgba(255,255,255,0.06)'}`,color:fontFam===f.id?'#00E5C8':'rgba(255,255,255,0.32)',fontSize:'0.78rem',fontWeight:600,fontFamily:f.id,transition:'all 0.13s'}}>{f.label}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Size</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{fontSize}px</span></div>
                    <input type="range" aria-label="Font size" min={8} max={64} value={fontSize} onChange={e=>{const v=+e.target.value;setFontSize(v);if(selected)updateLayer(selected,{fontSize:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
                  </div>

                  <div style={{display:'flex',gap:10}}>
                    <div>
                      <div style={LS}>Style</div>
                      <div style={{display:'flex',gap:5}}>
                        <button aria-label="Bold" aria-pressed={fontWeight==='bold'} onClick={()=>{const n:typeof fontWeight=fontWeight==='bold'?'normal':'bold';setFontWeight(n);if(selected)updateLayer(selected,{fontWeight:n});}}
                          style={{width:44,height:38,borderRadius:8,cursor:'pointer',background:fontWeight==='bold'?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.03)',border:`1.5px solid ${fontWeight==='bold'?'rgba(0,229,200,0.32)':'rgba(255,255,255,0.06)'}`,color:fontWeight==='bold'?'#00E5C8':'rgba(255,255,255,0.28)',fontWeight:'bold',fontSize:'0.95rem',transition:'all 0.13s'}}>B</button>
                        <button aria-label="Italic" aria-pressed={italic} onClick={()=>{const n=!italic;setItalic(n);if(selected)updateLayer(selected,{italic:n});}}
                          style={{width:44,height:38,borderRadius:8,cursor:'pointer',background:italic?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.03)',border:`1.5px solid ${italic?'rgba(0,229,200,0.32)':'rgba(255,255,255,0.06)'}`,color:italic?'#00E5C8':'rgba(255,255,255,0.28)',fontStyle:'italic',fontWeight:700,fontSize:'0.95rem',transition:'all 0.13s'}}>I</button>
                      </div>
                    </div>
                    {selLayer && selLayer.type==='text' && (
                      <div style={{flex:1}}>
                        <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Rotation</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{selLayer.rotation}°</span></div>
                        <input type="range" aria-label="Rotation" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginTop:8}}/>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={LS}>Text Color</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                      {TEXT_COLORS.map(c=>(
                        <button key={c} aria-label={`Color ${c}`} aria-pressed={textColor===c} onClick={()=>{setTextColor(c);if(selected)updateLayer(selected,{color:c});}}
                          style={{width:28,height:28,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:textColor===c?'2.5px solid #00E5C8':'2px solid rgba(255,255,255,0.08)',outlineOffset:2,transition:'all 0.12s',transform:textColor===c?'scale(1.18)':'scale(1)'}}/>
                      ))}
                      <label style={{width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.1)',fontSize:'0.85rem',position:'relative'}}>
                        +<input type="color" aria-hidden tabIndex={-1} value={textColor} onChange={e=>{setTextColor(e.target.value);if(selected)updateLayer(selected,{color:e.target.value});}} style={{opacity:0,position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%',cursor:'pointer'}}/>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD */}
              {designTab==='upload' && (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'flex',gap:4}}>
                    {([['front','Front',uploads.front],['back','Back',uploads.back],['chest','Chest',uploads.chest]] as [UploadSlot,string,string|null][]).map(([slot,label,img])=>(
                      <button key={slot} aria-pressed={uploadSlot===slot} onClick={()=>setUploadSlot(slot)}
                        style={{flex:1,padding:'7px',borderRadius:8,border:'1px solid',borderColor:uploadSlot===slot?'rgba(0,229,200,0.38)':'rgba(255,255,255,0.07)',background:uploadSlot===slot?'rgba(0,229,200,0.07)':'rgba(255,255,255,0.01)',color:uploadSlot===slot?'#00E5C8':'rgba(255,255,255,0.28)',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',transition:'all 0.13s',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                        {label}{img&&<span style={{width:5,height:5,borderRadius:'50%',background:'#10B981'}}/>}
                      </button>
                    ))}
                  </div>

                  <div onDragEnter={e=>{e.preventDefault();setFileDragging(true);}} onDragLeave={()=>setFileDragging(false)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setFileDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}} onClick={()=>fileRef.current?.click()}
                    style={{border:`2px dashed ${fileDragging?'rgba(0,229,200,0.5)':uploads[uploadSlot]?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:14,padding:'1.5rem 1rem',textAlign:'center',cursor:'pointer',background:fileDragging?'rgba(0,229,200,0.04)':uploads[uploadSlot]?'rgba(16,185,129,0.02)':'rgba(255,255,255,0.01)',transition:'all 0.2s'}}>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value='';}}/>
                    {uploads[uploadSlot]
                      ? <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center'}}><img src={uploads[uploadSlot]!} alt="upload" style={{height:54,maxWidth:100,borderRadius:6,objectFit:'contain'}}/><div><div style={{fontSize:'0.7rem',color:'#10B981',fontWeight:700}}>✓ Uploaded</div><div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.25)',marginTop:2}}>Click to replace</div></div></div>
                      : <><div style={{fontSize:28,marginBottom:6}}>📁</div><div style={{fontWeight:700,color:'rgba(255,255,255,0.45)',fontSize:'0.78rem',marginBottom:4}}>Drop image here</div><div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.2)'}}>PNG · JPG · SVG — click to browse</div></>}
                  </div>

                  {uploadSlot!=='chest' && (
                    <div>
                      <div style={LS}>Position</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {(Object.keys(POS_LABELS) as ImagePos[]).map(p=>(
                          <button key={p} aria-pressed={imgPos[uploadSlot==='front'?'front':'back']===p} onClick={()=>setImgPos(prev=>({...prev,[uploadSlot==='front'?'front':'back']:p}))}
                            style={{padding:'4px 10px',borderRadius:999,border:'1px solid',borderColor:imgPos[uploadSlot==='front'?'front':'back']===p?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.07)',background:imgPos[uploadSlot==='front'?'front':'back']===p?'rgba(0,229,200,0.07)':'transparent',color:imgPos[uploadSlot==='front'?'front':'back']===p?'#00E5C8':'rgba(255,255,255,0.28)',fontSize:'0.62rem',fontWeight:600,cursor:'pointer',transition:'all 0.13s'}}>
                            {POS_LABELS[p]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {uploads[uploadSlot] && <button onClick={()=>setUploads(p=>({...p,[uploadSlot]:null}))} style={{padding:'8px',borderRadius:9,border:'1px solid rgba(239,68,68,0.18)',background:'rgba(239,68,68,0.06)',color:'#f87171',fontSize:'0.68rem',fontWeight:700,cursor:'pointer'}}>🗑 Remove image</button>}
                </div>
              )}

              {/* AI */}
              {designTab==='ai' && (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{background:'linear-gradient(135deg,rgba(0,229,200,0.05),rgba(0,153,255,0.04))',border:'1px solid rgba(0,229,200,0.1)',borderRadius:12,padding:'11px 13px'}}>
                    <div style={{fontSize:'0.57rem',color:'#00E5C8',fontWeight:700,letterSpacing:'0.1em',marginBottom:5}}>✦ AI DESIGN GENERATOR</div>
                    <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.3)',lineHeight:1.55}}>Describe your idea — AI picks the best matching design from the catalog.</div>
                  </div>

                  <div>
                    <div style={LS}>Describe your design</div>
                    <textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="e.g. A minimalist mountain with bold typography..." rows={4} maxLength={200} aria-label="AI design prompt"
                      style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 12px',color:'#fff',fontSize:'0.8rem',outline:'none',resize:'none',fontFamily:'inherit',lineHeight:1.6,transition:'border-color 0.15s'}}
                      onFocus={e=>(e.target.style.borderColor='rgba(0,229,200,0.4)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.08)')}/>
                    {aiPrompt.length>160 && <span aria-live="polite" style={{fontSize:'0.58rem',color:aiPrompt.length>190?'#f87171':'rgba(255,255,255,0.25)',textAlign:'right',display:'block',marginTop:3}}>{200-aiPrompt.length} chars left</span>}
                  </div>

                  <button onClick={generateAI} disabled={!aiPrompt.trim()||aiLoading}
                    style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:aiPrompt.trim()&&!aiLoading?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.05)',color:aiPrompt.trim()&&!aiLoading?'#050507':'rgba(255,255,255,0.18)',fontWeight:800,fontSize:'0.82rem',cursor:aiPrompt.trim()&&!aiLoading?'pointer':'default',transition:'all 0.2s',letterSpacing:'0.03em'}}>
                    {aiLoading?`Generating... ${Math.round(aiProgress)}%`:aiSvg?'↻ Regenerate':'✦ Generate Design'}
                  </button>

                  {aiLoading && <div style={{height:2,background:'rgba(255,255,255,0.05)',borderRadius:999,overflow:'hidden'}}><div style={{height:'100%',width:`${aiProgress}%`,background:'linear-gradient(90deg,#00E5C8,#0099FF)',borderRadius:999,transition:'width 0.2s'}}/></div>}

                  {aiSvg && !aiLoading && (
                    <div style={{padding:'10px 12px',background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:10,display:'flex',gap:10,alignItems:'center'}}>
                      <div style={{width:44,height:44,background:'rgba(255,255,255,0.02)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <div style={{width:32,height:32}} dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,'rgba(255,255,255,0.7)').replace('<svg ','<svg width="32" height="32" ')}}/>
                      </div>
                      <div><div style={{fontSize:'0.67rem',color:'#10B981',fontWeight:700}}>✓ Design ready</div><div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.32)',marginTop:2}}>Showing on shirt preview</div></div>
                      <button aria-label="Clear AI" onClick={()=>setAiSvg(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.2)',cursor:'pointer',fontSize:18}}>×</button>
                    </div>
                  )}

                  <div>
                    <div style={LS}>Inspiration</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {['Minimalist mountain','Neon dragon','Bold street art','Abstract waves','Vintage logo'].map(p=>(
                        <button key={p} onClick={()=>setAiPrompt(p)}
                          style={{padding:'4px 9px',borderRadius:20,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.28)',fontSize:'0.6rem',fontWeight:600,cursor:'pointer',transition:'border-color 0.12s'}}
                          onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(0,229,200,0.28)')}
                          onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GRAPHICS */}
              {designTab==='gfx' && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <div style={LS}>Emoji & Icons</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5}}>
                      {EMOJIS.map(e=>(
                        <button key={e} aria-label={`Add ${e}`} onClick={()=>addGfx(e)}
                          style={{padding:'10px 2px',borderRadius:9,cursor:'pointer',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'1.28rem',transition:'all 0.12s',lineHeight:1}}
                          onMouseEnter={x=>{(x.currentTarget.style.background='rgba(0,229,200,0.1)');(x.currentTarget.style.transform='scale(1.12)');(x.currentTarget.style.borderColor='rgba(0,229,200,0.2)');}}
                          onMouseLeave={x=>{(x.currentTarget.style.background='rgba(255,255,255,0.03)');(x.currentTarget.style.transform='scale(1)');(x.currentTarget.style.borderColor='rgba(255,255,255,0.06)');}}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selLayer && (
                    <div style={{background:'rgba(0,229,200,0.04)',border:'1px solid rgba(0,229,200,0.12)',borderRadius:10,padding:'10px 12px'}}>
                      <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Size</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{selLayer.fontSize}px</span></div>
                      <input type="range" aria-label="Size" min={12} max={80} value={selLayer.fontSize} onChange={e=>updateLayer(selLayer.id,{fontSize:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                      <div style={{marginTop:8,...LS,display:'flex',justifyContent:'space-between'}}><span>Rotation</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{selLayer.rotation}°</span></div>
                      <input type="range" aria-label="Rotation" min={-180} max={180} value={selLayer.rotation} onChange={e=>updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8'}}/>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={DIV}/>

            {/* ─── LAYERS ─────────────────────────────────────── */}
            {layers.length>0 && (
              <>
                <div style={{padding:'14px 16px 12px'}}>
                  <div style={SHEAD}><span style={{opacity:0.45}}>⊞</span> LAYERS ({layers.length})</div>
                  <div style={{display:'flex',flexDirection:'column',gap:3}}>
                    {[...layers].reverse().map(l=>(
                      <div key={l.id} onClick={()=>setSelected(l.id)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,cursor:'pointer',background:selected===l.id?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',border:`1px solid ${selected===l.id?'rgba(0,229,200,0.2)':'rgba(255,255,255,0.04)'}`,transition:'all 0.12s'}}>
                        <span style={{fontSize:'0.72rem',width:15,textAlign:'center',flexShrink:0}}>{l.type==='text'?'T':l.content}</span>
                        <span style={{flex:1,fontSize:'0.7rem',fontWeight:600,color:selected===l.id?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.content}</span>
                        <button aria-label="Remove" onClick={e=>{e.stopPropagation();deleteLayer(l.id);}} style={{width:18,height:18,borderRadius:4,border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.03)',color:'#f87171',fontSize:'0.65rem',cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={DIV}/>
              </>
            )}

            {/* ─── ORDER ──────────────────────────────────────── */}
            <div style={{padding:'14px 16px 4px'}}>
              <button onClick={()=>setShowOrderForm(p=>!p)}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'none',border:'none',cursor:'pointer',padding:'0 0 12px',textAlign:'left'}}>
                <div style={SHEAD}>
                  <span style={{opacity:0.45}}>🛒</span> ORDER
                  {canOrder && <span style={{marginLeft:8,fontSize:'0.54rem',color:'rgba(0,229,200,0.6)',fontWeight:700,letterSpacing:'0.04em',textTransform:'none'}}>— ready ✓</span>}
                  {!canOrder && <span style={{marginLeft:8,fontSize:'0.54rem',color:'rgba(245,158,11,0.55)',fontWeight:600,letterSpacing:'0.04em',textTransform:'none'}}>— incomplete</span>}
                </div>
                <span style={{color:'rgba(255,255,255,0.18)',fontSize:'0.65rem',transition:'transform 0.2s',transform:showOrderForm?'rotate(180deg)':'rotate(0)',flexShrink:0}}>▼</span>
              </button>

              {showOrderForm && (
                <div style={{display:'flex',flexDirection:'column',gap:10,paddingBottom:8}}>
                  {(!size) && <div style={{padding:'9px 12px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.16)',borderRadius:10,fontSize:'0.68rem',color:'rgba(245,158,11,0.75)',lineHeight:1.5}}>⚠ Select a size above first</div>}

                  <div style={{background:'rgba(255,255,255,0.02)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)',padding:'10px 12px'}}>
                    {[['Custom shirt','$24.99'],[`Shipping`,`$${SHIPPING_PRICE.toFixed(2)}`]].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:'0.75rem'}}>
                        <span style={{color:'rgba(255,255,255,0.32)'}}>{k}</span><span style={{color:'rgba(255,255,255,0.62)'}}>{v}</span>
                      </div>
                    ))}
                    <div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'7px 0'}}/>
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:'0.85rem'}}><span>Total</span><span style={{color:'#00E5C8'}}>${total.toFixed(2)}</span></div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div><label htmlFor="ds-name" style={LS}>Full Name</label><input id="ds-name" style={INP} name="name" autoComplete="name" value={shipName} onChange={e=>setShipName(e.target.value)} placeholder="Jane Smith" maxLength={80}/></div>
                    <div><label htmlFor="ds-email" style={LS}>Email</label><input id="ds-email" style={INP} type="email" name="email" autoComplete="email" value={shipEmail} onChange={e=>setShipEmail(e.target.value)} placeholder="you@example.com" maxLength={120}/></div>
                  </div>
                  <div><label htmlFor="ds-street" style={LS}>Street Address</label><input id="ds-street" style={INP} autoComplete="street-address" value={shipStreet} onChange={e=>setShipStreet(e.target.value)} placeholder="123 Main St" maxLength={120}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 60px 76px',gap:8}}>
                    <div><label htmlFor="ds-city" style={LS}>City</label><input id="ds-city" style={INP} autoComplete="address-level2" value={shipCity} onChange={e=>setShipCity(e.target.value)} placeholder="New York" maxLength={60}/></div>
                    <div><label htmlFor="ds-state" style={LS}>State</label>
                      <select id="ds-state" value={shipState} onChange={e=>setShipState(e.target.value)} style={{...INP,appearance:'none' as const,cursor:'pointer',color:shipState?'#fff':'rgba(255,255,255,0.22)'}}>
                        <option value="">ST</option>
                        {US_STATES.map(s=><option key={s} value={s} style={{background:'#1a1a1a'}}>{s}</option>)}
                      </select>
                    </div>
                    <div><label htmlFor="ds-zip" style={LS}>ZIP</label><input id="ds-zip" style={{...INP,fontFamily:'monospace'}} autoComplete="postal-code" inputMode="numeric" value={shipZip} onChange={e=>setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001"/></div>
                  </div>
                  <div style={{padding:'8px 10px',background:'rgba(245,158,11,0.04)',border:'1px solid rgba(245,158,11,0.1)',borderRadius:8,fontSize:'0.63rem',color:'rgba(245,158,11,0.5)',lineHeight:1.5}}>🔒 Stripe/PayPal coming soon — demo mode active</div>
                  {orderError && <div role="alert" style={{padding:'8px 10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:8,fontSize:'0.7rem',color:'#f87171',fontWeight:600}}>⚠ {orderError}</div>}
                </div>
              )}
            </div>

            <div style={{height:96}}/>
          </div>

          {/* ─── STICKY CTA ─────────────────────────────────── */}
          <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.07)',background:'rgba(5,5,7,0.98)',backdropFilter:'blur(20px)',flexShrink:0,position:'relative'}}>
            <div style={{position:'absolute',top:0,left:'20%',right:'20%',height:'1px',background:'linear-gradient(90deg,transparent,rgba(0,229,200,0.15),transparent)',transform:'translateY(-1px)'}}/>

            {canOrder ? (
              <button onClick={handleOrder} disabled={submitting}
                style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#00E5C8,#0099FF)',color:'#050507',fontWeight:800,fontSize:'0.9rem',cursor:submitting?'default':'pointer',boxShadow:'0 6px 28px rgba(0,229,200,0.3)',transition:'all 0.15s',opacity:submitting?0.7:1,letterSpacing:'0.02em'}}
                onMouseEnter={e=>{if(!submitting)(e.currentTarget.style.boxShadow='0 8px 36px rgba(0,229,200,0.45)');}}
                onMouseLeave={e=>{(e.currentTarget.style.boxShadow='0 6px 28px rgba(0,229,200,0.3)');}}>
                {submitting?'⏳ Placing order...':`Place Order — $${total.toFixed(2)}`}
              </button>
            ) : (
              <button onClick={()=>{setShowOrderForm(true);setTimeout(()=>panelRef.current?.scrollTo({top:99999,behavior:'smooth'}),50);}}
                style={{width:'100%',padding:'14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.22)',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',letterSpacing:'0.02em',transition:'all 0.15s'}}
                onMouseEnter={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.14)');(e.currentTarget.style.color='rgba(255,255,255,0.45)');}}
                onMouseLeave={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.08)');(e.currentTarget.style.color='rgba(255,255,255,0.22)');}}>
                {!size?'↑ Select a size to continue':!deliveryDone?'↑ Fill delivery details to order':`Place Order — $${total.toFixed(2)}`}
              </button>
            )}

            <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:8}}>
              {['🔒 Secure','⚡ 72h delivery','↩️ Free returns'].map(b=>(
                <span key={b} style={{fontSize:'0.54rem',color:'rgba(255,255,255,0.12)',fontWeight:600,letterSpacing:'0.04em'}}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fsIn    { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shirtIn { from{opacity:0;transform:scale(0.9) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        input[type=range]{height:3px;border-radius:999px}
        input[type=range]::-webkit-slider-thumb{width:14px;height:14px}
        textarea:focus,input:focus{outline:none}
        select option{background:#111;color:white}
        @media(max-width:680px){
          .design-body{grid-template-columns:1fr!important;grid-template-rows:auto 1fr;overflow:auto!important;}
          .design-body>div:first-child{height:360px;flex-shrink:0;}
          .design-body>div:last-child{border-left:none!important;border-top:1px solid rgba(255,255,255,0.07);}
        }
      `}</style>
    </div>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050507',color:'rgba(255,255,255,0.18)',fontSize:'0.75rem',letterSpacing:'0.14em',textTransform:'uppercase'}}>Loading Studio...</div>}>
      <DesignStudio/>
    </Suspense>
  );
}

const LS: React.CSSProperties   = {display:'block',fontSize:'0.58rem',fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:5};
const INP: React.CSSProperties  = {width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'8px 10px',color:'#fff',fontSize:'0.8rem',outline:'none'};
const SHEAD: React.CSSProperties= {display:'flex',alignItems:'center',gap:6,fontSize:'0.57rem',fontWeight:700,color:'rgba(255,255,255,0.2)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:11};
const DIV: React.CSSProperties  = {height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)'};
