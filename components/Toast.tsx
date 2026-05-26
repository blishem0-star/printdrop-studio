'use client';
import { useEffect } from 'react';

type Props = {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
};

const STYLES = {
  error:   { bg: '#EF4444', glow: 'rgba(239,68,68,0.45)',   icon: '⚠' },
  success: { bg: '#10B981', glow: 'rgba(16,185,129,0.45)',  icon: '✓' },
  info:    { bg: '#6C63FF', glow: 'rgba(108,99,255,0.45)',  icon: 'ℹ' },
};

export default function Toast({ message, type = 'success', onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  const s = STYLES[type];

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: s.bg, color: 'white',
      padding: '0.875rem 1.75rem', borderRadius: 14,
      fontWeight: 700, fontSize: '0.875rem',
      boxShadow: `0 8px 40px ${s.glow}`,
      animation: 'fade-up 0.3s ease',
      display: 'flex', alignItems: 'center', gap: 9,
      whiteSpace: 'nowrap',
    }}>
      <span>{s.icon}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, padding: 0, marginLeft: 4 }}>×</button>
    </div>
  );
}
