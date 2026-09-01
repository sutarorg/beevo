"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, ListChecks, Sparkles, Lock } from "lucide-react";
import { cn, formatDayLabel, formatTime } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, Modal, Segmented, ProBadge, Skeleton } from "@/components/ui/primitives";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { PostRow } from "@/components/app/post-row";
import { useApp } from "@/providers/app-provider";
import type { Post } from "@/lib/types";

const STATUS_DOT: Record<Post["status"], string> = {
  scheduled: "bg-honey-500",
  published: "bg-leaf-500",
  draft: "bg-ink-600/40",
  failed: "bg-berry-600",
};

export default function CalendarPage() {
  const { ready, posts, openComposer, reschedule, plan, openUpgrade } = useApp();
  const [cursor, setCursor] = React.useState(() => new Date());
  const [view, setView] = React.useState<"month" | "agenda">("month");
  const [daySheet, setDaySheet] = React.useState<Date | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const postsByDay = React.useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((p) => {
      const iso = p.scheduledAt ?? p.publishedAt;
      if (!iso) return;
      const key = format(new Date(iso), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    map.forEach((list) =>
      list.sort((a, b) => (a.scheduledAt ?? a.publishedAt ?? "").localeCompare(b.scheduledAt ?? b.publishedAt ?? ""))
    );
    return map;
  }, [posts]);

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  }, [cursor]);

  const agendaDays = React.useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => addDays(today, i)).filter(
      (d, i) => (postsByDay.get(format(d, "yyyy-MM-dd")) ?? []).length > 0 || i < 3
    );
  }, [postsByDay]);

  function onDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/post-id");
    if (!id) return;
    const post = posts.find((p) => p.id === id);
    if (!post?.scheduledAt) return;
    const old = new Date(post.scheduledAt);
    const next = new Date(day);
    next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    reschedule(id, next.toISOString());
  }

  if (!ready)
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[560px] rounded-3xl" />
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink-950">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-600/60">
            Drag posts between days to reschedule
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented
            id="cal-view"
            value={view}
            onChange={(v) => setView(v)}
            options={[
              { value: "month", label: <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Month</span> },
              { value: "agenda", label: <span className="inline-flex items-center gap-1.5"><ListChecks size={13} /> Agenda</span> },
            ]}
          />
          <div className="flex items-center rounded-xl border border-cream-300 bg-white">
            <button onClick={() => setCursor(addMonths(cursor, -1))} className="cursor-pointer p-2 text-ink-700 hover:text-honey-700" aria-label="Previous month">
              <ChevronLeft size={17} />
            </button>
            <button onClick={() => setCursor(new Date())} className="cursor-pointer border-x border-cream-300 px-3 py-1.5 text-[13px] font-medium text-ink-800 hover:text-honey-700">
              Today
            </button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="cursor-pointer p-2 text-ink-700 hover:text-honey-700" aria-label="Next month">
              <ChevronRight size={17} />
            </button>
          </div>
          <Button size="sm" onClick={() => openComposer()}>
            <Plus size={14} strokeWidth={2.5} /> New post
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <Card className="overflow-hidden !rounded-3xl">
          {/* weekday header */}
          <div className="grid grid-cols-7 border-b border-cream-300/70 bg-cream-50/80">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-2 py-2.5 text-center font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-600/60">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const dayPosts = postsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, cursor);
              const today = isToday(day);
              return (
                <div
                  key={key}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
                  onDragLeave={() => setDragOver((d) => (d === key ? null : d))}
                  onDrop={(e) => onDrop(e, day)}
                  onClick={() => setDaySheet(day)}
                  className={cn(
                    "group relative min-h-[118px] cursor-pointer border-b border-r border-cream-200/80 p-1.5 transition-colors",
                    (i + 1) % 7 === 0 && "border-r-0",
                    i >= 35 && "border-b-0",
                    !inMonth && "bg-cream-50/50",
                    dragOver === key ? "bg-honey-100/70 ring-2 ring-inset ring-honey-500/60" : "hover:bg-honey-50/50"
                  )}
                >
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <span
                      className={cn(
                        "tnum flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                        today
                          ? "bg-gradient-to-b from-honey-400 to-honey-600 text-ink-950 shadow-[var(--shadow-gold)]"
                          : inMonth
                            ? "text-ink-800"
                            : "text-ink-600/35"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openComposer({ date: new Date(day).toISOString() }); }}
                      className="cursor-pointer rounded-md p-1 text-ink-600/0 transition-all hover:bg-honey-100 hover:!text-honey-700 group-hover:text-ink-600/50"
                      aria-label="Add post"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData("text/post-id", p.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={(e) => { e.stopPropagation(); setDaySheet(day); }}
                        className={cn(
                          "flex w-full cursor-grab items-center gap-1.5 rounded-lg border border-cream-300/80 bg-white px-1.5 py-1 text-left shadow-sm transition-all hover:border-honey-400/70 active:cursor-grabbing"
                        )}
                        title={p.caption}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[p.status])} />
                        <span className="flex -space-x-0.5">
                          {p.platforms.slice(0, 3).map((pl) => (
                            <span key={pl} className="flex h-4 w-4 items-center justify-center rounded-full bg-cream-100 ring-1 ring-white">
                              <PlatformIcon platform={pl} size={8} colored />
                            </span>
                          ))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[10.5px] font-medium text-ink-800">
                          {p.caption}
                        </span>
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="px-1 font-mono text-[10px] text-ink-600/55">+{dayPosts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* agenda */
        <div className="space-y-3">
          {agendaDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDay.get(key) ?? [];
            return (
              <Card key={key} className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-cream-300/60 bg-cream-50/60 px-5 py-3">
                  <span className={cn(
                    "flex h-9 w-9 flex-col items-center justify-center rounded-xl border text-[13px] font-bold leading-none",
                    isToday(day)
                      ? "border-honey-500/60 bg-gradient-to-b from-honey-300 to-honey-500 text-ink-950"
                      : "border-cream-300 bg-white text-ink-800"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink-900">{formatDayLabel(day.toISOString())}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-600/55">
                      {dayPosts.length} post{dayPosts.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button size="xs" variant="outline" className="ml-auto" onClick={() => openComposer({ date: day.toISOString() })}>
                    <Plus size={12} /> Add
                  </Button>
                </div>
                <div className="px-2.5 py-2">
                  {dayPosts.length ? (
                    dayPosts.map((p) => <PostRow key={p.id} post={p} compact />)
                  ) : (
                    <p className="px-3 py-3 text-[13px] text-ink-600/55">Nothing planned — a quiet corner of the comb.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* best-time banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="mt-4 flex flex-wrap items-center gap-3 !border-honey-500/40 bg-gradient-to-r from-honey-50 to-cream-50 px-5 py-4 comb-light">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey-500/15 text-honey-700 border border-honey-500/30">
            <Sparkles size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-ink-950">
              Your audience peaks on Sundays, 6–9 pm
            </p>
            <p className="text-xs text-ink-600/75">
              {plan === "pro"
                ? "Best-time engine is active — composer will auto-suggest peak slots."
                : "Unlock the best-time engine to auto-fill peak slots."}
            </p>
          </div>
          {plan === "pro" ? (
            <Badge tone="gold"><Sparkles size={11} /> Engine active</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => openUpgrade("best-time")}>
              <Lock size={12} /> Unlock <ProBadge className="ml-1" />
            </Button>
          )}
        </Card>
      </motion.div>

      {/* day sheet */}
      <Modal open={!!daySheet} onClose={() => setDaySheet(null)} size="sm">
        {daySheet && (
          <div>
            <div className="flex items-center justify-between border-b border-cream-300/70 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-ink-950">
                  {format(daySheet, "EEEE, d MMMM")}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-600/55">
                  {(postsByDay.get(format(daySheet, "yyyy-MM-dd")) ?? []).length} posts this day
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const d = daySheet;
                  setDaySheet(null);
                  openComposer({ date: d.toISOString() });
                }}
              >
                <Plus size={14} strokeWidth={2.5} /> Post
              </Button>
            </div>
            <div className="max-h-[55vh] space-y-1 overflow-y-auto px-2.5 py-2.5">
              {(postsByDay.get(format(daySheet, "yyyy-MM-dd")) ?? []).map((p) => (
                <div key={p.id} onClick={() => setDaySheet(null)}>
                  <PostRow post={p} compact />
                </div>
              ))}
              {(postsByDay.get(format(daySheet, "yyyy-MM-dd")) ?? []).length === 0 && (
                <EmptyState
                  icon={<CalendarDays size={20} />}
                  title="An empty cell"
                  body="No posts planned for this day yet."
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
