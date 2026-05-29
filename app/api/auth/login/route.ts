import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 422 });

  const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase().trim() } });

  const provided = Buffer.from(hashPassword(password));
  const stored   = Buffer.from(customer?.password ?? hashPassword('dummy-fallback'));
  const match    = provided.length === stored.length && timingSafeEqual(provided, stored);

  if (!customer || !customer.password || !match) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email, role: customer.role });
}
