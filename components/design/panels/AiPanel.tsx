'use client';
import { LS } from '../studioStyles';

export type AiPanelProps = {
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  aiLoading: boolean;
  aiProgress: number;
  aiSvg: string | null;
  clearAiSvg: () => void;
  generate: () => void;
};

const INSPIRATION = [
  'Minimalist mountain peak','Neon cyberpunk dragon','Bold street art letters',
  'Abstract geometric waves','Vintage 80s sunset logo','Japanese wave pattern',
];

export function AiPanel(p: AiPanelProps) {
  const { aiPrompt, aiLoading, aiProgress, aiSvg } = p;
  return (
    <div style={{padding:'14px'}}>
      <div style={{background:'linear-gradient(135deg,rgba(0,229,200,0.06),rgba(0,153,255,0.05))',border:'1px solid rgba(0,229,200,0.12)',borderRadius:14,padding:'14px',marginBottom:14}}>
        <div style={{fontSize:'0.6rem',color:'#00E5C8',fontWeight:700,letterSpacing:'0.1em',marginBottom:6}}>AI DESIGN GENERATOR</div>
        <div style={{fontSize:'0.73rem',color:'rgba(255,255,255,0.35)',lineHeight:1.6}}>Describe what you want. AI will generate a design for your shirt.</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={LS}>Your idea</div>
        <textarea value={aiPrompt} onChange={e=>p.setAiPrompt(e.target.value)} placeholder="e.g. A minimalist mountain peak with bold EXPLORE typography..." rows={4} maxLength={200}
          style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.09)',borderRadius:11,padding:'11px 13px',color:'#fff',fontSize:'0.82rem',outline:'none',resize:'none',fontFamily:'inherit',lineHeight:1.65,transition:'border-color 0.15s'}}
          onFocus={e=>(e.target.style.borderColor='rgba(0,229,200,0.45)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
        {aiPrompt.length>160&&<span style={{fontSize:'0.58rem',color:aiPrompt.length>190?'#f87171':'rgba(255,255,255,0.25)',textAlign:'right',display:'block',marginTop:3}}>{200-aiPrompt.length} left</span>}
      </div>
      <button onClick={p.generate} disabled={!aiPrompt.trim()||aiLoading}
        style={{width:'100%',padding:'12px',borderRadius:11,border:'none',background:aiPrompt.trim()&&!aiLoading?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.06)',color:aiPrompt.trim()&&!aiLoading?'#050507':'rgba(255,255,255,0.18)',fontWeight:800,fontSize:'0.85rem',cursor:aiPrompt.trim()&&!aiLoading?'pointer':'default',transition:'all 0.2s',marginBottom:10}}>
        {aiLoading?`Generating... ${Math.round(aiProgress)}%`:aiSvg?'Regenerate':'Generate Design'}
      </button>
      {aiLoading&&<div style={{height:2,background:'rgba(255,255,255,0.05)',borderRadius:999,overflow:'hidden',marginBottom:10}}><div style={{height:'100%',width:`${aiProgress}%`,background:'linear-gradient(90deg,#00E5C8,#0099FF)',borderRadius:999,transition:'width 0.2s'}}/></div>}
      {aiSvg&&!aiLoading&&(
        <div style={{padding:'11px',background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:11,display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
          <div style={{width:44,height:44,background:'rgba(255,255,255,0.03)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <div style={{width:34,height:34}} dangerouslySetInnerHTML={{__html:aiSvg.replace(/currentColor/g,'rgba(255,255,255,0.7)').replace('<svg ','<svg width="34" height="34" ')}}/>
          </div>
          <div><div style={{fontSize:'0.68rem',color:'#10B981',fontWeight:700}}>Applied to shirt</div><div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.32)',marginTop:2}}>Showing on preview</div></div>
          <button onClick={p.clearAiSvg} style={{marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.62)',cursor:'pointer',fontSize:18}}>x</button>
        </div>
      )}
      <div>
        <div style={LS}>Inspiration</div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {INSPIRATION.map(idea=>(
            <button key={idea} onClick={()=>p.setAiPrompt(idea)} style={{padding:'8px 11px',borderRadius:9,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.35)',fontSize:'0.72rem',cursor:'pointer',transition:'all 0.12s',textAlign:'left'}}
              onMouseEnter={e=>{(e.currentTarget.style.borderColor='rgba(0,229,200,0.28)');(e.currentTarget.style.color='rgba(255,255,255,0.65)');(e.currentTarget.style.background='rgba(0,229,200,0.04)');}}
              onMouseLeave={e=>{(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)');(e.currentTarget.style.color='rgba(255,255,255,0.35)');(e.currentTarget.style.background='rgba(255,255,255,0.03)');}}>
              {idea}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
