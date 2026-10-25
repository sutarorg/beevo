"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  fetchSession,
  getCachedSession,
  subscribeSessionCache,
  type SessionSnapshot,
} from "@/lib/services/auth";

const noSession = (): SessionSnapshot | null => null;
import { FullPageLoader } from "@/components/states";
import { Button } from "@/components/ui/button";

type GateState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "notCreator" }
  | { status: "ok"; snapshot: SessionSnapshot };

function evaluate(
  snapshot: SessionSnapshot,
  requireAdmin: boolean,
  requireCreator: boolean,
): GateState {
  if (!snapshot.user) return { status: "anonymous" };
  if (requireAdmin && !snapshot.isAdmin) return { status: "forbidden" };
  if (requireCreator && !snapshot.isCreator) return { status: "notCreator" };
  return { status: "ok", snapshot };
}

/**
 * Live-mode route guarding for app shells. Sessions are verified by calling
 * the server; absence redirects to the real login page with a `next` hop.
 * (Real authorization is still enforced server-side on every API call.)
 *
 * Fast path: the last verified session (in-memory, then the persisted
 * stay-signed-in hint) renders the shell immediately — no full-page
 * "Checking your session" wait on every dashboard open or tab return —
 * while the server check runs in the background and redirects if the
 * session really is gone. Returning to a long-idle tab re-verifies quietly.
 */
export function RequireSession({
  children,
  requireAdmin = false,
  requireCreator = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
  requireCreator?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Optimistic paint from the best-known session (external store), then the
  // verified server result takes over. No effect-driven first paint.
  const cached = useSyncExternalStore(subscribeSessionCache, getCachedSession, noSession);
  const [verified, setVerified] = useState<GateState | null>(null);
  const state: GateState = useMemo(
    () =>
      verified ??
      (cached?.user ? evaluate(cached, requireAdmin, requireCreator) : { status: "loading" }),
    [verified, cached, requireAdmin, requireCreator],
  );

  useEffect(() => {
    let cancelled = false;
    const verify = (force = false) => {
      void fetchSession({ force }).then((snapshot) => {
        if (cancelled) return;
        setVerified(evaluate(snapshot, requireAdmin, requireCreator));
      });
    };
    verify();
    const onVisible = () => {
      if (document.visibilityState === "visible") verify(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [requireAdmin, requireCreator, pathname]);

  useEffect(() => {
    if (state.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    if (state.status === "notCreator") {
      // Creator studio requires a creator account: send learner-only users
      // to their dashboard with the "Start teaching" agreement open.
      router.replace("/learn/courses?startTeaching=1");
    }
  }, [state, router, pathname]);

  if (state.status === "loading" || state.status === "anonymous" || state.status === "notCreator") {
    return (
      <FullPageLoader
        label={
          state.status === "anonymous"
            ? "Taking you to sign in"
            : state.status === "notCreator"
              ? "Taking you to Start teaching"
              : "Checking your session"
        }
      />
    );
  }
  if (state.status === "forbidden") {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-ink px-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-cream p-8 text-center shadow-hard-lime">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-accent text-cream">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
            Administrator access required
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-smoke">
            This account isn&apos;t an administrator. Admins are provisioned through a secure
            server-side process only — there&apos;s no self-service promotion.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="outline" size="sm">
              Back home
            </Button>
            <Button href="/login" variant="ink" size="sm">
              Sign in with another account
            </Button>
          </div>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
