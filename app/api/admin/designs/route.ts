import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const designs = await prisma.artistDesign.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { artist: { select: { name: true, email: true } } },
  });
  return NextResponse.json(designs);
}
