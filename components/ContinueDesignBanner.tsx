'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Retention nudge: if the visitor has an unfinished design saved locally,
// float a small pill inviting them back into the studio to finish (and order).
export function ContinueDesignBanner() {
  const [label, setLabel] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (sessionStorage.getItem('pd_continue_dismissed')) return;
        const raw = localStorage.getItem('pd_design');
        if (!raw) return;
        const d = JSON.parse(raw);
        const layers = Array.isArray(d?.layers) ? d.layers : [];
        const hasContent = layers.length > 0 || d?.printBg || d?.aiSvg;
        if (!hasContent) return;
        const text = layers.find((l: { type?: string; content?: string }) => l?.type === 'text' && l?.content)?.content;
        setLabel(text ? `"${String(text).slice(0, 22)}"` : 'your design');
      } catch { /* corrupted local state is not worth a banner */ }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  if (!label || dismissed) return null;
  return (
    <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 900, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 10px 16px', borderRadius: 999, border: '1px solid rgba(0,229,200,0.3)', background: 'rgba(5,5,8,0.94)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 24px rgba(0,229,200,0.08)', animation: 'cdbIn 0.35s ease' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#00E5C8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Unfinished design</div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>Finish {label} and order it</div>
      </div>
      <Link href="/design" style={{ flexShrink: 0, padding: '9px 15px', borderRadius: 999, background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontSize: '0.68rem', fontWeight: 950, textDecoration: 'none', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Continue</Link>
      <button aria-label="Dismiss" onClick={() => { setDismissed(true); try { sessionStorage.setItem('pd_continue_dismissed', '1'); } catch {} }}
        style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', cursor: 'pointer', lineHeight: 1 }}>x</button>
      <style>{`@keyframes cdbIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
