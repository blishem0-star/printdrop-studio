// Server-only. Do not expose through NEXT_PUBLIC_*.
// Clients learn the role from /api/auth/me, never by comparing emails locally.
export const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'blishem0@gmail.com';

export function isOwnerEmail(email: string | undefined | null): boolean {
  return Boolean(email && email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase().trim());
}
