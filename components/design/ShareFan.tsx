'use client';

type ShareChannel = 'instagram' | 'facebook' | 'x' | 'whatsapp';

type ShareFanProps = {
  open: boolean;
  onClose: () => void;
  onShare: (channel: ShareChannel) => void;
};

function SocialIcon({ channel }: { channel: ShareChannel }) {
  if (channel === 'instagram') {
    return <svg viewBox="0 0 32 32" width={26} height={26} fill="none" aria-hidden="true"><rect x="7" y="7" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="2.2"/><circle cx="16" cy="16" r="4.2" stroke="currentColor" strokeWidth="2.2"/><circle cx="21.4" cy="10.8" r="1.3" fill="currentColor"/></svg>;
  }
  if (channel === 'facebook') {
    return <svg viewBox="0 0 32 32" width={26} height={26} fill="none" aria-hidden="true"><path d="M18 27V17.5h3.2l.6-4H18v-2.1c0-1.1.4-1.9 2-1.9h2V6.1c-.9-.1-1.8-.2-2.7-.2-3.2 0-5.4 2-5.4 5.3v2.3h-3.5v4H14V27h4z" fill="currentColor"/></svg>;
  }
  if (channel === 'x') {
    return <svg viewBox="0 0 32 32" width={24} height={24} fill="none" aria-hidden="true"><path d="M8 7h5.2l4.2 5.8L22.7 7H25l-6.5 7.2L25.6 25h-5.2l-4.8-6.8L9.5 25H7.2l7.3-8.2L8 7zm3.1 1.8 10.2 14.4h1.2L12.3 8.8h-1.2z" fill="currentColor"/></svg>;
  }
  return <svg viewBox="0 0 32 32" width={26} height={26} fill="none" aria-hidden="true"><path d="M8.7 25.1 10 20.8a9.3 9.3 0 1 1 3.8 3.3l-5.1 1z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round"/><path d="M13.3 11.8c.3-.4.7-.4 1-.1l1.1 1.5c.3.4.2.8-.1 1.2l-.5.6c.9 1.6 2.1 2.7 3.7 3.5l.7-.6c.3-.3.8-.3 1.1 0l1.4 1.1c.4.3.4.8.1 1.1-.6.8-1.4 1.2-2.3 1-3.4-.7-6.8-4-7.6-7.5-.2-.8.3-1.5 1.4-1.8z" fill="currentColor"/></svg>;
}

export function ShareFan({ open, onClose, onShare }: ShareFanProps) {
  if (!open) return null;

  const options: { label: string; channel: ShareChannel; accent: string; angle: number; distance: number }[] = [
    { label: 'Instagram', channel: 'instagram', accent: '#f472b6', angle: -154, distance: 234 },
    { label: 'Facebook', channel: 'facebook', accent: '#60a5fa', angle: -113, distance: 250 },
    { label: 'X', channel: 'x', accent: '#e5e7eb', angle: -67, distance: 250 },
    { label: 'WhatsApp', channel: 'whatsapp', accent: '#34d399', angle: -26, distance: 234 },
  ];

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:8,background:'radial-gradient(circle at 50% 78%,rgba(0,229,200,0.15),rgba(96,165,250,0.08) 28%,rgba(2,2,5,0.52) 52%,rgba(2,2,5,0.72)),linear-gradient(180deg,rgba(244,114,182,0.05),rgba(0,229,200,0.04))',backdropFilter:'blur(14px) saturate(1.24)',pointerEvents:'auto'}}/>
      <div role="menu" aria-label="Share your design" className="share-fan" style={{position:'absolute',left:'50%',bottom:'calc(100% + 10px)',width:560,height:330,transform:'translateX(-50%) scale(var(--fan-scale,1))',transformOrigin:'50% 100%',zIndex:35,pointerEvents:'none'}}>
        <div className="share-fan-shell" style={{position:'absolute',left:'50%',bottom:0,width:500,height:246,transform:'translateX(-50%)',borderRadius:'500px 500px 0 0',background:'radial-gradient(circle at 50% 104%,rgba(0,229,200,0.34),rgba(8,8,14,0.98) 34%,rgba(19,19,34,0.84) 62%,rgba(255,255,255,0.04) 100%),conic-gradient(from 236deg at 50% 100%,rgba(244,114,182,0.34),rgba(96,165,250,0.22),rgba(0,229,200,0.23),rgba(52,211,153,0.3))',border:'1px solid rgba(255,255,255,0.18)',borderBottom:'none',boxShadow:'0 -34px 100px rgba(0,0,0,0.72),0 0 92px rgba(0,229,200,0.22),inset 0 1px 0 rgba(255,255,255,0.14)',pointerEvents:'none',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'repeating-conic-gradient(from 236deg at 50% 100%,rgba(255,255,255,0.24) 0deg,rgba(255,255,255,0.24) 0.55deg,transparent 0.9deg,transparent 13.5deg)',opacity:0.36}}/>
          <div style={{position:'absolute',inset:12,borderRadius:'480px 480px 0 0',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'none'}}/>
          <div style={{position:'absolute',left:'50%',bottom:-92,width:250,height:250,transform:'translateX(-50%)',borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,200,0.42),rgba(0,229,200,0.08) 48%,transparent 70%)'}}/>
          <div style={{position:'absolute',left:'14%',top:'28%',width:7,height:7,borderRadius:'50%',background:'rgba(244,114,182,0.62)',boxShadow:'0 0 18px rgba(244,114,182,0.72)'}}/>
          <div style={{position:'absolute',right:'17%',top:'24%',width:6,height:6,borderRadius:'50%',background:'rgba(52,211,153,0.62)',boxShadow:'0 0 18px rgba(52,211,153,0.72)'}}/>
        </div>
        <div style={{position:'absolute',left:'50%',bottom:-4,width:72,height:72,transform:'translateX(-50%)',borderRadius:'50%',background:'linear-gradient(145deg,rgba(0,229,200,0.26),rgba(5,5,8,0.96))',border:'1px solid rgba(0,229,200,0.32)',boxShadow:'0 14px 42px rgba(0,0,0,0.55),0 0 34px rgba(0,229,200,0.28)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:'50%',bottom:28,transform:'translateX(-50%)',padding:'8px 16px',borderRadius:999,background:'rgba(5,5,8,0.78)',border:'1px solid rgba(255,255,255,0.14)',fontSize:'0.72rem',fontWeight:950,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.82)',whiteSpace:'nowrap',boxShadow:'0 12px 34px rgba(0,0,0,0.38)'}}>Share your design</div>
        {options.map((opt, i) => {
          const rad = (opt.angle * Math.PI) / 180;
          const x = Math.cos(rad) * opt.distance;
          const y = Math.sin(rad) * opt.distance;
          return (
            <button key={opt.channel} role="menuitem" onClick={() => onShare(opt.channel)}
              className="share-fan-item"
              style={{position:'absolute',left:`calc(50% + ${x}px)`,bottom:`${24 - y}px`,width:108,height:108,borderRadius:28,border:`1px solid ${opt.accent}70`,background:`linear-gradient(145deg,rgba(10,10,16,0.98),${opt.accent}26)`,boxShadow:`0 26px 62px rgba(0,0,0,0.6),0 0 46px ${opt.accent}30,inset 0 1px 0 rgba(255,255,255,0.14)`,color:opt.accent,cursor:'pointer',pointerEvents:'auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,transform:`translate(-50%,0) rotate(${(i - 1.5) * -6}deg)`,animation:`fanOpen 340ms cubic-bezier(.16,1.34,.38,1) ${i * 52}ms both`}}>
              <span style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center'}}><SocialIcon channel={opt.channel}/></span>
              <span style={{fontSize:'0.72rem',fontWeight:950,color:'rgba(255,255,255,0.88)'}}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
