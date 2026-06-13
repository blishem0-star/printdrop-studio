import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { getSession } from '@/lib/session';

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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sub = await prisma.subscription.findFirst({
    where: { customerId: session.id, status: { not: 'CANCELLED' } },
    include: { shipments: { orderBy: { createdAt: 'desc' }, take: 6 } },
  });
  return NextResponse.json(sub ?? null);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`sub-create:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { stylePrefs } = await req.json();
    if (!stylePrefs || typeof stylePrefs !== 'object') return NextResponse.json({ error: 'Missing fields' }, { status: 422 });
    // Store only the known fields, with sane bounds — never raw client JSON
    const prefs = {
      style: typeof stylePrefs.style === 'string' ? stylePrefs.style.slice(0, 40) : '',
      productTypes: Array.isArray(stylePrefs.productTypes)
        ? stylePrefs.productTypes.filter((t: unknown) => typeof t === 'string').slice(0, 10)
        : [],
      size: typeof stylePrefs.size === 'string' ? stylePrefs.size.slice(0, 5) : 'M',
    };
    if (!prefs.style) return NextResponse.json({ error: 'Missing style' }, { status: 422 });

    // Cancel any existing active subscription first
    await prisma.subscription.updateMany({
      where: { customerId: session.id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const sub = await prisma.subscription.create({
      data: {
        customerId: session.id,
        stylePrefs: JSON.stringify(prefs),
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { subscriptionId, status } = await req.json();
    if (!subscriptionId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 422 });
    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 422 });

    // Ownership enforced via session (prevents IDOR on subscriptionId)
    const existing = await prisma.subscription.findFirst({ where: { id: subscriptionId, customerId: session.id } });
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
