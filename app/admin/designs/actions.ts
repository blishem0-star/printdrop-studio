'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { recordAdminAction } from '@/lib/audit';
import { growCatalog } from '@/lib/catalogGrowth';
import { GENERATABLE_CATEGORIES } from '@/lib/designGen';

export async function generateCatalogDesigns(category: string, count: number) {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  if (!GENERATABLE_CATEGORIES.includes(category)) throw new Error('Unknown category');

  const result = await growCatalog(category, count);
  await recordAdminAction(actor, 'DESIGNS_GENERATED', 'ArtistDesign', category, `${result.created} new ${category} designs`);
  revalidatePath('/admin/designs');
  revalidatePath('/catalog');
  return result;
}
