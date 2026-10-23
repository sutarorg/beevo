"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChartColumn,
  Clapperboard,
  FlaskConical,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Plus,
  ReceiptText,
  RotateCcw,
  Settings,
  Sparkles,
  TriangleAlert,
  UserRound,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DEMO_WORKSPACE_NOTE } from "@/lib/mocks/creator-app";
import { isMockAuth } from "@/lib/services/auth";
import { getCourseService, resetCourseMockData } from "@/lib/services/courses";
import { isFailNextCallArmed, simulateNextCallFailure } from "@/lib/services/mock-utils";
import { cn } from "@/lib/utils";
import { RequireSession } from "@/components/auth/gates";
import { NotificationBell } from "@/components/creator/notifications";
import { UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";

const NAV_SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Overview",
    items: [{ href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sell",
    items: [
      { href: "/creator/courses", label: "My courses", icon: Clapperboard },
      { href: "/creator/orders", label: "Orders", icon: ReceiptText },
      { href: "/creator/students", label: "Students", icon: UsersRound },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/creator/analytics", label: "Analytics", icon: ChartColumn },
      { href: "/creator/earnings", label: "Earnings", icon: Wallet },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/creator/profile", label: "Profile", icon: UserRound },
      { href: "/creator/settings", label: "Settings", icon: Settings },
      { href: "/creator/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

const BOTTOM_NAV = [
  { href: "/creator/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/creator/courses", label: "Courses", icon: Clapperboard },
  { href: "/creator/students", label: "Students", icon: UsersRound },
  { href: "/creator/orders", label: "Orders", icon: ReceiptText },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/creator/dashboard") return pathname === href || pathname === "/creator";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DemoControls() {
  const [armed, setArmed] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          simulateNextCallFailure();
          setArmed(true);
          window.setTimeout(() => setArmed(isFailNextCallArmed()), 1500);
        }}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:bg-lime"
      >
        <TriangleAlert className="size-3" aria-hidden="true" />
        {armed ? "Next call will fail" : "Fail next request"}
      </button>
      <button
        type="button"
        onClick={() => {
          resetCourseMockData();
          window.location.reload();
        }}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:bg-lime"
      >
        <RotateCcw className="size-3" aria-hidden="true" />
        Reset demo data
      </button>
    </>
  );
}

export function CreatorAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const available = getCourseService() !== null;
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  if (!available) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-cream px-4">
        <UnavailablePanel
          title="The creator workspace isn’t connected yet"
          message="Creator services (auth, database, storage) connect in Prompt 5. This environment has no configured backend, so no workspace is shown instead of a fake one."
        />
      </main>
    );
  }

  const demo = isMockAuth();

  return (
    <RequireSession>
    <div className="min-h-dvh bg-cream lg:pl-66">
      {/* Demo-strip (mock mode only) */}
      {demo ? (
      <div className="fixed inset-x-0 top-0 z-40 border-b-2 border-ink bg-lime lg:left-66">
        <div className="flex h-9 items-center gap-2 overflow-x-auto px-3 sm:px-4">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink uppercase">
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Demo workspace
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-[11px] font-medium text-ink/70 sm:block">
            {DEMO_WORKSPACE_NOTE}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            <DemoControls />
          </span>
        </div>
      </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-66 flex-col border-r-2 border-ink bg-cream lg:flex">
        <div className="flex h-16 items-center border-b-2 border-ink px-5">
          <Link href="/creator/dashboard" className="text-lg font-bold tracking-tight text-ink">
            Course<span className="text-accent">Kit</span>{" "}
            <span className="font-editorial text-sm font-normal text-smoke italic">studio</span>
          </Link>
        </div>
        <nav aria-label="Creator" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
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
          <Button href="/creator/courses/new" variant="accent" size="sm" className="w-full">
            <Plus className="size-4" aria-hidden="true" />
            Create course
          </Button>
          <Link
            href="/"
            className="block text-center text-xs font-semibold text-smoke transition-colors hover:text-accent"
          >
            ← Back to website
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className={cn("fixed inset-x-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-sm lg:hidden", demo ? "top-9" : "top-0")}>
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/creator/dashboard" className="text-lg font-bold tracking-tight text-ink">
            Course<span className="text-accent">Kit</span>{" "}
            <span className="font-editorial text-xs font-normal text-smoke italic">studio</span>
          </Link>
          <NotificationBell />
        </div>
      </div>

      {/* Desktop top row (bell only) */}
      <div className={cn("fixed right-0 left-66 z-30 hidden h-14 items-center justify-end border-b border-ink/10 bg-cream/80 px-6 backdrop-blur-sm lg:flex", demo ? "top-9" : "top-0")}>
        <NotificationBell />
      </div>

      <div className={cn("px-4 pb-28 sm:px-6 lg:px-8 lg:pb-12", demo ? "pt-33 lg:pt-30" : "pt-16 lg:pt-20")}>
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Creator"
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

      {/* Mobile "more" sheet */}
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
                {NAV_SECTIONS.flatMap((section) => section.items)
                  .filter((item) => !BOTTOM_NAV.some((nav) => nav.href === item.href))
                  .map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-bold",
                          isActive(pathname, item.href)
                            ? "border-ink bg-ink text-cream"
                            : "border-ink bg-white text-ink",
                        )}
                      >
                        <item.icon className="size-4.5" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
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
