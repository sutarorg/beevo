"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { NotificationItem } from "@/lib/app-types";

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "generation" | "credits" | "system">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const unreadCount = items.filter((i) => !i.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Eyebrow showSparkle>Studio Updates</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
            Notifications
          </h1>
          <p className="mt-1 text-[14px] text-beevo-body">
            Render completion alerts, automatic credit refunds, and workspace notices appear here.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={markAllRead}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-cream disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CheckCheck className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
            Mark All Read
          </button>
          <Link
            href="/app/settings"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-beevo-canvas px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-cream"
          >
            <Settings className="h-4 w-4 text-beevo-muted" aria-hidden="true" />
            Email Preferences
          </Link>
        </div>
      </header>

      {/* Category Filter */}
      <div
        role="group"
        aria-label="Filter notifications by category"
        className="flex flex-wrap gap-2"
      >
        {(
          [
            { value: "all", label: "All" },
            { value: "generation", label: "Generations" },
            { value: "credits", label: "Credits & Billing" },
            { value: "system", label: "System" },
          ] as const
        ).map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              aria-pressed={active}
              className={`min-h-[40px] rounded-full border px-4 text-[12.5px] font-bold transition-colors ${
                active
                  ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                  : "border-beevo-border bg-white text-beevo-body hover:bg-beevo-cream"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feed or Honest Empty State */}
      {filtered.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-beevo-border-warm bg-white px-6 py-12 text-center shadow-beevo-card sm:py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-beevo-cream text-beevo-honey-text">
            <Bell className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-[20px] font-extrabold text-beevo-ink">
            You&apos;re all caught up
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-beevo-body">
            No workspace notifications yet. Real-time generation alerts and credit receipts will
            stream into this inbox once Supabase connects in Phase 4.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app/create" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
              Create a Video
            </Link>
            <Link
              href="/app/settings"
              className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]"
            >
              Manage Email Preferences
            </Link>
          </div>
        </section>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item.id}
              className={`rounded-[18px] border p-4 shadow-beevo-card ${
                item.read
                  ? "border-beevo-border bg-white"
                  : "border-beevo-border-warm bg-beevo-cream/55"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[15px] font-extrabold text-beevo-ink">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-beevo-body">{item.body}</p>
                </div>
                <span className="shrink-0 text-[12px] text-beevo-muted">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
