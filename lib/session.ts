// HMAC-signed session token, verifiable in both Node and Edge runtimes (Web Crypto).
// Payload: { id, email, role, exp }. Stored in an httpOnly cookie — the client never
// reads it; identity is always derived server-side from this cookie.

export const SESSION_COOKIE = 'pd_auth';
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  id: string;
  email: string;
  role: 'OWNER' | 'USER' | 'ARTIST';
  exp: number; // unix seconds
};

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is required in production');
    return 'dev-only-insecure-secret';
  }
  return s;
}

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(user: { id: string; email: string; role: string }): Promise<string> {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    role: user.role as SessionPayload['role'],
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(body)));
  return `${body}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const sigBytes = Uint8Array.from(b64urlDecode(sig), c => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), sigBytes, enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(b64urlDecode(body)) as SessionPayload;
    if (!payload.id || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SEC,
  };
}

/** Read + verify the session from the request cookies (route handlers / server components / actions). */
export async function getSession(): Promise<SessionPayload | null> {
  // dynamic import keeps this module importable from middleware (Edge), where next/headers is unavailable
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Throws-free guard: returns the session or null; caller decides the HTTP response. */
export async function requireRole(role: SessionPayload['role']): Promise<SessionPayload | null> {
  const s = await getSession();
  return s && s.role === role ? s : null;
}
