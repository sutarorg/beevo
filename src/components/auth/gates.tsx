"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { fetchSession, isMockAuth } from "@/lib/services/auth";
import { FullPageLoader } from "@/components/states";
import { Button } from "@/components/ui/button";

/**
 * Live-mode route guarding for app shells. Sessions are verified by calling
 * the server; absence redirects to the real login page with a `next` hop.
 * (Real authorization is still enforced server-side on every API call.)
 */
export function RequireSession({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "forbidden" }
    | { status: "ok"; name: string; email: string }
  >({ status: "loading" });

  useEffect(() => {
    if (isMockAuth()) {
      setState({ status: "ok", name: "demo", email: "demo" });
      return;
    }
    let cancelled = false;
    fetchSession().then((session) => {
      if (cancelled) return;
      if (!session.user) {
        setState({ status: "anonymous" });
        return;
      }
      if (requireAdmin && !session.isAdmin) {
        setState({ status: "forbidden" });
        return;
      }
      setState({ status: "ok", name: session.user.fullName, email: session.user.email });
    });
    return () => {
      cancelled = true;
    };
  }, [requireAdmin, pathname]);

  useEffect(() => {
    if (state.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [state, router, pathname]);

  if (isMockAuth()) return <>{children}</>;
  if (state.status === "loading" || state.status === "anonymous") {
    return <FullPageLoader label={state.status === "anonymous" ? "Taking you to sign in" : "Checking your session"} />;
  }
  if (state.status === "forbidden") {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-ink px-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-cream p-8 text-center shadow-hard-lime">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-accent text-cream">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Administrator access required</h1>
          <p className="mt-2 text-sm leading-relaxed text-smoke">
            This account isn't an administrator. Admins are provisioned through a secure server-side
            process only — there's no self-service promotion.
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
