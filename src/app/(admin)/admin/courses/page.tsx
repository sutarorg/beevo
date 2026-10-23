"use client";

import { Clapperboard, Flag, FlagOff, Globe, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { CourseAdminRow } from "@/lib/admin-types";
import type { CourseStatus } from "@/lib/creator-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";
import { DetailRow, SearchInput, StatusPill } from "@/components/admin/ui";
import {
  CardListSkeleton,
  DemoChip,
  EmptyState,
  FailedState,
  PageHeader,
  StatusChip,
} from "@/components/creator/ui";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Action = "publish" | "unpublish" | "flag" | "unflag";

const ACTION_COPY: Record<Action, { title: string; confirm: string; body: (course: CourseAdminRow) => string }> = {
  publish: {
    title: "Publish this course?",
    confirm: "Publish course",
    body: (course) => `“${course.title}” becomes publicly purchasable from @${course.creatorHandle}'s storefront.`,
  },
  unpublish: {
    title: "Unpublish this course?",
    confirm: "Unpublish course",
    body: (course) => `“${course.title}” stops selling publicly. Enrolled learners keep full access and no financial records change.`,
  },
  flag: {
    title: "Flag for review?",
    confirm: "Flag course",
    body: (course) => `“${course.title}” is marked for content review. The creator is not notified in this demo.`,
  },
  unflag: {
    title: "Clear the review flag?",
    confirm: "Clear flag",
    body: (course) => `Removes the content-review flag from “${course.title}”.`,
  },
};

export default function AdminCoursesPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listCourses()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "all">("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<{ course: CourseAdminRow; action: Action } | null>(null);
  const [detail, setDetail] = useState<CourseAdminRow | null>(null);
  const [acting, setActing] = useState(false);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((course) => {
      if (statusFilter !== "all" && course.status !== statusFilter) return false;
      if (flaggedOnly && !course.flaggedForReview) return false;
      if (!query) return true;
      return [course.title, course.creatorName, course.creatorHandle].join(" ").toLowerCase().includes(query);
    });
  }, [state, search, statusFilter, flaggedOnly]);

  const runAction = async () => {
    if (!confirm || !service) return;
    setActing(true);
    const result = await service.moderateCourse(confirm.course.id, confirm.action, note);
    setActing(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Moderation failed", description: result.error.message });
      return;
    }
    toast.push({
      variant: "success",
      title: ACTION_COPY[confirm.action].confirm,
      description: "Learner access and financial records were not touched. Logged to audit.",
    });
    setConfirm(null);
    setDetail(null);
    setNote("");
    reload();
  };

  return (
    <div>
      <PageHeader title="Courses" sub="Catalog administration — moderation, publication state, and enrolment visibility.">
        <DemoChip />
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title or creator…" label="Search courses" />
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "published", "unpublished", "draft", "archived"] as const).map((value) => (
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
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-bold text-ink">
            <input type="checkbox" checked={flaggedOnly} onChange={(event) => setFlaggedOnly(event.target.checked)} className="slider-accent size-4" />
            Flagged only
          </label>
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="size-6 text-smoke" aria-hidden="true" />}
          title="No courses match"
          body="Try another search, status, or clear the flagged filter."
        >
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); setFlaggedOnly(false); }}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((course) => (
            <li key={course.id} className="rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-xs">
              <button type="button" onClick={() => setDetail(course)} className="flex w-full items-start gap-3 text-left">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-parchment">
                  <Clapperboard className="size-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">{course.title}</span>
                    <StatusChip status={course.status} />
                    {course.flaggedForReview ? <StatusPill label="Flagged" tone="accent" /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-smoke">
                    @{course.creatorHandle} · {course.priceInPaise !== null ? formatINR(course.priceInPaise) : "no price"} · {course.enrollmentCount} enrolments · updated {formatDate(course.updatedAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs font-bold text-ink tabular-nums">{formatINR(course.grossInPaise)}</span>
              </button>
              <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-ink/10 pt-3">
                {course.status === "published" ? (
                  <Button size="sm" variant="outline" onClick={() => setConfirm({ course, action: "unpublish" })}>
                    <Undo2 className="size-3.5" aria-hidden="true" /> Unpublish
                  </Button>
                ) : null}
                {course.status === "unpublished" ? (
                  <Button size="sm" variant="lime" onClick={() => setConfirm({ course, action: "publish" })}>
                    <Globe className="size-3.5" aria-hidden="true" /> Publish
                  </Button>
                ) : null}
                {course.flaggedForReview ? (
                  <Button size="sm" variant="outline" onClick={() => setConfirm({ course, action: "unflag" })}>
                    <FlagOff className="size-3.5" aria-hidden="true" /> Clear flag
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setConfirm({ course, action: "flag" })}>
                    <Flag className="size-3.5" aria-hidden="true" /> Flag for review
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setDetail(course)}>
                  Details
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Detail modal */}
      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? "Course"}>
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusChip status={detail.status} />
              {detail.flaggedForReview ? <StatusPill label="Flagged for review" tone="accent" /> : null}
            </div>
            <div>
              <DetailRow label="Creator">{detail.creatorName} (@{detail.creatorHandle})</DetailRow>
              <DetailRow label="Price">{detail.priceInPaise !== null ? formatINR(detail.priceInPaise) : "Not set"}</DetailRow>
              <DetailRow label="Enrolments">{detail.enrollmentCount}</DetailRow>
              <DetailRow label="Gross (paid)">{formatINR(detail.grossInPaise)}</DetailRow>
              <DetailRow label="Last updated">{formatDate(detail.updatedAt)}</DetailRow>
              <DetailRow label="Course ID" mono>{detail.id}</DetailRow>
            </div>
            <p className="rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
              Moderation never removes learner access or edits orders/ledger — those are separate
              systems. Unpublished courses stop selling but existing students keep watching.
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.status === "published" ? (
                <Button size="sm" variant="accent" onClick={() => setConfirm({ course: detail, action: "unpublish" })}>
                  Unpublish
                </Button>
              ) : null}
              {detail.status === "unpublished" ? (
                <Button size="sm" variant="ink" onClick={() => setConfirm({ course: detail, action: "publish" })}>
                  Publish
                </Button>
              ) : null}
              {detail.flaggedForReview ? (
                <Button size="sm" variant="outline" onClick={() => setConfirm({ course: detail, action: "unflag" })}>
                  Clear flag
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirm({ course: detail, action: "flag" })}>
                  Flag for review
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Confirm moderation */}
      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm ? ACTION_COPY[confirm.action].title : ""}>
        {confirm ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-smoke">{ACTION_COPY[confirm.action].body(confirm.course)}</p>
            <div>
              <label htmlFor="moderation-note" className="block text-sm font-semibold text-ink">
                Note for the audit log
              </label>
              <textarea
                id="moderation-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Optional but recommended"
                className="mt-1.5 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
              />
            </div>
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirm(null)} disabled={acting}>
                Cancel
              </Button>
              <Button variant={confirm.action === "unpublish" || confirm.action === "flag" ? "accent" : "ink"} onClick={runAction} loading={acting}>
                {ACTION_COPY[confirm.action].confirm}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
