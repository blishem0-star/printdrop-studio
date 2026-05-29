// Simple in-memory rate limiter. Not persistent across restarts — sufficient for demo/dev.
// For production, replace with Redis-backed solution (e.g. Upstash).
const store = new Map<string, number[]>();

// Periodically prune expired entries to prevent memory growth
let lastPrune = Date.now();
function maybePrune(windowMs: number) {
  const now = Date.now();
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, timestamps] of store) {
    const fresh = timestamps.filter(t => now - t < windowMs);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  maybePrune(windowMs);
  const timestamps = (store.get(key) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}
