"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Zap,
  RotateCcw,
  CalendarX2,
  Sparkles,
} from "lucide-react";
import { cn, formatDayLabel, formatTime, formatCompact } from "@/lib/utils";
import { Badge, Popover } from "@/components/ui/primitives";
import { PlatformChip } from "@/components/brand/platform-icon";
import { useApp } from "@/providers/app-provider";
import type { Post } from "@/lib/types";

export const STATUS_META: Record<Post["status"], { label: string; tone: "gold" | "green" | "neutral" | "red" }> = {
  scheduled: { label: "Scheduled", tone: "gold" },
  published: { label: "Published", tone: "green" },
  draft: { label: "Draft", tone: "neutral" },
  failed: { label: "Failed", tone: "red" },
};

export function PostRow({ post, compact = false }: { post: Post; compact?: boolean }) {
  const { openComposer, deletePost, duplicatePost, patchPost } = useApp();
  const meta = STATUS_META[post.status];
  const when = post.scheduledAt ?? post.publishedAt;

  const menuItem =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-700 transition-colors hover:bg-honey-50 hover:text-ink-950";

  return (
    <div
      className={cn(
        "group flex items-center gap-3.5 rounded-2xl border border-transparent px-3 py-3 transition-all hover:border-cream-300 hover:bg-white hover:shadow-[var(--shadow-card)]",
        compact ? "py-2.5" : ""
      )}
    >
      {/* thumb */}
      {post.media[0] ? (
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-cream-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.media[0]} alt="" className="h-full w-full object-cover" />
          {post.media.length > 1 && (
            <span className="absolute bottom-0.5 right-0.5 rounded-md bg-ink-950/80 px-1 font-mono text-[9px] text-cream-50">
              +{post.media.length - 1}
            </span>
          )}
        </span>
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cream-300 bg-cream-100">
          <span className="flex -space-x-1.5">
            {post.platforms.slice(0, 2).map((p) => (
              <PlatformChip key={p} platform={p} size={22} className="ring-2 ring-cream-100" />
            ))}
          </span>
        </span>
      )}

      {/* caption */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13.5px] font-medium text-ink-900", compact && "text-[13px]")}>
          {post.caption}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="flex -space-x-1">
            {post.platforms.map((p) => (
              <PlatformChip key={p} platform={p} size={18} className="ring-2 ring-cream-100 group-hover:ring-white" />
            ))}
          </span>
          {when && (
            <span className="font-mono text-[10.5px] text-ink-600/65">
              {formatDayLabel(when)} · {formatTime(when)}
            </span>
          )}
          {post.aiAssisted && (
            <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-honey-700">
              <Sparkles size={10} /> AI
            </span>
          )}
        </div>
      </div>

      {/* metrics for published */}
      {post.status === "published" && !compact && (
        <div className="hidden items-center gap-4 pr-2 md:flex">
          <Metric label="Likes" value={post.metrics.likes} />
          <Metric label="Reach" value={post.metrics.impressions} />
        </div>
      )}

      <Badge tone={meta.tone} className="shrink-0">{meta.label}</Badge>

      <Popover
        width="w-48"
        trigger={
          <button
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-600/50 opacity-0 transition-all hover:bg-cream-200/70 hover:text-ink-900 group-hover:opacity-100"
            aria-label="Post actions"
          >
            <MoreHorizontal size={16} />
          </button>
        }
      >
        {(close) => (
          <div className="p-1.5">
            <button className={menuItem} onClick={() => { close(); openComposer({ post }); }}>
              <Pencil size={14} className="opacity-70" /> Edit post
            </button>
            <button className={menuItem} onClick={async () => { close(); await duplicatePost(post.id); }}>
              <Copy size={14} className="opacity-70" /> Duplicate
            </button>
            {post.status !== "published" && (
              <button
                className={menuItem}
                onClick={async () => { close(); await patchPost(post.id, { action: "publish_now" }); }}
              >
                <Zap size={14} className="opacity-70" /> Publish now
              </button>
            )}
            {post.status === "failed" && (
              <button
                className={menuItem}
                onClick={async () => { close(); await patchPost(post.id, { action: "retry" }); }}
              >
                <RotateCcw size={14} className="opacity-70" /> Retry schedule
              </button>
            )}
            {post.status === "scheduled" && (
              <button
                className={menuItem}
                onClick={async () => { close(); await patchPost(post.id, { action: "unschedule" }); }}
              >
                <CalendarX2 size={14} className="opacity-70" /> Move to drafts
              </button>
            )}
            <div className="my-1 h-px bg-cream-200" />
            <button
              className={cn(menuItem, "!text-berry-600 hover:!bg-red-50")}
              onClick={async () => { close(); await deletePost(post.id); }}
            >
              <Trash2 size={14} className="opacity-70" /> Delete
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-right">
      <span className="tnum block text-[13px] font-semibold text-ink-900">{formatCompact(value)}</span>
      <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-600/55">{label}</span>
    </span>
  );
}
