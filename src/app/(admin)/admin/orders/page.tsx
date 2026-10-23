"use client";

import { CircleCheck, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminOrderRecord, AdminOrderStatus, ReconciliationState } from "@/lib/admin-types";
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
} from "@/components/creator/ui";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const ORDER_TONE: Record<AdminOrderStatus, PillTone> = {
  paid: "lime",
  pending: "sand",
  failed: "accent",
  refunded: "smoke",
};

const RECON_TONE: Record<ReconciliationState, PillTone> = {
  settled: "lime",
  pending: "sand",
  exception: "accent",
};

export default function AdminOrdersPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listOrders()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "all">("all");
  const [reconFilter, setReconFilter] = useState<ReconciliationState | "all">("all");
  const [selected, setSelected] = useState<AdminOrderRecord | null>(null);
  const [confirmReview, setConfirmReview] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (reconFilter !== "all" && order.reconciliation !== reconFilter) return false;
      if (!query) return true;
      return [order.id, order.providerRef, order.learnerName, order.creatorName, order.courseTitle]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [state, search, statusFilter, reconFilter]);

  const review = async () => {
    if (!selected || !service) return;
    setReviewing(true);
    const result = await service.reviewOrder(selected.id, reviewNote);
    setReviewing(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't save the review", description: result.error.message });
      return;
    }
    toast.push({ variant: "success", title: "Order marked reviewed", description: "Logged to the audit trail. Reconciliation state unchanged." });
    setConfirmReview(false);
    setReviewNote("");
    setSelected(null);
    reload();
  };

  return (
    <div>
      <PageHeader title="Orders" sub="Every checkout record — status, commission, and reconciliation in one place.">
        <DemoChip />
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search order, provider ref, learner, course…" label="Search orders" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-smoke">Status</span>
          {(["all", "paid", "pending", "failed", "refunded"] as const).map((value) => (
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
          <span className="ml-2 text-xs font-bold text-smoke">Reconciliation</span>
          <select
            value={reconFilter}
            onChange={(event) => setReconFilter(event.target.value as ReconciliationState | "all")}
            aria-label="Filter by reconciliation"
            className="rounded-lg border-2 border-ink bg-white px-2 py-1.5 text-xs font-bold text-ink"
          >
            <option value="all">All</option>
            <option value="settled">Settled</option>
            <option value="pending">Pending</option>
            <option value="exception">Exception</option>
          </select>
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-6 text-smoke" aria-hidden="true" />}
          title="No orders in this view"
          body="Try another status or reconciliation filter."
        >
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); setReconFilter("all"); }}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelected(order)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${order.status === "paid" ? "bg-lime" : order.status === "failed" ? "bg-accent text-cream" : "bg-parchment"}`}>
                  <ReceiptText className="size-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-ink">{order.learnerName}</span>
                    <StatusPill label={order.status} tone={ORDER_TONE[order.status]} />
                    <StatusPill label={order.reconciliation} tone={RECON_TONE[order.reconciliation]} />
                    {order.reviewed ? <StatusPill label="reviewed" tone="parchment" /> : null}
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    <span className="font-mono">{order.id}</span> · {order.courseTitle} · {order.creatorName}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-ink tabular-nums">{formatINR(order.grossInPaise)}</span>
                  <span className="text-[10px] text-smoke">{formatDateTime(order.placedAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Order detail */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected ? `Order ${selected.id}` : "Order"} wide>
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              <StatusPill label={`payment: ${selected.status}`} tone={ORDER_TONE[selected.status]} />
              <StatusPill label={`commission: ${selected.commissionStatus}`} tone={selected.commissionStatus === "accrued" ? "lime" : selected.commissionStatus === "reversed" ? "smoke" : "parchment"} />
              <StatusPill label={`recon: ${selected.reconciliation}`} tone={RECON_TONE[selected.reconciliation]} />
            </div>
            <div>
              <DetailRow label="Order reference" mono>{selected.id}</DetailRow>
              <DetailRow label="Provider reference" mono>{selected.providerRef}</DetailRow>
              <DetailRow label="Learner">{selected.learnerName}</DetailRow>
              <DetailRow label="Creator">{selected.creatorName}</DetailRow>
              <DetailRow label="Course">{selected.courseTitle}</DetailRow>
              <DetailRow label="Placed">{formatDateTime(selected.placedAt)}</DetailRow>
              <DetailRow label="Gross amount">{formatINR(selected.grossInPaise, { decimals: true })}</DetailRow>
              <DetailRow label="Platform commission (8%)">−{formatINR(selected.platformFeeInPaise, { decimals: true })}</DetailRow>
              <DetailRow label="Creator share (92%)">{formatINR(selected.creatorShareInPaise, { decimals: true })}</DetailRow>
            </div>
            {selected.reconciliation !== "settled" && !selected.reviewed && selected.status === "paid" ? (
              <div className="rounded-2xl border-2 border-accent-deep bg-accent/5 p-4">
                <p className="text-sm font-bold text-accent-deep">
                  This paid order is in “{selected.reconciliation}” reconciliation
                </p>
                <p className="mt-1 text-xs leading-relaxed text-smoke">
                  Marking it reviewed records that a human looked at it — it does not alter the
                  reconciliation state or any financial record (that flow ships with the provider
                  integration in Prompt 5).
                </p>
                <Button variant="accent" size="sm" className="mt-3" onClick={() => setConfirmReview(true)}>
                  <CircleCheck className="size-4" aria-hidden="true" />
                  Mark as reviewed
                </Button>
              </div>
            ) : (
              <p className="rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
                Order records are read-only in this demo. Refunds only ever happen per the purchase
                policy through disputes/legal exceptions — never as a self-serve flow.
              </p>
            )}
            <div className="border-t-2 border-ink/10 pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmReview}
        title="Mark this order as reviewed?"
        body="Only the review flag and audit log change. Money, commission, and reconciliation state remain untouched."
        confirmLabel="Mark reviewed"
        loading={reviewing}
        onConfirm={review}
        onCancel={() => setConfirmReview(false)}
      />
    </div>
  );
}
