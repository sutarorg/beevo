"use client";

import { GraduationCap, LifeBuoy, LogOut, ReceiptText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  fetchSession,
  getAuthService,
  getCachedSession,
  subscribeSessionCache,
  type SessionSnapshot,
} from "@/lib/services/auth";

const noSession = (): SessionSnapshot | null => null;
import { getLearnerService } from "@/lib/services/learner";
import { cn } from "@/lib/utils";
import { AccountModeToggle } from "@/components/account-mode-toggle";
import { RequireSession } from "@/components/auth/gates";
import { LogoMark } from "@/components/site/logo";
import { FailedState } from "@/components/creator/ui";
import { StartTeachingCard } from "@/components/learner/start-teaching";
import { UnavailablePanel } from "@/components/states";

const LEARNER_NAV = [
  { href: "/learn/courses", label: "My learning", icon: GraduationCap },
  { href: "/learn/purchases", label: "Purchases", icon: ReceiptText },
  { href: "/learn/settings", label: "Settings", icon: Settings },
  { href: "/learn/support", label: "Support", icon: LifeBuoy },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Learner identity + account kinds for the shell chrome (sidebar name,
 * Start-teaching card, Learner/Creator toggle). Starts from the cached
 * stay-signed-in snapshot so the user's name paints instantly, then
 * confirms against the server.
 */
function useShellSession(): SessionSnapshot | null {
  const cached = useSyncExternalStore(subscribeSessionCache, getCachedSession, noSession);
  const [verified, setVerified] = useState<SessionSnapshot | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((snapshot) => {
      if (!cancelled) setVerified(snapshot);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return verified ?? cached;
}

/** Learner area shell. Authentication is handled by `RequireSession`; the API
 *  enforces ownership on every library call, so there is nothing to fake here. */
export function LearnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const service = getLearnerService();
  const session = useShellSession();
  const [startTeachingAutoOpen, setStartTeachingAutoOpen] = useState(false);

  // Deep link from the creator studio guard: /learn/courses?startTeaching=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("startTeaching") !== "1") return;
    window.history.replaceState(null, "", window.location.pathname);
    const frame = window.requestAnimationFrame(() => setStartTeachingAutoOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!service) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-cream px-4">
        <UnavailablePanel
          title="The learner area isn’t available"
          message="We couldn't reach the learning services. Check your connection and reload."
        />
      </main>
    );
  }

  const signOut = async () => {
    // Await the real sign-out (destroys the server session + cookie and
    // clears the local stay-signed-in hint) before leaving the page.
    await getAuthService()?.signOut();
    window.location.assign("/login");
  };

  const fullName = session?.user?.fullName ?? "";
  const email = session?.user?.email ?? "";
  const showStartTeaching = session !== null && !session.isCreator;

  return (
    <RequireSession>
      <div className="min-h-dvh bg-cream lg:pl-60">
        {/* Sidebar (desktop) */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-ink bg-cream lg:flex">
          <div className="flex h-16 items-center border-b-2 border-ink px-5">
            <Link href="/learn/courses" className="text-lg font-bold tracking-tight text-ink">
              <LogoMark className="mr-2 inline-grid size-8 align-middle" />
              Beevo{" "}
              <span className="font-editorial text-sm font-normal text-smoke italic">learn</span>
            </Link>
          </div>
          {/* Both accounts on this email → switch dashboards from the header area. */}
          <AccountModeToggle current="learner" className="mx-3 mt-3 self-start" />
          <nav aria-label="Learner" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
            {LEARNER_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-ink bg-ink text-cream shadow-hard-xs"
                      : "border-transparent text-smoke hover:border-ink hover:bg-white hover:text-ink",
                  )}
                >
                  <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t-2 border-ink p-4">
            {/* Start teaching sits directly above the account block until
                this email also holds a creator account. */}
            {showStartTeaching ? (
              <StartTeachingCard autoOpen={startTeachingAutoOpen} variant="sidebar" />
            ) : null}
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-xs font-bold">
                {fullName ? initialsOf(fullName) : "·"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{fullName || "…"}</p>
                <p className="truncate text-[10px] text-smoke">{email || "Signed in"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-parchment"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </button>
            <Link
              href="/"
              className="block text-center text-xs font-semibold text-smoke transition-colors hover:text-accent"
            >
              ← Back to website
            </Link>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-sm lg:hidden">
          <div className="flex h-13 items-center justify-between gap-2 px-4">
            <Link href="/learn/courses" className="text-lg font-bold tracking-tight text-ink">
              <LogoMark className="mr-2 inline-grid size-7 align-middle" />
              Beevo{" "}
              <span className="font-editorial text-xs font-normal text-smoke italic">learn</span>
            </Link>
            <div className="flex items-center gap-2">
              <AccountModeToggle current="learner" compact />
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-white"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-16 pb-26 sm:px-6 lg:px-8 lg:pt-20 lg:pb-12">
          <div className="mx-auto max-w-4xl">
            {/* Mobile has no sidebar: surface Start teaching on My learning. */}
            {showStartTeaching && pathname === "/learn/courses" ? (
              <div className="mb-5 lg:hidden">
                {/* autoOpen is handled by the sidebar instance only — its
                    dialog portals to <body>, so it shows on mobile too and
                    never renders twice. */}
                <StartTeachingCard variant="banner" />
              </div>
            ) : null}
            {children}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav
          aria-label="Learner"
          className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream lg:hidden"
        >
          <div className="grid grid-cols-4">
            {LEARNER_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold",
                    active ? "text-accent" : "text-smoke",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </RequireSession>
  );
}

export { FailedState as LearnerFailedState };
