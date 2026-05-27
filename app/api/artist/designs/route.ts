import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get('artistId');
  if (!artistId) return NextResponse.json({ error: 'Missing artistId' }, { status: 400 });

  const designs = await prisma.artistDesign.findMany({
    where: { artistId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(designs);
}

export async function POST(req: NextRequest) {
  try {
    const { artistId, title, category, price, svg, badge } = await req.json();
    if (!artistId || !title?.trim() || !category || !svg?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }

    const artist = await prisma.customer.findUnique({ where: { id: artistId } });
    if (!artist || artist.role !== 'ARTIST') {
      return NextResponse.json({ error: 'Artist not found' }, { status: 403 });
    }

    const design = await prisma.artistDesign.create({
      data: {
        artistId,
        title: title.trim(),
        category,
        price: price ?? 29.99,
        svg,
        badge: badge ?? null,
        status: 'PENDING',
      },
    });
    return NextResponse.json(design, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
  }
}
