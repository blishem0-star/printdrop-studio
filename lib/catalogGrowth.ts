import { prisma } from '@/lib/prisma';
import { generateBatch, GENERATABLE_CATEGORIES } from '@/lib/designGen';

const STUDIO_ARTIST_EMAIL = 'studio@stylx.internal';

// House designs publish under a passwordless system artist so they ride the
// existing artist->catalog pipeline. No royalties accrue on house designs.
export async function studioArtist() {
  const existing = await prisma.customer.findUnique({ where: { email: STUDIO_ARTIST_EMAIL } });
  if (existing) return existing;
  return prisma.customer.create({
    data: { name: 'STYLX Studio', email: STUDIO_ARTIST_EMAIL, role: 'ARTIST' },
  });
}

export async function growCatalog(category: string, count: number): Promise<{ created: number; skipped: number }> {
  if (!GENERATABLE_CATEGORIES.includes(category)) return { created: 0, skipped: 0 };
  const n = Math.max(1, Math.min(12, Math.floor(count) || 1));
  const artist = await studioArtist();
  const batch = generateBatch(category, n);

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
        status: 'APPROVED' as const,
      })),
    });
  }
  return { created: fresh.length, skipped: batch.length - fresh.length };
}

/** Top demanded categories by weighted usage signals over the last `days`. */
export async function topDemandCategories(days = 30, limit = 2): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const rows = await prisma.usageEvent.groupBy({
    by: ['category', 'type'],
    where: { createdAt: { gte: since }, category: { in: GENERATABLE_CATEGORIES } },
    _count: { _all: true },
  }).catch(() => [] as { category: string | null; type: string; _count: { _all: number } }[]);
  const WEIGHT: Record<string, number> = { order: 5, remix: 3, favorite: 2, filter: 1 };
  const score = new Map<string, number>();
  for (const r of rows) {
    if (!r.category) continue;
    score.set(r.category, (score.get(r.category) ?? 0) + r._count._all * (WEIGHT[r.type] ?? 1));
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c);
}
