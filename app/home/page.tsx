'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OWNER_EMAIL } from '@/lib/owner';

type Session = { type: 'guest' | 'user'; customerId?: string; name: string; email?: string; role?: string };

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pd_session');
      if (!raw) { router.replace('/'); return; }
      const sess: Session = JSON.parse(raw);
      setSession(sess);
    } catch { router.replace('/'); }
  }, [router]);

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

        <button onClick={() => router.push('/premium')} style={navBtn('premium')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.14)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.07)'; }}
        >✨ Premium</button>

        <div style={{ flex: 1 }} />

        {session.type === 'guest' && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.7)' }}>Guest</span>
        )}

        {session.type === 'user' && session.role === 'ARTIST' && (
          <button onClick={() => router.push('/artist')} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA', cursor: 'pointer' }}>🎨 Artist Studio</button>
        )}

        {session.type === 'user' && (
          <button
            onClick={() => router.push('/profile')}
            style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, background: 'transparent', border: '1px solid transparent', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,77,28,0.2)', border: '1px solid rgba(255,77,28,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 900, color: '#FF8C40' }}>
              {session.name.charAt(0).toUpperCase()}
            </div>
            {session.name}
          </button>
        )}

        {session.email === OWNER_EMAIL && (
          <a href="/admin" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.22)', color: 'rgba(255,140,64,0.85)', textDecoration: 'none' }}>⚙ Admin</a>
        )}
        <button onClick={signOut} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Sign out</button>
      </header>

      <main style={{ padding: '4rem 2rem' }} />
    </div>
  );
}

function navBtn(accent: 'orange' | 'indigo' | 'premium'): React.CSSProperties {
  const c = accent === 'orange'
    ? { bg: 'rgba(255,77,28,0.07)', border: 'rgba(255,77,28,0.25)', color: 'rgba(255,140,64,0.9)' }
    : accent === 'premium'
    ? { bg: 'rgba(255,77,28,0.07)', border: 'rgba(255,77,28,0.25)', color: 'rgba(255,140,64,0.9)' }
    : { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.25)', color: 'rgba(129,140,248,0.9)' };
  return { padding: '6px 16px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' };
}
