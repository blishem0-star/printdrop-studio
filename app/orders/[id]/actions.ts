'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { sendEmail, orderStatusEmail, siteUrl } from '@/lib/email';

// Customers can cancel their own request while it is still in review
// (status DRAFT) - exactly what the refund policy promises. Paid or
// in-production orders must go through support so money movement stays controlled.
export async function cancelOwnOrder(orderId: string, email?: string) {
  const session = await getSession();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { select: { email: true, name: true } }, items: { include: { designAsset: true } } },
  });
  if (!order) return { ok: false, error: 'Order not found' };

  const authorized =
    (session && session.id === order.customerId) ||
    (!!email && email.toLowerCase().trim() === order.customer.email);
  if (!authorized) return { ok: false, error: 'Not authorized' };
  if (order.status !== 'DRAFT') return { ok: false, error: 'This order is already confirmed - reply to your order email to cancel it.' };

  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });

  const asset = order.items[0]?.designAsset;
  const msg = orderStatusEmail('CANCELLED', {
    orderId: order.id,
    customerName: order.customer.name,
    colorName: asset?.colorName ?? 'Custom',
    size: asset?.size ?? '-',
    total: order.total,
    siteUrl: siteUrl(),
  });
  if (msg) sendEmail(order.customer.email, msg.subject, msg.html).catch(() => null);

  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
