import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { OWNER_EMAIL } from '@/lib/owner';
import { rateLimit } from '@/lib/rateLimit';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  // 20 per 15 min per IP — accommodates shared/NAT'd IPs; account lockout and the
  // per-account login throttle are the real abuse controls.
  if (!rateLimit(`register:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  let body: { name?: string; email?: string; password?: string; role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, password, role } = body;
  const email = body.email?.toLowerCase().trim() ?? '';
  if (!name?.trim() || !email || !password) return NextResponse.json({ error: 'All fields required' }, { status: 422 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 422 });
  if (password.length > 128) return NextResponse.json({ error: 'Password too long (max 128 characters)' }, { status: 422 });

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  // OWNER is granted only if the owner email matches AND no OWNER account exists yet
  let assignedRole: 'OWNER' | 'USER' | 'ARTIST' = role === 'ARTIST' ? 'ARTIST' : 'USER';
  if (email === OWNER_EMAIL) {
    const ownerExists = await prisma.customer.findFirst({ where: { role: 'OWNER' }, select: { id: true } });
    if (!ownerExists) assignedRole = 'OWNER';
  }

  const customer = await prisma.customer.create({
    data: { name: name.trim(), email, password: hashPassword(password), role: assignedRole },
  });

  const res = NextResponse.json({ id: customer.id, name: customer.name, email: customer.email, role: customer.role }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(customer), sessionCookieOptions());
  return res;
}
