'use client';
import type { Layer } from '@/lib/studio/types';
import { SHAPES_LIB, EMOJIS_LIB, VECTOR_SHAPES, TEXT_COLORS } from '@/lib/studio/constants';
import { starPoints } from '@/lib/studio/helpers';
import { LS } from '../studioStyles';

export type ShapesPanelProps = {
  shapesTab: 'vector'|'shapes'|'emoji';
  setShapesTab: (t: 'vector'|'shapes'|'emoji') => void;
  addShape: (kind: string) => void;
  addGfx: (char: string) => void;
  selLayer: Layer | null;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  printBg: string | null;
  setPrintBg: (c: string | null) => void;
  addChestSymbol: () => void;
};

export function ShapesPanel(p: ShapesPanelProps) {
  const { shapesTab, selLayer, printBg } = p;
  return (
    <div style={{padding:'14px'}}>
      {/* Sub-tabs */}
      <div style={{display:'flex',background:'rgba(0,0,0,0.4)',borderRadius:10,padding:3,gap:2,marginBottom:14}}>
        {(['vector','shapes','emoji'] as const).map(t=>(
          <button key={t} onClick={()=>p.setShapesTab(t)} style={{flex:1,padding:'6px',borderRadius:7,border:'none',cursor:'pointer',background:shapesTab===t?'rgba(0,229,200,0.1)':'transparent',color:shapesTab===t?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.13s'}}>
            {t==='vector'?'Vector':t==='shapes'?'Glyphs':'Emoji'}
          </button>
        ))}
      </div>

      {shapesTab==='vector'&&(
        <div>
          <button onClick={p.addChestSymbol} style={{width:'100%',marginBottom:12,padding:'9px 12px',borderRadius:9,border:'1px solid rgba(0,229,200,0.18)',background:'rgba(0,229,200,0.06)',color:'#00E5C8',fontSize:'0.72rem',fontWeight:900,cursor:'pointer'}}>Add chest symbol</button>
          <div style={LS}>Vector Shapes - crisp at any size</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:16}}>
            {VECTOR_SHAPES.map(v=>(
              <button key={v.kind} title={v.label} onClick={()=>p.addShape(v.kind)}
                style={{padding:'12px 4px',borderRadius:10,cursor:'pointer',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',transition:'all 0.12s',display:'flex',flexDirection:'column',alignItems:'center',gap:6,color:'rgba(255,255,255,0.8)'}}
                onMouseEnter={x=>{(x.currentTarget.style.background='rgba(0,229,200,0.09)');(x.currentTarget.style.borderColor='rgba(0,229,200,0.25)');(x.currentTarget.style.transform='scale(1.04)');}}
                onMouseLeave={x=>{(x.currentTarget.style.background='rgba(255,255,255,0.03)');(x.currentTarget.style.borderColor='rgba(255,255,255,0.07)');(x.currentTarget.style.transform='scale(1)');}}>
                <svg viewBox="-12 -12 24 24" width={22} height={22} aria-hidden="true">
                  {v.kind==='rect'&&<rect x={-9} y={-9} width={18} height={18} rx={1.5} fill="currentColor"/>}
                  {v.kind==='circle'&&<circle r={9} fill="currentColor"/>}
                  {v.kind==='ring'&&<circle r={7.4} fill="none" stroke="currentColor" strokeWidth={3.2}/>}
                  {v.kind==='triangle'&&<polygon points="0,-9 9,9 -9,9" fill="currentColor"/>}
                  {v.kind==='diamond'&&<polygon points="0,-10 10,0 0,10 -10,0" fill="currentColor"/>}
                  {v.kind==='star'&&<polygon points={starPoints(20)} fill="currentColor"/>}
                  {v.kind==='line'&&<rect x={-10} y={-1} width={20} height={2} rx={1} fill="currentColor"/>}
                  {v.kind==='capsule'&&<rect x={-10} y={-5} width={20} height={10} rx={5} fill="currentColor"/>}
                </svg>
                <span style={{fontSize:'0.48rem',color:'rgba(255,255,255,0.62)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {shapesTab==='shapes'&&(
        <div>
          <div style={LS}>Geometric Shapes</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:16}}>
            {SHAPES_LIB.map(s=>(
              <button key={s.char} title={s.label} onClick={()=>p.addGfx(s.char)}
                style={{padding:'14px 8px',borderRadius:10,cursor:'pointer',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',transition:'all 0.12s',display:'flex',flexDirection:'column',alignItems:'center',gap:5}}
                onMouseEnter={x=>{(x.currentTarget.style.background='rgba(0,229,200,0.09)');(x.currentTarget.style.borderColor='rgba(0,229,200,0.25)');(x.currentTarget.style.transform='scale(1.04)');}}
                onMouseLeave={x=>{(x.currentTarget.style.background='rgba(255,255,255,0.03)');(x.currentTarget.style.borderColor='rgba(255,255,255,0.07)');(x.currentTarget.style.transform='scale(1)');}}>
                <span style={{fontSize:'1.5rem',lineHeight:1,color:'rgba(255,255,255,0.85)'}}>{s.char}</span>
                <span style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.62)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.label}</span>
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
              <button key={e} onClick={()=>p.addGfx(e)}
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
          <input type="range" min={12} max={80} value={selLayer.fontSize} onChange={e=>p.updateLayer(selLayer.id,{fontSize:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
          <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Rotate</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{selLayer.rotation}deg</span></div>
          <input type="range" min={-180} max={180} value={selLayer.rotation} onChange={e=>p.updateLayer(selLayer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
          <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Opacity</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none',fontWeight:700}}>{Math.round((selLayer.opacity??1)*100)}%</span></div>
          <input type="range" min={0.1} max={1} step={0.05} value={selLayer.opacity??1} onChange={e=>p.updateLayer(selLayer.id,{opacity:+e.target.value})} style={{width:'100%',accentColor:'#00E5C8',marginBottom:8}}/>
          <div style={LS}>Color</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {TEXT_COLORS.slice(0,8).map(c=>(
              <button key={c} onClick={()=>p.updateLayer(selLayer.id,{color:c})} style={{width:24,height:24,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:selLayer.color===c?'2px solid #00E5C8':'2px solid transparent',outlineOffset:2,transition:'all 0.12s'}}/>
            ))}
          </div>
        </div>
      )}

      {/* Print area background */}
      <div style={{marginTop:14}}>
        <div style={LS}>Print Area Background</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <button onClick={()=>p.setPrintBg(null)} style={{width:28,height:28,borderRadius:6,border:`1.5px solid ${!printBg?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',color:'rgba(255,255,255,0.66)'}}>None</button>
          {['#000000','#ffffff','#FF4D1C','#FFD700','#10B981','#0099FF','#6C63FF','#FF69B4'].map(c=>(
            <button key={c} onClick={()=>p.setPrintBg(c)} style={{width:28,height:28,borderRadius:6,border:`1.5px solid ${printBg===c?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:c,cursor:'pointer',transition:'all 0.12s',transform:printBg===c?'scale(1.15)':'scale(1)'}}/>
          ))}
          <label style={{width:28,height:28,borderRadius:6,cursor:'pointer',background:`${printBg||'rgba(255,255,255,0.06)'}`,border:'1.5px dashed rgba(255,255,255,0.2)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'rgba(255,255,255,0.5)'}}>
            +<input type="color" aria-hidden tabIndex={-1} value={printBg||'#ffffff'} onChange={e=>p.setPrintBg(e.target.value)} style={{opacity:0,position:'absolute',inset:0,cursor:'pointer'}}/>
          </label>
        </div>
      </div>
    </div>
  );
}
