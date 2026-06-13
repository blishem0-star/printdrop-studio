import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { getSession } from '@/lib/session';
import { sanitizeSvg } from '@/lib/sanitizeSvg';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const designs = await prisma.artistDesign.findMany({
    where: { artistId: session.id },
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ARTIST' && session.role !== 'OWNER') {
    return NextResponse.json({ error: 'Artist account required' }, { status: 403 });
  }

  try {
    const { title, category, price, svg, badge } = await req.json();
    if (!title?.trim() || !category || !svg?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
    }
    if (title.trim().length > 80) return NextResponse.json({ error: 'Title too long (max 80 chars)' }, { status: 422 });
    if (svg.length > 500_000) return NextResponse.json({ error: 'SVG file too large (max 500KB)' }, { status: 422 });
    const safePrice = typeof price === 'number' ? Math.min(Math.max(price, 9.99), 999.99) : 29.99;

    const existingCount = await prisma.artistDesign.count({ where: { artistId: session.id } });
    if (existingCount >= 50) {
      return NextResponse.json({ error: 'Maximum design limit reached (50)' }, { status: 422 });
    }

    // Raster uploads arrive as data URLs; everything else is SVG markup and gets DOM-sanitized
    let safeSvg: string;
    if (svg.trimStart().startsWith('data:')) {
      if (!/^data:image\/(png|jpeg|webp|gif)[;,]/.test(svg.trim())) {
        return NextResponse.json({ error: 'Unsupported image format' }, { status: 422 });
      }
      safeSvg = svg.trim();
    } else {
      safeSvg = sanitizeSvg(svg);
      if (!safeSvg.trim()) return NextResponse.json({ error: 'SVG content is empty after sanitization' }, { status: 422 });
    }

    const design = await prisma.artistDesign.create({
      data: {
        artistId: session.id,
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
