import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, email: true } },
      shipments: { orderBy: { createdAt: 'desc' } },
    },
  });
  return NextResponse.json(subs);
}
