"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CircleCheck,
  Share2,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  TriangleAlert,
  Plus,
  Sparkles,
  Flame,
  Crown,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn, formatCompact, greeting } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Delta, EmptyState, Meter, Skeleton } from "@/components/ui/primitives";
import { PostRow } from "@/components/app/post-row";
import { PlatformChip } from "@/components/brand/platform-icon";
import { useApp } from "@/providers/app-provider";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { ready, user, posts, accounts, analytics, billing, plan, openComposer, openUpgrade, patchPost } = useApp();

  const scheduled = React.useMemo(
    () =>
      posts
        .filter((p) => p.status === "scheduled" && p.scheduledAt)
        .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!)),
    [posts]
  );
  const failed = posts.filter((p) => p.status === "failed");
  const expiring = accounts.filter((a) => a.health === "expiring");
  const published = posts.filter((p) => p.status === "published");
  const totalEngagement = published.reduce(
    (s, p) => s + p.metrics.likes + p.metrics.comments + p.metrics.shares,
    0
  );
  const connected = accounts.filter((a) => a.connected);

  if (!ready) return <DashboardSkeleton />;

  const queue = scheduled.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* greeting hero */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 px-6 py-7 text-cream-50 comb-dark sm:px-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(420px 220px at 85% 0%, rgba(245,163,1,0.22), transparent 65%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-honey-400">
              {user?.workspace} hive
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
              {greeting()},{" "}
              <span className="font-display italic text-honey-300">{user?.name?.split(" ")[0]}</span>
            </h2>
            <p className="mt-1.5 text-sm text-cream-50/60">
              {scheduled.length > 0
                ? `${scheduled.length} post${scheduled.length > 1 ? "s" : ""} queued — next goes out ${
                    queue[0]?.scheduledAt
                      ? new Date(queue[0].scheduledAt).toLocaleDateString("en-IN", { weekday: "long" })
                      : "soon"
                  }.`
                : "Your queue is empty. Time to fill the comb."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="white" onClick={() => openComposer()}>
              <Plus size={16} strokeWidth={2.5} /> Compose
            </Button>
            <Link href="/calendar">
              <Button variant="dark" className="!border-honey-500/40 !bg-honey-500/15 !text-honey-300 hover:!bg-honey-500/25">
                <CalendarClock size={15} /> Calendar
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: CalendarClock, label: "Scheduled posts", value: scheduled.length, sub: "in queue", hue: "text-honey-600 bg-honey-100 border-honey-300/60" },
          { icon: CircleCheck, label: "Published", value: published.length, sub: "last 30 days", hue: "text-leaf-600 bg-lime-50 border-lime-200" },
          { icon: TrendingUp, label: "Engagement", value: formatCompact(totalEngagement), sub: "across channels", hue: "text-honey-700 bg-honey-50 border-honey-300/50" },
          { icon: Share2, label: "Accounts", value: `${connected.length}/${accounts.length}`, sub: "connected", hue: "text-ink-700 bg-cream-100 border-cream-300" },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ duration: 0.4, delay: 0.06 * i }}>
            <Card className="p-4.5" hover>
              <div className="flex items-center justify-between">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", s.hue)}>
                  <s.icon size={16} />
                </span>
                {i === 2 && analytics && <Delta value={analytics.kpis.engagementDelta} />}
              </div>
              <p className="tnum mt-3 text-[26px] font-bold leading-none tracking-tight text-ink-950">{s.value}</p>
              <p className="mt-1 text-xs text-ink-600/70">
                {s.label} <span className="text-ink-600/45">· {s.sub}</span>
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* queue */}
        <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.12 }} className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Up next in the queue"
              subtitle="Your next five scheduled posts across all channels"
              action={
                <Link href="/posts" className="inline-flex items-center gap-1 text-[13px] font-semibold text-honey-700 hover:text-honey-800">
                  View all <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="space-y-1 px-2.5 pb-3">
              {queue.map((p) => (
                <PostRow key={p.id} post={p} />
              ))}
              {queue.length === 0 && (
                <EmptyState
                  icon={<CalendarClock size={20} />}
                  title="Nothing scheduled yet"
                  body="Compose your first post and watch the hive hum."
                  action={<Button size="sm" onClick={() => openComposer()}><Plus size={14} /> New post</Button>}
                  className="m-2.5"
                />
              )}
            </div>

            {/* reach sparkline footer */}
            {analytics && (
              <div className="border-t border-cream-300/70 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-ink-900">Impressions · last 30 days</p>
                  <Badge tone="green">
                    <ArrowUpRight size={11} /> {analytics.kpis.impressionsDelta}%
                  </Badge>
                </div>
                <div className="mt-2 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="impDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F5A301" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#F5A301" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stroke="#D98206"
                        strokeWidth={2}
                        fill="url(#impDash)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* right rail */}
        <div className="space-y-4">
          {/* needs attention */}
          <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.18 }}>
            <Card className={failed.length || expiring.length ? "border-berry-600/25" : ""}>
              <CardHeader title="Needs attention" subtitle={failed.length + expiring.length > 0 ? "Small fixes keep honey flowing" : "All clear"} />
              <div className="space-y-2.5 px-5 pb-5">
                {failed.map((p) => (
                  <div key={p.id} className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3">
                    <TriangleAlert size={15} className="mt-0.5 shrink-0 text-berry-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink-900">{p.caption}</p>
                      <p className="mt-0.5 text-[11px] text-ink-600/70">Failed to publish — token expired</p>
                    </div>
                    <Button size="xs" variant="outline" onClick={() => patchPost(p.id, { action: "retry" })}>
                      Retry
                    </Button>
                  </div>
                ))}
                {expiring.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-honey-300/60 bg-honey-50/80 p-3">
                    <PlatformChip platform={a.platform} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink-900">{a.handle}</p>
                      <p className="text-[11px] text-ink-600/70">Access token expiring soon</p>
                    </div>
                    <Link href="/accounts">
                      <Button size="xs" variant="outline">Reconnect</Button>
                    </Link>
                  </div>
                ))}
                {failed.length === 0 && expiring.length === 0 && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-lime-200 bg-lime-50/70 p-3">
                    <CircleCheck size={16} className="text-leaf-600" />
                    <p className="text-[13px] text-ink-700">Everything in the hive is healthy.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* plan / usage */}
          <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.24 }}>
            {plan === "free" ? (
              <Card className="overflow-hidden">
                <div className="border-b border-cream-300/70 bg-gradient-to-r from-honey-100 to-honey-50 px-5 py-4 comb-light">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-honey-800">Free plan</p>
                    <Flame size={15} className="text-honey-600" />
                  </div>
                </div>
                <div className="space-y-4 px-5 py-4.5">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink-700">Posts this month</span>
                      <span className="tnum font-mono text-ink-600/80">
                        {billing?.usage.postsThisMonth}/{billing?.usage.postsLimit}
                      </span>
                    </div>
                    <Meter value={billing?.usage.postsThisMonth ?? 0} max={billing?.usage.postsLimit ?? 10} className="mt-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink-700">Accounts connected</span>
                      <span className="tnum font-mono text-ink-600/80">
                        {billing?.usage.accountsUsed}/{billing?.usage.accountsLimit}
                      </span>
                    </div>
                    <Meter value={billing?.usage.accountsUsed ?? 0} max={billing?.usage.accountsLimit ?? 2} className="mt-1.5" />
                  </div>
                  <Button className="w-full" onClick={() => openUpgrade("sidebar")}>
                    <Crown size={15} /> Upgrade to Pro — ₹942.82/mo
                  </Button>
                  <p className="text-center text-[11px] text-ink-600/60">
                    Unlimited posts · AI writer · best-time engine
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden border-honey-500/40">
                <div className="bg-gradient-to-br from-honey-400 to-honey-600 px-5 py-5 text-ink-950 comb-gold">
                  <div className="flex items-center gap-2">
                    <Crown size={16} />
                    <p className="text-[13px] font-bold uppercase tracking-wide">Pro plan active</p>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed opacity-85">
                    Unlimited posts, {billing?.usage.accountsLimit} account slots and Hive Writer are live.
                  </p>
                  <Link href="/billing" className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold underline underline-offset-2">
                    Manage subscription <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="flex items-center gap-2 px-5 py-3.5 text-[12px] text-ink-600/80">
                  <Sparkles size={13} className="text-honey-600" />
                  Renews {billing?.renewsOn ? new Date(billing.renewsOn).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "soon"} · ₹942.82/mo
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
