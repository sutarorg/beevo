import type { ApiResult } from "@/lib/domain";

/**
 * Shared utilities for mock adapters: simulated latency, deterministic failure
 * triggers, and the "fail next request" control used by the demo-controls
 * popover (an explicit, visible way to exercise the failed state).
 */

export function mockLatency(min = 250, spread = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * spread));
}

let failNextCall = false;

/** Demo control: the next service call returns service_unavailable. */
export function simulateNextCallFailure(): void {
  failNextCall = true;
}

export function isFailNextCallArmed(): boolean {
  return failNextCall;
}

/** Consume the failure flag. Returns an ApiResult error when armed. */
export function consumeForcedFailure<T>(): ApiResult<T> | null {
  if (!failNextCall) return null;
  failNextCall = false;
  return {
    ok: false,
    error: {
      code: "service_unavailable",
      message: "Simulated request failure (demo control). Use Retry to try again.",
    },
  };
}

let counter = 0;
export function mockId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

/**
 * Deterministic failure triggers for save/upload demos (documented in
 * FRONTEND_CONTRACTS.md): any text containing "[fail]" forces an error.
 */
export function containsFailTrigger(value: string | null | undefined): boolean {
  return typeof value === "string" && value.toLowerCase().includes("[fail]");
}
