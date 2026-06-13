import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { getSession } from '@/lib/session';
import { verifyPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`profile-get:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: {
      id: true, name: true, email: true, role: true,
      shipStreet: true, shipCity: true, shipState: true, shipZip: true,
      aiProfile: true, createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, status: true, total: true, createdAt: true,
          items: { select: { designAsset: { select: { title: true, colorHex: true, size: true } }, unitPrice: true } },
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json(customer);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE   = /^\d{5}$/;
const STATE_RE = /^[A-Z]{2}$/;

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`profile-patch:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, currentPassword, shipStreet, shipCity, shipState, shipZip } = await req.json();
    if (name !== undefined && name.trim().length < 2) return NextResponse.json({ error: 'Name too short' }, { status: 422 });
    if (email !== undefined && !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 422 });
    if (shipZip !== undefined && shipZip !== '' && !ZIP_RE.test(shipZip)) return NextResponse.json({ error: 'Invalid ZIP' }, { status: 422 });
    if (shipState !== undefined && shipState !== '' && !STATE_RE.test(shipState)) return NextResponse.json({ error: 'Invalid state' }, { status: 422 });

    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
    const emailChanging = !!normalizedEmail && normalizedEmail !== session.email;

    if (emailChanging) {
      // Changing the login identifier requires re-authentication
      const me = await prisma.customer.findUnique({ where: { id: session.id }, select: { password: true } });
      if (me?.password && (!currentPassword || !verifyPassword(currentPassword, me.password))) {
        return NextResponse.json({ error: 'Current password required to change email' }, { status: 403 });
      }
      const existing = await prisma.customer.findFirst({ where: { email: normalizedEmail, NOT: { id: session.id } } });
      if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const updated = await prisma.customer.update({
      where: { id: session.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(emailChanging && { email: normalizedEmail }),
        ...(shipStreet !== undefined && { shipStreet }),
        ...(shipCity !== undefined && { shipCity }),
        ...(shipState !== undefined && { shipState }),
        ...(shipZip !== undefined && { shipZip }),
      },
      select: { id: true, name: true, email: true, role: true, shipStreet: true, shipCity: true, shipState: true, shipZip: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
