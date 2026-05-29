// Simple in-memory rate limiter. Not persistent across restarts — sufficient for demo/dev.
// For production, replace with Redis-backed solution (e.g. Upstash).
const store = new Map<string, number[]>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}
