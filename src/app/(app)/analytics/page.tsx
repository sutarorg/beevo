"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, Eye, HeartHandshake, MousePointerClick, Download, Lock, Flame } from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { platformById, TIME_SLOTS, WEEK_DAYS } from "@/lib/constants";
import { Badge, Button, Card, CardHeader, Delta, ProBadge, Skeleton } from "@/components/ui/primitives";
import { PlatformIcon, PlatformChip } from "@/components/brand/platform-icon";
import { useApp } from "@/providers/app-provider";
import type { PlatformId } from "@/lib/types";

const HEAT_ICONS: PlatformId[] = ["instagram", "facebook", "twitter", "linkedin", "pinterest", "youtube"];

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; dataKey?: string | number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-cream-300 bg-white/95 px-3 py-2 shadow-[var(--shadow-lift)] backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-600/60">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tnum text-[13px] font-semibold text-ink-900">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: p.color ?? "#F5A301" }} />
          {formatCompact(Number(p.value ?? 0))}
          <span className="ml-1 text-[11px] font-normal text-ink-600/60">{String(p.dataKey)}</span>
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { ready, analytics, plan, openUpgrade } = useApp();

  if (!ready || !analytics)
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );

  const { kpis, series, split, bestTimes, topPosts } = analytics;
  const maxScore = Math.max(...bestTimes.map((c) => c.score));
  const bestCell = bestTimes.find((c) => c.score === maxScore);

  const cards = [
    { icon: Users, label: "Total followers", value: formatCompact(kpis.followers), delta: kpis.followersDelta },
    { icon: Eye, label: "Impressions · 30d", value: formatCompact(kpis.impressions), delta: kpis.impressionsDelta },
    { icon: HeartHandshake, label: "Engagement rate", value: kpis.engagementRate.toFixed(1) + "%", delta: kpis.engagementDelta },
    { icon: MousePointerClick, label: "Link clicks", value: formatCompact(kpis.linkClicks), delta: kpis.clicksDelta },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* header row */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="gold"><Flame size={11} /> Last 30 days</Badge>
        {plan === "free" && (
          <Badge tone="outline">
            <Lock size={10} /> 7-day history on Free plan
          </Badge>
        )}
        <div className="ml-auto">
          {plan === "pro" ? (
            <Button size="sm" variant="outline" onClick={() => {}}>
              <Download size={13} /> Export report
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => openUpgrade("analytics")}>
              <Lock size={12} /> Export <ProBadge className="ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4.5" hover>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-honey-300/60 bg-honey-100 text-honey-700">
                  <c.icon size={16} />
                </span>
                <Delta value={c.delta} />
              </div>
              <p className="tnum mt-3 text-[26px] font-bold leading-none tracking-tight text-ink-950">{c.value}</p>
              <p className="mt-1 text-xs text-ink-600/70">{c.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* main chart + split */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Reach & engagement"
            subtitle="Daily impressions and interactions across all channels"
          />
          <div className="h-72 px-3 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="imp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5A301" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F5A301" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="eng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#713112" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#713112" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#EAD9B8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#4A3823", fontFamily: "var(--font-plex-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#4A3823", fontFamily: "var(--font-plex-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCompact(v)}
                  width={44}
                />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="impressions" stroke="#D98206" strokeWidth={2.2} fill="url(#imp)" dot={false} />
                <Area type="monotone" dataKey="engagement" stroke="#713112" strokeWidth={1.6} fill="url(#eng)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* platform split donut */}
        <Card>
          <CardHeader title="Audience split" subtitle="Where your followers live" />
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={split}
                  dataKey="value"
                  nameKey="platform"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {split.map((s) => (
                    <Cell key={s.platform} fill={platformById(s.platform).color} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="tnum text-xl font-bold text-ink-950">{formatCompact(kpis.followers)}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-ink-600/55">followers</p>
            </div>
          </div>
          <ul className="space-y-1.5 px-5 pb-5 pt-2">
            {split.map((s) => (
              <li key={s.platform} className="flex items-center gap-2 text-[12.5px]">
                <PlatformChip platform={s.platform} size={20} />
                <span className="font-medium text-ink-800">{platformById(s.platform).name}</span>
                <span className="tnum ml-auto font-mono text-[11px] text-ink-600/65">{s.value}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* heatmap + top posts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* honeycomb best-time heatmap */}
        <Card className="relative overflow-hidden lg:col-span-2">
          <CardHeader
            title="Best times to post"
            subtitle="Engagement probability by day & hour — each cell is a honey cell"
            action={plan !== "pro" ? <ProBadge /> : bestCell ? <Badge tone="gold">Peak: {WEEK_DAYS[bestCell.day]} {TIME_SLOTS[bestCell.slot]}</Badge> : undefined}
          />
          <div className={cn("relative px-5 pb-6", plan !== "pro" && "select-none")}>
            <div className={cn(plan !== "pro" && "pointer-events-none blur-[6px]")}>
              <div className="grid grid-cols-[42px_repeat(7,1fr)] items-center gap-y-2">
                <span />
                {TIME_SLOTS.map((t) => (
                  <span key={t} className="text-center font-mono text-[9.5px] uppercase tracking-wide text-ink-600/55">
                    {t}
                  </span>
                ))}
                {WEEK_DAYS.map((d, dayIdx) => (
                  <React.Fragment key={d}>
                    <span className="font-mono text-[9.5px] uppercase tracking-wide text-ink-600/70">{d}</span>
                    {TIME_SLOTS.map((_, slotIdx) => {
                      const cell = bestTimes.find((c) => c.day === dayIdx && c.slot === slotIdx);
                      const score = cell?.score ?? 0;
                      const intensity = score / 100;
                      const isBest = cell === bestCell;
                      return (
                        <div key={slotIdx} className="flex justify-center">
                          <div
                            title={`${d} ${TIME_SLOTS[slotIdx]} — score ${score}`}
                            className={cn(
                              "hex-clip flex h-9 w-9 items-center justify-center transition-transform duration-150 hover:scale-110 sm:h-10 sm:w-10",
                              isBest && "ring-2 ring-ink-900"
                            )}
                            style={{
                              background: `rgba(245, 163, 1, ${0.06 + intensity * 0.9})`,
                            }}
                          >
                            {score > 55 && (
                              <PlatformIcon
                                platform={HEAT_ICONS[(dayIdx + slotIdx) % 6]}
                                size={11}
                                className={intensity > 0.5 ? "text-ink-950" : "text-ink-700/60"}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 font-mono text-[9.5px] uppercase tracking-wide text-ink-600/55">
                quiet
                {[0.08, 0.3, 0.55, 0.8, 1].map((o) => (
                  <span key={o} className="hex-clip h-3.5 w-3.5" style={{ background: `rgba(245,163,1,${o})` }} />
                ))}
                buzzing
              </div>
            </div>
            {plan !== "pro" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-5 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-honey-400">
                  <Lock size={16} />
                </span>
                <p className="text-sm font-semibold text-ink-950">Best-time engine is a Pro feature</p>
                <Button size="sm" onClick={() => openUpgrade("best-time")}>
                  Unlock heatmap — ₹942.82/mo
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* top posts */}
        <Card>
          <CardHeader title="Top performing" subtitle="Best posts in the last 30 days" />
          <div className="space-y-2.5 px-5 pb-5">
            {topPosts.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3 rounded-xl border border-cream-300/80 bg-white p-3"
              >
                <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-honey-100 font-mono text-[12px] font-bold text-honey-700 border border-honey-300/60">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink-900">{t.caption}</p>
                  <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] text-ink-600/60">
                    <span className="inline-flex items-center gap-1">
                      <PlatformIcon platform={t.platform} size={10} colored />
                      {platformById(t.platform).name.split(" ")[0]}
                    </span>
                    <span className="tnum">{formatCompact(t.impressions)} reach</span>
                    <span className="tnum text-honey-700">{formatCompact(t.engagement)} eng.</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
