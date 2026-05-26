import React from 'react';

type Props = {
  n: number;
  title: string;
  status: 'active' | 'done' | 'locked';
  summary?: string;
  onEdit?: () => void;
  children: React.ReactNode;
};

export default function StepShell({ n, title, status, summary, onEdit, children }: Props) {
  const accentColor = status === 'done' ? '#10B981' : status === 'active' ? '#FF4D1C' : 'rgba(255,255,255,0.15)';

  return (
    <div style={{
      borderRadius: 20,
      border: `1px solid ${status === 'active' ? 'rgba(255,77,28,0.3)' : status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
      background: status === 'locked' ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.025)',
      overflow: 'hidden',
      transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      opacity: status === 'locked' ? 0.4 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        borderBottom: status === 'active' ? '1px solid rgba(255,255,255,0.06)' : 'none',
        cursor: status === 'locked' ? 'not-allowed' : 'default',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: status === 'done'
              ? 'rgba(16,185,129,0.15)'
              : status === 'active'
                ? 'linear-gradient(135deg,#FF4D1C,#FF7A00)'
                : 'rgba(255,255,255,0.05)',
            border: `1px solid ${accentColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: status === 'active' ? 'white' : accentColor,
          }}>
            {status === 'done' ? '✓' : n}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: status === 'locked' ? 'rgba(255,255,255,0.3)' : 'white' }}>
              {title}
            </div>
            {status === 'done' && summary && (
              <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: 2 }}>{summary}</div>
            )}
            {status === 'locked' && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                Complete step {n - 1} first
              </div>
            )}
          </div>
        </div>
        {status === 'done' && onEdit && (
          <button onClick={onEdit} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '5px 14px', color: 'rgba(255,255,255,0.5)',
            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}>Edit</button>
        )}
      </div>
      {status === 'active' && (
        <div style={{ padding: '1.5rem' }}>{children}</div>
      )}
    </div>
  );
}
