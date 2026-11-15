"use client";

import React, { useMemo, useState } from "react";
import { CreditCard, Lock, RotateCcw, Search } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import {
  formatInrNullable,
  type AdminApiError,
  type AdminApiState,
  type AdminPaymentRecord,
} from "@/lib/admin-types";

interface PaymentsClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialPayments: AdminPaymentRecord[];
}

export function PaymentsClient({ apiState, apiError, initialPayments }: PaymentsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminPaymentRecord["status"]>("all");
  const [refundFilter, setRefundFilter] = useState<"all" | AdminPaymentRecord["refundStatus"]>(
    "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<AdminPaymentRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pageSize = 20;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialPayments.filter((p) => {
      if (
        q &&
        !p.paymentId.toLowerCase().includes(q) &&
        !p.orderId.toLowerCase().includes(q) &&
        !p.customerName.toLowerCase().includes(q) &&
        !p.customerEmail.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (refundFilter !== "all" && p.refundStatus !== refundFilter) return false;
      if (dateFrom && p.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && p.createdAt.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [initialPayments, search, statusFilter, refundFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Payments &amp; Orders
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Webhook-verified Razorpay orders, payment receipts, credit package settlements, and
            server-side refund requests.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start rounded-[8px] border border-beevo-border bg-white px-3 py-2 text-[11.5px] font-bold text-beevo-body sm:self-auto">
          <Lock className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
          Payment status is read-only (Razorpay webhook authoritative)
        </div>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Razorpay payment receipts and settlement records"
      />

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[10px] border border-beevo-border-warm bg-beevo-cream/85 px-4 py-3 text-[13px] font-semibold text-beevo-ink"
        >
          {feedback}
        </div>
      )}

      {/* Filters */}
      <section
        aria-label="Filter payments"
        className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search payment ID, order ID, or customer"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Payment ID, Order ID, or customer..."
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-8 pr-3 text-[12.5px] text-beevo-ink focus:border-beevo-ink focus:bg-white"
            />
          </div>

          <select
            aria-label="Filter by payment status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | AdminPaymentRecord["status"])
            }
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink lg:col-span-2"
          >
            <option value="all">Payment: All</option>
            <option value="captured">Captured</option>
            <option value="authorized">Authorized</option>
            <option value="created">Created</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            aria-label="Filter by refund status"
            value={refundFilter}
            onChange={(e) =>
              setRefundFilter(e.target.value as "all" | AdminPaymentRecord["refundStatus"])
            }
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink lg:col-span-2"
          >
            <option value="all">Refund: All</option>
            <option value="none">None</option>
            <option value="partial">Partial</option>
            <option value="full">Full</option>
            <option value="pending">Pending</option>
          </select>

          <div className="grid grid-cols-2 gap-2 lg:col-span-4">
            <input
              type="date"
              aria-label="Payments from date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2 font-mono text-[12px] text-beevo-ink"
            />
            <input
              type="date"
              aria-label="Payments to date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2 font-mono text-[12px] text-beevo-ink"
            />
          </div>
        </div>
      </section>

      {/* 10-Column Read-Only Razorpay Records Table */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1040px] border-collapse text-left text-[12px]">
            <caption className="sr-only">Razorpay payment receipts and order records</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                <th scope="col" className="px-3 py-3">Payment ID</th>
                <th scope="col" className="px-3 py-3">Order ID</th>
                <th scope="col" className="px-3 py-3">Customer</th>
                <th scope="col" className="px-3 py-3">Package</th>
                <th scope="col" className="px-3 py-3 text-right">Amount</th>
                <th scope="col" className="px-3 py-3">Currency</th>
                <th scope="col" className="px-3 py-3">Method</th>
                <th scope="col" className="px-3 py-3">Payment status</th>
                <th scope="col" className="px-3 py-3">Date</th>
                <th scope="col" className="px-3 py-3">Refund status</th>
                <th scope="col" className="px-3 py-3 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <CreditCard className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No Razorpay payment records found
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Verified Razorpay transactions (Starter ₹299, Creator ₹599, Studio ₹899)
                      appear here only after real webhook-signed captures in Phase 4.
                    </p>
                  </td>
                </tr>
              ) : (
                paged.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-[#FAF8F3]/60">
                    <td className="px-3 py-3 font-mono font-bold text-beevo-ink">{p.paymentId}</td>
                    <td className="px-3 py-3 font-mono text-beevo-muted">{p.orderId}</td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-beevo-ink">{p.customerName}</span>
                    </td>
                    <td className="px-3 py-3">{p.packageName}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-beevo-ink">
                      {formatInrNullable(p.amountPaise / 100)}
                    </td>
                    <td className="px-3 py-3 font-mono">{p.currency}</td>
                    <td className="px-3 py-3">{p.method ?? "—"}</td>
                    <td className="px-3 py-3 capitalize">{p.status}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-beevo-muted">
                      {p.createdAt.slice(0, 10)}
                    </td>
                    <td className="px-3 py-3 capitalize">{p.refundStatus}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setRefundTarget(p)}
                        disabled={p.status !== "captured" || p.refundStatus === "full"}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 text-[11.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3] disabled:opacity-45"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        Refund
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-beevo-border md:hidden">
          {paged.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CreditCard className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
              <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
                No Razorpay payment records found
              </p>
              <p className="mt-1 text-[12.5px] text-beevo-muted">
                Verified payment receipts load once Razorpay webhooks connect in Phase 4.
              </p>
            </div>
          ) : (
            paged.map((p) => (
              <article key={p.paymentId} className="space-y-2 p-4 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-beevo-ink">{p.paymentId}</span>
                  <span className="font-bold tabular-nums text-beevo-ink">
                    {formatInrNullable(p.amountPaise / 100)}
                  </span>
                </div>
                <p className="text-beevo-muted">
                  {p.customerName} &middot; {p.packageName}
                </p>
              </article>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-beevo-border bg-[#FAF8F3] px-4 py-2.5 text-[12px]">
          <span className="font-semibold text-beevo-muted">
            Page {page} of {totalPages} &middot; {filtered.length} records
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[36px] rounded-[7px] border border-beevo-border bg-white px-3 font-bold text-beevo-ink disabled:opacity-45"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[36px] rounded-[7px] border border-beevo-border bg-white px-3 font-bold text-beevo-ink disabled:opacity-45"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <AdminConfirmDialog
        open={refundTarget !== null}
        title="Initiate Backend Razorpay Refund"
        description={
          refundTarget
            ? `Submits a server-side refund request for ${refundTarget.paymentId}. Payment status updates only after Razorpay confirms via signed webhook.`
            : ""
        }
        confirmLabel="Initiate Server Refund"
        tone="danger"
        requireReason
        requireTypedPhrase="REFUND"
        onClose={() => setRefundTarget(null)}
        onConfirm={(reason) => {
          if (!refundTarget) return;
          setFeedback(
            `Server-side refund request for ${refundTarget.paymentId} (reason: "${reason}") requires Phase 4 POST /api/admin/payments/${refundTarget.paymentId}/refund.`
          );
          setRefundTarget(null);
        }}
      />
    </div>
  );
}
