import type { ApiError, ApiResult } from "@/lib/domain";

/**
 * Browser-side API client for the real backend. Every response is the shared
 * ApiResult envelope; network-level failures map to service_unavailable.
 */
export async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/v1/${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
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

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body });
export const put = <T>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });
