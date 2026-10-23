"use client";

import { Landmark, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CreatorEarningsRow, LedgerEntry, PayoutRecordAdmin } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDate, formatDateTime } from "@/lib/utils";
import { DetailRow, HistoryTimeline, SearchInput, StatusPill, type PillTone } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const PAYOUT_TONE: Record<PayoutRecordAdmin["status"], PillTone> = {
  pending: "sand",
  recorded: "lime",
  failed: "accent",
  cancelled: "smoke",
};

export default function AdminEarningsPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getCreatorEarnings()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<{
    summary: CreatorEarningsRow;
    ledger: LedgerEntry[];
    payouts: PayoutRecordAdmin[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((row) =>
      !query || [row.creatorName, row.handle].join(" ").toLowerCase().includes(query),
    );
  }, [state, search]);

  const openDetail = async (row: CreatorEarningsRow) => {
    if (!service) return;
    setDetailLoading(true);
    const result = await service.getCreatorEarningsDetail(row.creatorId);
    setDetailLoading(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't load earnings", description: result.error.message });
      return;
    }
    setDetail(result.data);
  };

  // Close the modal if it references a creator that disappeared after a reset.
  useEffect(() => {
    if (detail && state.status === "success" && !state.data.some((row) => row.creatorId === detail.summary.creatorId)) {
      setDetail(null);
    }
  }, [detail, state]);

  return (
    <div>
      <PageHeader title="Creator earnings" sub="What every creator has earned, what's been paid out, and what's still outstanding. Outstanding ≠ paid.">
      </PageHeader>

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creators…" label="Search creators" />
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-6 text-smoke" aria-hidden="true" />}
          title="No creators match"
          body="Try a different search."
        >
          <Button size="sm" variant="outline" onClick={() => setSearch("")}>
            Clear search
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((row) => (
            <li key={row.creatorId}>
              <button
                type="button"
                onClick={() => void openDetail(row)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5 sm:grid-cols-[1.4fr_repeat(4,auto)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{row.creatorName}</span>
                  <span className="block truncate text-xs text-smoke">@{row.handle}</span>
                </span>
                <span className="hidden text-right text-xs sm:block">
                  <span className="block font-bold text-ink tabular-nums">{formatINR(row.grossInPaise)}</span>
                  <span className="text-smoke">gross</span>
                </span>
                <span className="hidden text-right text-xs sm:block">
                  <span className="block font-bold text-accent tabular-nums">{formatINR(row.commissionInPaise)}</span>
                  <span className="text-smoke">commission</span>
                </span>
                <span className="hidden text-right text-xs sm:block">
                  <span className="block font-bold text-ink tabular-nums">{formatINR(row.paidOutInPaise)}</span>
                  <span className="text-smoke">paid out</span>
                </span>
                <span className="text-right text-xs">
                  <span className="block font-bold text-moss tabular-nums">{formatINR(row.outstandingInPaise)}</span>
                  <span className="text-smoke">outstanding</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={detail !== null || detailLoading} onClose={() => setDetail(null)} title={detail ? `${detail.summary.creatorName} — earnings` : "Loading…"} wide>
        {detailLoading || !detail ? (
          <p className="py-10 text-center text-sm text-smoke">Loading earnings…</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                ["Gross sales", formatINR(detail.summary.grossInPaise)],
                ["Platform commission", formatINR(detail.summary.commissionInPaise)],
                ["Gateway costs (est.)", formatINR(detail.summary.gatewayCostsInPaise)],
                ["Payable earnings", formatINR(detail.summary.payableInPaise)],
                ["Paid out (transfers)", formatINR(detail.summary.paidOutInPaise)],
                ["Outstanding (not yet paid)", formatINR(detail.summary.outstandingInPaise)],
              ].map(([label, value], index) => (
                <div key={label} className={`rounded-xl border-2 p-3 text-center ${index === 5 ? "border-ink bg-lime/50" : "border-ink/10 bg-cream"}`}>
                  <p className="text-sm font-bold text-ink tabular-nums">{value}</p>
                  <p className="text-[10px] font-bold tracking-wide text-smoke uppercase">{label}</p>
                </div>
              ))}
            </div>
            <p className="rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
              <span className="font-bold text-ink">Outstanding is not paid money.</span> It is
              payable earnings minus recorded transfer references. It only becomes “paid” when an
              admin records a bank transfer reference against a payout record.
            </p>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Ledger rows ({detail.ledger.length})</p>
              <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
                {detail.ledger.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{entry.courseTitle}</p>
                      <p className="font-mono text-[10px] text-smoke">{entry.orderId} · {formatDate(entry.recordedAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-ink tabular-nums">{formatINR(entry.creatorShareInPaise)}</p>
                      <StatusPill label={entry.commissionStatus} tone={entry.commissionStatus === "accrued" ? "lime" : "smoke"} />
                    </div>
                  </li>
                ))}
                {detail.ledger.length === 0 ? (
                  <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">No settled sales yet.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Payout records ({detail.payouts.length})</p>
              <ul className="mt-2 space-y-2">
                {detail.payouts.map((payout) => (
                  <li key={payout.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-ink tabular-nums">{formatINR(payout.amountInPaise)}</p>
                      <p className="font-mono text-[10px] text-smoke">
                        {payout.id} · {payout.transferRef ?? "no transfer ref"}
                      </p>
                    </div>
                    <StatusPill label={payout.status} tone={PAYOUT_TONE[payout.status]} />
                  </li>
                ))}
                {detail.payouts.length === 0 ? (
                  <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">No payout records yet.</li>
                ) : null}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 border-t-2 border-ink/10 pt-4">
              <Button href="/admin/payouts" variant="ink" size="sm">
                <Landmark className="size-4" aria-hidden="true" />
                Open payout workflow
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
