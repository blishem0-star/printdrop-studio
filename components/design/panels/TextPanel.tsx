'use client';
import type { Layer } from '@/lib/studio/types';
import { FONTS, TEXT_COLORS, GRADIENT_PRESETS, TEXT_PRESETS } from '@/lib/studio/constants';
import { LS, INP } from '../studioStyles';

export type TextPanelProps = {
  textInput: string;
  setTextInput: React.Dispatch<React.SetStateAction<string>>;
  addText: ()=>void;
  collarText: string;
  setCollarText: React.Dispatch<React.SetStateAction<string>>;
  addCollarText: (scope:'front'|'full')=>void;
  fontFam: string;
  setFontFam: React.Dispatch<React.SetStateAction<string>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  fontWeight: 'normal'|'bold';
  setFontWeight: React.Dispatch<React.SetStateAction<'normal'|'bold'>>;
  italic: boolean;
  setItalic: React.Dispatch<React.SetStateAction<boolean>>;
  letterSp: number;
  setLetterSp: React.Dispatch<React.SetStateAction<number>>;
  textColor: string;
  setTextColor: React.Dispatch<React.SetStateAction<string>>;
  hexInput: string;
  setHexInput: React.Dispatch<React.SetStateAction<string>>;
  recentColors: string[];
  trackRecentColor: (v:string)=>void;
  strokeCol: string;
  setStrokeCol: React.Dispatch<React.SetStateAction<string>>;
  strokeW: number;
  setStrokeW: React.Dispatch<React.SetStateAction<number>>;
  layerOpacity: number;
  setLayerOpacity: React.Dispatch<React.SetStateAction<number>>;
  textTransform: 'none'|'uppercase'|'lowercase';
  setTextTransform: React.Dispatch<React.SetStateAction<'none'|'uppercase'|'lowercase'>>;
  arcAngle: number;
  setArcAngle: React.Dispatch<React.SetStateAction<number>>;
  showAdvancedText: boolean;
  setShowAdvancedText: React.Dispatch<React.SetStateAction<boolean>>;
  shadowDx: number;
  setShadowDx: React.Dispatch<React.SetStateAction<number>>;
  shadowDy: number;
  setShadowDy: React.Dispatch<React.SetStateAction<number>>;
  shadowBlur: number;
  setShadowBlur: React.Dispatch<React.SetStateAction<number>>;
  shadowColor: string;
  setShadowColor: React.Dispatch<React.SetStateAction<string>>;
  glowBlur: number;
  setGlowBlur: React.Dispatch<React.SetStateAction<number>>;
  glowColor: string;
  setGlowColor: React.Dispatch<React.SetStateAction<string>>;
  selected: string|null;
  selLayer: Layer|null;
  updateLayer: (id:string,patch:Partial<Layer>)=>void;
};

export function TextPanel(props: TextPanelProps) {
  const { textInput, setTextInput, addText, collarText, setCollarText, addCollarText, fontFam, setFontFam, fontSize, setFontSize, fontWeight, setFontWeight, italic, setItalic, letterSp, setLetterSp, textColor, setTextColor, hexInput, setHexInput, recentColors, trackRecentColor, strokeCol, setStrokeCol, strokeW, setStrokeW, layerOpacity, setLayerOpacity, textTransform, setTextTransform, arcAngle, setArcAngle, showAdvancedText, setShowAdvancedText, shadowDx, setShadowDx, shadowDy, setShadowDy, shadowBlur, setShadowBlur, shadowColor, setShadowColor, glowBlur, setGlowBlur, glowColor, setGlowColor, selected, selLayer, updateLayer } = props;
  return (
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
              <button key={t} onClick={()=>setTextInput(t)} style={{padding:'3px 9px',borderRadius:20,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.62)',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.04em',transition:'all 0.12s'}}
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

        {/* Section */}
        <div style={{marginBottom:14}}>
          <div style={LS}>Style Presets{!selLayer||selLayer.type!=='text'?' (select a text layer)':''}</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {TEXT_PRESETS.map(p=>(
              <button key={p.name} disabled={!selLayer||selLayer.type!=='text'}
                onClick={()=>{if(selLayer&&selLayer.type==='text')updateLayer(selLayer.id,p.patch);}}
                style={{padding:'5px 11px',borderRadius:999,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',color:selLayer&&selLayer.type==='text'?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.2)',fontSize:'0.62rem',fontWeight:700,cursor:selLayer&&selLayer.type==='text'?'pointer':'default',letterSpacing:'0.04em',transition:'all 0.13s'}}
                onMouseEnter={e=>{if(selLayer&&selLayer.type==='text'){e.currentTarget.style.borderColor='rgba(0,229,200,0.4)';e.currentTarget.style.color='#00E5C8';}}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color=selLayer&&selLayer.type==='text'?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.2)';}}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div style={{marginBottom:14}}>
          <div style={LS}>Color</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            {TEXT_COLORS.map(c=>(
              <button key={c} aria-pressed={textColor===c} onClick={()=>{setTextColor(c);if(selected)updateLayer(selected,{color:c});}}
                style={{width:28,height:28,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:textColor===c?'2.5px solid #00E5C8':'2px solid rgba(255,255,255,0.1)',outlineOffset:2,transition:'all 0.12s',boxShadow:textColor===c?`0 0 14px ${c}66`:'none'}}/>
            ))}
            <label style={{width:28,height:28,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1.5px dashed rgba(255,255,255,0.2)',fontSize:'0.8rem',position:'relative',color:'rgba(255,255,255,0.5)'}}>
              +<input type="color" aria-hidden tabIndex={-1} value={textColor} onChange={e=>{const v=e.target.value;setTextColor(v);setHexInput(v.replace('#',''));trackRecentColor(v);if(selected)updateLayer(selected,{color:v});}} style={{opacity:0,position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%',cursor:'pointer'}}/>
            </label>
          </div>
          {/* Hex input */}
          <div style={{display:'flex',alignItems:'center',gap:5,marginTop:7,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'4px 8px'}}>
            <span style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.62)',fontFamily:'monospace',fontWeight:700}}>#</span>
            <input value={hexInput} onChange={e=>{const v=e.target.value.replace(/[^0-9a-fA-F]/g,'').slice(0,6);setHexInput(v);if(v.length===6){const col='#'+v;setTextColor(col);trackRecentColor(col);if(selected)updateLayer(selected,{color:col});}}}
              placeholder="ffffff" maxLength={6}
              style={{flex:1,background:'none',border:'none',color:'rgba(255,255,255,0.75)',fontSize:'0.72rem',fontFamily:'monospace',outline:'none',textTransform:'uppercase'}}/>
            <div style={{width:16,height:16,borderRadius:4,background:textColor,border:'1px solid rgba(255,255,255,0.15)',flexShrink:0}}/>
          </div>
          {recentColors.length>0&&(
            <div style={{display:'flex',alignItems:'center',gap:5,marginTop:7}}>
              <span style={{fontSize:'0.52rem',fontWeight:800,color:'rgba(255,255,255,0.35)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Recent</span>
              {recentColors.map(c=>(
                <button key={c} title={c} onClick={()=>{setTextColor(c);setHexInput(c.replace('#',''));if(selected)updateLayer(selected,{color:c});}}
                  style={{width:20,height:20,borderRadius:'50%',border:'none',background:c,cursor:'pointer',outline:textColor===c?'2px solid #00E5C8':'1.5px solid rgba(255,255,255,0.12)',outlineOffset:1}}/>
              ))}
            </div>
          )}
        </div>

        <button onClick={()=>setShowAdvancedText(v=>!v)} style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.72)',fontSize:'0.82rem',fontWeight:900,cursor:'pointer',marginBottom:14,textAlign:'left'}}>
          {showAdvancedText?'Hide advanced text options':'Advanced: curve, effects, outline, collar text...'}
        </button>
        {showAdvancedText&&(
          <div style={{border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px',background:'rgba(255,255,255,0.018)',marginBottom:14}}>

        {/* Collar text */}
        <div style={{border:'1px solid rgba(0,229,200,0.13)',background:'rgba(0,229,200,0.035)',borderRadius:12,padding:'11px 12px',marginBottom:14}}>
          <div style={{fontSize:'0.72rem',fontWeight:950,color:'rgba(255,255,255,0.78)',marginBottom:8}}>Collar text</div>
          <input aria-label="Collar text" value={collarText} onChange={e=>setCollarText(e.target.value)} placeholder="Brand, name, team..." maxLength={34}
            style={{...INP,marginBottom:8,fontSize:'0.82rem'}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
            <button onClick={()=>addCollarText('front')} style={{padding:'9px 8px',borderRadius:9,border:'1px solid rgba(0,229,200,0.24)',background:'rgba(0,229,200,0.07)',color:'#00E5C8',fontSize:'0.72rem',fontWeight:900,cursor:'pointer'}}>Front collar</button>
            <button onClick={()=>addCollarText('full')} style={{padding:'9px 8px',borderRadius:9,border:'1px solid rgba(0,153,255,0.24)',background:'rgba(0,153,255,0.07)',color:'#7dd3fc',fontSize:'0.72rem',fontWeight:900,cursor:'pointer'}}>Around collar</button>
          </div>
        </div>

        {/* Letter spacing */}
        <div style={{marginBottom:14}}>
          <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Letter Spacing</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{letterSp}</span></div>
          <input type="range" min={-2} max={20} value={letterSp} onChange={e=>{const v=+e.target.value;setLetterSp(v);if(selected)updateLayer(selected,{letterSpacing:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/>
        </div>

        {/* Gradient fills */}
        <div style={{marginBottom:14}}>
          <div style={LS}>Gradient</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <button title="Solid color" aria-pressed={!selLayer?.gradient} onClick={()=>{if(selected)updateLayer(selected,{gradient:''});}}
              style={{width:28,height:28,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.06)',cursor:'pointer',outline:selLayer&&!selLayer.gradient?'2.5px solid #00E5C8':'2px solid rgba(255,255,255,0.1)',outlineOffset:2,fontSize:'0.55rem',color:'rgba(255,255,255,0.45)'}}>Solid</button>
            {Object.entries(GRADIENT_PRESETS).map(([key,g])=>(
              <button key={key} title={g.label} aria-pressed={selLayer?.gradient===key}
                onClick={()=>{if(selected)updateLayer(selected,{gradient:key});}}
                style={{width:28,height:28,borderRadius:'50%',border:'none',background:`linear-gradient(135deg,${g.stops.join(',')})`,cursor:'pointer',outline:selLayer?.gradient===key?'2.5px solid #00E5C8':'2px solid rgba(255,255,255,0.1)',outlineOffset:2,transition:'all 0.12s',transform:selLayer?.gradient===key?'scale(1.12)':'scale(1)'}}/>
            ))}
          </div>
        </div>

        {/* Outline / stroke */}
        <div style={{marginBottom:14}}>
          <div style={LS}>Outline (Stroke)</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',flex:1}}>
              {['','#000000','#ffffff','#00E5C8','#FFD700','#FF4D1C'].map(c=>(
                <button key={c||'none'} aria-pressed={strokeCol===c} onClick={()=>{setStrokeCol(c);if(selected)updateLayer(selected,{strokeColor:c,strokeWidth:c&&strokeW===0?1.5:strokeW});}}
                  style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${strokeCol===c?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:c||'transparent',cursor:'pointer',transition:'all 0.12s',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',color:'rgba(255,255,255,0.66)'}}>
                  {!c&&'None'}
                </button>
              ))}
            </div>
            {strokeCol&&(
              <div style={{width:60}}>
                <div style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.62)',marginBottom:2}}>{strokeW}px</div>
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

        {/* Transform (uppercase / lowercase) */}
        <div style={{marginBottom:14}}>
          <div style={LS}>Transform</div>
          <div style={{display:'flex',gap:4}}>
            {([['none','Aa'],['uppercase','AA'],['lowercase','aa']] as ['none'|'uppercase'|'lowercase', string][]).map(([v,label])=>(
              <button key={v} aria-pressed={textTransform===v} onClick={()=>{setTextTransform(v);if(selected)updateLayer(selected,{textTransform:v});}}
                style={{flex:1,padding:'7px',borderRadius:8,border:`1.5px solid ${textTransform===v?'rgba(0,229,200,0.35)':'rgba(255,255,255,0.07)'}`,background:textTransform===v?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.02)',color:textTransform===v?'#00E5C8':'rgba(255,255,255,0.35)',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',transition:'all 0.13s'}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Curve / Arc text */}
        <div style={{marginBottom:14}}>
          <div style={{...LS,display:'flex',justifyContent:'space-between'}}>
            <span>Curve Text</span>
            <span style={{color:arcAngle===0?'rgba(255,255,255,0.3)':'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>
              {arcAngle===0?'Straight':arcAngle>0?`Arch up ${arcAngle}deg`:`Arch down ${Math.abs(arcAngle)}deg`}
            </span>
          </div>
          <input type="range" min={-80} max={80} value={arcAngle}
            onChange={e=>{const v=+e.target.value;setArcAngle(v);if(selected)updateLayer(selected,{arcAngle:v});}}
            style={{width:'100%',accentColor:'#00E5C8'}}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
            <span style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.62)'}}>Arch down</span>
            <span style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.62)'}}>Arch up</span>
          </div>
        </div>

        {/* Effects: Shadow + Glow */}
        <div style={{marginBottom:14}}>
          <div style={LS}>Effects</div>
          {/* Shadow */}
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:shadowBlur>0?8:0}}>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'rgba(255,255,255,0.66)',letterSpacing:'0.06em'}}>SHADOW</span>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                {['rgba(0,0,0,0.8)','#ffffff','#00E5C8','#FFD700','#FF4D1C'].map(c=>(
                  <button key={c} onClick={()=>{const col=shadowColor===c&&shadowBlur===0?'rgba(0,0,0,0.8)':c;setShadowColor(col);if(selected)updateLayer(selected,{shadowColor:col,shadowBlur:shadowBlur===0?4:shadowBlur});}}
                    style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${shadowColor===c&&shadowBlur>0?'#00E5C8':'rgba(255,255,255,0.12)'}`,background:c,cursor:'pointer'}}/>
                ))}
                <button onClick={()=>{setShadowBlur(0);if(selected)updateLayer(selected,{shadowBlur:0});}} style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.62)',background:'none',border:'none',cursor:'pointer'}}>off</button>
              </div>
            </div>
            {shadowBlur>0&&<>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div><div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Blur</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{shadowBlur}</span></div><input type="range" min={0} max={20} value={shadowBlur} onChange={e=>{const v=+e.target.value;setShadowBlur(v);if(selected)updateLayer(selected,{shadowBlur:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/></div>
                <div><div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Offset X</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{shadowDx}</span></div><input type="range" min={-8} max={8} value={shadowDx} onChange={e=>{const v=+e.target.value;setShadowDx(v);if(selected)updateLayer(selected,{shadowDx:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/></div>
              </div>
              <div style={{marginTop:6}}><div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Offset Y</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{shadowDy}</span></div><input type="range" min={-8} max={8} value={shadowDy} onChange={e=>{const v=+e.target.value;setShadowDy(v);if(selected)updateLayer(selected,{shadowDy:v});}} style={{width:'100%',accentColor:'#00E5C8'}}/></div>
            </>}
          </div>
          {/* Glow */}
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:glowBlur>0?8:0}}>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'rgba(255,255,255,0.66)',letterSpacing:'0.06em'}}>GLOW</span>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                {['#00E5C8','#0099FF','#FFD700','#FF4D1C','#8B5CF6'].map(c=>(
                  <button key={c} onClick={()=>{setGlowColor(c);if(selected)updateLayer(selected,{glowColor:c,glowBlur:glowBlur===0?8:glowBlur});}}
                    style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${glowColor===c&&glowBlur>0?'#fff':'rgba(255,255,255,0.12)'}`,background:c,cursor:'pointer',boxShadow:glowColor===c&&glowBlur>0?`0 0 8px ${c}`:'none'}}/>
                ))}
                <button onClick={()=>{setGlowBlur(0);if(selected)updateLayer(selected,{glowBlur:0});}} style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.62)',background:'none',border:'none',cursor:'pointer'}}>off</button>
              </div>
            </div>
            {glowBlur>0&&<div><div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Intensity</span><span style={{color:'#00E5C8',letterSpacing:0,textTransform:'none'}}>{glowBlur}</span></div><input type="range" min={1} max={20} value={glowBlur} onChange={e=>{const v=+e.target.value;setGlowBlur(v);if(selected)updateLayer(selected,{glowBlur:v});}} style={{width:'100%',accentColor:glowColor}}/></div>}
          </div>
        </div>
          </div>
        )}
      </div>
  );
}
