"use client";

import { BadgePercent } from "lucide-react";
import { useMemo, useState } from "react";
import type { CommissionStatus, LedgerEntry } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDateTime } from "@/lib/utils";
import { DetailRow, SearchInput, StatusPill, type PillTone } from "@/components/admin/ui";
import {
  CardListSkeleton,
  DemoChip,
  EmptyState,
  FailedState,
  PageHeader,
  StatCard,
} from "@/components/creator/ui";
import { Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";

const STATUS_TONE: Record<CommissionStatus, PillTone> = {
  accrued: "lime",
  waived: "parchment",
  reversed: "smoke",
};

export default function AdminCommissionLedgerPage() {
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getCommissionLedger()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "all">("all");
  const [selected, setSelected] = useState<LedgerEntry | null>(null);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((entry) => {
      if (statusFilter !== "all" && entry.commissionStatus !== statusFilter) return false;
      if (!query) return true;
      return [entry.orderId, entry.courseTitle, entry.creatorName].join(" ").toLowerCase().includes(query);
    });
  }, [state, search, statusFilter]);

  const totals = useMemo(() => {
    if (state.status !== "success") return { gross: 0, commission: 0, gateway: 0, share: 0 };
    const accrued = state.data.filter((entry) => entry.commissionStatus === "accrued");
    return {
      gross: accrued.reduce((sum, entry) => sum + entry.grossInPaise, 0),
      commission: accrued.reduce((sum, entry) => sum + entry.platformFeeInPaise, 0),
      gateway: accrued.reduce((sum, entry) => sum + entry.gatewayCostInPaise, 0),
      share: accrued.reduce((sum, entry) => sum + entry.creatorShareInPaise, 0),
    };
  }, [state]);

  return (
    <div>
      <PageHeader title="Commission ledger" sub="One ledger row per settled sale — the platform's 8%, gateway costs, and creator shares.">
        <DemoChip />
      </PageHeader>

      {state.status === "success" ? (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<BadgePercent className="size-4.5" aria-hidden="true" />} label="Gross (accrued)" value={formatINR(totals.gross)} demo />
          <StatCard icon={<BadgePercent className="size-4.5" aria-hidden="true" />} label="Platform commission" value={formatINR(totals.commission)} demo />
          <StatCard icon={<BadgePercent className="size-4.5" aria-hidden="true" />} label="Gateway costs (est.)" value={formatINR(totals.gateway)} hint="Estimated 2% until provider reports" demo />
          <StatCard icon={<BadgePercent className="size-4.5" aria-hidden="true" />} label="Creator shares" value={formatINR(totals.share)} demo />
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search order, course, creator…" label="Search ledger" />
        <div className="flex flex-wrap gap-2">
          {(["all", "accrued", "waived", "reversed"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold capitalize transition-colors ${statusFilter === value ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink hover:bg-parchment"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BadgePercent className="size-6 text-smoke" aria-hidden="true" />}
          title="No ledger rows match"
          body="Try another status filter or search."
        >
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard-xs">
            <ul className="divide-y-2 divide-ink/10">
              {filtered.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(entry)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cream sm:grid-cols-[1.2fr_repeat(3,auto)]"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-ink">{entry.courseTitle}</span>
                        <StatusPill label={entry.commissionStatus} tone={STATUS_TONE[entry.commissionStatus]} />
                      </span>
                      <span className="block truncate text-xs text-smoke">
                        <span className="font-mono">{entry.orderId}</span> · {entry.creatorName} · {formatDateTime(entry.recordedAt)}
                      </span>
                    </span>
                    <span className="hidden text-right text-xs sm:block">
                      <span className="block font-bold text-ink tabular-nums">{formatINR(entry.grossInPaise)}</span>
                      <span className="text-smoke">gross</span>
                    </span>
                    <span className="hidden text-right text-xs sm:block">
                      <span className="block font-bold text-accent tabular-nums">{formatINR(entry.platformFeeInPaise)}</span>
                      <span className="text-smoke">commission</span>
                    </span>
                    <span className="text-right text-xs">
                      <span className="block font-bold text-moss tabular-nums">{formatINR(entry.creatorShareInPaise)}</span>
                      <span className="text-smoke">creator</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-smoke">
            Rows derive from paid/refunded orders through the shared commission rule
            (8%, round-half-up to paise). Reversed rows show where a sale was unwound — the money
            never counts as outstanding. Gateway costs are estimates until provider reports land.
          </p>
        </>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Ledger entry">
        {selected ? (
          <div>
            <DetailRow label="Ledger row" mono>{selected.id}</DetailRow>
            <DetailRow label="Order" mono>{selected.orderId}</DetailRow>
            <DetailRow label="Course">{selected.courseTitle}</DetailRow>
            <DetailRow label="Creator">{selected.creatorName}</DetailRow>
            <DetailRow label="Recorded">{formatDateTime(selected.recordedAt)}</DetailRow>
            <DetailRow label="Status">{selected.commissionStatus}</DetailRow>
            <DetailRow label="Gross sale">{formatINR(selected.grossInPaise, { decimals: true })}</DetailRow>
            <DetailRow label="Platform commission (8%)">{formatINR(selected.platformFeeInPaise, { decimals: true })}</DetailRow>
            <DetailRow label="Gateway cost (est.)">{formatINR(selected.gatewayCostInPaise, { decimals: true })}</DetailRow>
            <DetailRow label="Creator share (92%)">{formatINR(selected.creatorShareInPaise, { decimals: true })}</DetailRow>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
