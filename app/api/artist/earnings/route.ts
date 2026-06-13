import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [totals, byStatus, designs] = await Promise.all([
    prisma.artistDesign.aggregate({
      where: { artistId: session.id },
      _sum: { totalEarned: true, salesCount: true },
    }),
    prisma.artistDesign.groupBy({
      by: ['status'],
      where: { artistId: session.id },
      _count: { _all: true },
    }),
    prisma.artistDesign.findMany({
      where: { artistId: session.id },
      take: 50,
      orderBy: { totalEarned: 'desc' },
      select: { id: true, title: true, status: true, salesCount: true, totalEarned: true, price: true },
    }),
  ]);

  const count = (s: string) => byStatus.find(b => b.status === s)?._count._all ?? 0;
  return NextResponse.json({
    totalEarned: totals._sum.totalEarned ?? 0,
    totalSales: totals._sum.salesCount ?? 0,
    approved: count('APPROVED'),
    pending: count('PENDING'),
    designs,
  });
}
