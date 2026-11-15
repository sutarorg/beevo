"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronDown,
  Info,
  Layers,
  ReceiptText,
  Users,
} from "lucide-react";
import { AdminDateRangeBar } from "@/components/admin/AdminDateRangeBar";
import { AdminMetricChart } from "@/components/admin/AdminMetricChart";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import {
  computeDateRange,
  formatInrNullable,
  formatNumberNullable,
  formatPercentNullable,
  type AdminApiError,
  type AdminApiState,
  type AdminDateRange,
  type AdminOverviewSnapshot,
} from "@/lib/admin-types";

interface OverviewClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  snapshot: AdminOverviewSnapshot;
}

interface MetricRowSpec {
  id: string;
  label: string;
  value: string;
  formula: string;
  unitBadge?: "INR" | "%";
}

export function OverviewClient({ apiState, apiError, snapshot }: OverviewClientProps) {
  const [dateRange, setDateRange] = useState<AdminDateRange>(() => computeDateRange("30d"));
  const [showFormulas, setShowFormulas] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const { metrics, charts, recentActivity } = snapshot;
  const dateLabel = `${dateRange.from} – ${dateRange.to}`;

  const metricBands: { title: string; subtitle: string; items: MetricRowSpec[] }[] = [
    {
      title: "Accounts & Projects",
      subtitle: "Verified workspace registrations and active creator output",
      items: [
        {
          id: "totalUsers",
          label: "Total users",
          value: formatNumberNullable(metrics.totalUsers),
          formula: "COUNT(profiles)",
        },
        {
          id: "newUsers",
          label: "New users",
          value: formatNumberNullable(metrics.newUsers),
          formula: "COUNT(profiles WHERE created_at IN range)",
        },
        {
          id: "activeUsers",
          label: "Active users",
          value: formatNumberNullable(metrics.activeUsers),
          formula: "COUNT(DISTINCT user_id FROM generations ∪ projects IN range)",
        },
        {
          id: "totalProjects",
          label: "Total projects",
          value: formatNumberNullable(metrics.totalProjects),
          formula: "COUNT(projects WHERE created_at IN range)",
        },
      ],
    },
    {
      title: "Production Pipeline Volume",
      subtitle: "Verified MP4 exports, failures, runtime minutes, and fal.ai image requests",
      items: [
        {
          id: "completedVideos",
          label: "Completed videos",
          value: formatNumberNullable(metrics.completedVideos),
          formula: "COUNT(generations WHERE status='completed' AND r2_verified=true)",
        },
        {
          id: "failedGenerations",
          label: "Failed generations",
          value: formatNumberNullable(metrics.failedGenerations),
          formula: "COUNT(generations WHERE status='failed' IN range)",
        },
        {
          id: "totalGeneratedMinutes",
          label: "Total generated minutes",
          value: formatNumberNullable(metrics.totalGeneratedMinutes, " min"),
          formula: "SUM(actual_duration_seconds) / 60 across verified renders",
        },
        {
          id: "totalImageRequests",
          label: "Total image requests",
          value: formatNumberNullable(metrics.totalImageRequests),
          formula: "COUNT(fal_image_requests) including initial, retries & regenerations",
        },
      ],
    },
    {
      title: "Credit Economy",
      subtitle: "Immutable double-entry credit supply, consumption, and active job holds",
      items: [
        {
          id: "creditsIssued",
          label: "Credits issued",
          value: formatNumberNullable(metrics.creditsIssued, " cr"),
          formula: "SUM(credits WHERE type IN ('purchase', 'admin_adjustment_add'))",
        },
        {
          id: "creditsConsumed",
          label: "Credits consumed",
          value: formatNumberNullable(metrics.creditsConsumed, " cr"),
          formula: "SUM(ABS(credits) WHERE type = 'deduction')",
        },
        {
          id: "reservedCredits",
          label: "Reserved credits",
          value: formatNumberNullable(metrics.reservedCredits, " cr"),
          formula: "SUM(credits WHERE type = 'reservation' AND settled_at IS NULL)",
        },
      ],
    },
    {
      title: "Financials & Contribution Margin",
      subtitle: "Razorpay receipts reconciled against AI provider and worker compute spend",
      items: [
        {
          id: "grossPaymentReceiptsInr",
          label: "Gross payment receipts",
          value: formatInrNullable(metrics.grossPaymentReceiptsInr),
          formula: "SUM(razorpay_captured_paise) / 100",
          unitBadge: "INR",
        },
        {
          id: "netRevenueExTaxInr",
          label: "Net revenue (ex. tax)",
          value: formatInrNullable(metrics.netRevenueExTaxInr),
          formula: "(Gross receipts − Refunds) / (1 + configured_tax_rate)",
          unitBadge: "INR",
        },
        {
          id: "providerExpenditureInr",
          label: "Provider expenditure",
          value: formatInrNullable(metrics.providerExpenditureInr),
          formula: "OpenAI + fal.ai + ElevenLabs + R2 actual billed spend",
          unitBadge: "INR",
        },
        {
          id: "renderingExpenditureInr",
          label: "Rendering expenditure",
          value: formatInrNullable(metrics.renderingExpenditureInr),
          formula: "SUM(ffmpeg_worker_compute_cost_inr)",
          unitBadge: "INR",
        },
        {
          id: "contributionMarginPct",
          label: "Contribution margin",
          value: formatPercentNullable(metrics.contributionMarginPct),
          formula: "(Net revenue − Payment fees − Provider − Render − Storage) / Net revenue × 100",
          unitBadge: "%",
        },
      ],
    },
  ];

  const filteredActivity =
    activityFilter === "all"
      ? recentActivity
      : recentActivity.filter((ev) => ev.category === activityFilter);

  return (
    <div className="space-y-6">
      {/* Compact Operational Title Area */}
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Operational Overview
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Verified user growth, 9-stage production volume, credit supply, and unit economics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFormulas((prev) => !prev)}
          aria-expanded={showFormulas}
          className="inline-flex min-h-[38px] items-center gap-1.5 self-start rounded-[8px] border border-beevo-border bg-white px-3 text-[12px] font-bold text-beevo-ink hover:bg-[#FAF8F3] sm:self-auto"
        >
          <Info className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
          <span>{showFormulas ? "Hide Metric Formulas" : "Inspect Metric Formulas"}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-beevo-muted transition-transform ${
              showFormulas ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Overview KPIs, financial rollups, and trend charts"
      />

      {/* Date Range Selector */}
      <AdminDateRangeBar value={dateRange} onChange={setDateRange} />

      {/* Structured 16-KPI Operational Bands (Compact, Restrained, Missing != Zero) */}
      <section aria-label="Operational KPI summary" className="space-y-4">
        {metricBands.map((band) => (
          <div
            key={band.title}
            className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border bg-[#FAF8F3] px-4 py-2.5">
              <div>
                <h2 className="font-display text-[13px] font-extrabold text-beevo-ink">
                  {band.title}
                </h2>
                <p className="text-[11.5px] text-beevo-muted">{band.subtitle}</p>
              </div>
              <span className="font-mono text-[11px] font-semibold text-beevo-muted">
                {dateLabel}
              </span>
            </div>

            <div
              className={`grid grid-cols-1 divide-y divide-beevo-border sm:grid-cols-2 sm:divide-y-0 ${
                band.items.length === 3
                  ? "lg:grid-cols-3 lg:divide-x"
                  : band.items.length === 5
                    ? "lg:grid-cols-5 lg:divide-x"
                    : "lg:grid-cols-4 lg:divide-x"
              }`}
            >
              {band.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between p-4 sm:border-b sm:border-beevo-border sm:odd:border-r lg:border-b-0 lg:odd:border-r-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] font-semibold text-beevo-muted">
                      {item.label}
                    </span>
                    {item.unitBadge && (
                      <span className="rounded-[4px] border border-beevo-border bg-[#FAF8F3] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-beevo-muted">
                        {item.unitBadge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-[22px] font-extrabold leading-none tabular-nums text-beevo-ink">
                    {item.value}
                  </p>
                  {showFormulas ? (
                    <p className="mt-2 rounded-[6px] bg-[#FAF8F3] px-2 py-1 font-mono text-[10.5px] leading-snug text-beevo-body">
                      {item.formula}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-beevo-muted">
                      {item.value === "—" ? "Data unavailable (not zero)" : "Verified backend sum"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 8 Restrained Operational & Financial Trend Charts */}
      <section aria-labelledby="admin-charts-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="admin-charts-heading"
              className="font-display text-[16px] font-extrabold tracking-[-0.02em] text-beevo-ink"
            >
              Operational &amp; Cost Trends
            </h2>
            <p className="text-[12.5px] text-beevo-muted">
              Time-series charts bind directly to backend billing and pipeline logs—zero simulated
              curves.
            </p>
          </div>
          <Link
            href="/admin/ai-costs"
            className="text-[12.5px] font-bold text-beevo-honey-text hover:underline"
          >
            Open AI Cost Analytics &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminMetricChart
            title="Revenue Over Time"
            unit="₹ INR"
            dateRangeLabel={dateLabel}
            data={charts.revenueOverTime}
            variant="line"
            primaryLabel="Captured Revenue"
          />
          <AdminMetricChart
            title="Generated Video Minutes"
            unit="min"
            dateRangeLabel={dateLabel}
            data={charts.generatedVideoMinutes}
            variant="bar"
            primaryLabel="Verified Output"
          />
          <AdminMetricChart
            title="New Users"
            unit="users"
            dateRangeLabel={dateLabel}
            data={charts.newUsers}
            variant="bar"
            primaryLabel="Registrations"
          />
          <AdminMetricChart
            title="Credit Consumption"
            unit="credits"
            dateRangeLabel={dateLabel}
            data={charts.creditConsumption}
            variant="bar"
            primaryLabel="Deducted Credits"
          />
          <AdminMetricChart
            title="Image-Generation Costs (fal.ai)"
            unit="₹ INR"
            dateRangeLabel={dateLabel}
            data={charts.imageGenerationCosts}
            variant="line"
            primaryLabel="Image Spend"
          />
          <AdminMetricChart
            title="Voice-Generation Costs (ElevenLabs)"
            unit="₹ INR"
            dateRangeLabel={dateLabel}
            data={charts.voiceGenerationCosts}
            variant="line"
            primaryLabel="Voice Spend"
          />
          <AdminMetricChart
            title="Rendering Expenses (FFmpeg Workers)"
            unit="₹ INR"
            dateRangeLabel={dateLabel}
            data={charts.renderingExpenses}
            variant="bar"
            primaryLabel="Compute Spend"
          />
          <AdminMetricChart
            title="Generation Success & Failure"
            unit="jobs"
            dateRangeLabel={dateLabel}
            data={charts.generationOutcomes}
            variant="dual-bar"
            primaryLabel="Completed"
            secondaryLabel="Failed"
          />
        </div>
      </section>

      {/* Genuine Recent Activity Stream */}
      <section
        aria-labelledby="recent-activity-heading"
        className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-beevo-border bg-[#FAF8F3] px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <h2
              id="recent-activity-heading"
              className="font-display text-[15px] font-extrabold text-beevo-ink"
            >
              Recent Operational Activity
            </h2>
            <p className="text-[12px] text-beevo-muted">
              Genuine registrations, Razorpay receipts, completed or failed jobs, credit
              adjustments, and refunds.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter recent activity"
            className="flex flex-wrap gap-1.5"
          >
            {[
              { id: "all", label: "All" },
              { id: "registration", label: "Signups" },
              { id: "payment", label: "Payments" },
              { id: "generation_completed", label: "Completed" },
              { id: "generation_failed", label: "Failed" },
              { id: "credit_adjustment", label: "Adjustments" },
              { id: "refund", label: "Refunds" },
            ].map((chip) => {
              const active = activityFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActivityFilter(chip.id)}
                  aria-pressed={active}
                  className={`min-h-[32px] rounded-[7px] border px-2.5 text-[11.5px] font-bold transition-colors ${
                    active
                      ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                      : "border-beevo-border bg-white text-beevo-body hover:bg-beevo-canvas"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredActivity.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Activity className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
            <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
              No operational events recorded yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-beevo-muted">
              Live events appear here only when real users register, complete Razorpay orders, run
              generations, or when authorized staff post audited adjustments.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/admin/users"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3.5 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
              >
                <Users className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                Users Directory
              </Link>
              <Link
                href="/admin/generations"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3.5 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
              >
                <Layers className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                Generation Monitor
              </Link>
              <Link
                href="/admin/audit-logs"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3.5 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
              >
                <ReceiptText className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                Audit Logs
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-beevo-border">
            {filteredActivity.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px]"
              >
                <div className="min-w-0">
                  <p className="font-bold text-beevo-ink">{ev.summary}</p>
                  <p className="text-[12px] text-beevo-muted">
                    {ev.actorOrUser} &middot; <span className="font-mono">{ev.referenceId}</span>
                  </p>
                </div>
                <span className="font-mono text-[11.5px] text-beevo-muted">{ev.timestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
