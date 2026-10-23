"use client";

import {
  AlertTriangle,
  BadgePercent,
  Banknote,
  Clapperboard,
  GraduationCap,
  IndianRupee,
  Landmark,
  ReceiptText,
  Scale,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDateTime } from "@/lib/utils";
import { EventIcon } from "@/components/admin/ui";
import {
  CardListSkeleton,
  FailedState,
  PageHeader,
  StatCard,
  StatGridSkeleton,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getDashboard()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );

  return (
    <div>
      <PageHeader title="Platform overview" sub="A live picture of the whole business. Every figure derives from settled orders and payouts.">
      </PageHeader>

      {state.status === "loading" || state.status === "idle" ? (
        <div className="space-y-5">
          <StatGridSkeleton count={8} />
          <CardListSkeleton count={3} />
        </div>
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<ShieldCheck className="size-4.5" aria-hidden="true" />} label="Creators" value={String(state.data.kpis.creators)} />
            <StatCard icon={<GraduationCap className="size-4.5" aria-hidden="true" />} label="Learners" value={String(state.data.kpis.learners)} />
            <StatCard icon={<Clapperboard className="size-4.5" aria-hidden="true" />} label="Published courses" value={String(state.data.kpis.publishedCourses)} />
            <StatCard icon={<ReceiptText className="size-4.5" aria-hidden="true" />} label="Confirmed sales" value={String(state.data.kpis.confirmedSales)} />
            <StatCard icon={<IndianRupee className="size-4.5" aria-hidden="true" />} label="Gross revenue" value={formatINR(state.data.kpis.grossInPaise)} />
            <StatCard icon={<BadgePercent className="size-4.5" aria-hidden="true" />} label="Platform commission (8%)" value={formatINR(state.data.kpis.commissionInPaise)} />
            <StatCard icon={<Scale className="size-4.5" aria-hidden="true" />} label="Pending reconciliation" value={formatINR(state.data.kpis.pendingReconciliationInPaise)} hint="Paid orders not yet settled" />
            <StatCard icon={<Landmark className="size-4.5" aria-hidden="true" />} label="Outstanding earnings" value={formatINR(state.data.kpis.outstandingEarningsInPaise)} hint={`${state.data.kpis.pendingPayouts} payout records pending · ${formatINR(state.data.kpis.pendingPayoutsInPaise)}`} />
          </div>

          {/* Watchlist */}
          <div className="grid gap-5 lg:grid-cols-2">
            <section aria-labelledby="watch" className="rounded-3xl border-2 border-accent-deep bg-accent/5 p-5">
              <h2 id="watch" className="flex items-center gap-2 text-base font-bold text-accent-deep">
                <TriangleAlert className="size-4.5" aria-hidden="true" />
                Needs attention
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-center justify-between rounded-xl border-2 border-ink bg-white px-3.5 py-2.5">
                  <span className="font-semibold text-ink">Failed payment events</span>
                  <span className="font-bold tabular-nums">{state.data.kpis.failedPaymentEvents}</span>
                </li>
                <li className="flex items-center justify-between rounded-xl border-2 border-ink bg-white px-3.5 py-2.5">
                  <span className="font-semibold text-ink">Pending payout records</span>
                  <span className="font-bold tabular-nums">
                    {state.data.kpis.pendingPayouts} · {formatINR(state.data.kpis.pendingPayoutsInPaise)}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-xl border-2 border-ink bg-white px-3.5 py-2.5">
                  <span className="font-semibold text-ink">Reconciliation to clear</span>
                  <span className="font-bold tabular-nums">{formatINR(state.data.kpis.pendingReconciliationInPaise)}</span>
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/admin/payments" variant="outline" size="sm">
                  <Banknote className="size-4" aria-hidden="true" />
                  Review payments
                </Button>
                <Button href="/admin/payouts" variant="outline" size="sm">
                  <Landmark className="size-4" aria-hidden="true" />
                  Process payouts
                </Button>
              </div>
            </section>

            <section aria-labelledby="recent" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
              <div className="flex items-center justify-between">
                <h2 id="recent" className="flex items-center gap-2 text-base font-bold text-ink">
                  <AlertTriangle className="size-4.5 text-accent" aria-hidden="true" />
                  Latest events
                </h2>
                <Button href="/admin/audit-logs" variant="outline" size="sm">
                  Audit logs
                </Button>
              </div>
              <ul className="mt-4 space-y-2.5">
                {state.data.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-2.5 rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5">
                    <EventIcon kind={event.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed text-ink">{event.detail}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-smoke">
                        {event.actor} · {formatDateTime(event.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-smoke">
                <UsersRound className="size-3" aria-hidden="true" />
                Every admin action appends to the audit trail automatically.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
