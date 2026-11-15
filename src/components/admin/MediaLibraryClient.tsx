"use client";

import React, { useMemo, useState } from "react";
import { FolderOpen, Lock, Search } from "lucide-react";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import {
  formatBytesNullable,
  type AdminApiError,
  type AdminApiState,
  type AdminMediaAsset,
  type MediaAssetType,
} from "@/lib/admin-types";

interface MediaLibraryClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialAssets: AdminMediaAsset[];
}

const ASSET_TYPE_OPTIONS: { id: "all" | MediaAssetType; label: string }[] = [
  { id: "all", label: "All Types" },
  { id: "character_reference", label: "Character refs" },
  { id: "cartoon_image", label: "Cartoon images" },
  { id: "narration_track", label: "Narration tracks" },
  { id: "background_music", label: "Background music" },
  { id: "sound_effect", label: "Sound effects" },
  { id: "captions", label: "Captions" },
  { id: "finished_mp4", label: "Finished MP4s" },
];

export function MediaLibraryClient({
  apiState,
  apiError,
  initialAssets,
}: MediaLibraryClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MediaAssetType>("all");
  const [accessFilter, setAccessFilter] = useState<
    "all" | AdminMediaAsset["accessPolicy"]
  >("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialAssets.filter((a) => {
      if (
        q &&
        !a.storageKey.toLowerCase().includes(q) &&
        !a.ownerName.toLowerCase().includes(q) &&
        !(a.projectTitle ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (typeFilter !== "all" && a.assetType !== typeFilter) return false;
      if (accessFilter !== "all" && a.accessPolicy !== accessFilter) return false;
      return true;
    });
  }, [initialAssets, search, typeFilter, accessFilter]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Media Library (Cloudflare R2)
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Inspect private user media objects, character references, narration tracks, captions,
            and verified MP4 exports stored in Cloudflare R2.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-[8px] border border-beevo-border bg-white px-3 py-2 text-[11.5px] font-bold text-beevo-body sm:self-auto">
          <Lock className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
          Private R2 buckets · Signed staff access only
        </span>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Cloudflare R2 asset metadata catalog"
      />

      {/* Asset Type Chips & Search */}
      <section className="space-y-3 rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by R2 asset type">
          {ASSET_TYPE_OPTIONS.map((opt) => {
            const active = typeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTypeFilter(opt.id)}
                aria-pressed={active}
                className={`min-h-[34px] rounded-[7px] border px-2.5 text-[12px] font-bold transition-colors ${
                  active
                    ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                    : "border-beevo-border bg-[#FAF8F3] text-beevo-body hover:bg-white"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search storage key, owner, or project"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search R2 storage key, owner, or project..."
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-8 pr-3 text-[12.5px] text-beevo-ink focus:border-beevo-ink focus:bg-white"
            />
          </div>
          <select
            aria-label="Filter by R2 access policy"
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as typeof accessFilter)}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Access policy: All</option>
            <option value="private_signed_only">Private Signed URL</option>
            <option value="licensed_catalog_internal">Licensed Audio Catalog</option>
          </select>
        </div>
      </section>

      {/* 7-Field R2 Asset Table */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] border-collapse text-left text-[12px]">
            <caption className="sr-only">Cloudflare R2 media object registry</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                <th scope="col" className="px-3.5 py-3">File type</th>
                <th scope="col" className="px-3.5 py-3 text-right">Size</th>
                <th scope="col" className="px-3.5 py-3">Owner</th>
                <th scope="col" className="px-3.5 py-3">Project</th>
                <th scope="col" className="px-3.5 py-3">Creation date</th>
                <th scope="col" className="px-3.5 py-3">Storage key</th>
                <th scope="col" className="px-3.5 py-3">Access info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FolderOpen className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No Cloudflare R2 media objects indexed yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Character refs, scene PNG/WebPs, narration MP3s, music, SFX, captions, and
                      finished MP4 videos populate here strictly from verified R2 metadata in Phase
                      4.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF8F3]/60">
                    <td className="px-3.5 py-3 font-mono font-semibold text-beevo-ink">
                      {a.assetType}
                    </td>
                    <td className="px-3.5 py-3 text-right tabular-nums">
                      {formatBytesNullable(a.fileSizeBytes)}
                    </td>
                    <td className="px-3.5 py-3">{a.ownerName}</td>
                    <td className="px-3.5 py-3">{a.projectTitle ?? "—"}</td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-beevo-muted">
                      {a.createdAt.slice(0, 10)}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-beevo-body">
                      {a.storageKey}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-[5px] border border-beevo-border bg-[#FAF8F3] px-2 py-0.5 text-[11px] font-bold text-beevo-ink">
                        <Lock className="h-3 w-3 text-beevo-honey-text" aria-hidden="true" />
                        {a.accessPolicy === "private_signed_only" ? "Private Signed" : "Licensed"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 text-center md:hidden">
          <FolderOpen className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
          <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
            No Cloudflare R2 media objects indexed yet
          </p>
          <p className="mt-1 text-[12.5px] text-beevo-muted">
            Private R2 objects load once Phase 4 storage indexing connects.
          </p>
        </div>
      </section>
    </div>
  );
}
