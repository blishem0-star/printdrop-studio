'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@/lib/types';
import { requireRole } from '@/lib/session';
import { recordAdminAction } from '@/lib/audit';
import { sendEmail, orderStatusEmail, siteUrl } from '@/lib/email';

const VALID_STATUSES: OrderStatus[] = ['DRAFT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export async function updateOrderStatus(id: string, status: string) {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  if (!VALID_STATUSES.includes(status as OrderStatus)) throw new Error('Invalid status');
  const previous = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  const order = await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus },
    include: { customer: true, items: { include: { designAsset: true } } },
  });
  await recordAdminAction(actor, 'ORDER_STATUS_CHANGED', 'Order', id, `${previous?.status ?? '?'} -> ${status}`);

  // Notify the customer on real transitions only; failures never block the admin.
  if (previous?.status !== status && order.customer?.email) {
    const asset = order.items[0]?.designAsset;
    const msg = orderStatusEmail(status as OrderStatus, {
      orderId: order.id,
      customerName: order.customer.name,
      colorName: asset?.colorName ?? 'Custom',
      size: asset?.size ?? '-',
      total: order.total,
      siteUrl: siteUrl(),
    });
    if (msg) sendEmail(order.customer.email, msg.subject, msg.html).catch(() => null);
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/orders');
}
