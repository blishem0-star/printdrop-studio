import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  let body: { token?: unknown; password?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const token = String(body.token ?? '');
  const password = String(body.password ?? '');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 422 });
  if (password.length < 8 || password.length > 100) {
    return NextResponse.json({ error: 'Password must be 8-100 characters' }, { status: 422 });
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This reset link is invalid or expired. Request a new one.' }, { status: 422 });
  }

  await prisma.$transaction([
    prisma.customer.update({ where: { id: reset.customerId }, data: { password: hashPassword(password) } }),
    prisma.passwordReset.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
