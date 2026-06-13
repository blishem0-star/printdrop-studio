import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';

// Best-effort audit trail — a logging failure must never block the admin operation itself.
export async function recordAdminAction(
  actor: SessionPayload,
  action: string,
  targetType: 'ArtistDesign' | 'Order',
  targetId: string,
  detail?: string,
) {
  try {
    await prisma.adminAction.create({
      data: { actorId: actor.id, actorEmail: actor.email, action, targetType, targetId, detail: detail ?? null },
    });
  } catch (e) {
    console.error('audit log write failed', e);
  }
}
