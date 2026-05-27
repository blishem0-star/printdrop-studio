'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OWNER_EMAIL } from '@/lib/owner';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string };

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      setSession(sess);
      setEditName(sess.name);
      setEditEmail(sess.email ?? '');
    } catch { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
        setEditMode(false);
        setSaveError('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function saveProfile() {
    if (!session?.customerId) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: session.customerId, name: editName.trim(), email: editEmail.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? 'Failed to save');
        return;
      }
      const updated = await res.json();
      const newSession = { ...session, name: updated.name, email: updated.email };
      localStorage.setItem('pd_session', JSON.stringify(newSession));
      setSession(newSession);
      setEditMode(false);
      setShowProfileMenu(false);
    } catch { setSaveError('Network error'); }
    finally { setSaving(false); }
  }

  function signOut() {
    try { localStorage.removeItem('pd_session'); } catch { /* ignore */ }
    router.replace('/');
  }

  if (!session) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 58, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 8, background: 'rgba(8,8,8,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <span style={{ fontSize: 20, marginRight: 4 }}>🖨</span>
        <span style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.04em', marginRight: 16 }}>PrintDrop</span>

        <button onClick={() => router.push('/studio/custom')} style={navBtn('orange')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.07)'; }}
        >✏️ Create your shirt</button>

        <button onClick={() => router.push('/catalog')} style={navBtn('indigo')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; }}
        >🎨 Catalog</button>

        <div style={{ flex: 1 }} />

        {session.type === 'guest' && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.7)' }}>Guest</span>
        )}

        {/* Username with profile menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { if (session.type === 'user') { setShowProfileMenu(v => !v); setEditMode(false); setSaveError(''); } }}
            style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, background: showProfileMenu ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${showProfileMenu ? 'rgba(255,255,255,0.12)' : 'transparent'}`, borderRadius: 8, padding: '5px 10px', cursor: session.type === 'user' ? 'pointer' : 'default', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { if (session.type === 'user') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!showProfileMenu) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,77,28,0.2)', border: '1px solid rgba(255,77,28,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, color: '#FF8C40' }}>
              {session.name.charAt(0).toUpperCase()}
            </div>
            {session.name}
            {session.type === 'user' && <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>▾</span>}
          </button>

          {/* Profile dropdown */}
          {showProfileMenu && session.type === 'user' && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260, background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', padding: '1rem', zIndex: 100 }}>
              {!editMode ? (
                <>
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 2 }}>{session.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{session.email}</div>
                  </div>
                  <button onClick={() => { setEditName(session.name); setEditEmail(session.email ?? ''); setEditMode(true); }} style={{ width: '100%', padding: '0.6rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                    ✏️ Edit profile
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '0.875rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Edit Profile</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                    <input
                      value={editName} onChange={e => setEditName(e.target.value)}
                      placeholder="Full name"
                      style={dropInp}
                    />
                    <input
                      value={editEmail} onChange={e => setEditEmail(e.target.value)}
                      type="email" placeholder="Email"
                      style={dropInp}
                    />
                  </div>
                  {saveError && <div style={{ fontSize: '0.7rem', color: '#f87171', marginBottom: 8 }}>{saveError}</div>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={saveProfile} disabled={saving || !editName.trim()} style={{ flex: 1, padding: '0.55rem', borderRadius: 8, border: 'none', background: !saving && editName.trim() ? '#FF4D1C' : 'rgba(255,255,255,0.06)', color: !saving && editName.trim() ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: '0.78rem', cursor: !saving && editName.trim() ? 'pointer' : 'default' }}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditMode(false); setSaveError(''); }} style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {session.email === OWNER_EMAIL && (
          <a href="/admin" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.22)', color: 'rgba(255,140,64,0.85)', textDecoration: 'none' }}>⚙ Admin</a>
        )}
        <button onClick={signOut} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Sign out</button>
      </header>

      <main style={{ padding: '4rem 2rem' }} />
    </div>
  );
}

function navBtn(accent: 'orange' | 'indigo'): React.CSSProperties {
  const c = accent === 'orange'
    ? { bg: 'rgba(255,77,28,0.07)', border: 'rgba(255,77,28,0.25)', color: 'rgba(255,140,64,0.9)' }
    : { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.25)', color: 'rgba(129,140,248,0.9)' };
  return { padding: '6px 16px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' };
}

const dropInp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '0.5rem 0.7rem',
  color: '#fff', fontSize: '0.82rem', outline: 'none',
};
