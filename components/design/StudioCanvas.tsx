'use client';
import type { TShirtColor } from '@/lib/mockData';
import type { Layer, ImagePos, UploadSlot, GarmentView, UploadMap, ImageOpacityMap, ImageFxMap } from '@/lib/studio/types';
import { SVG_W, SVG_H, SHIRT_PATH, IMG_ZONE, GRADIENT_PRESETS } from '@/lib/studio/constants';
import { calcArcPath, starPoints } from '@/lib/studio/helpers';
import { PRODUCT_MOCKUPS, PRODUCT_PATHS, type ProductType } from '@/lib/productTypes';

export type PrintArea = { x:number; y:number; w:number; h:number };

export type StudioCanvasProps = {
  w: number;
  h: number;
  view: GarmentView;
  interactive?: boolean;
  /** Unique per simultaneously-mounted instance; SVG defs ids are derived from it. */
  idScope?: string;
  /** Garment to render. Products use photo mockups when available, with vector fallback. */
  productType?: ProductType;
  layers: Layer[];
  selected: string | null;
  printArea: PrintArea;
  printBg: string | null;
  uploads: UploadMap;
  imgPos: Record<'front'|'back', ImagePos>;
  imgOpacity: ImageOpacityMap;
  imgFx: ImageFxMap;
  aiSvg: string | null;
  color: TShirtColor;
  isLight: boolean;
  isTouch: boolean;
  snapGuide: { x:boolean; y:boolean };
  onSelect?: (id:string|null)=>void;
  onLayerDown?: (e:React.PointerEvent, id:string)=>void;
  onLayerDoubleClick?: (id:string)=>void;
  onHandleDown?: (e:React.PointerEvent, id:string, mode:'resize'|'rotate')=>void;
  onPrintAreaDown?: (e:React.PointerEvent, mode:'move'|'resize')=>void;
};

function renderVectorShape(l:Layer, fill:string, filter?:string){
  const s=l.fontSize;
  const common={fill,stroke:l.strokeColor||undefined,strokeWidth:l.strokeWidth||undefined,filter,style:{userSelect:'none' as const}};
  switch(l.content){
    case 'rect':     return <rect x={-s/2} y={-s/2} width={s} height={s} rx={s*0.08} {...common}/>;
    case 'circle':   return <circle r={s/2} {...common}/>;
    case 'ring':     return <circle r={s/2-s*0.09} {...common} fill="none" stroke={fill} strokeWidth={s*0.18}/>;
    case 'triangle': return <polygon points={`0,${-s/2} ${s/2},${s/2} ${-s/2},${s/2}`} {...common}/>;
    case 'diamond':  return <polygon points={`0,${-s/2} ${s/2},0 0,${s/2} ${-s/2},0`} {...common}/>;
    case 'star':     return <polygon points={starPoints(s)} {...common}/>;
    case 'line':     return <rect x={-s/2} y={-s*0.045} width={s} height={s*0.09} rx={s*0.045} {...common}/>;
    case 'capsule':  return <rect x={-s/2} y={-s/4} width={s} height={s/2} rx={s/4} {...common}/>;
    default:         return <circle r={s/2} {...common}/>;
  }
}

export function StudioCanvas(props: StudioCanvasProps){
  const {
    w, h, view, interactive=true, layers, selected, printArea:area, printBg,
    uploads, imgPos, imgOpacity, imgFx, aiSvg, color, isLight, isTouch, snapGuide,
    onSelect, onLayerDown, onLayerDoubleClick, onHandleDown, onPrintAreaDown,
  } = props;

  const idScope=props.idScope??(interactive?'live':'preview');
  const svgId=(name:string)=>`${name}-${idScope}`;
  const garment:ProductType=props.productType??'TSHIRT';
  const garmentPaths=PRODUCT_PATHS[garment];
  const garmentMockup=PRODUCT_MOCKUPS[garment];
  const isBackView=view==='back';
  const isFrontView=view==='front';
  const isSideView=view==='left'||view==='right';
  const sideSlot: UploadSlot = view==='left'?'leftSleeve':'rightSleeve';
  const bodyImg=isBackView?uploads.back:isFrontView?uploads.front:null;
  const bodyPos=isBackView?imgPos.back:imgPos.front;
  const bodyZone=IMG_ZONE[bodyPos];
  const bodySlot: UploadSlot=isBackView?'back':'front';

  const layerNodes=layers.map(layer=>{
    if(layer.hidden) return null;
    const isCollar=Boolean(layer.collarMode);
    const lx=area.x+(layer.x/100)*area.w, ly=area.y+(layer.y/100)*area.h;
    const isSel=selected===layer.id&&interactive;
    const aw=layer.type==='text'?layer.content.length*layer.fontSize*0.58:layer.fontSize*1.15;
    const ah=layer.fontSize*1.3;
    const ls=layer.letterSpacing??0;
    const hasArc=!isCollar&&Math.abs(layer.arcAngle??0)>=2;
    const hasShadow=(layer.shadowBlur??0)>0&&(layer.shadowColor??'')!=='';
    const hasGlow=(layer.glowBlur??0)>0&&(layer.glowColor??'')!=='';
    const hasFilter=hasShadow||hasGlow;
    const filterId=`flt-${idScope}-${layer.id}`;
    const arcPathId=isCollar?`collar-${idScope}-${layer.id}`:`arc-${idScope}-${layer.id}`;
    const displayContent=layer.textTransform==='uppercase'?layer.content.toUpperCase():layer.textTransform==='lowercase'?layer.content.toLowerCase():layer.content;
    const commonTextProps={
      fontSize:layer.fontSize,
      fill:layer.gradient&&GRADIENT_PRESETS[layer.gradient]?`url(#lg-${idScope}-${layer.id})`:layer.color,
      fontFamily:layer.fontFamily, fontWeight:layer.fontWeight,
      fontStyle:layer.italic?'italic' as const:'normal' as const,
      stroke:layer.strokeColor||undefined,
      strokeWidth:layer.strokeWidth||undefined,
      paintOrder:(layer.strokeWidth?'stroke fill':undefined) as string|undefined,
      filter:hasFilter?`url(#${filterId})`:undefined,
      style:{userSelect:'none' as const},
    };
    if(isCollar) {
      const hitPath=layer.collarMode==='full'
        ? 'M72 51 C79 67,88 75,100 75 C112 75,121 67,128 51'
        : 'M80 58 C89 66,111 66,120 58';
      return (
        <g key={layer.id} opacity={layer.opacity??1}
          style={interactive&&!layer.locked?{cursor:'pointer'}:{}}
          onPointerDown={interactive&&!layer.locked?e=>{e.stopPropagation();onSelect?.(layer.id);}:undefined}>
          <path d={hitPath} fill="none" stroke="transparent" strokeWidth="15"/>
          <text {...commonTextProps}>
            <textPath href={`#${arcPathId}`} startOffset="50%" textAnchor="middle" letterSpacing={ls>0?ls:undefined}>
              {displayContent}
            </textPath>
          </text>
          {isSel&&<>
            <path d={hitPath} fill="none" stroke="#00E5C8" strokeWidth="1" strokeDasharray="2.5,1.5" opacity="0.85"/>
            <circle cx="100" cy={layer.collarMode==='full'?75:66} r={3} fill="#050507" stroke="#00E5C8" strokeWidth="1"/>
          </>}
        </g>
      );
    }
    return (
      <g key={layer.id} transform={`translate(${lx},${ly}) rotate(${layer.rotation}) scale(${layer.flipH?-1:1},${layer.flipV?-1:1})`}
        opacity={layer.opacity??1}
        style={interactive&&!layer.locked?{cursor:'move'}:{}}
        onPointerDown={interactive&&!layer.locked?e=>onLayerDown?.(e,layer.id):undefined}
        onDoubleClick={interactive&&!layer.locked?()=>onLayerDoubleClick?.(layer.id):undefined}>
        {/* Hit box */}
        <rect x={-aw/2-6} y={-ah/2-3} width={aw+12} height={ah+6} fill="transparent"/>
        {layer.type==='shape'?(
          renderVectorShape(layer,commonTextProps.fill,hasFilter?`url(#${filterId})`:undefined)
        ):hasArc?(
          <text {...commonTextProps}>
            <textPath href={`#${arcPathId}`} startOffset="50%" textAnchor="middle"
              letterSpacing={ls>0?ls:undefined}>
              {displayContent}
            </textPath>
          </text>
        ):(
          <text {...commonTextProps} textAnchor="middle" dominantBaseline="middle"
            letterSpacing={ls>0?ls:undefined}>
            {displayContent}
          </text>
        )}
        {isSel&&<>
          <rect x={-aw/2-6} y={-ah/2-4} width={aw+12} height={ah+8}
            fill="rgba(0,229,200,0.06)" stroke="#00E5C8" strokeWidth="0.8" strokeDasharray="2.5,1.5" rx="2"/>
          {[[-aw/2-6,-ah/2-4],[aw/2+6,-ah/2-4],[-aw/2-6,ah/2+4]].map(([cx,cy],i)=>
            <circle key={i} cx={cx} cy={cy} r={isTouch?'3':'2.2'} fill="#00E5C8"/>)}
          <circle cx={aw/2+6} cy={ah/2+4} r={isTouch?12:8} fill="transparent"
            style={{cursor:'nwse-resize',touchAction:'none'}}
            onPointerDown={e=>onHandleDown?.(e,layer.id,'resize')}/>
          <circle cx={aw/2+6} cy={ah/2+4} r={isTouch?5:3.6} fill="#050507" stroke="#00E5C8" strokeWidth="1" style={{pointerEvents:'none'}}/>
          {/* Rotate handle (above top-center) */}
          <line x1={0} y1={-ah/2-4} x2={0} y2={-ah/2-13} stroke="#00E5C8" strokeWidth="0.7" opacity="0.7" style={{pointerEvents:'none'}}/>
          <circle cx={0} cy={-ah/2-15} r={isTouch?12:8} fill="transparent"
            style={{cursor:'grab',touchAction:'none'}}
            onPointerDown={e=>onHandleDown?.(e,layer.id,'rotate')}/>
          <circle cx={0} cy={-ah/2-15} r={isTouch?5:3.4} fill="#050507" stroke="#00E5C8" strokeWidth="1" style={{pointerEvents:'none'}}/>
        </>}
      </g>
    );
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${SVG_W} ${SVG_H}`} fill="none" style={{overflow:'visible'}}>
      <defs>
        <filter id={svgId('ss')} x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="rgba(0,0,0,0.42)"/>
          <feDropShadow dx="0" dy="4"  stdDeviation="8"  floodColor="rgba(0,0,0,0.24)"/>
        </filter>
        <filter id={svgId('pb')}><feGaussianBlur stdDeviation="6"/></filter>
        <pattern id={svgId('weave')} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 1.5H6M1.5 0V6" stroke={isLight?'rgba(0,0,0,0.032)':'rgba(255,255,255,0.05)'} strokeWidth="0.35"/>
        </pattern>
        <linearGradient id={svgId('sg')} x1="0.18" y1="0" x2="0.82" y2="1">
          <stop offset="0%"   stopColor={color.hex} stopOpacity="1"/>
          <stop offset="100%" stopColor={color.hex} stopOpacity="0.92"/>
        </linearGradient>
        <linearGradient id={svgId('sh')} x1="0.12" y1="0" x2="0.88" y2="0.55">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.24)"/>
          <stop offset="45%"  stopColor="rgba(255,255,255,0.04)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <radialGradient id={svgId('sp')} cx="50%" cy="20%" r="70%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.18)"/>
          <stop offset="72%"  stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)"/>
        </radialGradient>
        <filter id={svgId('shirtTint')} colorInterpolationFilters="sRGB">
          <feFlood floodColor={color.hex} result="tint"/>
          <feComposite in="tint" in2="SourceAlpha" operator="in" result="color"/>
          <feBlend in="SourceGraphic" in2="color" mode="multiply"/>
        </filter>
        <clipPath id={svgId('ccb')}><rect x="56" y="82" width="88" height="130" rx="3"/></clipPath>
        <clipPath id={svgId('ccf')}><path d={SHIRT_PATH}/></clipPath>
        {/* Arc text paths */}
        {layers.filter(l=>Math.abs(l.arcAngle??0)>=2&&!l.collarMode).map(l=>{
          const lx=area.x+(l.x/100)*area.w, ly=area.y+(l.y/100)*area.h;
          return <path key={l.id} id={`arc-${idScope}-${l.id}`} d={calcArcPath(lx,ly,l.arcAngle,l.content.length,l.fontSize)} fill="none"/>;
        })}
        {layers.filter(l=>l.collarMode).map(l=>(
          <path key={`collar-${l.id}`} id={`collar-${idScope}-${l.id}`}
            d={l.collarMode==='full'
              ? 'M70 51 C78 70,88 78,100 78 C112 78,122 70,130 51'
              : 'M80 58 C89 67,111 67,120 58'}
            fill="none"/>
        ))}
        {/* Image effect filters */}
        <filter id={svgId('fx-gray')}><feColorMatrix type="saturate" values="0"/></filter>
        <filter id={svgId('fx-sepia')}><feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"/></filter>
        <filter id={svgId('fx-invert')}><feComponentTransfer><feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/></feComponentTransfer></filter>
        <filter id={svgId('fx-punch')}><feComponentTransfer><feFuncR type="linear" slope="1.35" intercept="-0.12"/><feFuncG type="linear" slope="1.35" intercept="-0.12"/><feFuncB type="linear" slope="1.35" intercept="-0.12"/></feComponentTransfer><feColorMatrix type="saturate" values="1.4"/></filter>
        {/* Per-layer gradient fills */}
        {layers.filter(l=>l.gradient&&GRADIENT_PRESETS[l.gradient]).map(l=>(
          <linearGradient key={`lg-${l.id}`} id={`lg-${idScope}-${l.id}`} x1="0" y1="0" x2="1" y2="1">
            {GRADIENT_PRESETS[l.gradient].stops.map((s,i,arr)=>(
              <stop key={i} offset={`${Math.round((i/(arr.length-1))*100)}%`} stopColor={s}/>
            ))}
          </linearGradient>
        ))}
        {/* Layer effect filters */}
        {layers.filter(l=>(l.shadowBlur??0)>0||(l.glowBlur??0)>0).map(l=>(
          <filter key={l.id} id={`flt-${idScope}-${l.id}`} x="-50%" y="-50%" width="200%" height="200%">
            {(l.shadowBlur??0)>0&&l.shadowColor&&<feDropShadow dx={l.shadowDx??2} dy={l.shadowDy??2} stdDeviation={(l.shadowBlur??0)/2} floodColor={l.shadowColor} floodOpacity="1"/>}
            {(l.glowBlur??0)>0&&l.glowColor&&<>
              <feGaussianBlur in="SourceGraphic" stdDeviation={(l.glowBlur??0)/2.5} result="gblur"/>
              <feFlood floodColor={l.glowColor} result="gc"/>
              <feComposite in="gc" in2="gblur" operator="in" result="coloredGlow"/>
              <feMerge><feMergeNode in="coloredGlow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </>}
          </filter>
        ))}
      </defs>
      <ellipse cx="100" cy="216" rx={isSideView?36:58} ry="7" fill="rgba(0,0,0,0.25)" filter={`url(#${svgId('pb')})`}/>
      <g transform={isSideView&&view==='left'?'translate(200 0) scale(-1 1)':''}>
        {garmentMockup?(
          <image
            href={isSideView && garmentMockup.side ? garmentMockup.side : isBackView && garmentMockup.back ? garmentMockup.back : garmentMockup.front}
            x={isSideView && garmentMockup.side ? 29 : garmentMockup.canvas.x}
            y={isSideView && garmentMockup.side ? 16 : garmentMockup.canvas.y}
            width={isSideView && garmentMockup.side ? 142 : garmentMockup.canvas.width}
            height={isSideView && garmentMockup.side ? 196 : garmentMockup.canvas.height}
            preserveAspectRatio="xMidYMid meet"
            filter={color.id==='white'?undefined:`url(#${svgId('shirtTint')})`}
          />
        ):(
          <g transform="translate(0,15)" filter={`url(#${svgId('ss')})`}>
            <path d={garmentPaths.body} fill={color.hex} stroke={isLight?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.14)'} strokeWidth="1.5"/>
            <path d={garmentPaths.body} fill={`url(#${svgId('weave')})`}/>
            <path d={garmentPaths.body} fill={`url(#${svgId('sp')})`}/>
            {garmentPaths.shadeLeft&&<path d={garmentPaths.shadeLeft} fill="rgba(0,0,0,0.09)"/>}
            {garmentPaths.shadeRight&&<path d={garmentPaths.shadeRight} fill="rgba(0,0,0,0.06)"/>}
            {isFrontView&&garmentPaths.detail&&<path d={garmentPaths.detail} fill={garmentPaths.detailFill??'none'} stroke={isLight?'rgba(0,0,0,0.26)':'rgba(255,255,255,0.22)'} strokeWidth="1.4" strokeLinecap="round"/>}
          </g>
        )}
        {isSideView ? (
          uploads[sideSlot] ? (
            <image href={uploads[sideSlot]!} x="82" y="67" width="34" height="34" preserveAspectRatio="xMidYMid meet" opacity={imgOpacity[sideSlot]} filter={imgFx[sideSlot]!=='none'?`url(#${svgId(`fx-${imgFx[sideSlot]}`)})`:undefined}/>
          ) : interactive ? (
            <rect x="82" y="67" width="34" height="34" rx="5" fill="rgba(0,229,200,0.03)" stroke={isLight?'rgba(0,0,0,0.28)':'rgba(255,255,255,0.28)'} strokeDasharray="3,2" strokeWidth="0.75"/>
          ) : null
        ) : (
          <>
            {printBg&&<rect x={area.x} y={area.y} width={area.w} height={area.h} fill={printBg} rx="3" opacity="0.9"/>}
            {bodyImg&&<image href={bodyImg} x={bodyZone.x} y={bodyZone.y} width={bodyZone.w} height={bodyZone.h} preserveAspectRatio={bodyZone.slice?'xMidYMid slice':'xMidYMid meet'} opacity={imgOpacity[bodySlot]} filter={imgFx[bodySlot]!=='none'?`url(#${svgId(`fx-${imgFx[bodySlot]}`)})`:undefined}/>}
            {isFrontView&&uploads.chest&&<image href={uploads.chest} x="68" y="76" width="25" height="25" preserveAspectRatio="xMidYMid meet" opacity={imgOpacity.chest} filter={imgFx.chest!=='none'?`url(#${svgId(`fx-${imgFx.chest}`)})`:undefined}/>}
            {isFrontView&&!uploads.front&&aiSvg&&<g transform="translate(71,93)" dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,color.textColor).replace(/<svg[^>]*>/,'').replace('</svg>','').replace(/width="[^"]*"/,'width="58"').replace(/height="[^"]*"/,'height="58"')}}/>}
            {interactive&&layers.length===0&&!bodyImg&&!aiSvg&&!printBg&&(
              <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="rgba(0,229,200,0.025)" stroke={isLight?'rgba(0,0,0,0.24)':'rgba(255,255,255,0.24)'} strokeDasharray="4,3" rx="5" strokeWidth="0.85"/>
            )}
            {interactive&&(
              <>
                <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="transparent" stroke="#00E5C8" strokeOpacity="0.42" strokeDasharray="4,3" rx="5" strokeWidth="1.1" pointerEvents="stroke" style={{cursor:'move'}} onPointerDown={e=>onPrintAreaDown?.(e,'move')}/>
                <circle cx={area.x+area.w} cy={area.y+area.h} r={isTouch?8:5} fill="#050507" stroke="#00E5C8" strokeWidth="1" style={{cursor:'nwse-resize'}} onPointerDown={e=>onPrintAreaDown?.(e,'resize')}/>
              </>
            )}
            {interactive&&snapGuide.x&&<line x1={area.x+area.w/2} y1={area.y-6} x2={area.x+area.w/2} y2={area.y+area.h+6} stroke="#00E5C8" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.9"/>}
            {interactive&&snapGuide.y&&<line x1={area.x-6} y1={area.y+area.h/2} x2={area.x+area.w+6} y2={area.y+area.h/2} stroke="#00E5C8" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.9"/>}
            {layerNodes}
          </>
        )}
      </g>
    </svg>
  );
}
