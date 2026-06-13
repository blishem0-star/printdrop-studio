// Server-only. Do NOT expose via NEXT_PUBLIC_* — clients must learn the user's
// role from /api/auth/me, never by comparing emails locally.
export const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'blishem0@gmail.com';
