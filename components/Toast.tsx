'use client';
import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDone?: () => void;
}

const COLORS: Record<ToastType, { border: string; text: string; bg: string; icon: string }> = {
  success: { border: 'rgba(16,185,129,0.35)', text: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: '✓' },
  error:   { border: 'rgba(239,68,68,0.35)',  text: '#f87171', bg: 'rgba(239,68,68,0.08)',  icon: '!' },
  info:    { border: 'rgba(0,229,200,0.3)',   text: '#00E5C8', bg: 'rgba(0,229,200,0.06)', icon: 'i' },
};

export function Toast({ message, type = 'info', duration = 3000, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const c = COLORS[type];

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(() => onDone?.(), 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div role="alert" aria-live={type === 'error' ? 'assertive' : 'polite'} aria-atomic="true"
      style={{
      position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
      opacity: visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      zIndex: 9999, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 18px', borderRadius: 12,
      background: 'rgba(5,5,7,0.95)', backdropFilter: 'blur(20px)',
      border: `1px solid ${c.border}`, color: '#fff',
      fontSize: '0.82rem', fontWeight: 600,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}`,
    }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: c.text, flexShrink: 0 }}>{c.icon}</span>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; key: number } | null>(null);

  function show(message: string, type: ToastType = 'info') {
    setToast({ message, type, key: Date.now() });
  }

  const element = toast ? (
    <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />
  ) : null;

  return { show, element };
}
