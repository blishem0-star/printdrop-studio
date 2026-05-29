import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`profile-get:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const customerId = req.nextUrl.searchParams.get('customerId');
  if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
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
  try {
    const { customerId, name, email, shipStreet, shipCity, shipState, shipZip } = await req.json();
    if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    if (name !== undefined && name.trim().length < 2) return NextResponse.json({ error: 'Name too short' }, { status: 422 });
    if (email !== undefined && !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 422 });
    if (shipZip !== undefined && shipZip !== '' && !ZIP_RE.test(shipZip)) return NextResponse.json({ error: 'Invalid ZIP' }, { status: 422 });
    if (shipState !== undefined && shipState !== '' && !STATE_RE.test(shipState)) return NextResponse.json({ error: 'Invalid state' }, { status: 422 });

    if (email) {
      const existing = await prisma.customer.findFirst({ where: { email: email.toLowerCase().trim(), NOT: { id: customerId } } });
      if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
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
