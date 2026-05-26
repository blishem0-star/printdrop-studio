'use client';
import { useState } from 'react';
import { SHIRT_SIZES, TShirtSize } from '@/lib/mockData';

const MOCK_MEMBERS = [
  { name: 'Alex K.', size: 'L', joined: true },
  { name: 'Maria S.', size: 'S', joined: true },
  { name: 'Tom B.', size: 'XL', joined: true },
];

export default function GroupOrderModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'create' | 'share' | 'join' | 'manage'>('create');
  const [groupName, setGroupName] = useState('');
  const [code] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [joinCode, setJoinCode] = useState('');
  const [yourSize, setYourSize] = useState<TShirtSize>('M');
  const [yourName, setYourName] = useState('');
  const [members, setMembers] = useState(MOCK_MEMBERS);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 24, padding: '2rem', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>👥 Group Order</h2>
            <p style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Everyone picks their size, one person pays</p>
          </div>
          <button onClick={onClose} style={{ background: '#1e1e1e', border: 'none', color: '#888', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {/* Bulk pricing tiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
          {[
            { qty: '1–4', price: '$29.99', label: 'Standard', color: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', tag: null },
            { qty: '5–9', price: '$24.99', label: '−17%', color: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.2)', tag: 'POPULAR' },
            { qty: '10+', price: '$19.99', label: '−33%', color: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', tag: 'BEST' },
          ].map(tier => (
            <div key={tier.qty} style={{ borderRadius: 12, padding: '0.75rem', textAlign: 'center', background: tier.color, border: `1px solid ${tier.border}`, position: 'relative' }}>
              {tier.tag && <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: tier.qty === '10+' ? '#10B981' : '#8B5CF6', color: 'white', fontSize: '0.55rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{tier.tag}</div>}
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4 }}>{tier.qty} shirts</div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'white' }}>{tier.price}</div>
              <div style={{ fontSize: '0.6rem', color: tier.label.startsWith('−') ? '#10B981' : 'rgba(255,255,255,0.25)', fontWeight: 700, marginTop: 2 }}>{tier.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', background: '#0d0d0d', borderRadius: 10, padding: 4 }}>
          {[['create', 'Create Group'], ['join', 'Join Group']].map(([id, label]) => (
            <button key={id} onClick={() => setStep(id as 'create' | 'join')} style={{
              flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none',
              background: step === id ? '#1e1e1e' : 'transparent',
              color: step === id ? '#fff' : '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Create */}
        {step === 'create' && (
          <div>
            <input value={groupName} onChange={e => setGroupName(e.target.value)}
              placeholder="Group name (e.g. Dev Team 2025)"
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none', marginBottom: '1rem' }} />
            <button className="btn-primary" onClick={() => setStep('share')}
              disabled={!groupName.trim()}
              style={{ width: '100%', justifyContent: 'center', opacity: !groupName.trim() ? 0.4 : 1 }}>
              Create Group →
            </button>
          </div>
        )}

        {/* Share */}
        {step === 'share' && (
          <div>
            <div style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 14, padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Share this code with your group</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.15em', color: '#FF4D1C', fontFamily: 'monospace' }}>{code}</div>
              <button onClick={() => navigator.clipboard?.writeText(code)}
                style={{ marginTop: 12, background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: 12, padding: '6px 16px', cursor: 'pointer' }}>
                Copy Code
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>Members who joined ({members.length})</p>
              {members.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13 }}>
                  <span style={{ color: '#ccc' }}>{m.name}</span>
                  <span style={{ background: 'rgba(255,77,28,0.1)', color: '#FF8C00', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Size {m.size}</span>
                </div>
              ))}
              <p style={{ color: '#444', fontSize: 11, marginTop: 8 }}>Waiting for more members...</p>
            </div>

            <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
              {(() => {
                const n = members.length;
                const price = n >= 10 ? 19.99 : n >= 5 ? 24.99 : 29.99;
                return `Place Order for ${n} — $${(price * n).toFixed(2)}`;
              })()}
            </button>
          </div>
        )}

        {/* Join */}
        {step === 'join' && (
          <div>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code (e.g. XK9P2M)"
              maxLength={6}
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 18, fontFamily: 'monospace', outline: 'none', marginBottom: '1rem', textAlign: 'center', letterSpacing: '0.2em' }} />
            <input value={yourName} onChange={e => setYourName(e.target.value)}
              placeholder="Your name"
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem', color: '#fff', fontSize: 14, outline: 'none', marginBottom: '1rem' }} />
            <label style={{ color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Your Size</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {SHIRT_SIZES.map(s => (
                <button key={s} onClick={() => setYourSize(s)} style={{
                  width: 48, height: 48, borderRadius: 10, border: `1px solid ${yourSize === s ? '#FF4D1C' : '#222'}`,
                  background: yourSize === s ? 'rgba(255,77,28,0.1)' : '#111',
                  color: yourSize === s ? '#FF8C00' : '#666',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            <button className="btn-primary"
              disabled={joinCode.length < 6 || !yourName.trim()}
              onClick={() => { setMembers(m => [...m, { name: yourName, size: yourSize, joined: true }]); setStep('share'); }}
              style={{ width: '100%', justifyContent: 'center', opacity: joinCode.length < 6 || !yourName.trim() ? 0.4 : 1 }}>
              Join Group →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
