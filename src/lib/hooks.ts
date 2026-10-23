"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult, AsyncState } from "@/lib/domain";

/**
 * Load data through a service and expose typed loading/success/error state
 * plus a reload function for the failed-state retry button.
 */
export function useAsyncData<T>(
  loader: () => Promise<ApiResult<T>>,
  deps: readonly unknown[] = [],
): { state: AsyncState<T>; reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    loaderRef.current().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "success", data: result.data });
      } else {
        setState({ status: "error", error: result.error });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  return { state, reload: () => setNonce((n) => n + 1) };
}

/** Debounce helper with manual flush for "leaving the stage" safety. */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): {
  schedule: (...args: A) => void;
  flush: () => void;
  cancel: () => void;
  pending: () => boolean;
} {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const pendingArgs = useRef<A | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pendingArgs.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pendingArgs.current) {
      const args = pendingArgs.current;
      pendingArgs.current = null;
      fnRef.current(...args);
    }
  }, []);

  const schedule = useCallback(
    (...args: A) => {
      pendingArgs.current = args;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        const queued = pendingArgs.current;
        pendingArgs.current = null;
        if (queued) fnRef.current(...queued);
      }, delayMs);
    },
    [delayMs],
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, flush, cancel, pending: () => pendingArgs.current !== null };
}
