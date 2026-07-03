import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

// Anonymous usage signals (no user id, no cookie) that power the
// category-demand dashboard in admin. Fire-and-forget from the client.

const VALID_TYPES = ['favorite', 'remix', 'order', 'filter', 'studio_start'] as const;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`events:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: { type?: unknown; category?: unknown; designId?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const type = String(body.type ?? '');
  if (!(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }
  const category = typeof body.category === 'string' ? body.category.slice(0, 40) : null;
  const designId = typeof body.designId === 'string' ? body.designId.slice(0, 60) : null;
  await prisma.usageEvent.create({ data: { type, category, designId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
