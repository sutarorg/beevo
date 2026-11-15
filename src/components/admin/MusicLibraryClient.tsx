"use client";

import React, { useMemo, useState } from "react";
import { FileAudio, Music, Plus, Search, ShieldCheck, Volume2 } from "lucide-react";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import { formatDurationLabel } from "@/lib/app-types";
import type {
  AdminApiError,
  AdminApiState,
  AdminMusicTrack,
} from "@/lib/admin-types";

interface MusicLibraryClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialTracks: AdminMusicTrack[];
}

export function MusicLibraryClient({
  apiState,
  apiError,
  initialTracks,
}: MusicLibraryClientProps) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | AdminMusicTrack["kind"]>("all");
  const [moodFilter, setMoodFilter] = useState<"all" | AdminMusicTrack["mood"]>("all");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Register Licensed Track Form
  const [trackName, setTrackName] = useState("");
  const [kind, setKind] = useState<AdminMusicTrack["kind"]>("music");
  const [mood, setMood] = useState<AdminMusicTrack["mood"]>("playful");
  const [usageRights, setUsageRights] = useState("Commercial Royalty-Free (Worldwide)");
  const [licenseRef, setLicenseRef] = useState("");
  const [activeStatus, setActiveStatus] = useState(true);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialTracks.filter((t) => {
      if (
        q &&
        !t.name.toLowerCase().includes(q) &&
        !t.licenseReference.toLowerCase().includes(q) &&
        !t.mood.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (kindFilter !== "all" && t.kind !== kindFilter) return false;
      if (moodFilter !== "all" && t.mood !== moodFilter) return false;
      return true;
    });
  }, [initialTracks, search, kindFilter, moodFilter]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackName.trim() || !licenseRef.trim()) {
      setFormNotice(
        "Provide both a genuine track name and a verifiable license reference ID before uploading."
      );
      return;
    }
    setFormNotice(
      `Validated licensed ${kind} submission "${trackName.trim()}" (license: ${licenseRef.trim()}). Signed R2 audio upload and catalog persistence activate in Phase 4.`
    );
    setShowRegisterForm(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Music &amp; Audio Library
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Manage verified, commercially licensed background music and sound effects available to
            Beevo creators. Zero placeholder or synthetic tracks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRegisterForm((p) => !p)}
          aria-expanded={showRegisterForm}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-[8px] bg-[#FFC928] px-3.5 text-[12.5px] font-extrabold text-beevo-ink hover:bg-[#F2B800] sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showRegisterForm ? "Close Registration Form" : "Register Licensed Track"}
        </button>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Licensed music and SFX catalog"
      />

      {formNotice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[10px] border border-beevo-border-warm bg-beevo-cream/85 px-4 py-3 text-[13px] font-semibold text-beevo-ink"
        >
          {formNotice}
        </div>
      )}

      {/* Licensed Track Registration Form */}
      {showRegisterForm && (
        <section
          aria-label="Register a genuinely licensed audio track"
          className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
        >
          <div className="flex items-center gap-2 border-b border-beevo-border pb-3">
            <ShieldCheck className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
            <h2 className="font-display text-[15px] font-extrabold text-beevo-ink">
              Register Licensed Audio Asset
            </h2>
          </div>

          <form onSubmit={handleRegisterSubmit} className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="track-name" className="block text-[12px] font-bold text-beevo-ink">
                Track name <span className="text-red-700">*</span>
              </label>
              <input
                id="track-name"
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="Official licensed title..."
                className="mt-1 min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 text-[13px] text-beevo-ink"
              />
            </div>

            <div>
              <label htmlFor="track-category" className="block text-[12px] font-bold text-beevo-ink">
                Asset category
              </label>
              <select
                id="track-category"
                value={kind}
                onChange={(e) => setKind(e.target.value as AdminMusicTrack["kind"])}
                className="mt-1 min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 text-[13px] font-semibold text-beevo-ink"
              >
                <option value="music">Background Music</option>
                <option value="sfx">Sound Effect (SFX)</option>
              </select>
            </div>

            <div>
              <label htmlFor="track-mood" className="block text-[12px] font-bold text-beevo-ink">
                Mood tag
              </label>
              <select
                id="track-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value as AdminMusicTrack["mood"])}
                className="mt-1 min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 text-[13px] font-semibold text-beevo-ink"
              >
                <option value="happy">Happy</option>
                <option value="cinematic">Cinematic</option>
                <option value="playful">Playful</option>
                <option value="emotional">Emotional</option>
                <option value="relaxing">Relaxing</option>
                <option value="educational">Educational</option>
                <option value="sfx">SFX</option>
              </select>
            </div>

            <div>
              <label htmlFor="track-license-ref" className="block text-[12px] font-bold text-beevo-ink">
                License reference / Invoice ID <span className="text-red-700">*</span>
              </label>
              <input
                id="track-license-ref"
                type="text"
                value={licenseRef}
                onChange={(e) => setLicenseRef(e.target.value)}
                placeholder="e.g. LIC-2026-AUDIO-8842"
                className="mt-1 min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 font-mono text-[12.5px] text-beevo-ink"
              />
            </div>

            <div>
              <label htmlFor="track-rights" className="block text-[12px] font-bold text-beevo-ink">
                Usage rights scope
              </label>
              <input
                id="track-rights"
                type="text"
                value={usageRights}
                onChange={(e) => setUsageRights(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 text-[13px] text-beevo-ink"
              />
            </div>

            <div>
              <label htmlFor="track-audio-file" className="block text-[12px] font-bold text-beevo-ink">
                Audio file (.mp3 / .wav)
              </label>
              <input
                id="track-audio-file"
                type="file"
                accept=".mp3,.wav,.m4a"
                className="mt-1 block min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 py-1.5 text-[12px] text-beevo-body"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 sm:col-span-2">
              <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 text-[12.5px] font-bold text-beevo-ink">
                <input
                  type="checkbox"
                  checked={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.checked)}
                  className="h-4 w-4 accent-[#1B1916]"
                />
                Publish immediately as Active in Studio picker
              </label>
              <button
                type="submit"
                className="min-h-[40px] rounded-[8px] bg-beevo-dark px-4 text-[12.5px] font-extrabold text-[#FFFDF7] hover:bg-[#2F2B25]"
              >
                Validate &amp; Upload (Phase 4)
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Bar */}
      <section className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search track name, mood, or license reference"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Track name, mood, or license ref..."
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-8 pr-3 text-[12.5px] text-beevo-ink focus:border-beevo-ink focus:bg-white"
            />
          </div>

          <select
            aria-label="Filter by audio category"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as "all" | AdminMusicTrack["kind"])}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Category: All</option>
            <option value="music">Background Music</option>
            <option value="sfx">Sound Effects (SFX)</option>
          </select>

          <select
            aria-label="Filter by mood"
            value={moodFilter}
            onChange={(e) => setMoodFilter(e.target.value as "all" | AdminMusicTrack["mood"])}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Mood: All</option>
            <option value="happy">Happy</option>
            <option value="cinematic">Cinematic</option>
            <option value="playful">Playful</option>
            <option value="emotional">Emotional</option>
            <option value="relaxing">Relaxing</option>
            <option value="educational">Educational</option>
            <option value="sfx">SFX</option>
          </select>
        </div>
      </section>

      {/* 7-Field Licensed Catalog Table */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] border-collapse text-left text-[12px]">
            <caption className="sr-only">Licensed Beevo music and sound effect catalog</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                <th scope="col" className="px-3.5 py-3">Track name</th>
                <th scope="col" className="px-3.5 py-3">Mood</th>
                <th scope="col" className="px-3.5 py-3 text-right">Duration</th>
                <th scope="col" className="px-3.5 py-3">Audio file</th>
                <th scope="col" className="px-3.5 py-3">Usage rights</th>
                <th scope="col" className="px-3.5 py-3">License reference</th>
                <th scope="col" className="px-3.5 py-3">Active status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Music className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No licensed tracks uploaded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Beevo ships with zero pre-populated fake tracks. Upload real, commercially
                      licensed MP3/WAV tracks with verified license references in Phase 4.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF8F3]/60">
                    <td className="px-3.5 py-3 font-bold text-beevo-ink">{t.name}</td>
                    <td className="px-3.5 py-3 capitalize">{t.mood}</td>
                    <td className="px-3.5 py-3 text-right tabular-nums">
                      {formatDurationLabel(t.durationSeconds)}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-beevo-body">
                      <span className="inline-flex items-center gap-1">
                        <FileAudio className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                        {t.audioUrl ? "Preview ready" : "Pending R2 upload"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">{t.usageRights}</td>
                    <td className="px-3.5 py-3 font-mono text-[11px]">{t.licenseReference}</td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`rounded-[5px] border px-2 py-0.5 text-[11px] font-bold ${
                          t.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-beevo-border bg-[#FAF8F3] text-beevo-muted"
                        }`}
                      >
                        {t.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 text-center md:hidden">
          <Volume2 className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
          <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
            No licensed tracks uploaded yet
          </p>
          <p className="mt-1 text-[12.5px] text-beevo-muted">
            Verified licensed music and SFX appear here after upload in Phase 4.
          </p>
        </div>
      </section>
    </div>
  );
}
