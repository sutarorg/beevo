/**
 * Small in-memory sliding-window rate limiter.
 * Per-instance on serverless — for strict global limits plug in Upstash Redis
 * (see README "Hardening"). Good enough to blunt credential stuffing per node.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, retryAfterSec: 0 };
}

// Opportunistic cleanup so the map doesn't grow forever.
let lastSweep = 0;
export function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
}
sweep();
