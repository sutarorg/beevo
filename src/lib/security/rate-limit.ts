import { ApiError } from "@/lib/security/http";

interface BucketState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketState>();

export interface RateLimitPolicy {
  keyPrefix: string;
  limit: number;
  windowMs: number;
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * In-process sliding-window rate limiter suitable for API route protection.
 * Rejects excessive bursts with HTTP 429 and retryAfterSeconds metadata.
 */
export function enforceRateLimit(identifier: string, policy: RateLimitPolicy): void {
  const now = Date.now();
  const key = `${policy.keyPrefix}:${identifier}`;
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    // Opportunistic pruning to keep memory bounded
    if (buckets.size > 5000) {
      for (const [k, v] of buckets.entries()) {
        if (now >= v.resetAt) buckets.delete(k);
      }
    }
    return;
  }

  if (existing.count >= policy.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new ApiError(
      429,
      "RATE_LIMITED",
      `Too many requests. Retry after ${retryAfterSeconds} seconds.`,
      { retryAfterSeconds }
    );
  }

  existing.count += 1;
}

export const RATE_LIMITS = {
  auth: { keyPrefix: "auth", limit: 20, windowMs: 60_000 },
  payments: { keyPrefix: "payments", limit: 15, windowMs: 60_000 },
  storyGen: { keyPrefix: "story", limit: 20, windowMs: 60_000 },
  videoGen: { keyPrefix: "gen", limit: 10, windowMs: 60_000 },
  adminWrite: { keyPrefix: "admin-w", limit: 40, windowMs: 60_000 },
  webhook: { keyPrefix: "webhook", limit: 300, windowMs: 60_000 },
} as const;
