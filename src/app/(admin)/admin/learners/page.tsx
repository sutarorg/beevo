"use client";

import { GraduationCap, LifeBuoy } from "lucide-react";
import { useMemo, useState } from "react";
import type { LearnerDetail, LearnerRow } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";
import { DetailRow, SearchInput, StatusPill } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function AdminLearnersPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listLearners()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<LearnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((learner) => {
      if (!query) return true;
      return [learner.fullName, learner.email].join(" ").toLowerCase().includes(query);
    });
  }, [state, search]);

  const openDetail = async (learner: LearnerRow) => {
    if (!service) return;
    setDetailLoading(true);
    const result = await service.getLearner(learner.id);
    setDetailLoading(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't load learner", description: result.error.message });
      return;
    }
    setDetail(result.data);
  };

  return (
    <div>
      <PageHeader title="Learners" sub="Buyers and students across all creators. Views request only the fields each list needs.">
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" label="Search learners" />
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-6 text-smoke" aria-hidden="true" />}
          title="No learners match"
          body="Try a different search."
        >
          <Button size="sm" variant="outline" onClick={() => setSearch("")}>
            Clear search
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((learner) => (
            <li key={learner.id}>
              <button
                type="button"
                onClick={() => void openDetail(learner)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-parchment text-sm font-bold">
                  {learner.fullName.split(" ").map((part) => part[0]).join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">{learner.fullName}</span>
                    <StatusPill label={learner.status} tone="lime" />
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    {learner.email} · joined {formatDate(learner.joinedAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <span className="block font-bold text-ink tabular-nums">{formatINR(learner.totalSpendInPaise)}</span>
                  <span className="text-smoke">{learner.enrolledCourses} course{learner.enrolledCourses === 1 ? "" : "s"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={detail !== null || detailLoading} onClose={() => setDetail(null)} title={detail?.fullName ?? "Loading…"} wide>
        {detailLoading || !detail ? (
          <p className="py-10 text-center text-sm text-smoke">Loading learner…</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["Total spend", formatINR(detail.totalSpendInPaise)],
                ["Courses", String(detail.enrolledCourses)],
                ["Status", detail.status],
                ["Joined", formatDate(detail.joinedAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                  <p className="truncate text-sm font-bold text-ink capitalize">{value}</p>
                  <p className="text-[10px] font-bold tracking-wide text-smoke uppercase">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Enrolment records</p>
              <ul className="mt-2 space-y-2">
                {detail.enrollments.map((enrolment) => (
                  <li key={enrolment.courseId} className="rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-ink">{enrolment.courseTitle}</p>
                      <p className="shrink-0 text-[11px] font-bold text-moss tabular-nums">{enrolment.progressPct}% watched</p>
                    </div>
                    <p className="text-[11px] text-smoke">
                      by {enrolment.creatorName} · enrolled {formatDate(enrolment.enrolledAt)}
                    </p>
                  </li>
                ))}
                {detail.enrollments.length === 0 ? (
                  <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">No enrolments yet.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Recent orders</p>
              <ul className="mt-2 space-y-2">
                {detail.recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{order.courseTitle}</p>
                      <p className="font-mono text-[10px] text-smoke">{order.id} · {formatDate(order.placedAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-ink tabular-nums">{formatINR(order.amountInPaise)}</p>
                      <StatusPill label={order.status} tone={order.status === "paid" ? "lime" : order.status === "failed" ? "accent" : "sand"} />
                    </div>
                  </li>
                ))}
                {detail.recentOrders.length === 0 ? (
                  <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">No orders.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.18em] text-smoke uppercase">
                <LifeBuoy className="size-3.5" aria-hidden="true" /> Support context
              </p>
              <ul className="mt-2 space-y-2">
                {detail.supportTickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5 text-xs">
                    <p className="font-bold text-ink">{ticket.subject}</p>
                    <p className="text-smoke">Status: {ticket.status} · {formatDate(ticket.createdAt)}</p>
                  </li>
                ))}
                {detail.supportTickets.length === 0 ? (
                  <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">No support history for this learner.</li>
                ) : null}
              </ul>
            </div>

            <div className="border-t-2 border-ink/10 pt-4">
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
