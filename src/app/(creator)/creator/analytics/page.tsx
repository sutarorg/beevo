"use client";

import { ChartColumn, IndianRupee, ReceiptText, TrendingUp, UserRoundPlus } from "lucide-react";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { MiniBars, TrendLine } from "@/components/creator/charts";
import {
  CardListSkeleton,
  FailedState,
  PageHeader,
  StatCard,
  StatusChip,
} from "@/components/creator/ui";

export default function CreatorAnalyticsPage() {
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getAnalytics()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );

  return (
    <div>
      <PageHeader
        title="Analytics"
        sub="Sales and enrolment trends across your courses."
      />

      {state.status === "loading" || state.status === "idle" ? (
        <div className="space-y-5">
          <CardListSkeleton count={2} />
        </div>
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<IndianRupee className="size-4.5" aria-hidden="true" />}
              label="Gross · 30 days"
              value={formatINR(state.data.overview.grossLast30dInPaise)}
            />
            <StatCard
              icon={<ReceiptText className="size-4.5" aria-hidden="true" />}
              label="Orders · 30 days"
              value={String(state.data.overview.ordersLast30d)}
            />
            <StatCard
              icon={<UserRoundPlus className="size-4.5" aria-hidden="true" />}
              label="Enrolments · 30 days"
              value={String(state.data.overview.enrollmentsLast30d)}
            />
            <StatCard
              icon={<TrendingUp className="size-4.5" aria-hidden="true" />}
              label="Avg. order value"
              value={
                state.data.overview.ordersLast30d > 0
                  ? formatINR(Math.round(state.data.overview.grossLast30dInPaise / state.data.overview.ordersLast30d))
                  : "—"
              }
            />
          </div>

          <section aria-labelledby="sales-chart" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <h2 id="sales-chart" className="flex items-center gap-2 text-base font-bold text-ink">
              <ChartColumn className="size-4.5 text-accent" aria-hidden="true" />
              Weekly gross — last 8 weeks
            </h2>
            <MiniBars
              className="mt-5"
              points={state.data.salesSeries.map((point) => ({ label: point.label, value: point.grossInPaise }))}
            />
            <p className="mt-3 text-[11px] text-smoke">
              Hover or focus a bar for the exact weekly gross.
            </p>
          </section>

          <section aria-labelledby="enrol-chart" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <h2 id="enrol-chart" className="text-base font-bold text-ink">Enrolments — last 8 weeks</h2>
            <TrendLine
              className="mt-5"
              points={state.data.enrollmentSeries.map((point) => ({ label: point.label, value: point.enrollments }))}
            />
          </section>

          <section aria-labelledby="perf-table" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <h2 id="perf-table" className="mb-4 text-base font-bold text-ink">Course performance</h2>
            <ul className="space-y-2.5">
              {state.data.performance.length === 0 ? (
                <li className="rounded-xl border-2 border-dashed border-ink/25 bg-cream px-4 py-6 text-center text-sm text-smoke">
                  No course performance yet — publish a course to start collecting sales.
                </li>
              ) : null}
              {state.data.performance.map((row, index) => {
                const max = state.data.performance[0]?.grossInPaise || 1;
                return (
                  <li key={row.courseId} className="rounded-2xl border-2 border-ink/10 bg-cream p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-editorial text-lg text-accent italic">{index + 1}.</span>
                        <p className="text-sm font-bold text-ink">{row.title}</p>
                      </div>
                      <StatusChip status={row.status} />
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
                      <div className="h-full bg-accent" style={{ width: `${Math.max(4, (row.grossInPaise / max) * 100)}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-smoke">
                      <span>
                        {row.sales} sales · {row.enrollments} enrolments
                      </span>
                      <span>
                        <span className="font-bold text-ink tabular-nums">{formatINR(row.grossInPaise)}</span> gross ·{" "}
                        <span className="font-bold text-moss tabular-nums">{formatINR(row.shareInPaise)}</span> yours
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-smoke">
              “Yours” is the 92% creator share after the 8% platform commission, computed from the
              same commission rule used at checkout.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
