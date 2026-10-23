"use client";

import { IndianRupee, ReceiptText, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { formatINR } from "@/lib/domain";
import type { OrderRecord } from "@/lib/creator-types";
import { useAsyncData } from "@/lib/hooks";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { formatDateTime } from "@/lib/utils";
import { Modal } from "@/components/creator/dialogs";
import {
  CardListSkeleton,
  DemoChip,
  EmptyState,
  FailedState,
  PageHeader,
  StatCard,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";

type StatusFilter = "all" | "paid" | "refunded";

export default function CreatorOrdersPage() {
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listOrders()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selected, setSelected] = useState<OrderRecord | null>(null);

  const courseOptions = useMemo(() => {
    if (state.status !== "success") return [];
    return [...new Map(state.data.map((o) => [o.courseId, o.courseTitle])).entries()];
  }, [state]);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    return state.data.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (courseFilter !== "all" && order.courseId !== courseFilter) return false;
      return true;
    });
  }, [state, statusFilter, courseFilter]);

  const totals = useMemo(() => {
    if (state.status !== "success") return { gross: 0, paid: 0, refunded: 0 };
    const paid = state.data.filter((order) => order.status === "paid");
    return {
      gross: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      paid: paid.length,
      refunded: state.data.length - paid.length,
    };
  }, [state]);

  return (
    <div>
      <PageHeader
        title="Orders"
        sub="Every checkout attempt that reached you. Commission maths shown per order."
      >
        <DemoChip />
      </PageHeader>

      {state.status === "success" ? (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatCard
            icon={<IndianRupee className="size-4.5" aria-hidden="true" />}
            label="Gross (paid)"
            value={formatINR(totals.gross)}
            demo
          />
          <StatCard
            icon={<ReceiptText className="size-4.5" aria-hidden="true" />}
            label="Paid orders"
            value={String(totals.paid)}
            demo
          />
          <StatCard
            icon={<RotateCcw className="size-4.5" aria-hidden="true" />}
            label="Refunded"
            value={String(totals.refunded)}
            demo
          />
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["paid", "Paid"],
            ["refunded", "Refunded"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            aria-pressed={statusFilter === value}
            className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
              statusFilter === value ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink hover:bg-parchment"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          aria-label="Filter by course"
          className="ml-auto rounded-xl border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink"
        >
          <option value="all">All courses</option>
          {courseOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-6 text-smoke" aria-hidden="true" />}
          title="No orders in this view"
          body="Try another status or course filter."
        >
          <Button size="sm" variant="outline" onClick={() => { setStatusFilter("all"); setCourseFilter("all"); }}>
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
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3.5 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 ${
                    order.status === "paid" ? "border-ink bg-lime" : "border-ink/30 bg-sand"
                  }`}
                >
                  <ReceiptText className="size-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">
                    {order.buyerName}
                    <span className="ml-2 font-mono text-[10px] font-semibold text-smoke">{order.id}</span>
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    {order.courseTitle} · {formatDateTime(order.placedAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={`block text-sm font-bold tabular-nums ${order.status === "refunded" ? "text-smoke line-through" : "text-ink"}`}>
                    {formatINR(order.grossInPaise)}
                  </span>
                  <span
                    className={`inline-block rounded-full border px-1.5 text-[9px] font-bold tracking-wide uppercase ${
                      order.status === "paid" ? "border-ink bg-lime/60 text-ink" : "border-ink/30 bg-sand text-smoke"
                    }`}
                  >
                    {order.status}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Order details">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-smoke">{selected.id}</p>
                <p className="mt-0.5 text-base font-bold text-ink">{selected.buyerName}</p>
                <p className="text-sm text-smoke">{selected.buyerEmail}</p>
              </div>
              <DemoChip />
            </div>
            <dl className="rounded-2xl border-2 border-ink bg-white p-4">
              <div className="flex justify-between border-b border-dashed border-ink/20 pb-2 text-sm">
                <dt className="text-smoke">Course</dt>
                <dd className="max-w-56 truncate font-semibold text-ink">{selected.courseTitle}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-ink/20 py-2 text-sm">
                <dt className="text-smoke">Placed</dt>
                <dd className="font-semibold text-ink">{formatDateTime(selected.placedAt)}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-ink/20 py-2 text-sm">
                <dt className="text-smoke">Status</dt>
                <dd className="font-semibold text-ink capitalize">{selected.status} (demo)</dd>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <dt className="text-smoke">Buyer paid</dt>
                <dd className="font-bold text-ink tabular-nums">{formatINR(selected.grossInPaise, { decimals: true })}</dd>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <dt className="text-smoke">Platform fee (8%)</dt>
                <dd className="font-semibold text-accent tabular-nums">
                  −{formatINR(selected.platformFeeInPaise, { decimals: true })}
                </dd>
              </div>
              <div className="flex justify-between border-t-2 border-dashed border-ink/20 pt-2 text-sm">
                <dt className="font-semibold text-ink">Your share (92%)</dt>
                <dd className="font-editorial text-xl text-ink italic tabular-nums">
                  {formatINR(selected.creatorShareInPaise, { decimals: true })}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] leading-relaxed text-smoke">
              Demo order — not a real payment. Refunds follow the Refund Policy: no standard
              refunds, except where applicable law requires a remedy; contact support to action one.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
