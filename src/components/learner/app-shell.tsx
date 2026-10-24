"use client";

import { GraduationCap, LifeBuoy, LogOut, ReceiptText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { getLearnerService } from "@/lib/services/learner";
import { cn } from "@/lib/utils";
import { RequireSession } from "@/components/auth/gates";
import { LogoMark } from "@/components/site/chrome";
import { FailedState } from "@/components/creator/ui";
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

/** Learner area shell. Authentication is handled by `RequireSession`; the API
 *  enforces ownership on every library call, so there is nothing to fake here. */
export function LearnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const service = getLearnerService();

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

  const signOut = () => {
    service.signOut();
    window.location.assign("/login");
  };

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
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-xs font-bold">
              M
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink">My account</p>
              <p className="truncate text-[10px] text-smoke">Signed in</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-parchment"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-sm lg:hidden">
        <div className="flex h-13 items-center justify-between px-4">
          <Link href="/learn/courses" className="text-lg font-bold tracking-tight text-ink">
            <LogoMark className="mr-2 inline-grid size-7 align-middle" />
            Beevo{" "}
            <span className="font-editorial text-xs font-normal text-smoke italic">learn</span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-16 pb-26 sm:px-6 lg:px-8 lg:pt-20 lg:pb-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Learner" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream lg:hidden">
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
