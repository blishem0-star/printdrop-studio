'use client';
import React from 'react';

// Base UI primitives built on the design tokens in globals.css.
// Adopt incrementally — new UI should use these instead of ad-hoc inline styles.

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'primary', size = 'md', style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: 'var(--radius-sm)',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    padding: size === 'sm' ? '5px 12px' : '0.6rem 1.2rem',
    fontSize: size === 'sm' ? '0.72rem' : '0.85rem',
    border: '1px solid transparent',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#03241F', borderColor: 'var(--accent)' },
    ghost:   { background: 'var(--surface)', color: 'var(--text-2)', borderColor: 'var(--border)' },
    danger:  { background: 'rgba(255,80,80,0.08)', color: '#FF7A7A', borderColor: 'rgba(255,80,80,0.25)' },
  };
  return <button {...rest} style={{ ...base, ...variants[variant], ...style }} />;
}

export function Card({ style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem',
        ...style,
      }}
    />
  );
}

export function Badge({ tone = 'neutral', style, ...rest }: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'accent' | 'neutral' | 'warn' | 'danger' }) {
  const tones: Record<string, React.CSSProperties> = {
    accent:  { background: 'rgba(0,229,200,0.08)', color: 'var(--accent)', borderColor: 'rgba(0,229,200,0.25)' },
    neutral: { background: 'var(--surface)', color: 'var(--text-2)', borderColor: 'var(--border)' },
    warn:    { background: 'rgba(255,200,60,0.08)', color: '#FFC83C', borderColor: 'rgba(255,200,60,0.25)' },
    danger:  { background: 'rgba(255,80,80,0.08)', color: '#FF7A7A', borderColor: 'rgba(255,80,80,0.25)' },
  };
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 6, border: '1px solid',
        ...tones[tone], ...style,
      }}
    />
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)',
  borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem',
  color: 'var(--text)', fontSize: '0.85rem', outline: 'none',
};

export function Input({ style, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} style={{ ...inputStyle, ...style }} />;
}
