import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get('artistId');
  if (!artistId) return NextResponse.json({ error: 'Missing artistId' }, { status: 400 });

  const designs = await prisma.artistDesign.findMany({
    where: { artistId },
    select: {
      id: true, title: true, status: true,
      salesCount: true, totalEarned: true, price: true,
    },
  });

  const totalEarned = designs.reduce((s, d) => s + d.totalEarned, 0);
  const totalSales  = designs.reduce((s, d) => s + d.salesCount, 0);
  const approved    = designs.filter(d => d.status === 'APPROVED').length;
  const pending     = designs.filter(d => d.status === 'PENDING').length;

  return NextResponse.json({ totalEarned, totalSales, approved, pending, designs });
}
