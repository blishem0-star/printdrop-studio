import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

// Receives client-side unhandled errors from app/error.tsx and stores them
// so the owner sees production breakage in the admin panel. Heavily rate
// limited and size-capped - it must never become an amplification vector.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`log-error:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: { message?: unknown; digest?: unknown; path?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const message = typeof body.message === 'string' ? body.message.slice(0, 500) : 'Unknown UI error';
  const digest = typeof body.digest === 'string' ? body.digest.slice(0, 120) : null;
  const path = typeof body.path === 'string' ? body.path.slice(0, 200) : null;

  await prisma.errorLog.create({ data: { source: 'ui', message, digest, path } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
