import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, isLegacyHash, hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 422 });
  const normEmail = email.toLowerCase().trim();

  // Per-account lockout (on top of per-IP rate limiting): 5 failures -> 15 minutes
  const throttle = await prisma.loginThrottle.findUnique({ where: { email: normEmail } });
  if (throttle?.lockedUntil && throttle.lockedUntil > new Date()) {
    return NextResponse.json({ error: 'Account temporarily locked. Try again later.' }, { status: 429 });
  }

  const customer = await prisma.customer.findUnique({ where: { email: normEmail } });

  const match = !!customer?.password && verifyPassword(password, customer.password);
  if (!customer || !match) {
    const failures = (throttle?.failures ?? 0) + 1;
    await prisma.loginThrottle.upsert({
      where: { email: normEmail },
      create: { email: normEmail, failures },
      update: { failures, ...(failures >= 5 && { lockedUntil: new Date(Date.now() + 15 * 60 * 1000), failures: 0 }) },
    });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Successful login clears the throttle
  if (throttle) await prisma.loginThrottle.delete({ where: { email: normEmail } }).catch(() => null);

  // Transparent migration: rehash legacy SHA-256 passwords with bcrypt
  if (customer.password && isLegacyHash(customer.password)) {
    await prisma.customer.update({ where: { id: customer.id }, data: { password: hashPassword(password) } });
  }

  const res = NextResponse.json({ id: customer.id, name: customer.name, email: customer.email, role: customer.role });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(customer), sessionCookieOptions());
  return res;
}
