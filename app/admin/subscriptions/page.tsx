'use client';
import { useState, useEffect } from 'react';
import { PRODUCT_TYPE_LABELS } from '@/lib/productTypes';
import type { ProductType } from '@/lib/productTypes';

type SubStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
type Subscription = {
  id: string; status: SubStatus; stylePrefs: string; nextShipmentAt: string; createdAt: string;
  customer: { name: string; email: string };
  shipments: { id: string; status: string; createdAt: string }[];
};

const STATUS_STYLE: Record<SubStatus, { color: string; bg: string }> = {
  ACTIVE:    { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  PAUSED:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  CANCELLED: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | SubStatus>('ACTIVE');

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(r => r.json())
      .then(setSubs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? subs : subs.filter(s => s.status === filter);
  const active  = subs.filter(s => s.status === 'ACTIVE').length;
  const paused  = subs.filter(s => s.status === 'PAUSED').length;
  const mrr     = active * 59.99;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Premium Subscriptions</h1>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginTop: 3 }}>Manage monthly box subscribers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '2rem' }}>
        {[
          { label: 'Active',  value: active,          icon: '✅', color: '#10B981' },
          { label: 'Paused',  value: paused,          icon: '⏸',  color: '#F59E0B' },
          { label: 'Total',   value: subs.length,     icon: '📦', color: '#8B5CF6' },
          { label: 'MRR',     value: `$${mrr.toFixed(2)}`, icon: '💰', color: '#3B82F6' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},transparent)` }} />
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.04em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: '1.5rem' }}>
        {(['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: filter === f ? 'rgba(255,77,28,0.4)' : 'rgba(255,255,255,0.07)', background: filter === f ? 'rgba(255,77,28,0.08)' : 'transparent', color: filter === f ? '#FF8C40' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
            {f === 'ALL' ? `All (${subs.length})` : f === 'ACTIVE' ? `Active (${active})` : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.15)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: 'rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <p>No subscriptions found</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Customer', 'Style Prefs', 'Status', 'Next Shipment', 'Boxes Sent', 'Since'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const prefs = (() => { try { return JSON.parse(s.stylePrefs); } catch { return {}; } })();
                const ss = STATUS_STYLE[s.status];
                return (
                  <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.customer.name}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' }}>{s.customer.email}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', marginBottom: 3 }}>{prefs.style ?? '—'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {(prefs.productTypes ?? []).map((t: ProductType) => (
                          <span key={t} style={{ fontSize: '0.5rem', fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>{PRODUCT_TYPE_LABELS[t]}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, color: ss.color, background: ss.bg, border: `1px solid ${ss.color}33`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: s.status === 'ACTIVE' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)' }}>
                      {new Date(s.nextShipmentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: '#A78BFA' }}>{s.shipments.length}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
