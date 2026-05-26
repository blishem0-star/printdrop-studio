import React from 'react';

export function Checkmark() {
  return (
    <div style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      width: 20, height: 20, borderRadius: '50%',
      background: 'linear-gradient(135deg,#10B981,#059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, color: 'white', fontWeight: 800,
      boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
    }}>✓</div>
  );
}

type FieldProps = {
  label: string; value: string; onChange: (v: string) => void;
  valid?: boolean; type?: string; mono?: boolean;
};

export function Field({ label, value, onChange, valid, type = 'text', mono = false }: FieldProps) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input" type={type} placeholder={label}
        value={value} onChange={e => onChange(e.target.value)}
        style={{ paddingRight: valid ? 40 : 14, fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.08em' : 'normal' }}
      />
      {valid && <Checkmark />}
    </div>
  );
}

type LabeledFieldProps = FieldProps & { placeholder?: string };

export function LabeledField({ label, value, onChange, valid, type = 'text', mono = false, placeholder }: LabeledFieldProps) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          className="input" type={type}
          placeholder={placeholder ?? label}
          value={value} onChange={e => onChange(e.target.value)}
          style={{
            paddingRight: valid ? 40 : 14,
            fontFamily: mono ? 'monospace' : 'inherit',
            letterSpacing: mono ? '0.08em' : 'normal',
            background: 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${valid ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10,
            color: 'rgba(255,255,255,0.88)',
            fontSize: '0.875rem',
            transition: 'border-color 0.15s',
          }}
        />
        {valid && <Checkmark />}
      </div>
    </div>
  );
}
