'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session';
import { recordAdminAction } from '@/lib/audit';
import { generateBatch, GENERATABLE_CATEGORIES } from '@/lib/designGen';

const STUDIO_ARTIST_EMAIL = 'studio@stylx.internal';

// Generated designs are published under a passwordless system artist, so they
// flow into the catalog through the exact same pipeline as human artists
// (and earn no royalties - totalEarned stays untouched for house designs).
async function studioArtist() {
  const existing = await prisma.customer.findUnique({ where: { email: STUDIO_ARTIST_EMAIL } });
  if (existing) return existing;
  return prisma.customer.create({
    data: { name: 'STYLX Studio', email: STUDIO_ARTIST_EMAIL, role: 'ARTIST' },
  });
}

export async function generateCatalogDesigns(category: string, count: number) {
  const actor = await requireRole('OWNER');
  if (!actor) throw new Error('Unauthorized');
  if (!GENERATABLE_CATEGORIES.includes(category)) throw new Error('Unknown category');
  const n = Math.max(1, Math.min(12, Math.floor(count) || 1));

  const artist = await studioArtist();
  const batch = generateBatch(category, n);

  // Skip titles that already exist in this category to keep the catalog varied
  const existing = await prisma.artistDesign.findMany({
    where: { artistId: artist.id, category },
    select: { title: true },
  });
  const taken = new Set(existing.map(d => d.title));
  const fresh = batch.filter(d => !taken.has(d.title));

  if (fresh.length > 0) {
    await prisma.artistDesign.createMany({
      data: fresh.map(d => ({
        artistId: artist.id,
        title: d.title,
        category: d.category,
        price: d.price,
        svg: d.svg,
        badge: 'new',
        status: 'APPROVED',
      })),
    });
  }

  await recordAdminAction(actor, 'DESIGNS_GENERATED', 'ArtistDesign', category, `${fresh.length} new ${category} designs`);
  revalidatePath('/admin/designs');
  revalidatePath('/catalog');
  return { created: fresh.length, skipped: batch.length - fresh.length };
}
