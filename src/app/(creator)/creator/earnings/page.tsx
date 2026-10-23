"use client";

import { BadgePercent, IndianRupee, Landmark, LifeBuoy, PiggyBank, Wallet } from "lucide-react";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { formatDate } from "@/lib/utils";
import {
  CardListSkeleton,
  DemoChip,
  FailedState,
  PageHeader,
  StatCard,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";

export default function CreatorEarningsPage() {
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getEarnings()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );

  return (
    <div>
      <PageHeader
        title="Earnings"
        sub="Your money, transparently: gross, the 8% commission, your 92% share, and payout records."
      >
        <DemoChip />
      </PageHeader>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={3} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<IndianRupee className="size-4.5" aria-hidden="true" />}
              label="Gross, all time"
              value={formatINR(state.data.summary.grossInPaise)}
              demo
            />
            <StatCard
              icon={<BadgePercent className="size-4.5" aria-hidden="true" />}
              label="Platform fees (8%)"
              value={formatINR(state.data.summary.platformFeesInPaise)}
              demo
            />
            <StatCard
              icon={<PiggyBank className="size-4.5" aria-hidden="true" />}
              label="Your share (92%)"
              value={formatINR(state.data.summary.creatorShareInPaise)}
              demo
            />
            <StatCard
              icon={<Wallet className="size-4.5" aria-hidden="true" />}
              label="Available balance"
              value={formatINR(state.data.summary.availableInPaise)}
              hint="Share minus recorded payouts"
              demo
            />
          </div>

          <section aria-labelledby="payouts" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="payouts" className="flex items-center gap-2 text-base font-bold text-ink">
                <Landmark className="size-4.5 text-accent" aria-hidden="true" />
                Payout records
              </h2>
              <DemoChip />
            </div>
            {state.data.payouts.length === 0 ? (
              <p className="mt-4 rounded-xl border-2 border-dashed border-ink/30 bg-parchment/60 px-4 py-6 text-center text-sm text-smoke">
                No payouts recorded yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {state.data.payouts.map((payout) => (
                  <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-cream p-4">
                    <div>
                      <p className="text-sm font-bold text-ink tabular-nums">{formatINR(payout.amountInPaise)}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-smoke">{payout.reference}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full border-2 border-ink bg-lime/60 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                        Recorded · manual
                      </span>
                      <p className="mt-1 text-[11px] text-smoke">{formatDate(payout.recordedAt)}</p>
                    </div>
                    <p className="w-full text-xs text-smoke">{payout.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-hard-xs sm:p-6">
            <h2 className="text-base font-bold">How payouts work here</h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-cream/75">
              <li>
                · Sales settle through our payment partner, Razorpay; the 8% platform commission is
                split per successful eligible sale.
              </li>
              <li>
                · Payouts are recorded manually by platform administration under the intended
                payment arrangement, subject to provider approval and settlement timelines.
              </li>
              <li>
                · The figures above are demo records, not real money. Nothing here is an earnings
                projection or a promise of payout dates.
              </li>
              <li>· Payout destination details are collected securely during provider onboarding (Prompt 5) — never through this app.</li>
            </ul>
            <Button href="/creator/support" variant="lime" size="sm" className="mt-5">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Ask about payouts
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
