"use client";

import {
  BadgePercent,
  Banknote,
  ChartColumn,
  Clapperboard,
  FlaskConical,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DEMO_ADMIN_NOTE } from "@/lib/mocks/admin";
import { isMockAuth } from "@/lib/services/auth";
import { getAdminService, resetAdminMockData } from "@/lib/services/admin";
import { cn } from "@/lib/utils";
import { RequireSession } from "@/components/auth/gates";
import { LogoMark } from "@/components/site/chrome";
import { UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

type AdminNavItem = { href: string; label: string; icon: LucideIcon };

const NAV: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { href: "/admin/creators", label: "Creators", icon: ShieldCheck },
      { href: "/admin/learners", label: "Learners", icon: GraduationCap },
    ],
  },
  {
    label: "Catalog",
    items: [{ href: "/admin/courses", label: "Courses", icon: Clapperboard }],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ReceiptText },
      { href: "/admin/payments", label: "Payments", icon: Banknote },
      { href: "/admin/commission-ledger", label: "Commission", icon: BadgePercent },
      { href: "/admin/earnings", label: "Earnings", icon: Wallet },
      { href: "/admin/payouts", label: "Payouts", icon: Landmark },
      { href: "/admin/disputes", label: "Disputes", icon: ShieldAlert },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
    ],
  },
];

const BOTTOM_NAV = [
  { href: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/admin/creators", label: "Creators", icon: ShieldCheck },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/payouts", label: "Payouts", icon: Landmark },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin gate — the server verifies the role on every request. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const service = getAdminService();
  const toast = useToast();
  const [nonce, setNonce] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [email, setEmail] = useState("admin@beevo.in");
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  if (!service) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-cream px-4">
        <UnavailablePanel
          title="The admin console isn’t available"
          message="We couldn't reach the admin services. Check your connection and reload."
        />
      </main>
    );
  }

  const demo = isMockAuth();
  const session = demo ? service.getSession() : { signedIn: true, profile: { name: "Administrator", email: "server-verified", role: "platform_admin" as const } };

  const signIn = async () => {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Enter a valid admin email.");
      return;
    }
    setSigningIn(true);
    setError(null);
    const result = await service.signIn(clean);
    setSigningIn(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast.push({ variant: "info", title: "Demo admin session started", description: "This simulates auth only — no real security." });
    setNonce((n) => n + 1);
  };

  if (!session.signedIn) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-ink px-4 py-14" key={nonce}>
        <div className="w-full max-w-md">
          <div className="rounded-3xl border-2 border-ink bg-cream p-6 shadow-hard-lime sm:p-8">
            <span className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-accent text-cream shadow-hard-xs">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Admin console</h1>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Internal platform management. Access is limited to accounts an administrator has
              granted the platform-admin role.
            </p>
            <div className="mt-5">
              <Field id="admin-email" label="Admin email" error={error ?? undefined}>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  invalid={Boolean(error)}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  autoComplete="email"
                />
              </Field>
            </div>
            <Button variant="ink" size="lg" className="mt-4 w-full" onClick={signIn} loading={signingIn}>
              <LogIn className="size-4" aria-hidden="true" />
              Start demo admin session
            </Button>
            <p className="mt-3 text-center text-[11px] text-smoke">
              Prefilled for the demo. Any valid email works; data stays fictional.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const chrome = (
    <div className="min-h-dvh bg-cream lg:pl-64" key={nonce}>
      {/* Demo strip (mock mode only) */}
      {demo ? (
      <div className="fixed inset-x-0 top-0 z-40 border-b-2 border-ink bg-accent lg:left-64">
        <div className="flex h-9 items-center gap-2 px-3 sm:px-4">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold tracking-wide text-cream uppercase">
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Demo admin
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-[11px] font-medium text-cream/80 sm:block">
            {DEMO_ADMIN_NOTE}
          </span>
          <button
            type="button"
            onClick={() => resetAdminMockData()}
            className="ml-auto shrink-0 rounded-full border-2 border-ink bg-cream px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:bg-lime"
          >
            Reset demo data
          </button>
        </div>
      </div>
      ) : null}

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r-2 border-ink bg-ink text-cream lg:flex">
        <div className="flex h-16 items-center border-b-2 border-cream/15 px-5">
          <Link href="/admin/dashboard" className="text-lg font-bold tracking-tight">
            <LogoMark className="mr-2 inline-grid size-8 align-middle" />
            Beevo{" "}
            <span className="font-editorial text-sm font-normal text-cream/50 italic">admin</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {NAV.map((section) => (
            <div key={section.label}>
              <p className="px-2.5 pb-1.5 text-[10px] font-bold tracking-[0.22em] text-cream/40 uppercase">
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
                            ? "border-cream bg-cream text-ink"
                            : "border-transparent text-cream/60 hover:border-cream/30 hover:text-cream",
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
        <div className="space-y-3 border-t-2 border-cream/15 p-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-lime bg-ink text-xs font-bold text-lime">
              PA
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{session.profile?.name ?? "Administrator"}</p>
              <p className="truncate text-[10px] text-cream/50">{session.profile?.email ?? "server-verified"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              service.signOut();
              if (demo) setNonce((n) => n + 1);
              else window.location.assign("/login");
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-cream/30 px-3 py-2 text-xs font-bold text-cream/80 transition-colors hover:border-cream hover:text-cream"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            {demo ? "End demo session" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className={cn("fixed inset-x-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-sm lg:hidden", demo ? "top-9" : "top-0")}>
        <div className="flex h-13 items-center justify-between px-4">
          <Link href="/admin/dashboard" className="text-lg font-bold tracking-tight text-ink">
            <LogoMark className="mr-2 inline-grid size-7 align-middle" />
            Beevo{" "}
            <span className="font-editorial text-xs font-normal text-smoke italic">admin</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              service.signOut();
              if (demo) setNonce((n) => n + 1);
              else window.location.assign("/login");
            }}
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={cn("px-4 pb-26 sm:px-6 lg:px-8 lg:pb-12", demo ? "pt-30 lg:pt-28" : "pt-16 lg:pt-20")}>
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream lg:hidden">
        <div className="grid grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold", active ? "text-accent" : "text-smoke")}
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
            className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold", moreOpen ? "text-accent" : "text-smoke")}
          >
            <Menu className="size-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      {/* Mobile more sheet */}
      <AnimatePresence>
        {moreOpen ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/50" onClick={() => setMoreOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t-2 border-ink bg-cream p-5 pb-8"
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold tracking-[0.18em] text-smoke uppercase">All admin pages</p>
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full border-2 border-ink bg-white">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {NAV.flatMap((section) => section.items).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-xs font-bold",
                        isActive(pathname, item.href) ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink",
                      )}
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );

  // Live admins are verified server-side; the gate checks session + role.
  return demo ? chrome : <RequireSession requireAdmin>{chrome}</RequireSession>;
}
