"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Search, Send, CalendarClock, FileEdit, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS } from "@/lib/constants";
import { Button, Card, EmptyState, Input, Select, Skeleton } from "@/components/ui/primitives";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { PostRow } from "@/components/app/post-row";
import { useApp } from "@/providers/app-provider";
import type { PlatformId, Post, PostStatus } from "@/lib/types";

type Filter = PostStatus | "all";

const FILTERS: { id: Filter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All posts", icon: Send },
  { id: "scheduled", label: "Scheduled", icon: CalendarClock },
  { id: "draft", label: "Drafts", icon: FileEdit },
  { id: "published", label: "Published", icon: CircleCheck },
  { id: "failed", label: "Failed", icon: TriangleAlert },
];

export default function PostsPage() {
  const { ready, posts, openComposer } = useApp();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [platform, setPlatform] = React.useState<"all" | PlatformId>("all");
  const [query, setQuery] = React.useState("");

  const counts = React.useMemo(() => {
    const c: Record<Filter, number> = { all: posts.length, scheduled: 0, draft: 0, published: 0, failed: 0 };
    posts.forEach((p) => c[p.status]++);
    return c;
  }, [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => (filter === "all" ? true : p.status === filter))
      .filter((p) => (platform === "all" ? true : p.platforms.includes(platform)))
      .filter((p) => (q ? p.caption.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const ta = a.scheduledAt ?? a.publishedAt ?? a.createdAt;
        const tb = b.scheduledAt ?? b.publishedAt ?? b.createdAt;
        const aFuture = new Date(ta) > new Date();
        const bFuture = new Date(tb) > new Date();
        if (aFuture && bFuture) return ta.localeCompare(tb);
        if (aFuture) return -1;
        if (bFuture) return 1;
        return tb.localeCompare(ta);
      });
  }, [posts, filter, platform, query]);

  if (!ready)
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-11 w-full max-w-xl" />
        <Skeleton className="h-[480px] rounded-3xl" />
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all",
              filter === f.id
                ? "border-ink-900 bg-ink-900 text-cream-50 shadow-[var(--shadow-card)]"
                : "border-cream-300 bg-white/70 text-ink-700 hover:border-honey-400/60 hover:text-ink-950"
            )}
          >
            <f.icon size={13} className={filter === f.id ? "text-honey-400" : "opacity-60"} />
            {f.label}
            <span className={cn(
              "tnum rounded-full px-1.5 font-mono text-[10px]",
              filter === f.id ? "bg-honey-500/20 text-honey-300" : "bg-cream-200/80 text-ink-600/70"
            )}>
              {counts[f.id]}
            </span>
          </button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/45" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search captions…"
              className="!h-9.5 w-48 !pl-8.5"
            />
          </div>
          <Select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "all" | PlatformId)}
            className="!h-9.5 w-40"
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => openComposer()}>
            <Plus size={14} strokeWidth={2.5} /> New post
          </Button>
        </div>
      </div>

      {/* list */}
      {filtered.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="!rounded-3xl p-2.5">
            <div className="hidden grid-cols-[1fr_auto] items-center gap-3 border-b border-cream-200/70 px-4 py-2.5 sm:grid">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600/55">
                {filtered.length} post{filtered.length === 1 ? "" : "s"}
                {filter !== "all" && ` · ${filter}`}
                {platform !== "all" && (
                  <span className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-cream-200/70 px-2 py-0.5 normal-case tracking-normal">
                    <PlatformIcon platform={platform as PlatformId} size={10} colored /> {platform}
                  </span>
                )}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600/55">Actions</p>
            </div>
            <div className="divide-y divide-cream-200/60">
              {filtered.map((p: Post, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <PostRow post={p} />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      ) : (
        <EmptyState
          icon={<Send size={20} />}
          title="No posts match"
          body={query ? `Nothing matches “${query}”. Try a different search.` : "This corner of the comb is empty — schedule something sweet."}
          action={<Button size="sm" onClick={() => openComposer()}><Plus size={14} /> Compose post</Button>}
          className="py-20"
        />
      )}
    </div>
  );
}
