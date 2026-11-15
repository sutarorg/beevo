import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Coins,
  Cpu,
  FileText,
  Image as ImageIcon,
  Layers,
  Mic,
  RefreshCw,
  ShieldAlert,
  Terminal,
  UserRound,
} from "lucide-react";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import { getAdminGenerationDetail } from "@/lib/admin-api";
import { ADMIN_PIPELINE_STAGES, formatInrNullable } from "@/lib/admin-types";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Generation Inspector",
  description:
    "Inspect operational script, storyboard, character references, images, voice alignment, render logs, retries, errors, and unit costs.",
  path: "/admin/generations/detail",
  noIndex: true,
});

export default async function AdminGenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = getAdminGenerationDetail(id);
  const job = response.data;

  const operationalPanels = [
    {
      title: "Original Idea & Prompt",
      icon: FileText,
      content: job?.originalIdea ?? null,
      empty: "Original user prompt loads only for authorized staff with an active Phase 4 record.",
    },
    {
      title: "Generated Script",
      icon: FileText,
      content: job?.scriptText ?? null,
      empty: "No script payload loaded for this generation ID.",
    },
    {
      title: "Dynamic Storyboard Scenes",
      icon: Layers,
      content: job && job.storyboardScenes.length > 0 ? `${job.storyboardScenes.length} scenes` : null,
      empty: "Scene-by-scene narration, image prompts, and frame statuses populate after storyboard persistence.",
    },
    {
      title: "Character References",
      icon: UserRound,
      content:
        job && job.characterReferences.length > 0
          ? `${job.characterReferences.length} character sheets`
          : null,
      empty: "Private R2 storage keys and fal.ai reference statuses appear here once generated.",
    },
    {
      title: "Scene Images",
      icon: ImageIcon,
      content: job ? `${job.completedImageCount} / ${job.dynamicImageCount ?? "Pending"}` : null,
      empty: "Scene illustrations stay strictly private and load via short-lived signed staff URLs in Phase 4.",
    },
    {
      title: "Voice Metadata & Alignment",
      icon: Mic,
      content: job?.voiceMetadata.voiceId ?? null,
      empty: "ElevenLabs model, voice ID, billable characters, audio duration, and word-alignment metrics appear here.",
    },
    {
      title: "Dynamic Timeline Segments",
      icon: Layers,
      content: job && job.timelineSegments.length > 0 ? `${job.timelineSegments.length} segments` : null,
      empty: "Computed scene start/end timestamps and transition definitions populate after alignment.",
    },
    {
      title: "FFmpeg Render Logs",
      icon: Terminal,
      content: job && job.renderLogs.length > 0 ? `${job.renderLogs.length} log entries` : null,
      empty: "Structured worker stdout/stderr log entries stream from FFmpeg render nodes in Phase 4.",
    },
    {
      title: "Retry Records",
      icon: RefreshCw,
      content: job && job.retryRecords.length > 0 ? `${job.retryRecords.length} retries` : null,
      empty: "Per-stage retry attempts, provider codes, and backoff timestamps appear here.",
    },
    {
      title: "Error Details",
      icon: AlertTriangle,
      content: job?.errorDetails?.message ?? null,
      empty: "No failure exception payload recorded for this generation ID.",
    },
    {
      title: "Credit Ledger References",
      icon: Coins,
      content:
        job && job.creditLedgerRefs.length > 0
          ? `${job.creditLedgerRefs.length} ledger rows`
          : null,
      empty: "Reservation, deduction, release, and refund transaction IDs link directly to /admin/credits.",
    },
    {
      title: "Provider Cost Records",
      icon: Cpu,
      content: job ? formatInrNullable(job.actualCostInr) : null,
      empty: "Per-provider OpenAI, fal.ai, ElevenLabs, FFmpeg, and R2 cost records load with Actual vs Estimate tags.",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/generations"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Generations
        </Link>
        <span className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 font-mono text-[11.5px] font-semibold text-beevo-muted">
          Generation ID: {id}
        </span>
      </div>

      {/* Staff Authorization & Sensitive Content Notice */}
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50/75 px-4 py-3 text-[12.5px] leading-relaxed text-amber-950"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" />
        <p>
          <strong>Authorized Staff Inspection Only:</strong> Sensitive user content (prompts,
          scripts, generated frames, voice tracks, and render logs) is protected by server-side
          Supabase RBAC &amp; RLS. Every Phase 4 read automatically records an immutable entry in{" "}
          <span className="font-mono">/admin/audit-logs</span>.
        </p>
      </div>

      <AdminStatusGuard
        state={response.state}
        error={response.error}
        contextLabel={`Generation operational dossier for ${id}`}
        compact
      />

      {/* Pipeline Stage Progress Strip */}
      <section className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-[19px] font-extrabold text-beevo-ink">
              {job ? job.projectTitle : `Generation Dossier · ${id}`}
            </h1>
            <p className="text-[12.5px] text-beevo-muted">
              9-stage execution checkpoint record across OpenAI, fal.ai, ElevenLabs, FFmpeg, and R2.
            </p>
          </div>
          <span className="rounded-[6px] border border-beevo-border bg-[#FAF8F3] px-2.5 py-1 text-[11.5px] font-bold capitalize text-beevo-muted">
            {job ? job.status : "Unloaded"}
          </span>
        </div>

        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-9">
          {ADMIN_PIPELINE_STAGES.map((stage) => (
            <li
              key={stage.key}
              className="rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 py-2"
            >
              <span className="font-mono text-[10px] font-extrabold text-beevo-honey-text">
                0{stage.order}
              </span>
              <p className="mt-0.5 text-[11.5px] font-bold text-beevo-ink">{stage.label}</p>
              <p className="text-[10px] text-beevo-muted">{stage.provider}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 12 Operational Telemetry Panels */}
      <section aria-label="Operational record panels" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {operationalPanels.map((panel) => {
          const Icon = panel.icon;
          return (
            <article
              key={panel.title}
              className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
            >
              <div className="flex items-center gap-2 border-b border-beevo-border pb-2.5">
                <Icon className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                <h2 className="font-display text-[14px] font-extrabold text-beevo-ink">
                  {panel.title}
                </h2>
              </div>
              <div className="mt-3 text-[12.5px] leading-relaxed text-beevo-body">
                {panel.content ? (
                  <p className="whitespace-pre-wrap">{panel.content}</p>
                ) : (
                  <p className="rounded-[8px] border border-dashed border-beevo-border bg-[#FAF8F3]/75 px-3 py-3 text-beevo-muted">
                    {panel.empty}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
