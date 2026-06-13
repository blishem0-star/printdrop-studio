import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generates the monthly SubscriptionShipment for every ACTIVE subscription whose
// nextShipmentAt has passed. Trigger via Vercel Cron / external scheduler:
//   GET /api/cron/shipments  with  Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', nextShipmentAt: { lte: now } },
    take: 100,
    select: { id: true, stylePrefs: true, customerId: true },
  });

  let created = 0;
  for (const sub of due) {
    // Pick up to 2 approved designs matching the subscriber's style as this month's box
    let prefs: { style?: string; productTypes?: string[]; size?: string } = {};
    try { prefs = JSON.parse(sub.stylePrefs); } catch { /* default box */ }

    const picks = await prisma.artistDesign.findMany({
      where: { status: 'APPROVED', ...(prefs.style ? { category: prefs.style } : {}) },
      orderBy: { salesCount: 'desc' },
      take: 2,
      select: { id: true, title: true, price: true, productType: true },
    });

    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);

    await prisma.$transaction([
      prisma.subscriptionShipment.create({
        data: {
          subscriptionId: sub.id,
          status: 'PENDING',
          items: JSON.stringify(picks.map(p => ({ designId: p.id, title: p.title, productType: p.productType, size: prefs.size ?? 'M' }))),
        },
      }),
      prisma.subscription.update({ where: { id: sub.id }, data: { nextShipmentAt: next } }),
    ]);
    created++;
  }

  return NextResponse.json({ processed: due.length, created });
}
