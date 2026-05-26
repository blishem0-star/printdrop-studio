import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, email, password } = body;
  if (!name?.trim() || !email || !password) return NextResponse.json({ error: 'All fields required' }, { status: 422 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 422 });

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const customer = await prisma.customer.create({
    data: { name: name.trim(), email, password: hashPassword(password) },
  });

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email }, { status: 201 });
}
