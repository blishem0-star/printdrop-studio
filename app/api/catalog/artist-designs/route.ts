import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`catalog-designs:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const designs = await prisma.artistDesign.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, title: true, category: true, price: true,
      svg: true, badge: true, artistId: true,
      artist: { select: { name: true } },
    },
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

  return NextResponse.json(formatted, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
