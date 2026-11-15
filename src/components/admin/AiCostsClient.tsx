"use client";

import React, { useState } from "react";
import {
  Cpu,
  HardDrive,
  Image as ImageIcon,
  Mic,
  Server,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AdminDateRangeBar } from "@/components/admin/AdminDateRangeBar";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import {
  computeDateRange,
  formatBytesNullable,
  formatInrNullable,
  formatNumberNullable,
  formatPercentNullable,
  type AdminAiCostsSnapshot,
  type AdminApiError,
  type AdminApiState,
  type AdminDateRange,
  type BillingSourceKind,
} from "@/lib/admin-types";

interface AiCostsClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  snapshot: AdminAiCostsSnapshot;
}

function BillingSourceBadge({ source }: { source: BillingSourceKind }) {
  if (source === "actual") {
    return (
      <span className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-emerald-800">
        Actual Provider Billing
      </span>
    );
  }
  if (source === "estimated") {
    return (
      <span className="rounded-[5px] border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-amber-900">
        Calculated Estimate
      </span>
    );
  }
  return (
    <span className="rounded-[5px] border border-beevo-border bg-[#FAF8F3] px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-beevo-muted">
      Billing Feed Unconnected
    </span>
  );
}

export function AiCostsClient({ apiState, apiError, snapshot }: AiCostsClientProps) {
  const [dateRange, setDateRange] = useState<AdminDateRange>(() => computeDateRange("30d"));
  const { openai, falAi, elevenLabs, ffmpeg, r2Storage, profitability } = snapshot;

  const providers: {
    name: string;
    subtitle: string;
    source: BillingSourceKind;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    rows: { label: string; value: string }[];
  }[] = [
    {
      name: "OpenAI",
      subtitle: "Scriptwriting & dynamic storyboard token usage",
      source: openai.billingSource,
      icon: Sparkles,
      rows: [
        { label: "Active model", value: openai.model ?? "—" },
        { label: "Input tokens", value: formatNumberNullable(openai.inputTokens) },
        { label: "Output tokens", value: formatNumberNullable(openai.outputTokens) },
        { label: "Script expenditure", value: formatInrNullable(openai.scriptExpenditureInr) },
        {
          label: "Storyboard expenditure",
          value: formatInrNullable(openai.storyboardExpenditureInr),
        },
        { label: "Cost per project", value: formatInrNullable(openai.costPerProjectInr) },
      ],
    },
    {
      name: "fal.ai",
      subtitle: "Character reference & cartoon scene illustration requests",
      source: falAi.billingSource,
      icon: ImageIcon,
      rows: [
        { label: "Image model", value: falAi.imageModel ?? "—" },
        { label: "Image requests", value: formatNumberNullable(falAi.imageRequests) },
        { label: "Completed images", value: formatNumberNullable(falAi.completedImages) },
        { label: "Failed images", value: formatNumberNullable(falAi.failedImages) },
        { label: "Regenerated images", value: formatNumberNullable(falAi.regeneratedImages) },
        { label: "Resolution", value: falAi.resolutionSummary ?? "—" },
        { label: "Cost per image", value: formatInrNullable(falAi.costPerImageInr) },
        {
          label: "Avg images / finished min",
          value:
            falAi.avgImagesPerFinishedMinute !== null
              ? falAi.avgImagesPerFinishedMinute.toFixed(1)
              : "—",
        },
        {
          label: "Total API expenditure",
          value: formatInrNullable(falAi.totalApiExpenditureInr),
        },
      ],
    },
    {
      name: "ElevenLabs",
      subtitle: "Narration synthesis & alignment character metering",
      source: elevenLabs.billingSource,
      icon: Mic,
      rows: [
        { label: "Voice model", value: elevenLabs.voiceModel ?? "—" },
        { label: "Voice IDs used", value: formatNumberNullable(elevenLabs.voiceIdsUsed) },
        { label: "Billable characters", value: formatNumberNullable(elevenLabs.billableCharacters) },
        {
          label: "Generated audio duration",
          value:
            elevenLabs.generatedAudioSeconds !== null
              ? `${(elevenLabs.generatedAudioSeconds / 60).toFixed(1)} min`
              : "—",
        },
        { label: "Cost per project", value: formatInrNullable(elevenLabs.costPerProjectInr) },
        {
          label: "Cost per finished minute",
          value: formatInrNullable(elevenLabs.costPerFinishedMinuteInr),
        },
      ],
    },
    {
      name: "FFmpeg Compute Workers",
      subtitle: "Camera motion, caption burn-in, audio mix & MP4 encoding",
      source: ffmpeg.billingSource,
      icon: Server,
      rows: [
        {
          label: "Worker runtime",
          value:
            ffmpeg.workerRuntimeSeconds !== null
              ? `${(ffmpeg.workerRuntimeSeconds / 60).toFixed(1)} min`
              : "—",
        },
        {
          label: "Avg render duration",
          value: formatNumberNullable(ffmpeg.avgRenderDurationSeconds, "s"),
        },
        {
          label: "Output video duration",
          value:
            ffmpeg.totalOutputDurationSeconds !== null
              ? `${(ffmpeg.totalOutputDurationSeconds / 60).toFixed(1)} min`
              : "—",
        },
        { label: "Failed jobs", value: formatNumberNullable(ffmpeg.failedJobs) },
        {
          label: "CPU / Memory utilization",
          value:
            ffmpeg.avgCpuPct !== null && ffmpeg.avgMemoryMb !== null
              ? `${ffmpeg.avgCpuPct.toFixed(0)}% CPU · ${ffmpeg.avgMemoryMb} MB`
              : "—",
        },
        {
          label: "Actual compute expense",
          value: formatInrNullable(ffmpeg.actualComputeExpenseInr),
        },
      ],
    },
    {
      name: "Cloudflare R2 Storage",
      subtitle: "Private illustration, narration audio, and finished MP4 storage",
      source: r2Storage.billingSource,
      icon: HardDrive,
      rows: [
        { label: "Image volume", value: formatBytesNullable(r2Storage.imageVolumeBytes) },
        { label: "Audio volume", value: formatBytesNullable(r2Storage.audioVolumeBytes) },
        { label: "Video volume", value: formatBytesNullable(r2Storage.videoVolumeBytes) },
        { label: "Object counts", value: formatNumberNullable(r2Storage.objectCount) },
        { label: "Storage costs", value: formatInrNullable(r2Storage.storageCostInr) },
        { label: "Access activity (ops)", value: formatNumberNullable(r2Storage.accessOperations) },
      ],
    },
  ];

  const profitabilityRows: { label: string; value: string; formula: string; highlight?: boolean }[] = [
    {
      label: "Gross Revenue",
      value: formatInrNullable(profitability.grossRevenueInr),
      formula: "Captured Razorpay receipts (gross)",
    },
    {
      label: "Revenue (ex. configured taxes)",
      value: formatInrNullable(profitability.revenueExTaxInr),
      formula: "(Gross revenue − Refunds) ÷ (1 + configured GST rate)",
    },
    {
      label: "Payment Gateway Fees",
      value: formatInrNullable(profitability.paymentFeesInr),
      formula: "Actual Razorpay transaction fees + GST on fee",
    },
    {
      label: "AI API Costs",
      value: formatInrNullable(profitability.aiCostsInr),
      formula: "OpenAI + fal.ai + ElevenLabs",
    },
    {
      label: "Rendering Costs",
      value: formatInrNullable(profitability.renderingCostsInr),
      formula: "FFmpeg worker compute expenditure",
    },
    {
      label: "Storage Costs",
      value: formatInrNullable(profitability.storageCostsInr),
      formula: "Cloudflare R2 volume + Class A/B operations",
    },
    {
      label: "Total Variable Cost",
      value: formatInrNullable(profitability.variableCostInr),
      formula: "Payment fees + AI costs + Rendering + Storage",
    },
    {
      label: "Contribution (INR)",
      value: formatInrNullable(profitability.contributionInr),
      formula: "Revenue (ex. tax) − Total variable cost",
      highlight: true,
    },
    {
      label: "Contribution Margin (%)",
      value: formatPercentNullable(profitability.contributionMarginPct),
      formula: "Contribution ÷ Revenue (ex. tax) × 100",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            AI Cost Analytics &amp; Unit Economics
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Provider-level expenditure across OpenAI, fal.ai, ElevenLabs, FFmpeg, and Cloudflare R2
            reconciled into contribution margin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <BillingSourceBadge source="actual" />
          <BillingSourceBadge source="estimated" />
        </div>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="AI provider billing logs and profitability calculations"
      />

      <AdminDateRangeBar value={dateRange} onChange={setDateRange} />

      {/* Profitability & Contribution Margin Panel */}
      <section
        aria-labelledby="profitability-heading"
        className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border bg-[#FAF8F3] px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
            <div>
              <h2
                id="profitability-heading"
                className="font-display text-[15px] font-extrabold text-beevo-ink"
              >
                Profitability &amp; Contribution Margin Statement
              </h2>
              <p className="text-[12px] text-beevo-muted">
                Missing billing feeds render as &ldquo;—&rdquo; instead of zero to prevent inflated
                margin illusions.
              </p>
            </div>
          </div>
          <BillingSourceBadge source={profitability.billingSource} />
        </div>

        <div className="divide-y divide-beevo-border">
          {profitabilityRows.map((row) => (
            <div
              key={row.label}
              className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px] ${
                row.highlight ? "bg-[#FAF6E8]/70 font-extrabold" : ""
              }`}
            >
              <div>
                <p className="font-bold text-beevo-ink">{row.label}</p>
                <p className="text-[11.5px] font-normal text-beevo-muted">{row.formula}</p>
              </div>
              <span className="font-display text-[16px] font-extrabold tabular-nums text-beevo-ink">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Provider Breakdown Cards */}
      <section aria-labelledby="providers-breakdown-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
          <h2
            id="providers-breakdown-heading"
            className="font-display text-[16px] font-extrabold text-beevo-ink"
          >
            Provider Telemetry Breakdown ({dateRange.from} &rarr; {dateRange.to})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {providers.map((provider, idx) => {
            const Icon = provider.icon;
            const isFullWidth = idx === providers.length - 1;
            return (
              <article
                key={provider.name}
                className={`overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)] ${
                  isFullWidth ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-beevo-border bg-[#FAF8F3] px-4 py-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden={true} />
                    <div className="min-w-0">
                      <h3 className="font-display text-[14.5px] font-extrabold text-beevo-ink">
                        {provider.name}
                      </h3>
                      <p className="text-[11.5px] text-beevo-muted">{provider.subtitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <BillingSourceBadge source={provider.source} />
                  </div>
                </div>

                <dl
                  className={
                    isFullWidth
                      ? "grid grid-cols-1 divide-y divide-beevo-border/80 px-4 text-[12.5px] sm:grid-cols-2 sm:gap-x-8"
                      : "divide-y divide-beevo-border/80 px-4 text-[12.5px]"
                  }
                >
                  {provider.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <dt className="font-medium text-beevo-muted">{row.label}</dt>
                      <dd className="font-bold tabular-nums text-beevo-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
