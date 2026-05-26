'use client';
import { useState, useEffect } from 'react';

const EVENTS = [
  { emoji: '🛒', text: 'Jake from Los Angeles just ordered', design: 'Cosmic Wanderer' },
  { emoji: '👀', text: '23 people are viewing', design: 'Tokyo Neon' },
  { emoji: '🎉', text: 'Sarah from New York just received their', design: 'Make Waves' },
  { emoji: '🔥', text: '47 orders today for', design: 'Wild Roots' },
  { emoji: '🛒', text: 'Priya from London just ordered', design: 'AI Dream' },
  { emoji: '⭐', text: 'New 5-star review left for', design: 'Retro Vibes' },
  { emoji: '👀', text: '12 people are viewing', design: 'Street Code' },
  { emoji: '🛒', text: 'Marcus from Berlin just ordered', design: 'Mountain High' },
];

export default function SocialProofBar() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!visible || dismissed) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % EVENTS.length);
        setVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, [visible, dismissed]);

  if (dismissed) return null;

  const ev = EVENTS[current];

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 100,
      background: '#161616',
      border: '1px solid #2a2a2a',
      borderRadius: 14,
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      maxWidth: 320,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      transform: visible ? 'translateY(0)' : 'translateY(80px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>{ev.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>
          {ev.text}{' '}
          <strong style={{ color: '#fff' }}>{ev.design}</strong>
        </p>
        <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>Just now</p>
      </div>
      <button onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 2, lineHeight: 1 }}>
        ×
      </button>
    </div>
  );
}
