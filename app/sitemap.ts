import type { MetadataRoute } from 'next';
import { CATALOG_DESIGNS } from '@/lib/catalogDesigns';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://stylx.ai';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/design`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/refunds`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/designs/nature`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/designs/urban`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/designs/abstract`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/designs/minimal`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/designs/vintage`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/size-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const designPages: MetadataRoute.Sitemap = CATALOG_DESIGNS.map(d => ({
    url: `${base}/catalog/${d.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  let artistPages: MetadataRoute.Sitemap = [];
  try {
    const artistDesigns = await prisma.artistDesign.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, updatedAt: true },
      take: 1000,
    });
    artistPages = artistDesigns.map(d => ({
      url: `${base}/catalog/artist-${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch { /* DB unavailable at build time — ship static entries only */ }

  return [...staticPages, ...designPages, ...artistPages];
}
