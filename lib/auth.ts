import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

// Passwords are hashed with bcrypt. Legacy rows were SHA-256 with a static salt;
// verifyPassword still accepts those and login transparently rehashes them.

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function legacyHash(password: string): string {
  return createHash('sha256').update(`printdrop:${password}`).digest('hex');
}

export function isLegacyHash(stored: string): boolean {
  return /^[0-9a-f]{64}$/.test(stored);
}

export function verifyPassword(password: string, stored: string): boolean {
  if (isLegacyHash(stored)) {
    // timing-safe enough: fixed-length hex comparison via bcrypt-free path
    const candidate = legacyHash(password);
    let diff = 0;
    for (let i = 0; i < 64; i++) diff |= candidate.charCodeAt(i) ^ stored.charCodeAt(i);
    return diff === 0;
  }
  try {
    return bcrypt.compareSync(password, stored);
  } catch {
    return false;
  }
}
