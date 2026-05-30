import { createHash } from 'crypto';

// Known limitation: SHA-256 with a static salt is faster than bcrypt.
// Acceptable for demo/prototype; upgrade to bcrypt/argon2 before production scale.
export function hashPassword(password: string): string {
  return createHash('sha256').update(`printdrop:${password}`).digest('hex');
}
