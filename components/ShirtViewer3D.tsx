'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import TShirtMockup from './TShirtMockup';

type Props = {
  color: string;
  textColor: string;
  emoji?: string;
  label?: string;
};

export default function ShirtViewer3D({ color, textColor, emoji, label }: Props) {
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const lastPos = useRef({ x: 0, y: 0 });
  const spinRef = useRef<number>(null);
  const rotRef = useRef(0);

  // Auto-spin
  const startSpin = useCallback(() => {
    if (!autoSpin) return;
    const tick = () => {
      rotRef.current += 0.4;
      setRotY(rotRef.current);
      spinRef.current = requestAnimationFrame(tick);
    };
    spinRef.current = requestAnimationFrame(tick);
  }, [autoSpin]);

  const stopSpin = useCallback(() => {
    if (spinRef.current) cancelAnimationFrame(spinRef.current);
  }, []);

  // Start auto-spin on mount and when autoSpin toggles on
  useEffect(() => {
    if (autoSpin) startSpin();
    else stopSpin();
    return () => stopSpin();
  }, [autoSpin, startSpin, stopSpin]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setAutoSpin(false);
    stopSpin();
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotY(r => r + dx * 0.8);
    setRotX(r => Math.max(-25, Math.min(25, r - dy * 0.4)));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => setDragging(false);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    setAutoSpin(false);
    stopSpin();
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    setRotY(r => r + dx * 0.8);
    setRotX(r => Math.max(-25, Math.min(25, r - dy * 0.4)));
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
        style={{
          cursor: dragging ? 'grabbing' : 'grab',
          perspective: 800,
          width: 260, height: 300,
          margin: '0 auto',
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: dragging ? 'none' : 'transform 0.05s',
        }}>
          {/* Front */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TShirtMockup color={color} textColor={textColor} emoji={emoji} label={label} size="lg" />
          </div>
          {/* Back */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <TShirtMockup color={color} textColor={textColor} size="lg" />
              <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 11, color: textColor, opacity: 0.4, fontWeight: 700, letterSpacing: '0.15em' }}>BACK</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
        <button onClick={() => { setRotY(0); setRotX(0); }} style={ctrlBtn}>Front</button>
        <button onClick={() => { setRotY(180); setRotX(0); }} style={ctrlBtn}>Back</button>
        <button onClick={() => setAutoSpin(a => !a)} style={{ ...ctrlBtn, borderColor: autoSpin ? '#FF4D1C' : '#222', color: autoSpin ? '#FF8C00' : '#555' }}>
          {autoSpin ? '⏸ Stop' : '▶ Spin'}
        </button>
      </div>
      <p style={{ textAlign: 'center', color: '#444', fontSize: 11, marginTop: 8 }}>Drag to rotate · Pinch to spin</p>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  background: '#111', border: '1px solid #222', borderRadius: 8,
  padding: '4px 12px', color: '#555', fontSize: 11, fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.15s',
};
