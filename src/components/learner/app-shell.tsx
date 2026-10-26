"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  LifeBuoy,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
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
import { NotificationBell } from "@/components/creator/notifications";
import { FailedState } from "@/components/creator/ui";
import { StartTeachingCard } from "@/components/learner/start-teaching";
import { LogoMark } from "@/components/site/logo";
import { UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";

/**
 * Learner shell — deliberately a pixel-for-pixel mirror of the creator
 * shell (same sidebar width, logo header, section labels, nav button
 * geometry, desktop top row, content insets and mobile chrome). Only the
 * destinations, the sidebar footer content and the wordmark differ.
 */
const NAV_SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: typeof GraduationCap }[];
}[] = [
  {
    label: "Learning",
    items: [
      { href: "/learn/courses", label: "My learning", icon: GraduationCap },
      { href: "/learn/purchases", label: "Purchases", icon: ReceiptText },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/learn/settings", label: "Settings", icon: Settings },
      { href: "/learn/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

const BOTTOM_NAV = [
  { href: "/learn/courses", label: "Learning", icon: GraduationCap },
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
 * Start-teaching card, Learner/Creator dropdown). Starts from the cached
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
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the "more" sheet whenever the route changes (state reset during
  // render — the React-endorsed alternative to an effect for this).
  const [sheetPathname, setSheetPathname] = useState(pathname);
  if (pathname !== sheetPathname) {
    setSheetPathname(pathname);
    setMoreOpen(false);
  }

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
      <div className="min-h-dvh bg-cream lg:pl-66">
        {/* Desktop sidebar — same width (w-66) and geometry as Creator. */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-66 flex-col border-r-2 border-ink bg-cream lg:flex">
          <div className="flex h-16 items-center border-b-2 border-ink px-5">
            <Link
              href="/learn/courses"
              className="group flex items-center gap-2 text-lg font-bold tracking-tight text-ink"
            >
              <LogoMark className="size-8" />
              Beevo{" "}
              <span className="font-editorial text-sm font-normal text-smoke italic">learn</span>
            </Link>
          </div>
          <nav aria-label="Learner" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="px-2.5 pb-1.5 text-[10px] font-bold tracking-[0.22em] text-smoke uppercase">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-sm font-semibold transition-colors",
                            active
                              ? "border-ink bg-ink text-cream shadow-hard-xs"
                              : "border-transparent text-smoke hover:border-ink hover:bg-white hover:text-ink",
                          )}
                        >
                          <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="space-y-2.5 border-t-2 border-ink p-3">
            {/* Start teaching sits directly above the account block until
                this email also holds a creator account. */}
            {showStartTeaching ? (
              <StartTeachingCard autoOpen={startTeachingAutoOpen} variant="sidebar" />
            ) : null}
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-xs font-bold">
                {fullName ? initialsOf(fullName) : "·"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{fullName || "…"}</p>
                <p className="truncate text-[10px] text-smoke">{email || "Signed in"}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
            <Link
              href="/"
              className="block text-center text-xs font-semibold text-smoke transition-colors hover:text-accent"
            >
              ← Back to website
            </Link>
          </div>
        </aside>

        {/* Mobile top bar — same height (h-14) and right-hand cluster as Creator. */}
        <div className="fixed inset-x-0 top-0 z-50 border-b-2 border-ink bg-cream lg:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Link
              href="/learn/courses"
              className="group flex items-center gap-2 text-lg font-bold tracking-tight text-ink"
            >
              <LogoMark className="size-7" />
              Beevo{" "}
              <span className="font-editorial text-xs font-normal text-smoke italic">learn</span>
            </Link>
            <div className="flex items-center gap-2">
              {/* Learner/Creator dropdown (dual accounts only), immediately
                  to the left of the notification bell. */}
              <AccountModeToggle current="learner" compact />
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Desktop top row — same h-16 as the sidebar logo header (so its
            low-brightness bottom line aligns with the sidebar header's
            bottom line): dropdown immediately left of the bell. */}
        <div className="fixed top-0 right-0 left-66 z-30 hidden h-16 items-center justify-end border-b-2 border-ink/10 bg-cream px-6 lg:flex">
          <div className="flex items-center gap-2">
            <AccountModeToggle current="learner" />
            <NotificationBell />
          </div>
        </div>

        <div className="px-4 pt-16 pb-28 sm:px-6 lg:px-8 lg:pt-20 lg:pb-12">
          <div className="mx-auto max-w-5xl">
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
          <div className="grid grid-cols-5">
            {BOTTOM_NAV.map((item) => {
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
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label="Open more navigation"
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold",
                moreOpen ? "text-accent" : "text-smoke",
              )}
            >
              <Menu className="size-5" aria-hidden="true" />
              More
            </button>
          </div>
        </nav>

        {/* Mobile "more" sheet — same sheet as Creator's. */}
        <AnimatePresence>
          {moreOpen ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-ink/50"
                onClick={() => setMoreOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t-2 border-ink bg-cream p-5 pb-8"
                role="dialog"
                aria-modal="true"
                aria-label="More navigation"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold tracking-[0.18em] text-smoke uppercase">
                    Everything else
                  </p>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    aria-label="Close"
                    className="grid size-9 place-items-center rounded-full border-2 border-ink bg-white"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <ul className="space-y-1.5">
                  <li>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-3 text-sm font-bold text-ink"
                    >
                      <LogOut className="size-4.5" aria-hidden="true" />
                      Sign out
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/"
                      className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink/40 px-4 py-3 text-sm font-bold text-smoke"
                    >
                      <Sparkles className="size-4.5" aria-hidden="true" />
                      Back to website
                    </Link>
                  </li>
                </ul>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </RequireSession>
  );
}

export { FailedState as LearnerFailedState };
