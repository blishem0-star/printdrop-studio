import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get('artistId');
  if (!artistId) return NextResponse.json({ error: 'Missing artistId' }, { status: 400 });

  const designs = await prisma.artistDesign.findMany({
    where: { artistId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, title: true, category: true, price: true,
      svg: true, badge: true, status: true,
      salesCount: true, totalEarned: true, createdAt: true,
    },
  });
  return NextResponse.json(designs);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`artist-design-post:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many submissions. Try again in an hour.' }, { status: 429 });
  }
  try {
    const { artistId, title, category, price, svg, badge } = await req.json();
    if (!artistId || !title?.trim() || !category || !svg?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }
    if (title.trim().length > 80) return NextResponse.json({ error: 'Title too long (max 80 chars)' }, { status: 422 });
    if (svg.length > 500_000) return NextResponse.json({ error: 'SVG file too large (max 500KB)' }, { status: 422 });
    const safePrice = typeof price === 'number' ? Math.min(Math.max(price, 9.99), 999.99) : 29.99;

    const artist = await prisma.customer.findUnique({ where: { id: artistId } });
    if (!artist || artist.role !== 'ARTIST') {
      return NextResponse.json({ error: 'Artist not found' }, { status: 403 });
    }

    // Rate limit: max 50 designs per artist
    const existingCount = await prisma.artistDesign.count({ where: { artistId } });
    if (existingCount >= 50) {
      return NextResponse.json({ error: 'Maximum design limit reached (50)' }, { status: 422 });
    }

    // Strip script tags and event handlers from SVG to prevent XSS
    const safeSvg = svg
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');

    const design = await prisma.artistDesign.create({
      data: {
        artistId,
        title: title.trim(),
        category,
        price: safePrice,
        svg: safeSvg,
        badge: badge ?? null,
        status: 'PENDING',
      },
    });
    return NextResponse.json(design, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
  }
}
