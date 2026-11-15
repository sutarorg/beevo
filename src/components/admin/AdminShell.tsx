"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronRight,
  Coins,
  Cpu,
  CreditCard,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Music,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";

interface AdminNavItem {
  label: string;
  href: string;
  group: "Operations" | "Financials" | "Assets & System";
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  matchPrefix?: boolean;
  keywords: string;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    group: "Operations",
    icon: LayoutDashboard,
    matchPrefix: false,
    keywords: "dashboard kpi revenue metrics summary home",
  },
  {
    label: "Users",
    href: "/admin/users",
    group: "Operations",
    icon: Users,
    matchPrefix: true,
    keywords: "accounts customers suspend reactivate profile",
  },
  {
    label: "Generations",
    href: "/admin/generations",
    group: "Operations",
    icon: Activity,
    matchPrefix: true,
    keywords: "pipeline jobs videos renders storyboard ffmpeg failed",
  },
  {
    label: "Payments",
    href: "/admin/payments",
    group: "Financials",
    icon: CreditCard,
    matchPrefix: true,
    keywords: "razorpay orders receipts refunds billing inr",
  },
  {
    label: "Credit Ledger",
    href: "/admin/credits",
    group: "Financials",
    icon: Coins,
    matchPrefix: true,
    keywords: "credits balance adjustment reservations deductions ledger",
  },
  {
    label: "AI Costs",
    href: "/admin/ai-costs",
    group: "Financials",
    icon: Cpu,
    matchPrefix: true,
    keywords: "openai fal elevenlabs ffmpeg r2 storage margin unit economics",
  },
  {
    label: "Media Library",
    href: "/admin/media-library",
    group: "Assets & System",
    icon: FolderOpen,
    matchPrefix: true,
    keywords: "r2 files assets mp4 images audio captions storage",
  },
  {
    label: "Music Library",
    href: "/admin/music-library",
    group: "Assets & System",
    icon: Music,
    matchPrefix: true,
    keywords: "tracks licensed sfx audio moods soundtrack",
  },
  {
    label: "Configuration",
    href: "/admin/configuration",
    group: "Assets & System",
    icon: Settings,
    matchPrefix: true,
    keywords: "pricing packs credit rules models concurrency presets",
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    group: "Assets & System",
    icon: ScrollText,
    matchPrefix: true,
    keywords: "history security trail actor actions compliance",
  },
];

const NAV_GROUPS: ("Operations" | "Financials" | "Assets & System")[] = [
  "Operations",
  "Financials",
  "Assets & System",
];

function getAdminRouteMeta(pathname: string): {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
} {
  if (pathname === "/admin") {
    return { title: "Overview", breadcrumbs: [{ label: "Admin" }, { label: "Overview" }] };
  }
  if (pathname === "/admin/users") {
    return {
      title: "Users",
      breadcrumbs: [{ label: "Admin", href: "/admin" }, { label: "Users" }],
    };
  }
  if (pathname.startsWith("/admin/users/")) {
    return {
      title: "User Detail",
      breadcrumbs: [
        { label: "Admin", href: "/admin" },
        { label: "Users", href: "/admin/users" },
        { label: "Account Dossier" },
      ],
    };
  }
  if (pathname === "/admin/generations") {
    return {
      title: "Generations",
      breadcrumbs: [{ label: "Admin", href: "/admin" }, { label: "Generations" }],
    };
  }
  if (pathname.startsWith("/admin/generations/")) {
    return {
      title: "Generation Inspector",
      breadcrumbs: [
        { label: "Admin", href: "/admin" },
        { label: "Generations", href: "/admin/generations" },
        { label: "Job Detail" },
      ],
    };
  }
  const matched = ADMIN_NAV_ITEMS.find(
    (item) => item.href !== "/admin" && pathname.startsWith(item.href)
  );
  if (matched) {
    return {
      title: matched.label,
      breadcrumbs: [{ label: "Admin", href: "/admin" }, { label: matched.label }],
    };
  }
  return { title: "Admin", breadcrumbs: [{ label: "Admin" }] };
}

function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (!item.matchPrefix) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const routeMeta = getAdminRouteMeta(pathname);

  const quickSearchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ADMIN_NAV_ITEMS.slice(0, 6);
    return ADMIN_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpenMobile(false);
    setSearchFocused(false);
    setNotifOpen(false);
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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchFocused(false);
        setNotifOpen(false);
        setProfileOpen(false);
        setSearchOpenMobile(false);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  const renderSidebarNav = () => (
    <div className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group}>
          <p className="px-3 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-beevo-muted">
            {group}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {ADMIN_NAV_ITEMS.filter((i) => i.group === group).map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-[40px] items-center gap-2.5 rounded-[8px] px-3 text-[13.5px] transition-colors ${
                      active
                        ? "bg-[#FAF6E8] font-extrabold text-beevo-ink before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-[3px] before:rounded-r before:bg-[#FFC928]"
                        : "font-semibold text-beevo-body hover:bg-[#FAF8F3] hover:text-beevo-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[16px] w-[16px] shrink-0 ${
                        active ? "text-beevo-honey-text" : "text-beevo-muted"
                      }`}
                      aria-hidden={true}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full overflow-x-clip bg-beevo-canvas text-beevo-body">
      {/* Desktop Persistent Sidebar (>= 1280px, 248px width) */}
      <aside
        aria-label="Beevo Admin navigation"
        className="hidden xl:sticky xl:top-0 xl:flex xl:h-screen xl:w-[248px] xl:shrink-0 xl:flex-col xl:border-r xl:border-beevo-border xl:bg-white"
      >
        <div className="flex h-[60px] items-center justify-between border-b border-beevo-border px-4">
          <Link
            href="/admin"
            aria-label="Beevo Admin Overview"
            className="inline-flex min-h-[40px] items-center gap-2.5"
          >
            <BeevoLogo variant="icon" iconSize={24} />
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[15px] font-extrabold tracking-[-0.02em] text-beevo-ink">
                beevo
              </span>
              <span className="rounded-[5px] border border-beevo-border bg-[#FAF8F3] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-beevo-muted">
                Admin
              </span>
            </div>
          </Link>
        </div>

        <nav
          aria-label="Admin sections"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          {renderSidebarNav()}
        </nav>

        <div className="border-t border-beevo-border p-3">
          <div className="rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.05em] text-beevo-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
              Server RBAC Ready
            </div>
            <p className="mt-1 text-[11px] leading-snug text-beevo-muted">
              Supabase SSR + RLS enforcement connects in Phase 4.
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[12px] font-semibold text-beevo-muted">
            <Link href="/app" className="inline-flex min-h-[36px] items-center gap-1 hover:text-beevo-ink">
              Studio
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
            <Link href="/" className="inline-flex min-h-[36px] items-center gap-1 hover:text-beevo-ink">
              Website
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-beevo-border bg-white/95 backdrop-blur-md">
          <div className="flex h-[56px] items-center justify-between gap-2 px-3 sm:h-[60px] sm:gap-4 sm:px-5 lg:px-6">
            {/* Left: Drawer Button (< xl) + Brand (< xl) + Breadcrumb & Page Title */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                ref={drawerTriggerRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="admin-drawer"
                className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] border border-beevo-border bg-white text-beevo-ink hover:bg-[#FAF8F3] xl:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>

              <Link
                href="/admin"
                aria-label="Beevo Admin Overview"
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 xl:hidden"
              >
                <BeevoLogo variant="icon" iconSize={22} />
                <span className="hidden font-display text-[14px] font-extrabold text-beevo-ink min-[400px]:inline">
                  Admin
                </span>
              </Link>

              <div className="hidden h-5 w-px bg-beevo-border sm:block xl:hidden" aria-hidden="true" />

              <div className="hidden min-w-0 sm:block">
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center gap-1 text-[11px] font-semibold text-beevo-muted"
                >
                  {routeMeta.breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={`${crumb.label}-${idx}`}>
                      {idx > 0 && (
                        <ChevronRight className="h-3 w-3 shrink-0 text-beevo-muted/65" aria-hidden="true" />
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
                <p className="truncate font-display text-[15px] font-extrabold leading-tight tracking-[-0.02em] text-beevo-ink">
                  {routeMeta.title}
                </p>
              </div>
            </div>

            {/* Right: Search + Notifications + Admin Profile */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              {/* Desktop / Tablet Search Input */}
              <div ref={searchBoxRef} className="relative hidden md:block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
                  aria-hidden="true"
                />
                <label htmlFor="admin-global-search" className="sr-only">
                  Search admin sections
                </label>
                <input
                  id="admin-global-search"
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quickSearchMatches[0]) {
                      router.push(quickSearchMatches[0].href);
                      setSearchFocused(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Jump to admin view..."
                  className="h-[38px] w-[200px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-8 pr-3 text-[12.5px] font-medium text-beevo-ink placeholder:text-beevo-muted/75 focus:border-beevo-ink focus:bg-white lg:w-[250px]"
                />
                {searchFocused && (
                  <div
                    role="listbox"
                    aria-label="Quick admin navigation"
                    className="absolute right-0 mt-1.5 w-[270px] rounded-[10px] border border-beevo-border bg-white p-1.5 shadow-lg"
                  >
                    <p className="px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-beevo-muted">
                      Admin Views
                    </p>
                    {quickSearchMatches.length === 0 ? (
                      <p className="px-2.5 py-2 text-[12px] text-beevo-muted">
                        No matching admin modules.
                      </p>
                    ) : (
                      quickSearchMatches.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="option"
                            aria-selected={isNavActive(pathname, item)}
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchQuery("");
                            }}
                            className="flex min-h-[38px] items-center justify-between gap-2 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-beevo-ink hover:bg-[#FAF8F3]"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden={true} />
                              {item.label}
                            </span>
                            <span className="text-[10.5px] text-beevo-muted">{item.group}</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Search Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpenMobile((p) => !p)}
                aria-label="Toggle admin quick search"
                aria-expanded={searchOpenMobile}
                className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-[8px] border border-beevo-border bg-white text-beevo-ink hover:bg-[#FAF8F3] md:hidden"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Notifications Popover */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((p) => !p);
                    setProfileOpen(false);
                  }}
                  aria-label="Operational notifications"
                  aria-expanded={notifOpen}
                  className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-[8px] border border-beevo-border bg-white text-beevo-ink hover:bg-[#FAF8F3]"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </button>
                {notifOpen && (
                  <div
                    role="region"
                    aria-label="Operational alerts"
                    className="absolute right-0 mt-1.5 w-[264px] rounded-[10px] border border-beevo-border bg-white p-3.5 shadow-lg"
                  >
                    <p className="font-display text-[13px] font-extrabold text-beevo-ink">
                      Operational Alerts
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-beevo-muted">
                      No active incidents or webhook alerts. Live Razorpay, worker failure, and
                      budget threshold alerts stream here in Phase 4.
                    </p>
                    <Link
                      href="/admin/audit-logs"
                      className="mt-3 inline-flex text-[12px] font-bold text-beevo-honey-text hover:underline"
                    >
                      Inspect Audit Logs &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Admin Profile Menu */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((p) => !p);
                    setNotifOpen(false);
                  }}
                  aria-label="Admin profile menu"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-[40px] items-center gap-2 rounded-[8px] border border-beevo-border bg-white px-2.5 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3] sm:px-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#FAF6E8] text-beevo-ink">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="hidden sm:inline">Admin</span>
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    aria-label="Admin session menu"
                    className="absolute right-0 mt-1.5 w-[230px] rounded-[10px] border border-beevo-border bg-white p-1.5 shadow-lg"
                  >
                    <div className="border-b border-beevo-border px-2.5 py-2">
                      <p className="text-[12.5px] font-extrabold text-beevo-ink">
                        Staff Session Pending
                      </p>
                      <p className="mt-0.5 text-[11px] text-beevo-muted">
                        Server-verified RBAC activates in Phase 4
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/admin/configuration"
                        role="menuitem"
                        className="flex min-h-[38px] items-center gap-2 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-beevo-body hover:bg-[#FAF8F3] hover:text-beevo-ink"
                      >
                        <Settings className="h-3.5 w-3.5 text-beevo-muted" aria-hidden="true" />
                        Configuration
                      </Link>
                      <Link
                        href="/admin/audit-logs"
                        role="menuitem"
                        className="flex min-h-[38px] items-center gap-2 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-beevo-body hover:bg-[#FAF8F3] hover:text-beevo-ink"
                      >
                        <ScrollText className="h-3.5 w-3.5 text-beevo-muted" aria-hidden="true" />
                        Audit Logs
                      </Link>
                      <Link
                        href="/app"
                        role="menuitem"
                        className="flex min-h-[38px] items-center gap-2 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-beevo-body hover:bg-[#FAF8F3] hover:text-beevo-ink"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-beevo-muted" aria-hidden="true" />
                        User Studio
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Quick Search Bar */}
          {searchOpenMobile && (
            <div className="border-t border-beevo-border bg-[#FAF8F3] px-3 py-2.5 md:hidden">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jump to admin section..."
                  aria-label="Jump to admin section"
                  className="min-h-[42px] w-full rounded-[8px] border border-beevo-border bg-white pl-9 pr-3 text-[13px] text-beevo-ink"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickSearchMatches.slice(0, 6).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex min-h-[34px] items-center rounded-[7px] border border-beevo-border bg-white px-2.5 text-[12px] font-semibold text-beevo-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Main Workspace Container */}
        <main id="main-content" className="flex-1 px-3.5 py-5 sm:px-5 sm:py-6 lg:px-7">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Tablet / Mobile Slide-Out Navigation Drawer */}
      {drawerOpen && (
        <div
          id="admin-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation drawer"
          className="fixed inset-0 z-50 flex xl:hidden"
        >
          <div
            className="fixed inset-0 bg-[#171717]/45 backdrop-blur-[2px]"
            onClick={() => {
              setDrawerOpen(false);
              drawerTriggerRef.current?.focus();
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-[min(288px,86vw)] flex-col bg-white shadow-2xl">
            <div className="flex h-[56px] items-center justify-between border-b border-beevo-border px-4">
              <div className="inline-flex items-center gap-2">
                <BeevoLogo variant="icon" iconSize={23} />
                <span className="font-display text-[15px] font-extrabold text-beevo-ink">
                  beevo
                </span>
                <span className="rounded-[5px] border border-beevo-border bg-[#FAF8F3] px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-beevo-muted">
                  Admin
                </span>
              </div>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  drawerTriggerRef.current?.focus();
                }}
                aria-label="Close admin menu"
                className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-[8px] border border-beevo-border bg-white text-beevo-ink hover:bg-[#FAF8F3]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Admin drawer navigation" className="flex-1 overflow-y-auto px-3 py-4">
              {renderSidebarNav()}
            </nav>

            <div className="border-t border-beevo-border px-4 py-3 text-[12px] font-semibold text-beevo-muted">
              <div className="flex items-center justify-between">
                <Link href="/app" className="inline-flex min-h-[40px] items-center gap-1 hover:text-beevo-ink">
                  User Studio <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
                <Link href="/" className="inline-flex min-h-[40px] items-center gap-1 hover:text-beevo-ink">
                  Website <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
