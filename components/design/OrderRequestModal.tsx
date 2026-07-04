'use client';
import type { ReactNode } from 'react';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { SHIPPING_PRICE } from '@/lib/mockData';
import { US_STATES } from '@/lib/studio/constants';
import { INP } from './studioStyles';
import { qtyDiscountPct, nextTierHint, SIDE_SURCHARGES, type OrderQuote } from '@/lib/pricing';

export type ShippingFields = {
  name: string; email: string; phone: string; street: string;
  city: string; zip: string; state: string; notes: string;
};

export type OrderRequestModalProps = {
  onClose: () => void;
  preview: ReactNode;
  color: TShirtColor;
  size: TShirtSize | null;
  qty: number;
  setQty: (n:number) => void;
  layersCount: number;
  uploadCount: number;
  total: number;
  quote?: OrderQuote;
  qualityScore: number;
  hasDesignContent: boolean;
  sidesSummary: string;
  fields: ShippingFields;
  onField: (key: keyof ShippingFields, value: string) => void;
  couponCode: string;
  couponPct: number;
  couponBusy: boolean;
  onCouponChange: (v:string)=>void;
  onApplyCoupon: ()=>void;
  saveShipping: boolean;
  setSaveShipping: (v:boolean) => void;
  orderError: string | null;
  submitting: boolean;
  canOrder: boolean;
  onSubmit: () => void;
};

const FIELD_LABEL: React.CSSProperties = {display:'grid',gap:6,fontSize:'0.78rem',fontWeight:900,color:'rgba(255,255,255,0.6)'};

export default function OrderRequestModal(p: OrderRequestModalProps){
  const { fields, onField } = p;
  return (
    <div role="dialog" aria-modal="true" aria-label="Review and submit order request" style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(0,0,0,0.68)',backdropFilter:'blur(18px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}} onClick={p.onClose}>
      <div className="checkout-modal" onClick={e=>e.stopPropagation()} style={{width:'min(1080px,96vw)',maxHeight:'92vh',overflow:'hidden',border:'1px solid rgba(255,255,255,0.1)',background:'linear-gradient(180deg,rgba(13,13,18,0.98),rgba(6,6,9,0.98))',borderRadius:16,boxShadow:'0 30px 90px rgba(0,0,0,0.62)',display:'grid',gridTemplateColumns:'minmax(320px,0.85fr) minmax(360px,1fr)'}}>
        <div style={{padding:'24px',borderRight:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.018)',display:'flex',flexDirection:'column',gap:16,overflowY:'auto'}}>
          <div>
            <div style={{fontSize:'1.15rem',fontWeight:950,color:'rgba(255,255,255,0.92)',marginBottom:5}}>Review your shirt</div>
            <div style={{fontSize:'0.86rem',color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>Check the design, choose quantity, then confirm your delivery details.</div>
          </div>
          <div style={{height:330,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,background:'radial-gradient(ellipse at 50% 38%,rgba(0,229,200,0.055),rgba(255,255,255,0.018) 55%,rgba(0,0,0,0.16))'}}>
            {p.preview}
          </div>
          <div style={{border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:14,background:'rgba(255,255,255,0.025)'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:8}}><span style={{color:'rgba(255,255,255,0.52)'}}>Shirt</span><strong>{p.color.name}{p.size?` / ${p.size}`:''}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:8}}><span style={{color:'rgba(255,255,255,0.52)'}}>Design</span><strong>{p.layersCount} layers, {p.uploadCount} uploads</strong></div>
            {p.quote&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:8}}><span style={{color:'rgba(255,255,255,0.52)'}}>Shirts x {p.quote.qty}</span><strong>${p.quote.subtotal.toFixed(2)}</strong></div>}
            {p.quote&&p.quote.sides.map(s=>(
              <div key={s} style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',marginBottom:6,paddingLeft:10}}><span style={{color:'rgba(255,255,255,0.4)'}}>incl. {SIDE_SURCHARGES[s].label}</span><span style={{color:'rgba(255,255,255,0.4)'}}>+${SIDE_SURCHARGES[s].price.toFixed(2)}/shirt</span></div>
            ))}
            {p.quote&&p.quote.discount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:8}}><span style={{color:'#34d399'}}>Volume discount ({p.quote.discountPct}%)</span><strong style={{color:'#34d399'}}>-${p.quote.discount.toFixed(2)}</strong></div>}
            {p.quote&&p.quote.couponDiscount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:8}}><span style={{color:'#34d399'}}>Coupon ({p.quote.couponPct}%)</span><strong style={{color:'#34d399'}}>-${p.quote.couponDiscount.toFixed(2)}</strong></div>}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem',marginBottom:12}}><span style={{color:'rgba(255,255,255,0.52)'}}>Shipping</span><strong>${SHIPPING_PRICE.toFixed(2)}</strong></div>
            <div style={{height:1,background:'rgba(255,255,255,0.08)',marginBottom:12}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'1.05rem',fontWeight:950}}><span>Total</span><span style={{color:'#00E5C8'}}>${p.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div style={{padding:'24px',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:18}}>
            <div>
              <div style={{fontSize:'1.15rem',fontWeight:950,color:'rgba(255,255,255,0.92)',marginBottom:5}}>Delivery details</div>
              <div style={{fontSize:'0.86rem',color:'rgba(255,255,255,0.48)',lineHeight:1.5}}>A few details and your order request is ready for review.</div>
            </div>
            <button onClick={p.onClose} style={{width:34,height:34,borderRadius:10,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.035)',color:'rgba(255,255,255,0.62)',cursor:'pointer',fontSize:'1rem'}}>x</button>
          </div>

          {!p.size&&<div style={{padding:'12px 13px',borderRadius:12,border:'1px solid rgba(245,158,11,0.2)',background:'rgba(245,158,11,0.07)',color:'rgba(245,158,11,0.92)',fontSize:'0.86rem',fontWeight:800,marginBottom:14}}>Choose a shirt size before placing the order.</div>}

          <div style={{border:'1px solid rgba(0,229,200,0.16)',background:'linear-gradient(145deg,rgba(0,229,200,0.06),rgba(255,255,255,0.02))',borderRadius:13,padding:12,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10}}>
              <div>
                <div style={{fontSize:'0.72rem',fontWeight:950,color:'#00E5C8',letterSpacing:'0.12em',textTransform:'uppercase'}}>Production review</div>
                <div style={{fontSize:'0.66rem',fontWeight:750,color:'rgba(255,255,255,0.48)',marginTop:3}}>Final check before submitting the request.</div>
              </div>
              <div style={{width:44,height:44,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:p.qualityScore>=80?'rgba(0,229,200,0.12)':'rgba(245,158,11,0.1)',border:`1px solid ${p.qualityScore>=80?'rgba(0,229,200,0.32)':'rgba(245,158,11,0.24)'}`,color:p.qualityScore>=80?'#00E5C8':'#fbbf24',fontWeight:950}}>{p.qualityScore}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:7}}>
              {[
                ['Color',p.color.name],
                ['Size',p.size || 'Missing'],
                ['Artwork',p.hasDesignContent?'Added':'Missing'],
                ['Sides',p.sidesSummary || 'Front'],
              ].map(([label,value])=>(
                <div key={label} style={{border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.025)',borderRadius:9,padding:'8px 9px'}}>
                  <div style={{fontSize:'0.54rem',fontWeight:950,color:'rgba(255,255,255,0.36)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{label}</div>
                  <div style={{fontSize:'0.78rem',fontWeight:900,color:value==='Missing'?'#fbbf24':'rgba(255,255,255,0.78)',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gap:12}}>
            <div>
              <div style={{fontSize:'0.82rem',fontWeight:900,color:'rgba(255,255,255,0.68)',marginBottom:8}}>Quantity</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[1,2,3,4,5].map(n=>{
                  const pct=qtyDiscountPct(n);
                  return (
                    <button key={n} onClick={()=>p.setQty(n)} style={{width:52,height:52,borderRadius:11,border:`1.5px solid ${p.qty===n?'#00E5C8':'rgba(255,255,255,0.1)'}`,background:p.qty===n?'rgba(0,229,200,0.11)':'rgba(255,255,255,0.03)',color:p.qty===n?'#00E5C8':'rgba(255,255,255,0.68)',fontSize:'0.95rem',fontWeight:900,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
                      {n}
                      {pct>0&&<span style={{fontSize:'0.5rem',fontWeight:900,color:'#34d399'}}>-{pct}%</span>}
                    </button>
                  );
                })}
              </div>
              {(()=>{const hint=nextTierHint(p.qty);return hint?(
                <div style={{marginTop:8,fontSize:'0.72rem',fontWeight:800,color:'#34d399'}}>Add {hint.addQty} more shirt{hint.addQty>1?'s':''} and save {hint.pct}% on all of them</div>
              ):p.qty>=2?(
                <div style={{marginTop:8,fontSize:'0.72rem',fontWeight:800,color:'#34d399'}}>Best price unlocked - {qtyDiscountPct(p.qty)}% off every shirt</div>
              ):null;})()}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <label style={FIELD_LABEL}>Full name<input style={INP} autoComplete="name" value={fields.name} onChange={e=>onField('name',e.target.value)} placeholder="Jane Smith" maxLength={80}/></label>
              <label style={FIELD_LABEL}>Phone<input style={INP} autoComplete="tel" inputMode="tel" value={fields.phone} onChange={e=>onField('phone',e.target.value)} placeholder="555-123-4567" maxLength={30}/></label>
            </div>
            <label style={FIELD_LABEL}>Email<input style={INP} type="email" autoComplete="email" value={fields.email} onChange={e=>onField('email',e.target.value)} placeholder="you@example.com" maxLength={120}/></label>
            <label style={FIELD_LABEL}>Street address<input style={INP} autoComplete="street-address" value={fields.street} onChange={e=>onField('street',e.target.value)} placeholder="123 Main St" maxLength={120}/></label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 82px 96px',gap:10}}>
              <label style={FIELD_LABEL}>City<input style={INP} autoComplete="address-level2" value={fields.city} onChange={e=>onField('city',e.target.value)} placeholder="New York" maxLength={60}/></label>
              <label style={FIELD_LABEL}>State<select value={fields.state} onChange={e=>onField('state',e.target.value)} style={{...INP,appearance:'none' as const,cursor:'pointer',color:fields.state?'#fff':'rgba(255,255,255,0.42)'}}><option value="">ST</option>{US_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
              <label style={FIELD_LABEL}>ZIP<input style={{...INP,fontFamily:'monospace'}} autoComplete="postal-code" inputMode="numeric" value={fields.zip} onChange={e=>onField('zip',e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001"/></label>
            </div>
            <label style={FIELD_LABEL}>Delivery notes<textarea value={fields.notes} onChange={e=>onField('notes',e.target.value)} placeholder="Gate code, leave at door, preferred delivery note..." rows={3} maxLength={180} style={{...INP,minHeight:82,resize:'vertical',lineHeight:1.45}}/></label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input value={p.couponCode} onChange={e=>p.onCouponChange(e.target.value.toUpperCase())} placeholder='Coupon code' maxLength={24} aria-label='Coupon code'
                style={{...INP,flex:1,textTransform:'uppercase',fontFamily:'monospace'}}/>
              <button onClick={p.onApplyCoupon} disabled={p.couponBusy||!p.couponCode.trim()}
                style={{padding:'10px 16px',borderRadius:10,border:'1px solid rgba(0,229,200,0.25)',background:p.couponPct>0?'rgba(16,185,129,0.12)':'rgba(0,229,200,0.07)',color:p.couponPct>0?'#34d399':'#00E5C8',fontSize:'0.76rem',fontWeight:900,cursor:p.couponBusy?'default':'pointer',whiteSpace:'nowrap'}}>
                {p.couponBusy?'Checking...':p.couponPct>0?`-${p.couponPct}% applied`:'Apply'}
              </button>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:9,fontSize:'0.82rem',fontWeight:800,color:'rgba(255,255,255,0.68)',cursor:'pointer'}}><input type="checkbox" checked={p.saveShipping} onChange={e=>p.setSaveShipping(e.target.checked)} style={{width:16,height:16,accentColor:'#00E5C8'}}/> Save these delivery details for next time</label>
          </div>

          {p.orderError&&<div role="alert" style={{padding:'11px 12px',borderRadius:10,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.08)',color:'#f87171',fontSize:'0.82rem',fontWeight:800,marginTop:14}}>{p.orderError}</div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.3fr',gap:10,marginTop:18}}>
            <button onClick={p.onClose} style={{padding:'14px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.035)',color:'rgba(255,255,255,0.72)',fontSize:'0.9rem',fontWeight:900,cursor:'pointer'}}>Back to editing</button>
            <button onClick={p.onSubmit} disabled={!p.canOrder||p.submitting} style={{padding:'14px',borderRadius:12,border:'none',background:p.canOrder?'linear-gradient(135deg,#00E5C8,#0099FF)':'rgba(255,255,255,0.07)',color:p.canOrder?'#050507':'rgba(255,255,255,0.34)',fontSize:'0.92rem',fontWeight:950,cursor:p.canOrder&&!p.submitting?'pointer':'default',boxShadow:p.canOrder?'0 10px 34px rgba(0,229,200,0.28)':'none'}}>{p.submitting?'Sending request...':p.canOrder?`Submit order request - $${p.total.toFixed(2)}`:'Complete required details'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
