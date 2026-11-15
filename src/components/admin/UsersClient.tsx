"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Coins,
  Eye,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import { formatDurationLabel } from "@/lib/app-types";
import {
  formatNumberNullable,
  type AccountStatus,
  type AdminApiError,
  type AdminApiState,
  type AdminUserRow,
} from "@/lib/admin-types";

interface UsersClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialUsers: AdminUserRow[];
}

type SortKey = "registeredAt" | "creditBalance" | "completedVideos" | "generatedDurationSeconds";

export function UsersClient({ apiState, apiError, initialUsers }: UsersClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("registeredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [sortAnnouncement, setSortAnnouncement] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    user: AdminUserRow;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const pageSize = 20;

  const toggleSort = (key: SortKey, label: string) => {
    const nextDir = sortKey === key && sortDir === "desc" ? "asc" : "desc";
    setSortKey(key);
    setSortDir(nextDir);
    setSortAnnouncement(`Users sorted by ${label} (${nextDir === "asc" ? "ascending" : "descending"}).`);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialUsers
      .filter((u) => {
        if (
          q &&
          !u.fullName.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !u.id.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (statusFilter !== "all" && u.status !== statusFilter) return false;
        if (dateFrom && u.registeredAt.slice(0, 10) < dateFrom) return false;
        if (dateTo && u.registeredAt.slice(0, 10) > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const factor = sortDir === "asc" ? 1 : -1;
        if (sortKey === "registeredAt") {
          return (new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()) * factor;
        }
        if (sortKey === "creditBalance") {
          return ((a.creditBalance ?? -1) - (b.creditBalance ?? -1)) * factor;
        }
        if (sortKey === "completedVideos") {
          return (a.completedVideos - b.completedVideos) * factor;
        }
        return (a.generatedDurationSeconds - b.generatedDurationSeconds) * factor;
      });
  }, [initialUsers, search, statusFilter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            User Management
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Inspect customer accounts, credit balances, video output, and audited account status
            actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/credits"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3.5 text-[12.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
          >
            <Coins className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
            Credit Adjustment Workbench
          </Link>
          <Link
            href="/admin/users/inspect"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] bg-beevo-dark px-3.5 text-[12.5px] font-bold text-[#FFFDF7] hover:bg-[#2F2B25]"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Dossier View
          </Link>
        </div>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Customer accounts and credit balances"
      />

      {actionFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[10px] border border-beevo-border-warm bg-beevo-cream/80 px-4 py-3 text-[13px] font-semibold text-beevo-ink"
        >
          {actionFeedback}
        </div>
      )}

      {/* Search & Operational Filters */}
      <section
        aria-label="Filter user directory"
        className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <label htmlFor="admin-users-search" className="sr-only">
              Search users by name, email, or user ID
            </label>
            <input
              id="admin-users-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, or user ID..."
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-9 pr-3 text-[13px] text-beevo-ink placeholder:text-beevo-muted/75 focus:border-beevo-ink focus:bg-white"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="admin-users-status" className="sr-only">
              Filter by account status
            </label>
            <select
              id="admin-users-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | AccountStatus);
                setPage(1);
              }}
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 text-[13px] font-semibold text-beevo-ink"
            >
              <option value="all">Account status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 md:col-span-4">
            <input
              type="date"
              aria-label="Registered from date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 font-mono text-[12px] text-beevo-ink"
            />
            <input
              type="date"
              aria-label="Registered to date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 font-mono text-[12px] text-beevo-ink"
            />
          </div>
        </div>
      </section>

      <div className="sr-only" role="status" aria-live="polite">
        {sortAnnouncement}
      </div>

      {/* Desktop / Tablet Operational Table + Mobile Cards */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-[12.5px]">
            <caption className="sr-only">Beevo registered user accounts</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[11px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th
                  scope="col"
                  aria-sort={
                    sortKey === "registeredAt"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("registeredAt", "registration date")}
                    className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-beevo-ink"
                  >
                    Registration date
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortKey === "creditBalance"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-4 py-3 text-right"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("creditBalance", "credit balance")}
                    className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-beevo-ink"
                  >
                    Credit balance
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right">Total projects</th>
                <th
                  scope="col"
                  aria-sort={
                    sortKey === "completedVideos"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-4 py-3 text-right"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("completedVideos", "completed videos")}
                    className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-beevo-ink"
                  >
                    Completed videos
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortKey === "generatedDurationSeconds"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-4 py-3 text-right"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("generatedDurationSeconds", "generated duration")}
                    className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-beevo-ink"
                  >
                    Generated duration
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3">Account status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No user accounts returned
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Registered customer profiles, derived credit balances, and project counts
                      load from Supabase Postgres once Phase 4 connects.
                    </p>
                  </td>
                </tr>
              ) : (
                paged.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FAF8F3]/60">
                    <td className="px-4 py-3 font-bold text-beevo-ink">
                      <Link href={`/admin/users/${user.id}`} className="hover:underline">
                        {user.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-beevo-body">{user.email}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-beevo-muted">
                      {user.registeredAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-beevo-ink">
                      {formatNumberNullable(user.creditBalance, " cr")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{user.totalProjects}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{user.completedVideos}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatDurationLabel(user.generatedDurationSeconds)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-[6px] border px-2 py-0.5 text-[11px] font-bold capitalize ${
                          user.status === "active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 text-[11.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget({
                              user,
                              action: user.status === "active" ? "suspend" : "reactivate",
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 text-[11.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="h-3 w-3 text-red-700" aria-hidden="true" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 text-emerald-700" aria-hidden="true" />
                              Reactivate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Alternative (< 768px) */}
        <div className="divide-y divide-beevo-border md:hidden">
          {paged.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Users className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
              <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
                No user accounts returned
              </p>
              <p className="mt-1 text-[12.5px] text-beevo-muted">
                Customer records populate here once Supabase connects in Phase 4.
              </p>
            </div>
          ) : (
            paged.map((user) => (
              <article key={user.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-display text-[14.5px] font-extrabold text-beevo-ink"
                    >
                      {user.fullName}
                    </Link>
                    <p className="text-[12px] text-beevo-muted">{user.email}</p>
                  </div>
                  <span
                    className={`rounded-[6px] border px-2 py-0.5 text-[11px] font-bold capitalize ${
                      user.status === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <dt className="text-beevo-muted">Credit balance</dt>
                    <dd className="font-bold tabular-nums text-beevo-ink">
                      {formatNumberNullable(user.creditBalance, " cr")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-beevo-muted">Registered</dt>
                    <dd className="font-mono text-beevo-body">{user.registeredAt.slice(0, 10)}</dd>
                  </div>
                  <div>
                    <dt className="text-beevo-muted">Projects / Videos</dt>
                    <dd className="font-semibold text-beevo-ink">
                      {user.totalProjects} / {user.completedVideos}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-beevo-muted">Generated duration</dt>
                    <dd className="font-semibold text-beevo-ink">
                      {formatDurationLabel(user.generatedDurationSeconds)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-beevo-border bg-[#FAF8F3] px-4 py-2.5 text-[12px]">
          <span className="font-semibold tabular-nums text-beevo-muted">
            Showing {paged.length} of {filtered.length} users &middot; Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
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
        open={confirmTarget !== null}
        title={
          confirmTarget?.action === "suspend" ? "Suspend User Account" : "Reactivate User Account"
        }
        description={
          confirmTarget
            ? `This audited server action will ${confirmTarget.action} ${confirmTarget.user.email} and write an immutable audit entry.`
            : ""
        }
        confirmLabel={confirmTarget?.action === "suspend" ? "Confirm Suspension" : "Reactivate Account"}
        tone={confirmTarget?.action === "suspend" ? "danger" : "neutral"}
        requireReason
        onClose={() => setConfirmTarget(null)}
        onConfirm={(reason) => {
          if (!confirmTarget) return;
          setActionFeedback(
            `Account ${confirmTarget.action} for ${confirmTarget.user.email} (reason: "${reason}") requires server-verified Supabase RBAC in Phase 4.`
          );
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
