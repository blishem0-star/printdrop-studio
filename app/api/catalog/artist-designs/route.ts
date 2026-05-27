import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const designs = await prisma.artistDesign.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: { artist: { select: { name: true } } },
  });

  const formatted = designs.map(d => ({
    id: `artist-${d.id}`,
    originalId: d.id,
    title: d.title,
    category: d.category,
    price: d.price,
    svg: d.svg,
    badge: d.badge ?? 'new',
    artistId: d.artistId,
    artistName: d.artist.name,
  }));

  return NextResponse.json(formatted);
}
