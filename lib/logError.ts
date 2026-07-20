import { prisma } from '@/lib/prisma';

// Best-effort server-side error logging. Never throws, never blocks the
// response - a failed log must not turn a handled error into a crash.
export function logServerError(message: string, path?: string) {
  prisma.errorLog
    .create({ data: { source: 'api', message: message.slice(0, 500), path: path?.slice(0, 200) ?? null } })
    .catch(() => null);
}
