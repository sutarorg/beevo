"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  Send,
  BarChart3,
  Images,
  Share2,
  CreditCard,
  Settings,
  Plus,
  CornerDownLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/constants";
import { cn, formatDayLabel, formatTime } from "@/lib/utils";
import { useDebouncedValue, useBodyScrollLock } from "@/lib/hooks";
import { PlatformChip } from "@/components/brand/platform-icon";
import { Badge } from "@/components/ui/primitives";
import { useApp } from "@/providers/app-provider";
import type { PlatformId, PostStatus } from "@/lib/types";

interface SearchHit {
  id: string;
  caption: string;
  status: PostStatus;
  platforms: PlatformId[];
  scheduledAt: string | null;
}

interface Action {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  run: () => void;
}

const STATUS_TONE: Record<PostStatus, "gold" | "green" | "neutral" | "red"> = {
  scheduled: "gold",
  published: "green",
  draft: "neutral",
  failed: "red",
};

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openComposer, posts: allPosts } = useApp();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(query, 220);
  useBodyScrollLock(paletteOpen);

  const close = React.useCallback(() => setPaletteOpen(false), [setPaletteOpen]);

  React.useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      setHits([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [paletteOpen]);

  /* posts search through the Axios instance */
  React.useEffect(() => {
    if (!paletteOpen) return;
    if (debounced.trim().length < 2) {
      setHits([]);
      return;
    }
    let alive = true;
    api
      .get<{ posts: SearchHit[] }>(API.search, { params: { q: debounced } })
      .then(({ data }) => alive && setHits(data.posts))
      .catch(() => alive && setHits([]));
    return () => {
      alive = false;
    };
  }, [debounced, paletteOpen]);

  const actions: Action[] = React.useMemo(() => {
    const nav = (href: string) => () => {
      close();
      router.push(href);
    };
    const all: Action[] = [
      { id: "new", label: "Compose new post", hint: "Create", icon: Plus, run: () => { close(); openComposer(); } },
      { id: "dash", label: "Go to Dashboard", icon: LayoutDashboard, run: nav("/dashboard") },
      { id: "cal", label: "Go to Calendar", icon: CalendarDays, run: nav("/calendar") },
      { id: "posts", label: "Go to Posts", icon: Send, run: nav("/posts") },
      { id: "analytics", label: "Go to Analytics", icon: BarChart3, run: nav("/analytics") },
      { id: "media", label: "Go to Media Library", icon: Images, run: nav("/media") },
      { id: "accounts", label: "Go to Connected Accounts", icon: Share2, run: nav("/accounts") },
      { id: "billing", label: "Go to Billing", icon: CreditCard, run: nav("/billing") },
      { id: "settings", label: "Go to Settings", icon: Settings, run: nav("/settings") },
    ];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) => a.label.toLowerCase().includes(q));
  }, [query, close, router, openComposer]);

  const postActions: Action[] = hits.map((h) => ({
    id: h.id,
    label: h.caption,
    icon: Send,
    run: () => {
      const full = allPosts.find((p) => p.id === h.id);
      close();
      if (full) openComposer({ post: full });
      else router.push("/posts");
    },
  }));

  const flat = [...postActions, ...actions];

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[active]?.run();
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[6px]" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-3 border-b border-cream-300/70 px-4">
              <Search size={17} className="text-honey-600" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKey}
                placeholder="Search posts, jump anywhere…"
                className="h-13 w-full bg-transparent text-[15px] text-ink-900 placeholder:text-ink-600/45 focus:outline-none"
              />
              <kbd className="rounded-md border border-cream-300 bg-cream-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600/60">
                esc
              </kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-2">
              {postActions.length > 0 && (
                <p className="px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600/50">
                  Posts
                </p>
              )}
              {postActions.map((a, i) => {
                const idx = i;
                const hit = hits[i];
                return (
                  <button
                    key={`p-${a.id}`}
                    onClick={a.run}
                    onMouseEnter={() => setActive(idx)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                      active === idx ? "bg-honey-50" : ""
                    )}
                  >
                    <span className="flex -space-x-1">
                      {hit.platforms.slice(0, 3).map((p) => (
                        <PlatformChip key={p} platform={p} size={22} className="ring-2 ring-white" />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink-800">{a.label}</span>
                    <span className="flex items-center gap-2">
                      {hit.scheduledAt && (
                        <span className="font-mono text-[10px] text-ink-600/60">
                          {formatDayLabel(hit.scheduledAt)} · {formatTime(hit.scheduledAt)}
                        </span>
                      )}
                      <Badge tone={STATUS_TONE[hit.status]}>{hit.status}</Badge>
                    </span>
                  </button>
                );
              })}

              <p className="px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600/50">
                Actions
              </p>
              {actions.map((a, i) => {
                const idx = postActions.length + i;
                return (
                  <button
                    key={a.id}
                    onClick={a.run}
                    onMouseEnter={() => setActive(idx)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-ink-800",
                      active === idx ? "bg-honey-50" : ""
                    )}
                  >
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", active === idx ? "border-honey-400/60 bg-white text-honey-700" : "border-cream-300 bg-cream-100 text-ink-600/70")}>
                      <a.icon size={14} />
                    </span>
                    {a.label}
                    {active === idx && <CornerDownLeft size={13} className="ml-auto text-ink-600/50" />}
                  </button>
                );
              })}
              {flat.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-ink-600/60">
                  Nothing in the hive matches “{query}”.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
