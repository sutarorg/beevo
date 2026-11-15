"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Coins,
  Film,
  Home,
  LayoutDashboard,
  LogIn,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  User,
  X,
  ExternalLink,
} from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";
import { getInitialSessionData } from "@/lib/app-api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  emphasis?: boolean;
  matchPrefix?: boolean;
}

const SIDEBAR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard, matchPrefix: false },
  {
    label: "Create Video",
    href: "/app/create",
    icon: Sparkles,
    emphasis: true,
    matchPrefix: true,
  },
  { label: "My Videos", href: "/app/videos", icon: Film, matchPrefix: true },
  { label: "Credits", href: "/app/credits", icon: Coins, matchPrefix: true },
  {
    label: "Transactions",
    href: "/app/transactions",
    icon: ReceiptText,
    matchPrefix: true,
  },
  {
    label: "Notifications",
    href: "/app/notifications",
    icon: Bell,
    matchPrefix: true,
  },
  { label: "Settings", href: "/app/settings", icon: Settings, matchPrefix: true },
];

const MOBILE_BOTTOM_NAV: NavItem[] = [
  { label: "Home", href: "/app", icon: Home, matchPrefix: false },
  { label: "Create", href: "/app/create", icon: Sparkles, emphasis: true, matchPrefix: true },
  { label: "Videos", href: "/app/videos", icon: Film, matchPrefix: true },
  { label: "Credits", href: "/app/credits", icon: Coins, matchPrefix: true },
];

function getRouteMeta(pathname: string): {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
} {
  if (pathname === "/app") {
    return { title: "Dashboard", breadcrumbs: [{ label: "Studio" }, { label: "Dashboard" }] };
  }
  if (pathname.startsWith("/app/create")) {
    return {
      title: "Create Video",
      breadcrumbs: [{ label: "Studio", href: "/app" }, { label: "Create Video" }],
    };
  }
  if (pathname.includes("/storyboard")) {
    return {
      title: "Storyboard Review",
      breadcrumbs: [
        { label: "Studio", href: "/app" },
        { label: "Projects" },
        { label: "Storyboard" },
      ],
    };
  }
  if (pathname.startsWith("/app/generations/")) {
    return {
      title: "Live Generation",
      breadcrumbs: [
        { label: "Studio", href: "/app" },
        { label: "Generations" },
        { label: "Live Progress" },
      ],
    };
  }
  if (pathname === "/app/videos") {
    return {
      title: "My Videos",
      breadcrumbs: [{ label: "Studio", href: "/app" }, { label: "My Videos" }],
    };
  }
  if (pathname.startsWith("/app/videos/")) {
    return {
      title: "Video Detail",
      breadcrumbs: [
        { label: "Studio", href: "/app" },
        { label: "My Videos", href: "/app/videos" },
        { label: "Player" },
      ],
    };
  }
  if (pathname.startsWith("/app/credits")) {
    return {
      title: "Credits",
      breadcrumbs: [{ label: "Studio", href: "/app" }, { label: "Credits" }],
    };
  }
  if (pathname.startsWith("/app/transactions")) {
    return {
      title: "Transactions",
      breadcrumbs: [{ label: "Studio", href: "/app" }, { label: "Transactions" }],
    };
  }
  if (pathname.startsWith("/app/notifications")) {
    return {
      title: "Notifications",
      breadcrumbs: [{ label: "Studio", href: "/app" }, { label: "Notifications" }],
    };
  }
  if (pathname.startsWith("/app/settings")) {
    return {
      title: "Settings",
      breadcrumbs: [{ label: "Studio", href: "/app" }, { label: "Settings" }],
    };
  }
  return { title: "Beevo Studio", breadcrumbs: [{ label: "Studio" }] };
}

function isNavActive(pathname: string, item: NavItem): boolean {
  if (!item.matchPrefix) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/app";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileContainerRef = useRef<HTMLDivElement | null>(null);

  const session = getInitialSessionData();
  const routeMeta = getRouteMeta(pathname);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerCloseRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        drawerTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [profileOpen]);

  const balanceLabel =
    session.data.wallet !== null
      ? `${session.data.wallet.availableCredits.toLocaleString()} credits`
      : "— credits";

  const balanceCompactLabel =
    session.data.wallet !== null
      ? `${session.data.wallet.availableCredits.toLocaleString()} cr`
      : "— cr";

  return (
    <div className="flex min-h-screen w-full overflow-x-clip bg-beevo-canvas text-beevo-body">
      {/* Desktop Permanent Sidebar (>= 1280px) */}
      <aside
        aria-label="Beevo Studio navigation"
        className="hidden xl:sticky xl:top-0 xl:flex xl:h-screen xl:w-[252px] xl:shrink-0 xl:flex-col xl:border-r xl:border-beevo-border xl:bg-[#FFFEFB]"
      >
        <div className="flex h-[68px] items-center border-b border-beevo-border/70 px-5">
          <Link
            href="/app"
            aria-label="Beevo Studio Home"
            className="inline-flex min-h-[44px] items-center rounded-lg"
          >
            <BeevoLogo variant="horizontal" iconSize={25} />
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-5" aria-label="Primary">
          {SIDEBAR_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item);
            if (item.emphasis) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`mb-2 flex min-h-[46px] items-center gap-3 rounded-[14px] px-4 text-[14px] font-extrabold transition-all ${
                    active
                      ? "bg-[#FFC928] text-beevo-ink shadow-beevo-yellow-sm ring-2 ring-beevo-ink/15"
                      : "bg-[#FFC928] text-beevo-ink shadow-beevo-yellow-sm hover:bg-[#F5BC15]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden={true} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-[12px] px-3.5 text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-beevo-cream text-beevo-ink font-bold border border-beevo-border-warm/80"
                    : "text-beevo-body hover:bg-beevo-cream/60 hover:text-beevo-ink"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    active ? "text-beevo-honey-text" : "text-beevo-muted"
                  }`}
                  aria-hidden={true}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-beevo-border/80 p-3.5">
          <div className="rounded-[14px] border border-beevo-border bg-beevo-cream/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-beevo-honey-text">
                Wallet
              </span>
              <Link
                href="/app/credits"
                className="text-[12px] font-bold text-beevo-ink underline underline-offset-2 hover:text-beevo-honey-text"
              >
                Buy Credits
              </Link>
            </div>
            <p className="mt-1 font-display text-[17px] font-extrabold tabular-nums text-beevo-ink">
              {balanceLabel}
            </p>
            <p className="mt-0.5 text-[11.5px] text-beevo-muted">
              {session.connectionState === "connected"
                ? "Synced with workspace"
                : "Sign in connects in Phase 4"}
            </p>
          </div>
          <Link
            href="/"
            className="mt-2.5 flex min-h-[40px] items-center justify-between rounded-[10px] px-2.5 text-[12.5px] font-semibold text-beevo-muted transition-colors hover:bg-beevo-cream/50 hover:text-beevo-ink"
          >
            <span>Public Website</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* Main Studio Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-beevo-border/85 bg-[#FFFEFB]/95 backdrop-blur-md">
          <div className="flex h-[60px] items-center justify-between gap-2 px-3 sm:h-[68px] sm:gap-4 sm:px-5 lg:px-7">
            {/* Left: Drawer trigger (< xl) + Logo (< xl) + Title / Breadcrumb */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                ref={drawerTriggerRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open Studio navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="studio-drawer"
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] border border-beevo-border bg-white text-beevo-ink transition-colors hover:bg-beevo-cream xl:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <Link
                href="/app"
                aria-label="Beevo Studio Home"
                className="inline-flex min-h-[44px] shrink-0 items-center xl:hidden"
              >
                <span className="inline-flex min-[360px]:hidden">
                  <BeevoLogo variant="icon" iconSize={26} />
                </span>
                <span className="hidden min-[360px]:inline-flex">
                  <BeevoLogo variant="horizontal" iconSize={22} />
                </span>
              </Link>

              <div className="hidden h-5 w-px bg-beevo-border sm:block xl:hidden" aria-hidden="true" />

              <div className="hidden min-w-0 sm:block">
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-beevo-muted"
                >
                  {routeMeta.breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={`${crumb.label}-${idx}`}>
                      {idx > 0 && (
                        <ChevronRight className="h-3 w-3 shrink-0 text-beevo-muted/70" aria-hidden="true" />
                      )}
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-beevo-ink">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="truncate text-beevo-body">{crumb.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
                <p className="truncate font-display text-[17px] font-extrabold leading-tight tracking-[-0.02em] text-beevo-ink">
                  {routeMeta.title}
                </p>
              </div>
            </div>

            {/* Right: Credit Balance + Notifications + Profile Menu */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <Link
                href="/app/credits"
                aria-label={`Credit balance: ${balanceLabel}`}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-beevo-border-warm bg-beevo-cream px-2.5 text-[12px] font-extrabold tabular-nums text-beevo-ink transition-colors hover:bg-[#FFF0BD] sm:min-h-[42px] sm:px-3.5 sm:text-[13px]"
              >
                <Coins className="h-3.5 w-3.5 shrink-0 text-beevo-honey-text" aria-hidden="true" />
                <span className="whitespace-nowrap sm:hidden">{balanceCompactLabel}</span>
                <span className="hidden whitespace-nowrap sm:inline">{balanceLabel}</span>
              </Link>

              <Link
                href="/app/notifications"
                aria-label="Notifications"
                className="relative inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink transition-colors hover:bg-beevo-cream"
              >
                <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
                {session.data.unreadNotifications > 0 && (
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-beevo-yellow ring-2 ring-white" />
                )}
              </Link>

              <div ref={profileContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-[44px] items-center gap-2 rounded-full border border-beevo-border bg-white px-2.5 text-[13px] font-bold text-beevo-ink transition-colors hover:bg-beevo-cream sm:px-3.5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-beevo-cream text-beevo-ink">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="hidden md:inline">
                    {session.data.user ? session.data.user.fullName : "Account"}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    aria-label="Account options"
                    className="absolute right-0 mt-2 w-[232px] rounded-[16px] border border-beevo-border bg-white p-2 shadow-beevo"
                  >
                    <div className="border-b border-beevo-border/80 px-3 py-2.5">
                      <p className="text-[12.5px] font-extrabold text-beevo-ink">
                        {session.data.user ? session.data.user.fullName : "Not signed in"}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-beevo-muted">
                        {session.data.user
                          ? session.data.user.email
                          : "Auth connects in Phase 4"}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/app/settings"
                        role="menuitem"
                        className="flex min-h-[42px] items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-semibold text-beevo-body hover:bg-beevo-cream hover:text-beevo-ink"
                      >
                        <Settings className="h-4 w-4 text-beevo-muted" aria-hidden="true" />
                        Account Settings
                      </Link>
                      <Link
                        href="/app/transactions"
                        role="menuitem"
                        className="flex min-h-[42px] items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-semibold text-beevo-body hover:bg-beevo-cream hover:text-beevo-ink"
                      >
                        <ReceiptText className="h-4 w-4 text-beevo-muted" aria-hidden="true" />
                        Credit History
                      </Link>
                      <Link
                        href="/login"
                        role="menuitem"
                        className="flex min-h-[42px] items-center gap-2.5 rounded-[10px] px-3 text-[13px] font-semibold text-beevo-body hover:bg-beevo-cream hover:text-beevo-ink"
                      >
                        <LogIn className="h-4 w-4 text-beevo-muted" aria-hidden="true" />
                        Log In / Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          className="flex-1 px-3.5 pb-24 pt-5 sm:px-5 sm:pt-6 md:pb-10 lg:px-7 xl:px-8"
        >
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
        </main>
      </div>

      {/* Tablet / Mobile Navigation Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Studio navigation drawer"
          id="studio-drawer"
        >
          <div
            className="fixed inset-0 bg-[#1B1916]/45 backdrop-blur-[2px]"
            onClick={() => {
              setDrawerOpen(false);
              drawerTriggerRef.current?.focus();
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-[min(300px,86vw)] flex-col bg-[#FFFEFB] shadow-2xl">
            <div className="flex h-[64px] items-center justify-between border-b border-beevo-border px-4">
              <BeevoLogo variant="horizontal" iconSize={24} />
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  drawerTriggerRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border border-beevo-border bg-white text-beevo-ink hover:bg-beevo-cream"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-4" aria-label="Drawer navigation">
              {SIDEBAR_NAV.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item);
                if (item.emphasis) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="mb-2 flex min-h-[48px] items-center gap-3 rounded-[14px] bg-[#FFC928] px-4 text-[14.5px] font-extrabold text-beevo-ink shadow-beevo-yellow-sm"
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden={true} />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[46px] items-center gap-3 rounded-[12px] px-3.5 text-[14.5px] font-semibold ${
                      active
                        ? "border border-beevo-border-warm bg-beevo-cream font-bold text-beevo-ink"
                        : "text-beevo-body hover:bg-beevo-cream/60 hover:text-beevo-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        active ? "text-beevo-honey-text" : "text-beevo-muted"
                      }`}
                      aria-hidden={true}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-beevo-border p-4 space-y-2">
              <Link
                href="/login"
                className="beevo-btn-secondary min-h-[44px] w-full text-[13.5px]"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Log In / Sign Up
              </Link>
              <Link
                href="/"
                className="flex min-h-[42px] items-center justify-center gap-1.5 text-[12.5px] font-semibold text-beevo-muted hover:text-beevo-ink"
              >
                <span>Back to Public Website</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-beevo-border bg-[#FFFEFB]/98 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_18px_rgba(27,25,22,0.06)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid max-w-[480px] grid-cols-4 items-center gap-1">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item);
            if (item.emphasis) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-[14px] bg-[#FFC928] px-2 py-1 text-beevo-ink shadow-beevo-yellow-sm"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden={true} />
                  <span className="text-[11px] font-extrabold leading-none">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-[12px] px-1 py-1 transition-colors ${
                  active ? "bg-beevo-cream text-beevo-ink" : "text-beevo-muted hover:text-beevo-ink"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    active ? "text-beevo-honey-text" : "text-beevo-muted"
                  }`}
                  aria-hidden={true}
                />
                <span className="text-[11px] font-bold leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
