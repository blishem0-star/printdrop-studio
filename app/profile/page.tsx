'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OWNER_EMAIL } from '@/lib/owner';
import { useToast } from '@/components/Toast';

type Role = 'OWNER' | 'USER' | 'ARTIST';
type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string; role?: Role };
type OrderStatus = 'DRAFT' | 'PAID' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: 'Draft', PAID: 'Paid', IN_PRODUCTION: 'In Production',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT: 'rgba(255,255,255,0.3)', PAID: '#3B82F6', IN_PRODUCTION: '#F59E0B',
  SHIPPED: '#8B5CF6', DELIVERED: '#10B981', CANCELLED: '#EF4444',
};

type Profile = {
  id: string; name: string; email: string; role: Role; createdAt: string;
  shipStreet?: string | null; shipCity?: string | null; shipState?: string | null; shipZip?: string | null;
  aiProfile?: string | null;
  orders: { id: string; status: OrderStatus; total: number; createdAt: string; items: { designAsset: { title: string; colorHex: string; size: string } | null; unitPrice: number }[] }[];
  _count: { orders: number };
};

const ROLE_BADGE: Record<Role, { label: string; color: string; bg: string }> = {
  OWNER:  { label: 'Owner',  color: '#00E5C8', bg: 'rgba(0,229,200,0.12)' },
  ARTIST: { label: 'Artist', color: '#A78BFA', bg: 'rgba(139,92,246,0.12)' },
  USER:   { label: 'Member', color: '#60A5FA', bg: 'rgba(59,130,246,0.1)' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const { show: showToast, element: toastEl } = useToast();

  // Edit address
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity]     = useState('');
  const [addrState, setAddrState]   = useState('');
  const [addrZip, setAddrZip]       = useState('');
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrSaved, setAddrSaved]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      if (sess.type !== 'user' || !sess.customerId) { router.replace('/home'); return; }
      setSession(sess);
    } catch { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    if (!session?.customerId) return;
    fetch(`/api/user/profile?customerId=${session.customerId}`)
      .then(r => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setEditName(p.name);
        setEditEmail(p.email);
        setAddrStreet(p.shipStreet ?? '');
        setAddrCity(p.shipCity ?? '');
        setAddrState(p.shipState ?? '');
        setAddrZip(p.shipZip ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  async function saveProfile() {
    if (!session?.customerId) return;
    setProfileSaving(true); setProfileError(''); setProfileSaved(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: session.customerId, name: editName.trim(), email: editEmail.trim() }),
      });
      if (!res.ok) { const d = await res.json(); const msg = d.error ?? 'Failed to save'; setProfileError(msg); showToast(msg, 'error'); return; }
      const updated = await res.json();
      const newSession = { ...session, name: updated.name, email: updated.email };
      localStorage.setItem('pd_session', JSON.stringify(newSession));
      setSession(newSession);
      setProfile(p => p ? { ...p, name: updated.name, email: updated.email } : p);
      setProfileSaved(true);
      showToast('Profile saved!', 'success');
      setTimeout(() => setProfileSaved(false), 2500);
    } catch { setProfileError('Network error'); showToast('Network error.', 'error'); }
    finally { setProfileSaving(false); }
  }

  async function saveAddress() {
    if (!session?.customerId) return;
    setAddrSaving(true); setAddrSaved(false);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: session.customerId,
          shipStreet: addrStreet.trim(),
          shipCity: addrCity.trim(),
          shipState: addrState,
          shipZip: addrZip.trim(),
        }),
      });
      setProfile(p => p ? { ...p, shipStreet: addrStreet, shipCity: addrCity, shipState: addrState, shipZip: addrZip } : p);
      // sync localStorage for pre-filled forms
      localStorage.setItem('pd_shipping', JSON.stringify({ street: addrStreet.trim(), city: addrCity.trim(), state: addrState, zip: addrZip.trim() }));
      setAddrSaved(true);
      showToast('Address saved!', 'success');
      setTimeout(() => setAddrSaved(false), 2500);
    } catch { showToast('Failed to save address.', 'error'); }
    finally { setAddrSaving(false); }
  }

  function signOut() {
    try { localStorage.removeItem('pd_session'); } catch { /* ignore */ }
    router.replace('/');
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none',
  };
  const lbl: React.CSSProperties = {
    fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block',
  };
  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, padding: '1.5rem', marginBottom: '1.25rem',
    position: 'relative', overflow: 'hidden',
    backdropFilter: 'blur(8px)',
  };

  const role = profile?.role ?? session?.role ?? 'USER';
  const badge = ROLE_BADGE[role];
  const orderCount = profile?._count.orders ?? 0;
  const aiUnlocked = orderCount >= 3;

  if (!session || loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#050507,#060610)' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem', fontFamily: "'Outfit', system-ui, sans-serif" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507 0%,#060610 100%)', position: 'relative' }}>
      {toastEl}
      {/* Atmosphere */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.04) 0%, transparent 60%)', top: '-5%', right: '10%' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.03) 0%, transparent 65%)', bottom: '10%', left: '0%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.011) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.011) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, background: 'rgba(5,5,7,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif" }}>← Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.35rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1 }}>Profile</span>
        <div style={{ flex: 1 }} />
        {role === 'ARTIST' && (
          <button onClick={() => router.push('/artist')} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.25)', color: '#00E5C8', cursor: 'pointer' }}>🎨 Artist Studio</button>
        )}
        {session.email === OWNER_EMAIL && (
          <a href="/admin" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.22)', color: 'rgba(0,229,200,0.85)', textDecoration: 'none' }}>⚙ Admin</a>
        )}
        <button onClick={signOut} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Sign out</button>
      </header>

      <main className="rsp-pad" style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
        <h1 className="sr-only">Your Profile — {profile?.name ?? session.name}</h1>

        {/* Identity card */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${badge.bg}`, border: `2px solid ${badge.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900, color: badge.color, flexShrink: 0 }}>
            {(profile?.name ?? session.name).charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 900, fontSize: '1.15rem' }}>{profile?.name ?? session.name}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}44`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{badge.label}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{profile?.email ?? session.email}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>
              {orderCount} order{orderCount !== 1 ? 's' : ''} · Member since {profile ? new Date(profile.createdAt ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✏️ Edit Profile
          </div>
          <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Full Name</label><input style={inp} autoComplete="name" maxLength={80} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Jane Smith" /></div>
            <div><label style={lbl}>Email</label><input style={inp} type="email" autoComplete="email" maxLength={120} value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="you@example.com" /></div>
          </div>
          {profileError && <div style={{ fontSize: '0.72rem', color: '#F87171', marginBottom: 10 }}>{profileError}</div>}
          <button onClick={saveProfile} disabled={profileSaving || !editName.trim()} style={{ padding: '0.55rem 1.5rem', borderRadius: 10, border: 'none', background: profileSaved ? '#10B981' : editName.trim() && !profileSaving ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.05)', color: editName.trim() && !profileSaving ? '#050507' : 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: '0.82rem', cursor: editName.trim() && !profileSaving ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {profileSaved ? '✓ Saved' : profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Shipping Address */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            📦 Shipping Address
            <span style={{ fontWeight: 400, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>Used for future orders</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Street Address</label><input style={inp} autoComplete="street-address" maxLength={120} value={addrStreet} onChange={e => setAddrStreet(e.target.value)} placeholder="123 Main St" /></div>
            <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 10 }}>
              <div><label style={lbl}>City</label><input style={inp} autoComplete="address-level2" maxLength={60} value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="New York" /></div>
              <div>
                <label style={lbl}>State</label>
                <select value={addrState} onChange={e => setAddrState(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer', color: addrState ? '#fff' : 'rgba(255,255,255,0.28)' }}>
                  <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>ST</option>
                  {US_STATES.map(s => <option key={s} value={s} style={{ background: '#1a1a1a', color: '#fff' }}>{s}</option>)}
                </select>
              </div>
              <div><label style={lbl}>ZIP</label><input style={{ ...inp, fontFamily: 'monospace' }} autoComplete="postal-code" inputMode="numeric" value={addrZip} onChange={e => setAddrZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" /></div>
            </div>
          </div>
          <button onClick={saveAddress} disabled={addrSaving} style={{ padding: '0.55rem 1.5rem', borderRadius: 10, border: 'none', background: addrSaved ? '#10B981' : !addrSaving ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.05)', color: !addrSaving ? '#050507' : 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: '0.82rem', cursor: !addrSaving ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {addrSaved ? '✓ Saved' : addrSaving ? 'Saving...' : 'Save Address'}
          </button>
        </div>

        {/* AI Style Profile */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✨ AI Style Profile
            {!aiUnlocked && <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>Unlocks after 3 orders</span>}
          </div>

          {!aiUnlocked ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(orderCount / 3) * 100}%`, background: 'linear-gradient(90deg,#00E5C8,#0099FF)', borderRadius: 999, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, flexShrink: 0 }}>{orderCount}/3 orders</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                After your 3rd order, our AI analyzes your style preferences and creates a personalized profile — with shirt recommendations tailored just for you.
              </p>
            </div>
          ) : profile?.aiProfile ? (
            <AiProfileView data={profile.aiProfile} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem', background: 'rgba(0,229,200,0.04)', borderRadius: 12, border: '1px solid rgba(0,229,200,0.12)' }}>
              <div style={{ fontSize: 28 }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>AI is analyzing your style...</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Your style profile will appear here once AI integration is enabled. Your order history is already being tracked.</div>
              </div>
            </div>
          )}
        </div>

        {/* Order History */}
        {profile && profile.orders.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.25rem' }}>📦 Recent Orders</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.orders.map(order => (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: order.items[0]?.designAsset?.colorHex ?? '#2a2a2a', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{order.items[0]?.designAsset?.title ?? 'Custom Design'}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>
                      #{order.id.slice(0,8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, color: STATUS_COLOR[order.status], background: `${STATUS_COLOR[order.status]}18`, border: `1px solid ${STATUS_COLOR[order.status]}33` }}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>${order.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artist CTA */}
        {role === 'USER' && (
          <div style={{ ...sectionStyle, background: 'rgba(0,229,200,0.03)', border: '1px solid rgba(0,229,200,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>🎨</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: 3 }}>Are you a designer?</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Artists can upload their designs to our catalog and earn 50% on every sale. Register a new artist account to get started.</div>
              </div>
              <button onClick={() => router.push('/')} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1px solid rgba(0,229,200,0.3)', background: 'rgba(0,229,200,0.07)', color: '#00E5C8', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>Learn More</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AiProfileView({ data }: { data: string }) {
  try {
    const profile = JSON.parse(data);
    return (
      <div>
        {profile.style && <div style={{ marginBottom: 12 }}><span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Style</span><div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>{profile.style}</div></div>}
        {profile.recommendations?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recommended For You</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.recommendations.map((r: string, i: number) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(0,229,200,0.08)', border: '1px solid rgba(0,229,200,0.2)', color: '#00E5C8', fontSize: '0.72rem', fontWeight: 600 }}>{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch {
    return <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>AI profile data is loading...</div>;
  }
}
