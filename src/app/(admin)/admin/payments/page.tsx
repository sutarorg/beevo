"use client";

import { Banknote, CreditCard, Landmark, Smartphone, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { PaymentEvent } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDateTime } from "@/lib/utils";
import { DetailRow, SearchInput, StatusPill, type PillTone } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
  StatCard,
} from "@/components/creator/ui";
import { Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";

const EVENT_TONE: Record<PaymentEvent["status"], PillTone> = {
  succeeded: "lime",
  initiated: "parchment",
  pending: "sand",
  failed: "accent",
};

const METHOD_ICONS = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
} as const;

export default function AdminPaymentsPage() {
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listPaymentEvents()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentEvent["status"] | "all">("all");
  const [selected, setSelected] = useState<PaymentEvent | null>(null);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((event) => {
      if (statusFilter !== "all" && event.status !== statusFilter) return false;
      if (!query) return true;
      return [event.id, event.orderId, event.learnerName, event.providerRef, event.failureReason ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [state, search, statusFilter]);

  const counts = useMemo(() => {
    if (state.status !== "success") return { succeeded: 0, failed: 0, pendingInitiated: 0 };
    return {
      succeeded: state.data.filter((event) => event.status === "succeeded").length,
      failed: state.data.filter((event) => event.status === "failed").length,
      pendingInitiated: state.data.filter((event) => event.status === "pending" || event.status === "initiated").length,
    };
  }, [state]);

  return (
    <div>
      <PageHeader title="Payments" sub="Gateway-level payment events: attempts, successes, failures, and operational signals.">
      </PageHeader>

      {state.status === "success" ? (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatCard icon={<Banknote className="size-4.5" aria-hidden="true" />} label="Succeeded" value={String(counts.succeeded)} />
          <StatCard icon={<TriangleAlert className="size-4.5" aria-hidden="true" />} label="Failed events" value={String(counts.failed)} />
          <StatCard icon={<Banknote className="size-4.5" aria-hidden="true" />} label="Pending / initiated" value={String(counts.pendingInitiated)} />
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search refs, learner, reason…" label="Search payment events" />
        <div className="flex flex-wrap gap-2">
          {(["all", "succeeded", "failed", "pending", "initiated"] as const).map((value) => (
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
          icon={<Banknote className="size-6 text-smoke" aria-hidden="true" />}
          title="No events match"
          body="Try clearing the status filter or search."
        >
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((event) => {
            const MethodIcon = METHOD_ICONS[event.method];
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => setSelected(event)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${event.status === "failed" ? "bg-accent text-cream" : event.status === "succeeded" ? "bg-lime" : "bg-parchment"}`}>
                    <MethodIcon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-ink">{event.learnerName}</span>
                      <StatusPill label={event.status} tone={EVENT_TONE[event.status]} />
                      {event.failureReason ? <StatusPill label={event.failureReason.replace(/_/g, " ")} tone="accent" /> : null}
                    </span>
                    <span className="block truncate text-xs text-smoke">
                      {event.method.toUpperCase()} · <span className="font-mono">{event.providerRef}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-ink tabular-nums">{formatINR(event.amountInPaise)}</span>
                    <span className="text-[10px] text-smoke">{formatDateTime(event.at)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Payment event">
        {selected ? (
          <div className="space-y-4">
            <div>
              <DetailRow label="Event" mono>{selected.id}</DetailRow>
              <DetailRow label="Order" mono>{selected.orderId}</DetailRow>
              <DetailRow label="Provider ref" mono>{selected.providerRef}</DetailRow>
              <DetailRow label="Learner">{selected.learnerName}</DetailRow>
              <DetailRow label="Method">{selected.method.toUpperCase()}</DetailRow>
              <DetailRow label="Amount">{formatINR(selected.amountInPaise, { decimals: true })}</DetailRow>
              <DetailRow label="Status">{selected.status}</DetailRow>
              {selected.failureReason ? <DetailRow label="Failure reason">{selected.failureReason.replace(/_/g, " ")}</DetailRow> : null}
              <DetailRow label="Time">{formatDateTime(selected.at)}</DetailRow>
            </div>
            <p className="rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
              Every event here comes from the payment provider&apos;s webhook. Signature verification
              runs on each delivery, so unverified events never appear.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
