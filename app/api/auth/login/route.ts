import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 422 });

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.password || customer.password !== hashPassword(password)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email });
}
