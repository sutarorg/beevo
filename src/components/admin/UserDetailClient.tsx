"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import {
  formatInrNullable,
  formatNumberNullable,
  type AdminApiError,
  type AdminApiState,
  type AdminUserDetail,
} from "@/lib/admin-types";

interface UserDetailClientProps {
  userId: string;
  apiState: AdminApiState;
  apiError?: AdminApiError;
  user: AdminUserDetail | null;
}

type DetailTab = "projects" | "videos" | "payments" | "ledger" | "generations";

export function UserDetailClient({ userId, apiState, apiError, user }: UserDetailClientProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("projects");
  const [confirmMode, setConfirmMode] = useState<"suspend" | "reactivate" | "credits" | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<"add" | "deduct">("add");
  const [adjustCredits, setAdjustCredits] = useState("100");
  const [feedback, setFeedback] = useState<string | null>(null);

  const tabs: { id: DetailTab; label: string; count: number }[] = [
    { id: "projects", label: "Projects", count: user?.projects.length ?? 0 },
    { id: "videos", label: "Videos", count: user?.videos.length ?? 0 },
    { id: "payments", label: "Payments", count: user?.payments.length ?? 0 },
    { id: "ledger", label: "Credit Ledger", count: user?.ledger.length ?? 0 },
    { id: "generations", label: "Generation History", count: user?.generations.length ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/users"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Users
        </Link>
        <span className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 font-mono text-[11.5px] font-semibold text-beevo-muted">
          User ID: {userId}
        </span>
      </div>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel={`Customer dossier for ${userId}`}
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

      {/* Profile Header & Audited Actions */}
      <section className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-beevo-border bg-[#FAF8F3] text-beevo-ink">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[20px] font-extrabold text-beevo-ink">
                  {user ? user.fullName : "No customer record loaded"}
                </h1>
                <span className="rounded-[6px] border border-beevo-border bg-[#FAF8F3] px-2 py-0.5 text-[11px] font-bold capitalize text-beevo-muted">
                  {user ? user.status : "Unloaded"}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-beevo-muted">
                {user
                  ? `${user.email} · Registered ${user.registeredAt.slice(0, 10)}`
                  : "Real customer profile, payment receipts, credit ledger, and AI spend load here in Phase 4."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmMode("credits")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] bg-[#FFC928] px-3.5 text-[12.5px] font-extrabold text-beevo-ink hover:bg-[#F2B800]"
            >
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              Adjust Credits
            </button>
            <button
              type="button"
              onClick={() => setConfirmMode("suspend")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] border border-red-200 bg-white px-3.5 text-[12.5px] font-bold text-red-700 hover:bg-red-50"
            >
              <UserX className="h-3.5 w-3.5" aria-hidden="true" />
              Suspend
            </button>
            <button
              type="button"
              onClick={() => setConfirmMode("reactivate")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3.5 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              Reactivate
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-beevo-border pt-4 lg:grid-cols-4">
          <div className="rounded-[8px] border border-beevo-border bg-[#FAF8F3] p-3">
            <dt className="text-[11.5px] font-semibold text-beevo-muted">Derived Credit Balance</dt>
            <dd className="mt-1 font-display text-[19px] font-extrabold tabular-nums text-beevo-ink">
              {formatNumberNullable(user?.creditBalance ?? null, " cr")}
            </dd>
          </div>
          <div className="rounded-[8px] border border-beevo-border bg-[#FAF8F3] p-3">
            <dt className="text-[11.5px] font-semibold text-beevo-muted">Reserved Credits</dt>
            <dd className="mt-1 font-display text-[19px] font-extrabold tabular-nums text-beevo-ink">
              {formatNumberNullable(user?.reservedCredits ?? null, " cr")}
            </dd>
          </div>
          <div className="rounded-[8px] border border-beevo-border bg-[#FAF8F3] p-3">
            <dt className="text-[11.5px] font-semibold text-beevo-muted">Completed Videos</dt>
            <dd className="mt-1 font-display text-[19px] font-extrabold tabular-nums text-beevo-ink">
              {user ? user.completedVideos.toLocaleString() : "—"}
            </dd>
          </div>
          <div className="rounded-[8px] border border-beevo-border bg-[#FAF8F3] p-3">
            <dt className="text-[11.5px] font-semibold text-beevo-muted">Total Generation Cost</dt>
            <dd className="mt-1 font-display text-[19px] font-extrabold tabular-nums text-beevo-ink">
              {formatInrNullable(user?.totalGenerationCostInr ?? null)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Dossier Tabs: Projects, Videos, Payments, Ledger, Generation History */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div
          role="tablist"
          aria-label="User dossier sections"
          className="flex flex-wrap gap-1 border-b border-beevo-border bg-[#FAF8F3] px-3 py-2"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] rounded-[7px] px-3 text-[12.5px] font-bold transition-colors ${
                  active
                    ? "bg-beevo-dark text-[#FFFDF7]"
                    : "text-beevo-body hover:bg-white hover:text-beevo-ink"
                }`}
              >
                {tab.label}{" "}
                <span className="ml-1 font-mono text-[11px] opacity-80">({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 text-center">
          <p className="font-display text-[14.5px] font-extrabold text-beevo-ink">
            No {activeTab} records available for this user ID
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-beevo-muted">
            When Phase 4 connects Supabase Postgres, this tab loads verified {activeTab} scoped
            strictly to <span className="font-mono">{userId}</span> via server-authorized admin
            queries.
          </p>
        </div>
      </section>

      {/* Audited Credit Adjustment Mini-Drawer Modal */}
      {confirmMode === "credits" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-credit-adjust-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-[#171717]/50 backdrop-blur-[2px]"
            onClick={() => setConfirmMode(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-[460px] rounded-[12px] border border-beevo-border bg-white p-5 shadow-xl">
            <h2
              id="quick-credit-adjust-title"
              className="font-display text-[16px] font-extrabold text-beevo-ink"
            >
              Audited Credit Adjustment
            </h2>
            <p className="mt-1 text-[12.5px] text-beevo-muted">
              Posts an append-only ledger entry and audit record—never overwrites balance directly.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["add", "deduct"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setAdjustDirection(dir)}
                  aria-pressed={adjustDirection === dir}
                  className={`min-h-[40px] rounded-[8px] border text-[13px] font-bold capitalize ${
                    adjustDirection === dir
                      ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                      : "border-beevo-border bg-[#FAF8F3] text-beevo-body"
                  }`}
                >
                  {dir} credits
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label htmlFor="detail-adjust-amount" className="block text-[12px] font-bold text-beevo-ink">
                Credit Amount
              </label>
              <input
                id="detail-adjust-amount"
                type="number"
                min={25}
                step={25}
                value={adjustCredits}
                onChange={(e) => setAdjustCredits(e.target.value)}
                className="mt-1 min-h-[42px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 font-mono text-[13.5px] font-bold text-beevo-ink"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmMode(null)}
                className="min-h-[40px] rounded-[8px] border border-beevo-border bg-white px-4 text-[13px] font-bold text-beevo-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setFeedback(
                    `Audited ${adjustDirection} of ${adjustCredits} credits for ${userId} requires Phase 4 backend credit ledger endpoint POST /api/admin/credits/adjustments.`
                  );
                  setConfirmMode(null);
                }}
                className="min-h-[40px] rounded-[8px] bg-[#FFC928] px-4 text-[13px] font-extrabold text-beevo-ink"
              >
                Submit Audited Request
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={confirmMode === "suspend" || confirmMode === "reactivate"}
        title={confirmMode === "suspend" ? "Suspend User Account" : "Reactivate User Account"}
        description={`Confirm ${confirmMode ?? ""} for account ${userId}. All status changes are logged immutably in /admin/audit-logs.`}
        confirmLabel={confirmMode === "suspend" ? "Suspend Account" : "Reactivate Account"}
        tone={confirmMode === "suspend" ? "danger" : "neutral"}
        requireReason
        onClose={() => setConfirmMode(null)}
        onConfirm={(reason) => {
          setFeedback(
            `Status change (${confirmMode}) for ${userId} with audit reason "${reason}" awaits Phase 4 server endpoint POST /api/admin/users/${userId}/status.`
          );
          setConfirmMode(null);
        }}
      />
    </div>
  );
}
