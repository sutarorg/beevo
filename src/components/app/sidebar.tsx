"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Send,
  BarChart3,
  Images,
  Share2,
  CreditCard,
  Settings,
  Plus,
  X,
  Sparkles,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BeeWordmark } from "@/components/brand/bee-mark";
import { Button, Meter, HexAvatar } from "@/components/ui/primitives";
import { useApp } from "@/providers/app-provider";

const NAV: {
  section: string;
  items: { href: string; label: string; icon: React.ElementType; key: string }[];
}[] = [
  {
    section: "Plan",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
      { href: "/calendar", label: "Calendar", icon: CalendarDays, key: "calendar" },
      { href: "/posts", label: "Posts", icon: Send, key: "posts" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, key: "analytics" },
    ],
  },
  {
    section: "Create",
    items: [{ href: "/media", label: "Media Library", icon: Images, key: "media" }],
  },
  {
    section: "Manage",
    items: [
      { href: "/accounts", label: "Accounts", icon: Share2, key: "accounts" },
      { href: "/billing", label: "Billing", icon: CreditCard, key: "billing" },
      { href: "/settings", label: "Settings", icon: Settings, key: "settings" },
    ],
  },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { posts, plan, billing, user, openComposer, openUpgrade } = useApp();
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const failedCount = posts.filter((p) => p.status === "failed").length;

  const badgeFor = (key: string): React.ReactNode => {
    if (key === "posts" && (scheduledCount || draftCount))
      return (
        <span className="ml-auto rounded-full bg-honey-500/15 px-1.5 py-px font-mono text-[10px] font-medium text-honey-400 border border-honey-500/25">
          {scheduledCount + draftCount}
        </span>
      );
    if (key === "accounts" && failedCount > 0)
      return <span className="ml-auto h-1.5 w-1.5 rounded-full bg-honey-400" />;
    return null;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <BeeWordmark dark />
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="text-cream-50/60 hover:text-cream-50 lg:hidden cursor-pointer">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="px-4">
        <Button className="w-full" size="lg" onClick={() => { openComposer(); onNavigate?.(); }}>
          <Plus size={18} strokeWidth={2.5} /> New post
        </Button>
      </div>

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cream-50/35">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-honey-500/12 text-honey-300"
                          : "text-cream-50/55 hover:bg-white/[0.04] hover:text-cream-50"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-honey-300 to-honey-600"
                        />
                      )}
                      <item.icon
                        size={17}
                        strokeWidth={active ? 2.4 : 2}
                        className={cn(active ? "text-honey-400" : "text-cream-50/40 group-hover:text-cream-50/80")}
                      />
                      {item.label}
                      {badgeFor(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* plan / usage card */}
      <div className="px-3 pb-3">
        {plan === "free" ? (
          <div className="rounded-2xl border border-honey-500/25 bg-gradient-to-b from-honey-500/12 to-transparent p-3.5 comb-dark">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-honey-400" />
              <p className="text-xs font-semibold text-cream-50">Free plan</p>
            </div>
            <p className="mt-2 font-mono text-[11px] text-cream-50/60 tnum">
              {billing?.usage.postsThisMonth ?? 0}/{billing?.usage.postsLimit ?? 10} posts this month
            </p>
            <Meter
              value={billing?.usage.postsThisMonth ?? 0}
              max={billing?.usage.postsLimit ?? 10}
              className="mt-1.5 !bg-white/10"
            />
            <Button
              size="sm"
              className="mt-3 w-full"
              onClick={() => openUpgrade("sidebar")}
            >
              <Crown size={14} /> Upgrade — ₹799/mo
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-honey-500/40 bg-gradient-to-br from-honey-400 to-honey-600 p-3.5 text-ink-950 comb-gold">
            <div className="flex items-center gap-2">
              <Crown size={14} />
              <p className="text-xs font-bold uppercase tracking-wide">Pro member</p>
            </div>
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed opacity-80">
              Unlimited posts, AI assistant & best-time engine unlocked.
            </p>
            <Link
              href="/billing"
              className="mt-2.5 inline-flex text-[11px] font-bold underline underline-offset-2 hover:opacity-80"
            >
              Manage billing
            </Link>
          </div>
        )}
      </div>

      {/* user */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-4">
        <HexAvatar name={user?.name ?? "Bee Keeper"} hue={36} size={34} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-cream-50">{user?.name ?? "…"}</p>
          <p className="truncate font-mono text-[10px] text-cream-50/40">{user?.workspace ?? "Hive"}</p>
        </div>
        <Link href="/settings" className="ml-auto text-cream-50/35 transition-colors hover:text-honey-400">
          <Settings size={16} />
        </Link>
      </div>
    </div>
  );
}

export function AppSidebar({ menuOpen, onCloseMenu }: { menuOpen: boolean; onCloseMenu: () => void }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] lg:block">
        <SidebarBody />
      </aside>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm lg:hidden"
              onClick={onCloseMenu}
            />
            <motion.aside
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[272px] bg-ink-950 comb-dark lg:hidden"
            >
              <SidebarBody onNavigate={onCloseMenu} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
