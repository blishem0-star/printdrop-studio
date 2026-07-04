import { prisma } from '@/lib/prisma';

// Server-side coupon validation - the single source both the checkout
// preview endpoint and the order route use.
export async function validCouponPct(codeRaw: unknown): Promise<{ code: string; pct: number } | null> {
  if (typeof codeRaw !== 'string') return null;
  const code = codeRaw.toUpperCase().trim();
  if (!/^[A-Z0-9]{3,24}$/.test(code)) return null;
  const c = await prisma.coupon.findUnique({ where: { code } }).catch(() => null);
  if (!c || !c.active) return null;
  if (c.expiresAt && c.expiresAt < new Date()) return null;
  if (c.maxUses !== null && c.uses >= c.maxUses) return null;
  return { code, pct: c.pct };
}

export async function consumeCoupon(code: string) {
  await prisma.coupon.update({ where: { code }, data: { uses: { increment: 1 } } }).catch(() => null);
}
