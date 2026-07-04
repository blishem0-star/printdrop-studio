import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`newsletter:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts' }, { status: 429 });
  }
  let email = '', source = 'landing';
  try {
    const body = await req.json();
    email = String(body.email ?? '').toLowerCase().trim();
    if (typeof body.source === 'string') source = body.source.slice(0, 30);
  } catch { /* fall through to validation */ }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email' }, { status: 422 });
  }
  // Upsert keeps it idempotent - signing up twice is a no-op, not an error
  await prisma.newsletterSignup.upsert({ where: { email }, update: {}, create: { email, source } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
