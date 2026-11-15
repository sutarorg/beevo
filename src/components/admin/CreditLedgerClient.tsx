"use client";

import React, { useMemo, useState } from "react";
import { Coins, Lock, Search, ShieldCheck } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import type {
  AdminApiError,
  AdminApiState,
  AdminCreditLedgerRow,
  AdminLedgerTxType,
} from "@/lib/admin-types";

interface CreditLedgerClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialEntries: AdminCreditLedgerRow[];
}

export function CreditLedgerClient({
  apiState,
  apiError,
  initialEntries,
}: CreditLedgerClientProps) {
  // Ledger filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AdminLedgerTxType>("all");
  const [dateFilter, setDateFilter] = useState("");

  // Audited Adjustment Workbench
  const [userLookup, setUserLookup] = useState("");
  const [direction, setDirection] = useState<"add" | "deduct">("add");
  const [creditAmount, setCreditAmount] = useState("100");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  const parsedCredits = Number.parseInt(creditAmount, 10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialEntries.filter((row) => {
      if (
        q &&
        !row.customerName.toLowerCase().includes(q) &&
        !row.customerEmail.toLowerCase().includes(q) &&
        !row.transactionId.toLowerCase().includes(q) &&
        !row.reference.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (dateFilter && row.createdAt.slice(0, 10) !== dateFilter) return false;
      return true;
    });
  }, [initialEntries, search, typeFilter, dateFilter]);

  const handleReviewAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!userLookup.trim()) {
      setFormError("Select or enter a verified user email or user ID before reviewing.");
      return;
    }
    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      setFormError("Enter a positive whole credit quantity.");
      return;
    }
    if (reason.trim().length < 8) {
      setFormError("Enter an operational audit reason (at least 8 characters).");
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Credit Ledger &amp; Audited Adjustments
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Append-only double-entry credit history. Balances are always derived from immutable
            ledger entries and never overwritten directly.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-[8px] border border-beevo-border bg-white px-3 py-2 text-[11.5px] font-bold text-beevo-body sm:self-auto">
          <Lock className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
          Append-only ledger · Audit trail mandatory
        </span>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Immutable credit ledger entries and server-side adjustments"
      />

      {submissionNotice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[10px] border border-beevo-border-warm bg-beevo-cream/85 px-4 py-3 text-[13px] font-semibold text-beevo-ink"
        >
          {submissionNotice}
        </div>
      )}

      {/* Audited Admin Credit Adjustment Workbench */}
      <section
        aria-labelledby="credit-adjustment-heading"
        className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-beevo-border pb-3">
          <div>
            <h2
              id="credit-adjustment-heading"
              className="font-display text-[15.5px] font-extrabold text-beevo-ink"
            >
              Admin Credit Adjustment Workbench
            </h2>
            <p className="mt-0.5 text-[12.5px] text-beevo-muted">
              Select a verified user, specify add or deduct, document the reason, review, and
              confirm. Every mutation writes both a ledger row and an audit entry.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-[6px] border border-beevo-border bg-[#FAF8F3] px-2 py-1 text-[11px] font-bold text-beevo-body">
            <ShieldCheck className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
            Requires confirmation
          </span>
        </div>

        <form onSubmit={handleReviewAdjustment} className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div>
              <label
                htmlFor="adjust-user-lookup"
                className="block text-[12px] font-bold text-beevo-ink"
              >
                Target User (Real User ID or Email) <span className="text-red-700">*</span>
              </label>
              <input
                id="adjust-user-lookup"
                type="text"
                value={userLookup}
                onChange={(e) => setUserLookup(e.target.value)}
                placeholder="Search verified user email or UUID (Phase 4 directory)..."
                className="mt-1 min-h-[42px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 text-[13px] text-beevo-ink placeholder:text-beevo-muted/75 focus:border-beevo-ink focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-[12px] font-bold text-beevo-ink">
                  Adjustment Direction <span className="text-red-700">*</span>
                </span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(["add", "deduct"] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setDirection(dir)}
                      aria-pressed={direction === dir}
                      className={`min-h-[42px] rounded-[8px] border text-[13px] font-bold capitalize ${
                        direction === dir
                          ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                          : "border-beevo-border bg-[#FAF8F3] text-beevo-body hover:bg-white"
                      }`}
                    >
                      {dir} credits
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="adjust-credit-qty"
                  className="block text-[12px] font-bold text-beevo-ink"
                >
                  Credit Quantity <span className="text-red-700">*</span>
                </label>
                <input
                  id="adjust-credit-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 font-mono text-[13.5px] font-bold text-beevo-ink focus:border-beevo-ink focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="adjust-audit-reason"
                className="block text-[12px] font-bold text-beevo-ink"
              >
                Required Audit Reason <span className="text-red-700">*</span>
              </label>
              <textarea
                id="adjust-audit-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reference support ticket ID, failed job refund ID, or billing reconciliation note..."
                className="mt-1 w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] p-2.5 text-[13px] text-beevo-ink placeholder:text-beevo-muted/75 focus:border-beevo-ink focus:bg-white"
              />
            </div>

            {formError && (
              <p role="alert" className="text-[12.5px] font-bold text-red-700">
                {formError}
              </p>
            )}
          </div>

          {/* Live Review Summary Panel */}
          <div className="flex flex-col justify-between rounded-[10px] border border-beevo-border bg-[#FAF8F3] p-4 lg:col-span-5">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-beevo-muted">
                Pending Append-Only Ledger Preview
              </p>
              <dl className="mt-3 space-y-2 text-[12.5px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Target account</dt>
                  <dd className="truncate font-mono font-bold text-beevo-ink">
                    {userLookup.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Ledger event type</dt>
                  <dd className="font-mono font-bold text-beevo-ink">
                    {direction === "add" ? "admin_adjustment_add" : "admin_adjustment_deduct"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Credit delta</dt>
                  <dd className="font-display text-[15px] font-extrabold tabular-nums text-beevo-ink">
                    {Number.isFinite(parsedCredits) && parsedCredits > 0
                      ? `${direction === "add" ? "+" : "−"}${parsedCredits.toLocaleString()} cr`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Audit log generation</dt>
                  <dd className="font-bold text-emerald-800">Automatic (Mandatory)</dd>
                </div>
              </dl>
            </div>

            <button
              type="submit"
              className="mt-4 min-h-[42px] w-full rounded-[8px] bg-[#FFC928] px-4 text-[13px] font-extrabold text-beevo-ink hover:bg-[#F2B800]"
            >
              Review &amp; Confirm Adjustment
            </button>
          </div>
        </form>
      </section>

      {/* Immutable 10-Field Ledger Filter & Table */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="grid grid-cols-1 gap-2.5 border-b border-beevo-border bg-[#FAF8F3] p-3.5 sm:grid-cols-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search credit ledger"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, txn ID, or reference..."
              className="min-h-[38px] w-full rounded-[8px] border border-beevo-border bg-white pl-8 pr-3 text-[12.5px] text-beevo-ink"
            />
          </div>
          <select
            aria-label="Filter by ledger transaction type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | AdminLedgerTxType)}
            className="min-h-[38px] rounded-[8px] border border-beevo-border bg-white px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Ledger type: All</option>
            <option value="purchase">Purchase</option>
            <option value="reservation">Reservation</option>
            <option value="deduction">Deduction</option>
            <option value="release">Release</option>
            <option value="refund">Refund</option>
            <option value="admin_adjustment">Admin Adjustment</option>
          </select>
          <input
            type="date"
            aria-label="Filter ledger by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="min-h-[38px] rounded-[8px] border border-beevo-border bg-white px-2.5 font-mono text-[12px] text-beevo-ink"
          />
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1040px] border-collapse text-left text-[12px]">
            <caption className="sr-only">Immutable Beevo credit ledger records</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                <th scope="col" className="px-3 py-3">Customer</th>
                <th scope="col" className="px-3 py-3">Transaction ID</th>
                <th scope="col" className="px-3 py-3">Type</th>
                <th scope="col" className="px-3 py-3 text-right">Added</th>
                <th scope="col" className="px-3 py-3 text-right">Deducted</th>
                <th scope="col" className="px-3 py-3 text-right">Reserved</th>
                <th scope="col" className="px-3 py-3 text-right">Released</th>
                <th scope="col" className="px-3 py-3 text-right">Refund</th>
                <th scope="col" className="px-3 py-3">Reference</th>
                <th scope="col" className="px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <Coins className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No credit ledger entries recorded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Every credit pack purchase, generation reservation, deduction, release,
                      refund, and audited admin adjustment appears here once Phase 4 connects.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.transactionId} className="hover:bg-[#FAF8F3]/60">
                    <td className="px-3 py-3 font-semibold text-beevo-ink">{row.customerName}</td>
                    <td className="px-3 py-3 font-mono text-beevo-muted">{row.transactionId}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">{row.type}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.addedCredits ?? "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.deductedCredits ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.reservedCredits ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.releasedCredits ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {row.refundCredits ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">{row.reference}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-beevo-muted">
                      {row.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 text-center md:hidden">
          <Coins className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
          <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
            No credit ledger entries recorded yet
          </p>
          <p className="mt-1 text-[12.5px] text-beevo-muted">
            Append-only transactions load here in Phase 4.
          </p>
        </div>
      </section>

      <AdminConfirmDialog
        open={confirmOpen}
        title="Confirm Audited Credit Ledger Entry"
        description="Verify the details below. Confirming submits a server-side idempotent ledger transaction and writes an immutable entry in /admin/audit-logs."
        confirmLabel="Post Ledger Adjustment"
        tone={direction === "deduct" ? "danger" : "neutral"}
        requireTypedPhrase="POST LEDGER"
        summaryRows={[
          { label: "Target User", value: userLookup.trim() },
          {
            label: "Operation",
            value: direction === "add" ? `Add +${parsedCredits} cr` : `Deduct −${parsedCredits} cr`,
          },
          { label: "Audit Reason", value: reason.trim() },
        ]}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setSubmissionNotice(
            `Validated audited ${direction} of ${parsedCredits} credits for "${userLookup.trim()}" (reason: "${reason.trim()}"). Persisting to Supabase requires Phase 4 POST /api/admin/credits/adjustments.`
          );
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
