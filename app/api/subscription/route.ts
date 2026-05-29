import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

function nextShipmentDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1); // 1st of next month
  return d;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`sub-get:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const customerId = req.nextUrl.searchParams.get('customerId');
  if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });

  const sub = await prisma.subscription.findFirst({
    where: { customerId, status: { not: 'CANCELLED' } },
    include: { shipments: { orderBy: { createdAt: 'desc' }, take: 6 } },
  });
  return NextResponse.json(sub ?? null);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`sub-create:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  try {
    const { customerId, stylePrefs } = await req.json();
    if (!customerId || !stylePrefs) return NextResponse.json({ error: 'Missing fields' }, { status: 422 });

    // Cancel any existing active subscription first
    await prisma.subscription.updateMany({
      where: { customerId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const sub = await prisma.subscription.create({
      data: {
        customerId,
        stylePrefs: JSON.stringify(stylePrefs),
        nextShipmentAt: nextShipmentDate(),
        status: 'ACTIVE',
      },
    });
    return NextResponse.json(sub, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { subscriptionId, customerId, status } = await req.json();
    if (!subscriptionId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 422 });
    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 422 });

    // Verify ownership if customerId provided (prevents IDOR on subscriptionId)
    const where = customerId
      ? { id: subscriptionId, customerId }
      : { id: subscriptionId };

    const existing = await prisma.subscription.findFirst({ where });
    if (!existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    const sub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status, updatedAt: new Date() },
    });
    return NextResponse.json(sub);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
