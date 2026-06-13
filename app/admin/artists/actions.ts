'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { recordAdminAction } from '@/lib/audit';

export async function updateDesignStatus(id: string, status: 'APPROVED' | 'REJECTED') {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  if (!['APPROVED', 'REJECTED'].includes(status)) throw new Error('Invalid status');
  await prisma.artistDesign.update({ where: { id }, data: { status } });
  await recordAdminAction(actor, `DESIGN_${status}`, 'ArtistDesign', id);
  revalidatePath('/admin/artists');
}
