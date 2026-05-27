'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'welcome' | 'login' | 'register';
type RegisterRole = 'USER' | 'ARTIST';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<RegisterRole>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem('pd_session')) router.replace('/home');
    } catch { /* ignore */ }
  }, [router]);

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
  }

  function enterAsGuest() {
    try {
      localStorage.setItem('pd_session', JSON.stringify({ type: 'guest', name: 'Guest' }));
    } catch { /* ignore */ }
    router.push('/home');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? 'Login failed');
        return;
      }
      const user = await res.json() as { id: string; name: string; email: string; role: string };
      localStorage.setItem('pd_session', JSON.stringify({ type: 'user', customerId: user.id, name: user.name, email: user.email, role: user.role }));
      router.push(user.role === 'ARTIST' ? '/artist' : '/home');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: registerRole }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? 'Registration failed');
        return;
      }
      const user = await res.json() as { id: string; name: string; email: string; role: string };
      localStorage.setItem('pd_session', JSON.stringify({ type: 'user', customerId: user.id, name: user.name, email: user.email, role: user.role }));
      router.push(user.role === 'ARTIST' ? '/artist' : '/home');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '0.7rem 0.9rem',
    color: '#fff', fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.6rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: 5,
  };

  return (
    <main style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '48px 48px', pointerEvents: 'none',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,77,28,0.12) 0%, transparent 70%)',
        top: '20%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 40, marginBottom: 10, filter: 'drop-shadow(0 0 20px rgba(255,77,28,0.4))' }}>🖨</div>
          <div style={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.05em' }}>PrintDrop</div>
          <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.8rem', marginTop: 6, letterSpacing: '0.02em' }}>
            Custom T-Shirts · Delivered in 72h
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              ['welcome', 'Guest'],
              ['login', 'Sign In'],
              ['register', 'Register'],
            ] as [Mode, string][]).map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                padding: '0.875rem 0.5rem', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em',
                background: mode === m ? 'rgba(255,77,28,0.07)' : 'transparent',
                color: mode === m ? '#FF8C40' : 'rgba(255,255,255,0.3)',
                borderBottom: `2px solid ${mode === m ? '#FF4D1C' : 'transparent'}`,
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Body */}
          <div style={{ padding: '1.75rem' }}>

            {/* ── Guest ── */}
            {mode === 'welcome' && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Browse 50+ designs, customize your shirt, and place orders — no account needed.
                </p>

                <div style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.18)',
                  borderRadius: 10, padding: '0.875rem 1rem',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  marginBottom: '1.25rem',
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1, opacity: 0.8 }}>⚠</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(245,158,11,0.9)', marginBottom: 2 }}>
                      AI features unavailable
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.55 }}>
                      AI design generation requires a free account. Create one in seconds.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: '1.5rem' }}>
                  {['Browse 50+ premium designs', 'Custom text on your shirt', '72-hour door delivery', 'Free returns policy'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ color: '#10B981', fontSize: 11, fontWeight: 900 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={enterAsGuest} style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #FF4D1C, #FF8C40)',
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                  cursor: 'pointer', letterSpacing: '0.01em',
                  boxShadow: '0 6px 24px rgba(255,77,28,0.35)',
                  transition: 'opacity 0.15s',
                }}>
                  Continue as Guest →
                </button>
              </div>
            )}

            {/* ── Login ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8, padding: '0.7rem 0.9rem',
                    fontSize: '0.78rem', color: '#F87171', marginBottom: '1rem',
                  }}>{error}</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #FF4D1C, #FF8C40)',
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(255,77,28,0.3)',
                  transition: 'all 0.15s',
                }}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.22)' }}>
                  No account?{' '}
                  <button type="button" onClick={() => switchMode('register')} style={{
                    background: 'none', border: 'none', color: '#FF8C40',
                    cursor: 'pointer', fontSize: 'inherit', fontWeight: 700, padding: 0,
                  }}>Create one free</button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8, padding: '0.7rem 0.9rem',
                    fontSize: '0.78rem', color: '#F87171', marginBottom: '1rem',
                  }}>{error}</div>
                )}
                {/* Account type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
                  {([['USER', '🛒 Customer', 'Order custom shirts'] , ['ARTIST', '🎨 Artist', 'Upload & earn 50%']] as [RegisterRole, string, string][]).map(([r, label, desc]) => (
                    <button key={r} type="button" onClick={() => setRegisterRole(r)} style={{ padding: '0.75rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${registerRole === r ? (r === 'ARTIST' ? 'rgba(139,92,246,0.5)' : 'rgba(255,77,28,0.4)') : 'rgba(255,255,255,0.07)'}`, background: registerRole === r ? (r === 'ARTIST' ? 'rgba(139,92,246,0.07)' : 'rgba(255,77,28,0.06)') : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: registerRole === r ? (r === 'ARTIST' ? '#A78BFA' : '#FF8C40') : 'rgba(255,255,255,0.55)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required autoComplete="name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required autoComplete="new-password" />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #FF4D1C, #FF8C40)',
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(255,77,28,0.3)',
                  transition: 'all 0.15s',
                }}>
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.22)' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} style={{
                    background: 'none', border: 'none', color: '#FF8C40',
                    cursor: 'pointer', fontSize: 'inherit', fontWeight: 700, padding: 0,
                  }}>Sign in</button>
                </p>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.12)' }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>
    </main>
  );
}
