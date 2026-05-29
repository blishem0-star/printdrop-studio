'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateDesignStatus(id: string, status: 'APPROVED' | 'REJECTED') {
  if (!['APPROVED', 'REJECTED'].includes(status)) throw new Error('Invalid status');
  await prisma.artistDesign.update({ where: { id }, data: { status } });
  revalidatePath('/admin/artists');
}
