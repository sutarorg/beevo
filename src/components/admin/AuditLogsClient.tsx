"use client";

import React, { useMemo, useState } from "react";
import { Lock, ScrollText, Search } from "lucide-react";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import type {
  AdminApiError,
  AdminApiState,
  AdminAuditLogEntry,
} from "@/lib/admin-types";

interface AuditLogsClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialLogs: AdminAuditLogEntry[];
}

export function AuditLogsClient({ apiState, apiError, initialLogs }: AuditLogsClientProps) {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | AdminAuditLogEntry["result"]>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialLogs.filter((entry) => {
      if (
        q &&
        !entry.actorEmail.toLowerCase().includes(q) &&
        !entry.action.toLowerCase().includes(q) &&
        !entry.target.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (resultFilter !== "all" && entry.result !== resultFilter) return false;
      if (dateFilter && entry.timestamp.slice(0, 10) !== dateFilter) return false;
      return true;
    });
  }, [initialLogs, search, resultFilter, dateFilter]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            Audit Logs
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Strictly read-only chronological record of all administrative actions, credit
            adjustments, refunds, configuration updates, and sensitive content inspections.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-[8px] border border-beevo-border bg-white px-3 py-2 text-[11.5px] font-bold text-beevo-body sm:self-auto">
          <Lock className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
          Immutable read-only history (no edit or delete)
        </span>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Chronological admin audit trail"
      />

      {/* Filters */}
      <section
        aria-label="Filter audit logs"
        className="rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search admin actor, action, or target"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Actor email, action, or target ID..."
              className="min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] pl-8 pr-3 text-[12.5px] text-beevo-ink focus:border-beevo-ink focus:bg-white"
            />
          </div>

          <select
            aria-label="Filter by audit result"
            value={resultFilter}
            onChange={(e) =>
              setResultFilter(e.target.value as "all" | AdminAuditLogEntry["result"])
            }
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 text-[12.5px] font-semibold text-beevo-ink"
          >
            <option value="all">Result: All</option>
            <option value="success">Success</option>
            <option value="denied">Denied (403)</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            aria-label="Filter audit logs by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="min-h-[40px] rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-2.5 font-mono text-[12px] text-beevo-ink"
          />
        </div>
      </section>

      {/* Strictly Read-Only 6-Column Audit Log Table */}
      <section className="overflow-hidden rounded-[12px] border border-beevo-border bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] border-collapse text-left text-[12px]">
            <caption className="sr-only">Immutable Beevo administrative audit log</caption>
            <thead>
              <tr className="border-b border-beevo-border bg-[#FAF8F3] text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                <th scope="col" className="px-3.5 py-3">Admin actor</th>
                <th scope="col" className="px-3.5 py-3">Action</th>
                <th scope="col" className="px-3.5 py-3">Target</th>
                <th scope="col" className="px-3.5 py-3">Result</th>
                <th scope="col" className="px-3.5 py-3">Timestamp</th>
                <th scope="col" className="px-3.5 py-3 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beevo-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ScrollText className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
                    <p className="mt-2.5 font-display text-[14.5px] font-extrabold text-beevo-ink">
                      No audit events recorded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-[12.5px] text-beevo-muted">
                      Every verified admin action—suspensions, credit ledger adjustments, Razorpay
                      refund requests, configuration updates, and generation inspections—writes an
                      immutable server entry here in Phase 4.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-[#FAF8F3]/60">
                      <td className="px-3.5 py-3 font-semibold text-beevo-ink">
                        {entry.actorEmail}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[11.5px] text-beevo-ink">
                        {entry.action}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[11.5px] text-beevo-body">
                        {entry.target}
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`rounded-[5px] border px-2 py-0.5 text-[11px] font-bold capitalize ${
                            entry.result === "success"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-800"
                          }`}
                        >
                          {entry.result}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[11px] text-beevo-muted">
                        {entry.timestamp}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((prev) => (prev === entry.id ? null : entry.id))
                          }
                          aria-expanded={expandedId === entry.id}
                          className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 text-[11.5px] font-bold text-beevo-ink hover:bg-[#FAF8F3]"
                        >
                          {expandedId === entry.id ? "Hide JSON" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === entry.id && (
                      <tr>
                        <td colSpan={6} className="bg-[#FAF8F3] px-4 py-3">
                          <pre className="overflow-x-auto rounded-[8px] border border-beevo-border bg-white p-3 font-mono text-[11.5px] text-beevo-ink">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 text-center md:hidden">
          <ScrollText className="mx-auto h-6 w-6 text-beevo-muted/70" aria-hidden="true" />
          <p className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
            No audit events recorded yet
          </p>
          <p className="mt-1 text-[12.5px] text-beevo-muted">
            Chronological server audit records stream here in Phase 4.
          </p>
        </div>
      </section>
    </div>
  );
}
