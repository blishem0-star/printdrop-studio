import { createHash } from 'crypto';

export function hashPassword(password: string): string {
  return createHash('sha256').update(`printdrop:${password}`).digest('hex');
}
