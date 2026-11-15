"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Eye, Filter, Search } from "lucide-react";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import { formatDurationLabel } from "@/lib/app-types";
import {
  ADMIN_PIPELINE_STAGES,
  formatInrNullable,
  type AdminApiError,
  type AdminApiState,
  type AdminGenerationRow,
  type AdminPipelineStageKey,
  type GenerationOverallStatus,
} from "@/lib/admin-types";

interface GenerationsClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialGenerations: AdminGenerationRow[];
}

export function GenerationsClient({
  apiState,
  apiError,
  initialGenerations,
}: GenerationsClientProps) {
  const [userQuery, setUserQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GenerationOverallStatus>("all");
  const [stageFilter, setStageFilter] = useState<"all" | AdminPipelineStageKey>("all");
  const [durationFilter, setDurationFilter] = useState<"all" | "short" | "medium" | "long">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [failedOnly, setFailedOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return initialGenerations.filter((g) => {
      if (
        q &&
        !g.userName.toLowerCase().includes(q) &&
        !g.userEmail.toLowerCase().includes(q) &&
        !g.id.toLowerCase().includes(q) &&
        !g.projectTitle.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (dateFilter && g.createdAt.slice(0, 10) !== dateFilter) return false;
      if (failedOnly && g.status !== "failed") return false;
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (stageFilter !== "all" && g.currentStage !== stageFilter) return false;
      if (durationFilter === "short" && g.durationSeconds > 60) return false;
      if (durationFilter === "medium" && (g.durationSeconds <= 60 || g.durationSeconds > 300)) {
        return false;
      }
      if (durationFilter === "long" && g.durationSeconds <= 300) return false;
      if (providerFilter !== "all" && !g.providersUsed.includes(providerFilter)) return false;
      return true;
    });
  }, [
    initialGenerations,
    userQuery,
    dateFilter,
    statusFilter,
    stageFilter,
    durationFilter,
    providerFilter,
    failedOnly,
  ]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Generation Monitoring
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            End-to-end 9-stage video generation observability, dynamic image counts, credit holds,
            and actual unit cost tracking.
          </p>
        </div>
        <Link
          href="/admin/generations/inspect"
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-[8px] bg-beevo-dark px-3.5 text-[12.5px] font-bold text-[#FFFDF7] hover:bg-[#2F2B25] sm:self-auto"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Open Inspector View
        </Link>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Live 9-stage generation job telemetry"
      />

      {/* Complete 9-Stage Beevo Pipeline Strip (Click to Filter Stage) */}
      <section
        aria-label="9-stage Beevo generation pipeline"
        className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[13.5px] font-extrabold text-beevo-ink">
            Beevo 9-Stage Pipeline Filter
          </h2>
          {stageFilter !== "all" && (
            <button
              type="button"
              onClick={() => setStageFilter("all")}
              className="text-[12px] font-bold text-beevo-honey-text hover:underline"
            >
              Clear stage filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-9">
          {ADMIN_PIPELINE_STAGES.map((stage) => {
            const active = stageFilter === stage.key;
            const stageCount = initialGenerations.filter((g) => g.currentStage === stage.key).length;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setStageFilter(active ? "all" : stage.key)}
                aria-pressed={active}
                className={`flex flex-col justify-between rounded-[8px] border p-2.5 text-left transition-colors ${
                  active
                    ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                    : "border-beevo-border bg-[#FAF8F3] text-beevo-ink hover:border-beevo-border-warm"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono text-[10px] font-extrabold ${
                      active ? "text-[#FFC928]" : "text-beevo-honey-text"
                    }`}
                  >
                    0{stage.order}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      active ? "text-white/80" : "text-beevo-muted"
                    }`}
                  >
                    {apiState === "connected" ? stageCount : "—"}
                  </span>
                </div>
                <span className="mt-1.5 text-[11.5px] font-bold leading-snug">{stage.label}</span>
                <span
                  className={`mt-0.5 text-[10px] ${active ? "text-white/65" : "text-beevo-muted"}`}
                >
                  {stage.provider}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Multi-Axis Operational Filters */}
      <section
        aria-label="Filter generation jobs"
        className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-beevo-muted">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Job Filters
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Filter by user, project, or generation ID"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="User, project, or generation ID..."
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-8 pr-3 text-[12.5px] text-beevo-ink focus:border-beevo-ink focus:bg-white"
            />
          </div>

          <input
            type="date"
            aria-label="Filter by creation date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 font-mono text-[12px] text-beevo-ink"
          />

          <select
            aria-label="Filter by generation status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | GenerationOverallStatus)}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Status: All</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            aria-label="Filter by duration bucket"
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value as typeof durationFilter)}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Duration: All</option>
            <option value="short">&le; 1 min</option>
            <option value="medium">1–5 min</option>
            <option value="long">5–10 min</option>
          </select>

          <select
            aria-label="Filter by AI or render provider"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Provider: All</option>
            <option value="OpenAI">OpenAI</option>
            <option value="fal.ai">fal.ai</option>
            <option value="ElevenLabs">ElevenLabs</option>
            <option value="FFmpeg">FFmpeg</option>
            <option value="Cloudflare R2">Cloudflare R2</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-beevo-border pt-2.5">
          <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-[12.5px] font-bold text-beevo-ink">
            <input
              type="checkbox"
              checked={failedOnly}
              onChange={(e) => setFailedOnly(e.target.checked)}
              className="h-4 w-4 accent-[#1B1916]"
            />
            Show failed generations only
          </label>
          <span className="font-mono text-[11.5px] font-semibold text-beevo-muted">
            {filtered.length} jobs matched
          </span>
        </div>
      </section>

      {/* 14-Column Operational Table (Desktop/Tablet scroll-isolated container) + Mobile Cards */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1040px] border-collapse text-left text-[12px]">
            <caption className="sr-only">Beevo video generation job telemetry table</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[10px] font-extrabold uppercase tracking-[0.04em] text-beevo-muted">
                <th scope="col" className="px-2.5 py-3">Generation ID</th>
                <th scope="col" className="px-2.5 py-3">User</th>
                <th scope="col" className="px-2.5 py-3">Project</th>
                <th scope="col" className="px-2.5 py-3 text-right">Duration</th>
                <th scope="col" className="px-2.5 py-3 text-right">Dynamic imgs</th>
                <th scope="col" className="px-2.5 py-3 text-right">Done imgs</th>
                <th scope="col" className="px-2.5 py-3">Voice</th>
                <th scope="col" className="px-2.5 py-3">Align</th>
                <th scope="col" className="px-2.5 py-3">Render</th>
                <th scope="col" className="px-2.5 py-3">Export</th>
                <th scope="col" className="px-2.5 py-3 text-right">Reserved cr</th>
                <th scope="col" className="px-2.5 py-3 text-right">Consumed cr</th>
                <th scope="col" className="px-2.5 py-3 text-right">Actual cost</th>
                <th scope="col" className="px-2.5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center">
                    <Activity className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No generation jobs recorded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Active, completed, and failed 9-stage video pipelines stream into this table
                      once Phase 4 workers connect.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-[#FAF8F3]/65">
                    <td className="px-3 py-3 font-mono font-bold text-beevo-ink">
                      <Link href={`/admin/generations/${g.id}`} className="underline underline-offset-2">
                        {g.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{g.userName}</td>
                    <td className="px-3 py-3 font-semibold text-beevo-ink">{g.projectTitle}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatDurationLabel(g.durationSeconds)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {g.dynamicImageCount ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{g.completedImageCount}</td>
                    <td className="px-3 py-3 capitalize">{g.voiceStatus}</td>
                    <td className="px-3 py-3 capitalize">{g.alignmentStatus}</td>
                    <td className="px-3 py-3 capitalize">{g.renderingStatus}</td>
                    <td className="px-3 py-3 capitalize">{g.exportStatus}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{g.reservedCredits}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {g.consumedCredits ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-beevo-ink">
                      {formatInrNullable(g.actualCostInr)}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-beevo-muted">
                      {g.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (< 768px) */}
        <div className="divide-y divide-beevo-border md:hidden">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Activity className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
              <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
                No generation jobs recorded yet
              </p>
              <p className="mt-1 text-[12.5px] text-beevo-muted">
                Live pipeline jobs appear here once Phase 4 workers connect.
              </p>
            </div>
          ) : (
            filtered.map((g) => (
              <article key={g.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/generations/${g.id}`}
                    className="font-mono text-[13px] font-extrabold text-beevo-ink underline"
                  >
                    {g.id}
                  </Link>
                  <span className="rounded-[6px] border border-beevo-border bg-[#FAF8F3] px-2 py-0.5 text-[11px] font-bold capitalize">
                    {g.status}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-beevo-ink">{g.projectTitle}</p>
                <dl className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <dt className="text-beevo-muted">Images (Done / Dynamic)</dt>
                    <dd className="font-semibold tabular-nums">
                      {g.completedImageCount} / {g.dynamicImageCount ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-beevo-muted">Actual Cost</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatInrNullable(g.actualCostInr)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
