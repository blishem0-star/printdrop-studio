import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { getSession, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

// Upgrade a logged-in customer to an artist account. Artists still go
// through admin approval per design, so self-service upgrade is safe -
// it only unlocks the upload dashboard, never publishing.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`become-artist:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'USER') {
    return NextResponse.json({ error: 'Account is already an artist' }, { status: 409 });
  }

  const customer = await prisma.customer.update({
    where: { id: session.id },
    data: { role: 'ARTIST' },
    select: { id: true, email: true, role: true },
  });

  // The role lives in the session token - reissue the cookie so artist
  // endpoints authorize immediately without a re-login.
  const res = NextResponse.json({ role: customer.role });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(customer), sessionCookieOptions());
  return res;
}
