'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@/lib/types';
import { requireRole } from '@/lib/session';
import { recordAdminAction } from '@/lib/audit';

const VALID_STATUSES: OrderStatus[] = ['DRAFT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export async function updateOrderStatus(id: string, status: string) {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  if (!VALID_STATUSES.includes(status as OrderStatus)) throw new Error('Invalid status');
  const previous = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
  await recordAdminAction(actor, 'ORDER_STATUS_CHANGED', 'Order', id, `${previous?.status ?? '?'} -> ${status}`);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/orders');
}
