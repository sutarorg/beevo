"use client";

import { Ban, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AccountStatus, CreatorDetail, CreatorRow } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";
import { DetailRow, HistoryTimeline, SearchInput, StatusPill } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/creator/ui";
import { useToast } from "@/components/ui/toast";

type StatusFilter = "all" | AccountStatus;

export default function AdminCreatorsPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listCreators()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [detail, setDetail] = useState<CreatorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ creator: CreatorRow; action: "suspend" | "reactivate" } | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((creator) => {
      if (statusFilter !== "all" && creator.status !== statusFilter) return false;
      if (!query) return true;
      return [creator.displayName, creator.handle, creator.email, creator.niche]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [state, search, statusFilter]);

  const openDetail = async (creator: CreatorRow) => {
    if (!service) return;
    setDetailLoading(true);
    const result = await service.getCreator(creator.id);
    setDetailLoading(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't load creator", description: result.error.message });
      return;
    }
    setDetail(result.data);
  };

  const runAction = async () => {
    if (!confirm || !service) return;
    setActing(true);
    const result = await service.setCreatorStatus(
      confirm.creator.id,
      confirm.action === "suspend" ? "suspended" : "active",
      reason,
    );
    setActing(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Action failed", description: result.error.message });
      return;
    }
    setConfirm(null);
    setReason("");
    setDetail(null);
    toast.push({
      variant: "success",
      title: confirm.action === "suspend" ? "Creator suspended" : "Creator reactivated",
      description: "Written to the audit log.",
    });
    reload();
  };

  // Progressively close the confirm dialog if it references a gone creator.
  useEffect(() => {
    if (confirm && state.status === "success" && !state.data.some((c) => c.id === confirm.creator.id)) {
      setConfirm(null);
    }
  }, [confirm, state]);

  return (
    <div>
      <PageHeader title="Creators" sub="Every creator on the platform — search, inspect, and manage account status.">
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, handle, email, niche…" label="Search creators" />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-sm font-bold text-ink"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-6 text-smoke" aria-hidden="true" />}
          title="No creators match"
          body="Try another search or status filter."
        >
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((creator) => (
            <li key={creator.id}>
              <button
                type="button"
                onClick={() => void openDetail(creator)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${creator.status === "suspended" ? "bg-sand text-smoke" : "bg-lime"}`}>
                  {creator.displayName.split(" ").map((part) => part[0]).join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">{creator.displayName}</span>
                    <StatusPill label={creator.status} tone={creator.status === "active" ? "lime" : "accent"} />
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    @{creator.handle} · {creator.niche} · joined {formatDate(creator.joinedAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <span className="block font-bold text-ink tabular-nums">{formatINR(creator.grossInPaise)}</span>
                  <span className="text-smoke">{creator.publishedCount}/{creator.courseCount} live</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Detail modal */}
      <Modal open={detail !== null || detailLoading} onClose={() => setDetail(null)} title={detail?.displayName ?? "Loading…"} wide>
        {detailLoading || !detail ? (
          <p className="py-10 text-center text-sm text-smoke">Loading creator…</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-accent">@{detail.handle}</p>
                <p className="text-xs text-smoke">{detail.email} · joined {formatDate(detail.joinedAt)} · last active {formatDate(detail.lastActiveAt)}</p>
              </div>
              <StatusPill label={detail.status} tone={detail.status === "active" ? "lime" : "accent"} />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                ["Gross sales", formatINR(detail.grossInPaise)],
                ["Learners", String(detail.learnerCount)],
                ["Live courses", `${detail.publishedCount}/${detail.courseCount}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                  <p className="text-base font-bold text-ink tabular-nums">{value}</p>
                  <p className="text-[10px] font-bold tracking-wide text-smoke uppercase">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Courses</p>
              <ul className="mt-2 space-y-2">
                {detail.courses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{course.title}</p>
                      <p className="text-[11px] text-smoke">
                        {course.priceInPaise !== null ? formatINR(course.priceInPaise) : "No price"} · {course.enrollments} enrolments
                      </p>
                    </div>
                    <StatusChip status={course.status} />
                  </li>
                ))}
                {detail.courses.length === 0 ? (
                  <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">No courses yet.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Relevant history</p>
              <div className="mt-2">
                <HistoryTimeline events={detail.history} emptyLabel="No recorded admin actions for this creator." />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t-2 border-ink/10 pt-4">
              {detail.status === "active" ? (
                <Button variant="accent" size="sm" onClick={() => setConfirm({ creator: detail, action: "suspend" })}>
                  <Ban className="size-4" aria-hidden="true" />
                  Suspend creator
                </Button>
              ) : (
                <Button variant="ink" size="sm" onClick={() => setConfirm({ creator: detail, action: "reactivate" })}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Reactivate creator
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm suspend/reactivate */}
      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm?.action === "suspend" ? "Suspend this creator?" : "Reactivate this creator?"}>
        {confirm ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-smoke">
              {confirm.action === "suspend" ? (
                <>
                  <span className="font-semibold text-ink">{confirm.creator.displayName}</span> will
                  lose access to the studio and their storefront stops selling. Existing learner
                  access is untouched. The reason is written to the audit log.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink">{confirm.creator.displayName}</span>{" "}
                  regains studio access and can sell again.
                </>
              )}
            </p>
            {confirm.action === "suspend" ? (
              <div>
                <label htmlFor="suspend-reason" className="block text-sm font-semibold text-ink">
                  Reason (required)
                </label>
                <textarea
                  id="suspend-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder="e.g. Repeated copyright complaints pending review"
                  className="mt-1.5 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
                />
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirm(null)} disabled={acting}>
                Cancel
              </Button>
              <Button
                variant={confirm.action === "suspend" ? "accent" : "ink"}
                onClick={runAction}
                loading={acting}
                disabled={confirm.action === "suspend" && !reason.trim()}
              >
                {confirm.action === "suspend" ? "Suspend creator" : "Reactivate creator"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
