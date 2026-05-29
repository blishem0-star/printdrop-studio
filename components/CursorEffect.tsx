'use client';
import { useEffect, useRef } from 'react';

export default function CursorEffect() {
  const dot  = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No cursor effect on touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const d = dot.current, r = ring.current;
    if (!d || !r) return;

    let mx = -200, my = -200, rx = -200, ry = -200;
    let raf: number;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      d.style.left = mx + 'px';
      d.style.top  = my + 'px';
    };

    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      hovering = !!(t.closest('button, a, [role="button"], input, textarea, select'));
      r.style.width  = hovering ? '48px' : '30px';
      r.style.height = hovering ? '48px' : '30px';
      r.style.borderColor = hovering ? 'rgba(0,229,200,0.7)' : 'rgba(0,229,200,0.35)';
    };

    const tick = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      r.style.left = rx + 'px';
      r.style.top  = ry + 'px';
      raf = requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dot} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 99999,
        width: 6, height: 6, borderRadius: '50%',
        background: '#00E5C8', mixBlendMode: 'difference',
        transform: 'translate(-50%,-50%)',
        top: -200, left: -200,
      }} />
      <div ref={ring} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 99998,
        width: 30, height: 30, borderRadius: '50%',
        border: '1px solid rgba(0,229,200,0.35)',
        transform: 'translate(-50%,-50%)',
        top: -200, left: -200,
        transition: 'width 0.25s, height 0.25s, border-color 0.25s',
      }} />
    </>
  );
}
