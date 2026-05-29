'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@/lib/types';

const VALID_STATUSES: OrderStatus[] = ['DRAFT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export async function updateOrderStatus(id: string, status: string) {
  if (!VALID_STATUSES.includes(status as OrderStatus)) throw new Error('Invalid status');
  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/orders');
}
