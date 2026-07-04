import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { validCouponPct } from '@/lib/coupons';

// Checkout preview: is this code valid and how much is it worth?
// The order route re-validates - this endpoint is display-only.
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`coupon:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ valid: false }, { status: 429 });
  }
  const code = req.nextUrl.searchParams.get('code') ?? '';
  const c = await validCouponPct(code);
  if (!c) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, code: c.code, pct: c.pct });
}
