"use client";

import { ArrowLeft, ArrowRight, ArchiveRestore, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import type { CourseEditor } from "@/lib/creator-types";
import { useAsyncData } from "@/lib/hooks";
import { getCourseService, type CourseStage } from "@/lib/services/courses";
import { cn, formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "@/components/creator/dialogs";
import { CurriculumStage } from "@/components/creator/wizard/curriculum";
import {
  DetailsStage,
  PricingStage,
  ReviewStage,
  StorefrontPreviewModal,
} from "@/components/creator/wizard/stages";
import { CardListSkeleton, FailedState, StatusChip } from "@/components/creator/ui";
import { UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const STAGES: { id: CourseStage; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "curriculum", label: "Curriculum" },
  { id: "pricing", label: "Pricing" },
  { id: "review", label: "Review & publish" },
];

export function CourseWizard({
  courseId,
  initialStage = "details",
}: {
  courseId: string;
  initialStage?: CourseStage;
}) {
  const toast = useToast();
  const service = getCourseService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getCourse(courseId)
        : Promise.resolve({
            ok: false as const,
            error: { code: "unavailable", message: "Course service unavailable" },
          }),
    [courseId],
  );
  const [course, setCourse] = useState<CourseEditor | null>(null);
  const [stage, setStage] = useState<CourseStage>(initialStage);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (state.status === "success") setCourse(state.data);
  }, [state]);

  if (!service) {
    return (
      <UnavailablePanel
        title="Course services aren't connected yet"
        message="The editor needs the course backend, which connects in Prompt 5."
      />
    );
  }

  if (state.status === "loading" || state.status === "idle" || (state.status === "success" && !course)) {
    return (
      <div className="space-y-4 pt-4">
        <CardListSkeleton count={3} />
      </div>
    );
  }

  if (state.status === "error") {
    const notFound = state.error.code === "not_found";
    return (
      <div className="space-y-4 pt-4">
        <FailedState
          title={notFound ? "Course not found" : "Couldn't load the editor"}
          body={state.error.message}
          onRetry={notFound ? undefined : reload}
        />
        <Button href="/creator/courses" variant="outline" size="sm">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to My Courses
        </Button>
      </div>
    );
  }

  if (!course) return null;

  const readOnly = course.status === "archived";
  const stageIndex = STAGES.findIndex((item) => item.id === stage);

  const saveDraft = async () => {
    setSavingDraft(true);
    const result = await service.saveDetails(course.id, {});
    setSavingDraft(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't save the draft", description: result.error.message });
      return;
    }
    setCourse(result.data);
    toast.push({ variant: "success", title: "Draft saved", description: "Everything is up to date." });
  };

  const restore = async () => {
    setRestoring(true);
    const result = await service.unarchive(course.id);
    setRestoring(false);
    setConfirmRestore(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't restore", description: result.error.message });
      return;
    }
    setCourse(result.data);
    toast.push({ variant: "success", title: "Course restored", description: "It's back in drafts and fully editable." });
  };

  return (
    <div className="pb-6">
      {/* Editor header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button href="/creator/courses" variant="outline" size="sm">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My courses
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={course.status} />
          <span className="text-[11px] font-semibold text-smoke">
            Updated {formatDateTime(course.updatedAt)}
          </span>
        </div>
      </div>

      <h1 className="mt-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {course.title || "Untitled course"}
      </h1>

      {readOnly ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-sand/60 p-4">
          <p className="text-sm font-semibold text-ink">
            This course is archived — the editor is read-only.
          </p>
          <Button type="button" size="sm" variant="ink" onClick={() => setConfirmRestore(true)}>
            <ArchiveRestore className="size-4" aria-hidden="true" />
            Restore to drafts
          </Button>
        </div>
      ) : null}

      {/* Stage stepper */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Editor stages">
        {STAGES.map((item, index) => {
          const active = item.id === stage;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStage(item.id)}
              className={cn(
                "rounded-xl border-2 px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-ink bg-ink text-cream shadow-hard-xs"
                  : "border-ink bg-white text-ink hover:bg-parchment",
              )}
            >
              <span className={cn("font-editorial mr-1.5 italic", active ? "text-lime" : "text-accent")}>
                {index + 1}.
              </span>
              <span className="text-xs font-bold sm:text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stage body */}
      <div className="mt-6 rounded-3xl border-2 border-ink bg-cream p-4 sm:p-6">
        {stage === "details" ? (
          <DetailsStage course={course} service={service} setCourse={setCourse} readOnly={readOnly} />
        ) : null}
        {stage === "curriculum" ? (
          <CurriculumStage
            course={course}
            service={service}
            setCourse={setCourse}
            readOnly={readOnly}
            goToReview={() => setStage("review")}
          />
        ) : null}
        {stage === "pricing" ? (
          <PricingStage
            course={course}
            service={service}
            setCourse={setCourse}
            readOnly={readOnly}
            goToReview={() => setStage("review")}
          />
        ) : null}
        {stage === "review" ? (
          <ReviewStage
            course={course}
            service={service}
            setCourse={setCourse}
            goToStage={setStage}
            onOpenPreview={() => setPreviewOpen(true)}
            readOnly={readOnly}
          />
        ) : null}
      </div>

      {/* Footer navigation */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          {stageIndex > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setStage(STAGES[stageIndex - 1].id)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {STAGES[stageIndex - 1].label}
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={saveDraft} loading={savingDraft}>
              Save draft
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" aria-hidden="true" />
            Preview storefront
          </Button>
          {stageIndex < STAGES.length - 1 ? (
            <Button type="button" variant="ink" size="sm" onClick={() => setStage(STAGES[stageIndex + 1].id)}>
              {STAGES[stageIndex + 1].label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>

      <StorefrontPreviewModal course={course} open={previewOpen} onClose={() => setPreviewOpen(false)} />

      <ConfirmDialog
        open={confirmRestore}
        title="Restore this course?"
        body="It will move back to your drafts in read/write mode. You can re-publish it after review."
        confirmLabel="Restore to drafts"
        loading={restoring}
        onConfirm={restore}
        onCancel={() => setConfirmRestore(false)}
      />
    </div>
  );
}
