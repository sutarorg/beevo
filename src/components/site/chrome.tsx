"use client";

import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { APP_TAGLINE, SUPPORT_EMAIL } from "@/lib/config";
import { NAV_LINKS } from "@/lib/content";
import { PLATFORM_COMMISSION_LABEL } from "@/lib/domain";
import {
  dashboardPathFor,
  fetchSession,
  getCachedSession,
  subscribeSessionCache,
  type SessionSnapshot,
} from "@/lib/services/auth";

const noSession = (): SessionSnapshot | null => null;
import { cn } from "@/lib/utils";
import { AccountModeToggle } from "@/components/account-mode-toggle";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

export { Logo, LogoMark } from "@/components/site/logo";

/**
 * Reads the stay-signed-in session for header chrome.
 *
 * The server session cookie persists across tabs and browser restarts, so
 * the header must reflect it: a signed-in visitor sees "Dashboard" (never
 * "Log in") on every marketing page, including right after "Back to
 * website". The check is client-side so marketing pages stay fully static;
 * a persisted hint paints the signed-in state instantly and the server
 * response then confirms it. Re-checked whenever the user returns to the
 * tab, so sign-in/out in another tab shows up without a reload.
 */
function useHeaderSession(): SessionSnapshot | null | undefined {
  const cached = useSyncExternalStore(subscribeSessionCache, getCachedSession, noSession);
  const [verified, setVerified] = useState<SessionSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = (force = false) => {
      void fetchSession({ force }).then((snapshot) => {
        if (!cancelled) setVerified(snapshot);
      });
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // undefined = not known yet (render the neutral placeholder, not "Log in").
  return verified ?? cached ?? undefined;
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useHeaderSession();
  const signedIn = Boolean(session?.user);
  const dashboardHref = dashboardPathFor(session ?? null);

  // Close the mobile menu whenever the route changes (state reset during
  // render — the React-endorsed alternative to an effect for this).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "link-underline text-sm font-semibold transition-colors",
                  pathname === link.href ? "text-accent" : "text-ink hover:text-accent",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {session === undefined ? (
              // Session unknown yet (first paint): hold the space instead of
              // flashing "Log in" at someone who is already signed in.
              <span
                aria-hidden="true"
                className="hidden h-9 w-36 animate-pulse rounded-full bg-ink/10 sm:block"
              />
            ) : signedIn ? (
              <>
                {/* Both accounts on this email → Learner/Creator switch. */}
                <AccountModeToggle className="hidden lg:inline-flex" />
                <Button href={dashboardHref} size="sm" className="hidden sm:inline-flex">
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="link-underline hidden text-sm font-semibold text-ink hover:text-accent sm:block"
                >
                  Log in
                </Link>
                <Button href="/signup" size="sm" className="hidden sm:inline-flex">
                  Start free
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-cream shadow-hard-xs transition-transform active:translate-y-0.5 active:shadow-none md:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div
          className="anim-fade-in fixed inset-0 z-[80] flex flex-col bg-ink text-cream md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex h-16 items-center justify-between border-b-2 border-cream/20 px-4">
            <Logo dark />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-xl border-2 border-cream/40"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-1 px-6">
            {NAV_LINKS.map((link, index) => (
              <div
                key={link.href}
                className="anim-slide-in-left"
                style={{ animationDelay: `${80 + index * 60}ms` }}
              >
                <Link
                  href={link.href}
                  className="group flex items-center justify-between border-b border-cream/15 py-4"
                >
                  <span className="font-editorial text-4xl italic">{link.label}</span>
                  <ArrowRight
                    className="size-6 text-lime transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            ))}
          </nav>
          <div
            className="anim-rise-in space-y-4 px-6 pb-8"
            style={{ animationDelay: "320ms" }}
          >
            {signedIn ? (
              <>
                <div className="flex justify-center">
                  <AccountModeToggle />
                </div>
                <Button href={dashboardHref} variant="lime" size="lg" className="w-full">
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                  Dashboard
                </Button>
                <p className="text-center text-sm text-cream/60">
                  Signed in as{" "}
                  <span className="font-semibold text-cream">{session?.user?.fullName}</span>
                </p>
              </>
            ) : (
              <>
                <Button href="/signup" variant="lime" size="lg" className="w-full">
                  Start free — ₹0/month
                </Button>
                <p className="text-center text-sm text-cream/60">
                  Already creating?{" "}
                  <Link href="/login" className="font-semibold text-lime underline underline-offset-4">
                    Log in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Create account" },
      { href: "/login", label: "Log in" },
      { href: `mailto:${SUPPORT_EMAIL}`, label: "Contact support" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">{APP_TAGLINE}</p>
            <div className="mt-5">
              <Sticker color="lime" className="border-lime shadow-none">
                Not a marketplace
              </Sticker>
            </div>
            <div className="mt-5 rounded-2xl border-2 border-cream/20 bg-cream/5 p-4 text-xs leading-relaxed text-cream/70">
              <p>
                Free plan · ₹0/month · {PLATFORM_COMMISSION_LABEL} commission per successful
                eligible course sale. No Pro plan.
              </p>
            </div>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-xs font-bold tracking-[0.22em] text-lime uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-underline text-sm text-cream/80 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-cream/15 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Beevo. Made for creators, not algorithms.</p>
          <p>Course purchases are non-refundable except where required by law.</p>
        </div>
      </div>
    </footer>
  );
}
