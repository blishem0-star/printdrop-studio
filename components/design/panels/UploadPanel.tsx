'use client';
import { useRef } from 'react';
import type { ImagePos, UploadSlot, GarmentView, UploadMap, ImageOpacityMap, ImageFxMap, ImageFx } from '@/lib/studio/types';
import { POS_LABELS } from '@/lib/studio/constants';
import { LS } from '../studioStyles';

export type UploadPanelProps = {
  uploadSlot: UploadSlot;
  setUploadSlot: (s: UploadSlot) => void;
  setGarmentView: (v: GarmentView) => void;
  uploads: UploadMap;
  removeUpload: (slot: UploadSlot) => void;
  imgPos: Record<'front'|'back', ImagePos>;
  setImgPos: (fn: (p: Record<'front'|'back', ImagePos>) => Record<'front'|'back', ImagePos>) => void;
  imgOpacity: ImageOpacityMap;
  setImgOpacity: (fn: (p: ImageOpacityMap) => ImageOpacityMap) => void;
  imgFx: ImageFxMap;
  setImgFx: (fn: (p: ImageFxMap) => ImageFxMap) => void;
  fileDragging: boolean;
  setFileDragging: (v: boolean) => void;
  handleFile: (f: File) => void;
};

export function UploadPanel(p: UploadPanelProps) {
  const { uploadSlot, uploads, imgPos, imgOpacity, imgFx, fileDragging } = p;
  const fileRef = useRef<HTMLInputElement>(null);
  function openPicker() { fileRef.current?.click(); }
  return (
    <div style={{padding:'14px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:4,marginBottom:12}}>
        {([
          ['front','Front'],
          ['back','Back'],
          ['chest','Chest'],
          ['leftSleeve','Left sleeve'],
          ['rightSleeve','Right sleeve'],
        ] as [UploadSlot,string][]).map(([slot,label])=>(
          <button key={slot} aria-pressed={uploadSlot===slot} onClick={()=>{
            p.setUploadSlot(slot);
            if(slot==='front'||slot==='chest') p.setGarmentView('front');
            if(slot==='back') p.setGarmentView('back');
            if(slot==='leftSleeve') p.setGarmentView('left');
            if(slot==='rightSleeve') p.setGarmentView('right');
          }}
            style={{flex:1,padding:'8px 4px',borderRadius:9,border:'1px solid',borderColor:uploadSlot===slot?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.07)',background:uploadSlot===slot?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',color:uploadSlot===slot?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.65rem',fontWeight:700,cursor:'pointer',transition:'all 0.13s',display:'flex',alignItems:'center',justifyContent:'center',gap:4,textTransform:'capitalize'}}>
            {label}{uploads[slot]&&<span style={{width:4,height:4,borderRadius:'50%',background:'#10B981'}}/>}
          </button>
        ))}
      </div>
      <div onDragEnter={e=>{e.preventDefault();p.setFileDragging(true);}} onDragLeave={()=>p.setFileDragging(false)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();p.setFileDragging(false);const f=e.dataTransfer.files[0];if(f)p.handleFile(f);}} onClick={openPicker}
        style={{border:`2px dashed ${fileDragging?'rgba(0,229,200,0.6)':uploads[uploadSlot]?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:14,padding:uploads[uploadSlot]?'1.2rem':'2.5rem 1rem',textAlign:'center',cursor:'pointer',background:fileDragging?'rgba(0,229,200,0.05)':uploads[uploadSlot]?'rgba(16,185,129,0.02)':'rgba(255,255,255,0.01)',transition:'all 0.2s',marginBottom:12}}>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)p.handleFile(f);e.target.value='';}}/>
        {/* eslint-disable-next-line @next/next/no-img-element -- data-URL preview, next/image adds nothing here */}
        {uploads[uploadSlot]?<div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center'}}><img src={uploads[uploadSlot]!} alt="upload" style={{height:60,maxWidth:110,borderRadius:8,objectFit:'contain'}}/><div><div style={{fontSize:'0.72rem',color:'#10B981',fontWeight:700}}>Uploaded</div><div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.62)',marginTop:3}}>Click to replace</div></div></div>
          :<><div style={{opacity:0.4,marginBottom:8,display:'flex',justifyContent:'center'}}><svg viewBox="0 0 28 28" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" width={28} height={28} aria-hidden="true"><path d="M14 18V7M10 11l4-4 4 4"/><path d="M22 18v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3"/></svg></div><div style={{fontWeight:700,color:'rgba(255,255,255,0.5)',fontSize:'0.82rem',marginBottom:5}}>Drop image here</div><div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.62)'}}>PNG - JPG - WEBP</div></>}
      </div>
      {(uploadSlot==='front'||uploadSlot==='back')&&(
        <div style={{marginBottom:12}}>
          <div style={LS}>Position</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
            {(Object.keys(POS_LABELS) as ImagePos[]).map(pos=>(
              <button key={pos} aria-pressed={imgPos[uploadSlot==='front'?'front':'back']===pos} onClick={()=>p.setImgPos(prev=>({...prev,[uploadSlot==='front'?'front':'back']:pos}))}
                style={{padding:'7px 10px',borderRadius:8,border:'1px solid',borderColor:imgPos[uploadSlot==='front'?'front':'back']===pos?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.07)',background:imgPos[uploadSlot==='front'?'front':'back']===pos?'rgba(0,229,200,0.08)':'rgba(255,255,255,0.02)',color:imgPos[uploadSlot==='front'?'front':'back']===pos?'#00E5C8':'rgba(255,255,255,0.3)',fontSize:'0.65rem',fontWeight:600,cursor:'pointer',transition:'all 0.13s',textAlign:'center'}}>
                {POS_LABELS[pos]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <div style={{...LS,display:'flex',justifyContent:'space-between'}}><span>Image Opacity</span><span style={{color:'#00E5C8',fontWeight:700,letterSpacing:0,textTransform:'none'}}>{Math.round(imgOpacity[uploadSlot]*100)}%</span></div>
        <input type="range" min={0.1} max={1} step={0.05} value={imgOpacity[uploadSlot]} onChange={e=>p.setImgOpacity(prev=>({...prev,[uploadSlot]:+e.target.value}))} style={{width:'100%',accentColor:'#00E5C8'}}/>
        <div style={{...LS,marginTop:12}}>Image Effect</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {([['none','Original'],['gray','B&W'],['sepia','Sepia'],['invert','Invert'],['punch','Punch']] as [ImageFx,string][]).map(([k,label])=>(
            <button key={k} aria-pressed={imgFx[uploadSlot]===k} onClick={()=>p.setImgFx(prev=>({...prev,[uploadSlot]:k}))}
              style={{padding:'5px 10px',borderRadius:999,border:`1px solid ${imgFx[uploadSlot]===k?'rgba(0,229,200,0.4)':'rgba(255,255,255,0.08)'}`,background:imgFx[uploadSlot]===k?'rgba(0,229,200,0.1)':'rgba(255,255,255,0.02)',color:imgFx[uploadSlot]===k?'#00E5C8':'rgba(255,255,255,0.4)',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',transition:'all 0.13s'}}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {uploads[uploadSlot]&&<button onClick={()=>p.removeUpload(uploadSlot)} style={{width:'100%',padding:'8px',borderRadius:9,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.07)',color:'#f87171',fontSize:'0.7rem',fontWeight:700,cursor:'pointer'}}>Remove image</button>}
    </div>
  );
}
