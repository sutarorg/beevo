"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Menu,
  Search,
  Bell,
  Plus,
  CheckCheck,
  CircleCheck,
  TriangleAlert,
  Link2,
  Lightbulb,
  Crown,
  Settings,
  CreditCard,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Badge, Button, HexAvatar, Popover, ProBadge } from "@/components/ui/primitives";
import { useApp } from "@/providers/app-provider";
import type { NotificationKind } from "@/lib/types";

const TITLES: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/calendar", "Content Calendar"],
  ["/posts", "Posts"],
  ["/analytics", "Analytics"],
  ["/media", "Media Library"],
  ["/accounts", "Connected Accounts"],
  ["/billing", "Billing & Plan"],
  ["/settings", "Settings"],
];

const NOTIF_ICON: Record<NotificationKind, React.ElementType> = {
  published: CircleCheck,
  failed: TriangleAlert,
  account: Link2,
  plan: Crown,
  tip: Lightbulb,
};

const NOTIF_TONE: Record<NotificationKind, string> = {
  published: "bg-lime-50 text-leaf-600 border-lime-200",
  failed: "bg-red-50 text-berry-600 border-red-200",
  account: "bg-honey-50 text-honey-700 border-honey-300/70",
  plan: "bg-honey-50 text-honey-700 border-honey-300/70",
  tip: "bg-amber-50 text-amber-700 border-amber-200",
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, plan, notifications, unreadCount, markNotifications, openComposer, setPaletteOpen, setPlan } = useApp();

  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Beevo";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="sticky top-0 z-30 border-b border-cream-300/70 bg-cream-100/85 backdrop-blur-md lg:top-3 lg:rounded-t-[28px]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="cursor-pointer text-ink-700 hover:text-ink-950 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-ink-950">{title}</h1>
          <p className="hidden font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-600/60 sm:block">
            {today}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 cursor-pointer items-center gap-2.5 rounded-xl border border-cream-300 bg-white/70 px-3 text-sm text-ink-600/70 transition-colors hover:border-honey-400/60 hover:text-ink-900 sm:flex"
          >
            <Search size={15} />
            <span className="text-[13px]">Search the hive…</span>
            <kbd className="rounded-md border border-cream-300 bg-cream-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600/70">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-cream-300 bg-white/70 text-ink-700 sm:hidden"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          <Popover
            width="w-[360px]"
            trigger={
              <button
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-cream-300 bg-white/70 text-ink-700 transition-colors hover:border-honey-400/60"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-honey-500 px-1 font-mono text-[9px] font-bold text-ink-950 ring-2 ring-cream-100">
                    {unreadCount}
                  </span>
                )}
              </button>
            }
          >
            <div className="flex items-center justify-between border-b border-cream-300/70 px-4 py-3">
              <p className="text-[13px] font-semibold text-ink-900">Notifications</p>
              <button
                onClick={() => markNotifications(undefined, true)}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-honey-700 hover:text-honey-800"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.map((n) => {
                const Icon = NOTIF_ICON[n.kind];
                return (
                  <button
                    key={n.id}
                    onClick={() => markNotifications(n.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 border-b border-cream-200/70 px-4 py-3 text-left transition-colors hover:bg-honey-50/60",
                      !n.read && "bg-honey-50/40"
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", NOTIF_TONE[n.kind])}>
                      <Icon size={13} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-ink-900">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-honey-500" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-600/85">{n.body}</span>
                      <span className="mt-1 block font-mono text-[10px] text-ink-600/50">
                        {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Popover>

          <Popover
            width="w-64"
            trigger={
              <button className="cursor-pointer rounded-full transition-transform hover:scale-105" aria-label="Account">
                <HexAvatar name={user?.name ?? "Bee Keeper"} hue={36} size={36} />
              </button>
            }
          >
            {(close) => (
              <div>
                <div className="border-b border-cream-300/70 px-4 py-3">
                  <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate font-mono text-[11px] text-ink-600/70">{user?.email}</p>
                  <div className="mt-2">
                    {plan === "pro" ? (
                      <Badge tone="gold"><Crown size={11} /> Pro · ₹799/mo</Badge>
                    ) : (
                      <Badge tone="neutral">Free plan</Badge>
                    )}
                  </div>
                </div>
                <div className="p-1.5 text-sm">
                  <MenuItem icon={Settings} label="Settings" onClick={() => { close(); router.push("/settings"); }} />
                  <MenuItem icon={CreditCard} label="Billing & invoices" onClick={() => { close(); router.push("/billing"); }} />
                  <MenuItem
                    icon={ArrowLeftRight}
                    label={plan === "pro" ? "Switch to Free" : "Upgrade to Pro"}
                    onClick={() => { close(); setPlan(plan === "pro" ? "free" : "pro"); }}
                  />
                  <MenuItem
                    icon={LogOut}
                    label="Log out"
                    onClick={async () => {
                      close();
                      await api.post("/api/auth/logout").catch(() => undefined);
                      router.push("/login");
                      router.refresh();
                    }}
                    danger
                  />
                </div>
              </div>
            )}
          </Popover>

          <Button size="sm" onClick={() => openComposer()} className="ml-1 hidden sm:inline-flex">
            <Plus size={15} strokeWidth={2.5} /> New post
          </Button>
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
  pro,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
  pro?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
        danger ? "text-berry-600 hover:bg-red-50" : "text-ink-700 hover:bg-honey-50 hover:text-ink-950"
      )}
    >
      <Icon size={15} className="opacity-70" />
      {label}
      {pro && <ProBadge className="ml-auto" />}
    </button>
  );
}
