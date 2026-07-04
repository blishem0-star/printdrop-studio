import { prisma } from '@/lib/prisma';
import { createCoupon } from './actions';
import { ToggleButton } from './ToggleButton';

export const dynamic = 'force-dynamic';

const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}>Coupons</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: 4 }}>Percent-off codes, validated server-side at checkout. Great for launch and win-back campaigns.</p>
      </div>

      <form action={createCoupon} style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap', border: '1px solid rgba(0,229,200,0.16)', background: 'rgba(0,229,200,0.03)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        {[['code', 'Code (e.g. LAUNCH15)', 'text', 'LAUNCH15'], ['pct', 'Percent off', 'number', '15'], ['maxUses', 'Max uses (blank = unlimited)', 'number', ''], ['days', 'Expires in days (blank = never)', 'number', '']].map(([name, label, type, ph]) => (
          <label key={name} style={{ display: 'grid', gap: 5, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label}
            <input name={name} type={type} placeholder={ph} required={name === 'code' || name === 'pct'} style={{ ...inp, width: name === 'code' ? 160 : 120, textTransform: name === 'code' ? 'uppercase' : undefined }} />
          </label>
        ))}
        <button type="submit" style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer' }}>Save coupon</button>
      </form>

      {coupons.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>No coupons yet - create LAUNCH15 above and share it on launch day.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {coupons.map(c => {
            const expired = c.expiresAt && c.expiresAt < new Date();
            const exhausted = c.maxUses !== null && c.uses >= c.maxUses;
            const live = c.active && !expired && !exhausted;
            return (
              <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.8rem 1rem', borderRadius: 12, border: `1px solid ${live ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`, background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', color: live ? '#34d399' : 'rgba(255,255,255,0.4)' }}>{c.code}</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>-{c.pct}%</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ''} used</span>
                {c.expiresAt && <span style={{ fontSize: '0.7rem', color: expired ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{expired ? 'expired' : `until ${c.expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>}
                {exhausted && <span style={{ fontSize: '0.7rem', color: '#f87171' }}>exhausted</span>}
                <span style={{ marginLeft: 'auto' }}><ToggleButton code={c.code} active={c.active} /></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
