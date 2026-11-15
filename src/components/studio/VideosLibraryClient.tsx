"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Download,
  Film,
  Grid2x2,
  List,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatDurationLabel, type VideoAsset } from "@/lib/app-types";

interface VideosLibraryClientProps {
  initialVideos: VideoAsset[];
}

export function VideosLibraryClient({ initialVideos }: VideosLibraryClientProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "longest" | "shortest">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "processing" | "failed">(
    "all"
  );
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d">("all");
  const [page, setPage] = useState(1);

  const pageSize = 12;

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return initialVideos
      .filter((video) => {
        if (q && !video.title.toLowerCase().includes(q) && !video.originalIdea.toLowerCase().includes(q)) {
          return false;
        }
        if (statusFilter !== "all" && video.status !== statusFilter) return false;
        if (dateFilter !== "all") {
          const days = dateFilter === "7d" ? 7 : 30;
          const ageMs = now - new Date(video.createdAt).getTime();
          if (ageMs > days * 86400 * 1000) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "longest") return b.durationSeconds - a.durationSeconds;
        return a.durationSeconds - b.durationSeconds;
      });
  }, [initialVideos, search, statusFilter, dateFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / pageSize));
  const pagedVideos = filteredVideos.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Eyebrow showSparkle>Video Library</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
            My Videos
          </h1>
          <p className="mt-1 text-[14px] text-beevo-body">
            Preview, rename, and download your finished Beevo cartoon MP4 exports.
          </p>
        </div>
        <Link href="/app/create" className="beevo-btn-primary min-h-[46px] px-5 text-[14px]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Create Video
        </Link>
      </header>

      {/* Search, Filters & View Mode Toolbar */}
      <section
        aria-label="Video filters and search"
        className="rounded-[20px] border border-beevo-border bg-white p-4 shadow-beevo-card"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <label htmlFor="videos-search" className="sr-only">
              Search videos by title or idea
            </label>
            <input
              id="videos-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search videos by title or story idea..."
              className="min-h-[44px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas pl-10 pr-3.5 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
            />
          </div>

          {/* Filter Dropdowns + Grid/List Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="min-h-[44px] rounded-[12px] border border-beevo-border bg-beevo-canvas px-3 text-[13px] font-semibold text-beevo-ink"
            >
              <option value="all">Status: All</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            <div className="relative inline-flex items-center">
              <Calendar
                className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-beevo-muted"
                aria-hidden="true"
              />
              <select
                aria-label="Filter by date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as typeof dateFilter);
                  setPage(1);
                }}
                className="min-h-[44px] rounded-[12px] border border-beevo-border bg-beevo-canvas pl-8 pr-3 text-[13px] font-semibold text-beevo-ink"
              >
                <option value="all">All dates</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>

            <select
              aria-label="Sort videos"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="min-h-[44px] rounded-[12px] border border-beevo-border bg-beevo-canvas px-3 text-[13px] font-semibold text-beevo-ink"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="longest">Sort: Longest</option>
              <option value="shortest">Sort: Shortest</option>
            </select>

            <div
              role="group"
              aria-label="Layout view mode"
              className="inline-flex rounded-[12px] border border-beevo-border bg-beevo-canvas p-1"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                className={`inline-flex h-[36px] w-[38px] items-center justify-center rounded-[8px] transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-beevo-ink shadow-sm"
                    : "text-beevo-muted hover:text-beevo-ink"
                }`}
              >
                <Grid2x2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                className={`inline-flex h-[36px] w-[38px] items-center justify-center rounded-[8px] transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-beevo-ink shadow-sm"
                    : "text-beevo-muted hover:text-beevo-ink"
                }`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Results or Genuine Empty State */}
      {pagedVideos.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-beevo-border-warm bg-white px-6 py-12 text-center shadow-beevo-card sm:py-16">
          <Image
            src="/images/beevo/bee-flight-doodle.webp"
            alt="Beevo mascot illustration"
            width={240}
            height={195}
            className="mx-auto h-auto w-[110px] object-contain"
          />
          <h2 className="mt-4 font-display text-[21px] font-extrabold tracking-[-0.02em] text-beevo-ink">
            {initialVideos.length === 0
              ? "Your video library is empty"
              : "No videos match your current filters"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-beevo-body">
            {initialVideos.length === 0
              ? "Finished MP4 videos stored in Cloudflare R2 will appear here with instant playback, rename, and download controls once your account is connected."
              : "Try clearing your search term or resetting the status and date filters."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app/create" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Create Your First Video
            </Link>
            {(search || statusFilter !== "all" || dateFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]"
              >
                Reset Filters
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {pagedVideos.map((video) => (
              <article
                key={video.id}
                className={`overflow-hidden rounded-[20px] border border-beevo-border bg-white shadow-beevo-card ${
                  viewMode === "list" ? "flex flex-col sm:flex-row sm:items-center" : ""
                }`}
              >
                <Link
                  href={`/app/videos/${video.id}`}
                  className={`relative block bg-beevo-dark ${
                    viewMode === "list" ? "aspect-video sm:w-[210px] sm:shrink-0" : "aspect-video w-full"
                  }`}
                >
                  {video.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/60">
                      <Film className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                    {formatDurationLabel(video.durationSeconds)}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <Link
                      href={`/app/videos/${video.id}`}
                      className="font-display text-[15.5px] font-extrabold text-beevo-ink hover:text-beevo-honey-text"
                    >
                      {video.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-beevo-muted">
                      {video.aspectRatio} &middot; {video.resolution} &middot; {video.styleName}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
                    <Link
                      href={`/app/videos/${video.id}`}
                      className="inline-flex min-h-[38px] items-center rounded-full bg-beevo-cream px-3.5 text-[12px] font-bold text-beevo-ink"
                    >
                      Preview
                    </Link>
                    {video.mp4Url && (
                      <a
                        href={video.mp4Url}
                        download
                        aria-label={`Download ${video.title}`}
                        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      aria-label={`Rename ${video.title}`}
                      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${video.title}`}
                      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <nav
            aria-label="Video library pagination"
            className="flex items-center justify-between rounded-[16px] border border-beevo-border bg-white px-4 py-3 text-[13px]"
          >
            <span className="font-semibold text-beevo-muted tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-[40px] rounded-full border border-beevo-border bg-beevo-canvas px-4 font-bold text-beevo-ink disabled:opacity-45"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-[40px] rounded-full border border-beevo-border bg-beevo-canvas px-4 font-bold text-beevo-ink disabled:opacity-45"
              >
                Next
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
