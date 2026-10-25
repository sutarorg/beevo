import type { ApiError, ApiResult } from "@/lib/domain";

/**
 * Browser-side API client for the real backend.
 *
 * Every response is the shared ApiResult envelope; network-level failures map
 * to service_unavailable. Short-lived GET caching plus in-flight de-duping
 * keeps tab and page switches feeling instant without ever serving stale data
 * after a mutation (any write clears the cache).
 */

const GET_TTL_MS = 15_000;
const STOREFRONT_TTL_MS = 60_000;
const CACHE_LIMIT = 60;

const cache = new Map<string, { expiresAt: number; result: ApiResult<unknown> }>();
const inflight = new Map<string, Promise<ApiResult<unknown>>>();

function cacheableGet(path: string): boolean {
  // Session/identity reads must always hit the server.
  return !path.startsWith("auth/");
}

/**
 * Public storefront reads (creator page + course page) contain only
 * published, intentionally-public data and the server marks them
 * `Cache-Control: public`. Those may also use the browser HTTP cache, so
 * repeat visits and shared-link opens don't wait on the network at all.
 * Preview playback is excluded — it returns short-lived media URLs.
 */
function publicStorefrontGet(path: string): boolean {
  return path.startsWith("storefront/") && !path.endsWith("/preview");
}

function ttlFor(path: string): number {
  return publicStorefrontGet(path) ? STOREFRONT_TTL_MS : GET_TTL_MS;
}

function readCache<T>(path: string): ApiResult<T> | null {
  const entry = cache.get(path);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(path);
    return null;
  }
  return entry.result as ApiResult<T>;
}

function writeCache(path: string, result: ApiResult<unknown>): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(path, { expiresAt: Date.now() + ttlFor(path), result });
}

/** Drops cached reads (called after every mutation). */
export function clearApiCache(): void {
  cache.clear();
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  try {
    const isGet = (init?.method ?? "GET").toUpperCase() === "GET";
    const res = await fetch(`/api/v1/${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      // Private data never touches the HTTP cache; public storefront reads
      // (explicitly marked public by the server) may reuse it.
      cache: isGet && publicStorefrontGet(path) ? "default" : "no-store",
    });
    const json = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (!json || typeof json !== "object" || !("ok" in json)) {
      return {
        ok: false,
        error: { code: "bad_response", message: "Unexpected server response." } satisfies ApiError,
      };
    }
    return json;
  } catch {
    return {
      ok: false,
      error: { code: "service_unavailable", message: "Couldn't reach the server. Check your connection and retry." },
    };
  }
}

export async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<ApiResult<T>> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    clearApiCache();
    return request<T>(path, init);
  }

  if (!cacheableGet(path)) return request<T>(path);

  const cached = readCache<T>(path);
  if (cached) return cached;

  const pending = inflight.get(path) as Promise<ApiResult<T>> | undefined;
  if (pending) return pending;

  const promise = request<T>(path).then((result) => {
    if (result.ok) writeCache(path, result as ApiResult<unknown>);
    inflight.delete(path);
    return result;
  });
  inflight.set(path, promise as Promise<ApiResult<unknown>>);
  return promise;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body });
export const put = <T>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });
