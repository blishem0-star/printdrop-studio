import { NextRequest, NextResponse } from 'next/server';
import { growCatalog, topDemandCategories } from '@/lib/catalogGrowth';
import { GENERATABLE_CATEGORIES } from '@/lib/designGen';

// Autonomous catalog growth. Schedule weekly:
//   GET /api/cron/catalog  with  Authorization: Bearer <CRON_SECRET>
// Reads the last 30 days of demand signals and publishes fresh house designs
// into the top categories (falls back to a rotating category when there are
// no signals yet, so the catalog keeps growing pre-launch too).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let targets = await topDemandCategories(30, 2);
  if (targets.length === 0) {
    // No demand data yet - rotate deterministically by ISO week
    const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
    targets = [GENERATABLE_CATEGORIES[week % GENERATABLE_CATEGORIES.length]];
  }

  const results: Record<string, { created: number; skipped: number }> = {};
  for (const cat of targets) {
    results[cat] = await growCatalog(cat, 3);
  }
  return NextResponse.json({ targets, results });
}
