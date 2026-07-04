'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { recordAdminAction } from '@/lib/audit';

export async function createCoupon(formData: FormData) {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  const code = String(formData.get('code') ?? '').toUpperCase().trim();
  const pct = Math.max(1, Math.min(90, parseInt(String(formData.get('pct') ?? '0')) || 0));
  const maxUsesRaw = parseInt(String(formData.get('maxUses') ?? ''));
  const days = parseInt(String(formData.get('days') ?? ''));
  if (!/^[A-Z0-9]{3,24}$/.test(code)) throw new Error('Code must be 3-24 letters/numbers');
  await prisma.coupon.upsert({
    where: { code },
    update: { pct, active: true, maxUses: Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? maxUsesRaw : null, expiresAt: Number.isFinite(days) && days > 0 ? new Date(Date.now() + days * 24 * 3600 * 1000) : null },
    create: { code, pct, maxUses: Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? maxUsesRaw : null, expiresAt: Number.isFinite(days) && days > 0 ? new Date(Date.now() + days * 24 * 3600 * 1000) : null },
  });
  await recordAdminAction(actor, 'COUPON_SAVED', 'Coupon', code, `${pct}% off`);
  revalidatePath('/admin/coupons');
}

export async function toggleCoupon(code: string, active: boolean) {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  await prisma.coupon.update({ where: { code }, data: { active } });
  await recordAdminAction(actor, active ? 'COUPON_ENABLED' : 'COUPON_DISABLED', 'Coupon', code);
  revalidatePath('/admin/coupons');
}
