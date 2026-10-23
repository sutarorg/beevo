"use client";

import { ArrowLeft, ArrowRight, ListVideo } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback, useAsyncData } from "@/lib/hooks";
import type { ApiResult } from "@/lib/domain";
import type { LearnerCourseView, LearnerLessonView } from "@/lib/learner-types";
import { getLearnerService } from "@/lib/services/learner";
import { CardListSkeleton, FailedState, Skeleton } from "@/components/creator/ui";
import { CurriculumPanel, NotEnrolledPanel } from "@/components/learner/course-ui";
import { CompletionToggle, DirectPlayer, ResourceDownloads, SimulatedPlayer } from "@/components/learner/player";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function LearnerLessonPage({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const toast = useToast();
  const service = getLearnerService();
  const { state, reload } = useAsyncData(
    async (): Promise<ApiResult<{ lesson: LearnerLessonView; course: LearnerCourseView }>> => {
      if (!service) {
        return { ok: false, error: { code: "unavailable", message: "Service unavailable" } };
      }
      const lesson = await service.getLesson(courseId, lessonId);
      if (!lesson.ok) return { ok: false, error: lesson.error };
      const course = await service.getCourse(courseId);
      if (!course.ok) return { ok: false, error: course.error };
      return { ok: true, data: { lesson: lesson.data, course: course.data } };
    },
    [courseId, lessonId],
  );
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (state.status === "success") setCompleted(state.data.lesson.lesson.completed);
  }, [state]);

  const savePosition = useCallback(
    (positionSeconds: number) => {
      if (!service) return;
      void service.updateProgress(courseId, lessonId, { positionSeconds });
    },
    [service, courseId, lessonId],
  );
  const debouncedSavePosition = useDebouncedCallback(savePosition, 400);

  const setCompletion = async (next: boolean) => {
    if (!service) return;
    setToggling(true);
    setCompleted(next);
    const result = await service.updateProgress(courseId, lessonId, { completed: next });
    setToggling(false);
    if (!result.ok) {
      setCompleted(!next);
      toast.push({ variant: "error", title: "Couldn't save progress", description: result.error.message });
      return;
    }
    if (next) {
      toast.push({
        variant: "success",
        title: "Lesson complete (demo)",
        description: "Progress is stored only in this demo session.",
      });
    }
  };

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full" />
        <CardListSkeleton count={2} />
      </div>
    );
  }

  if (state.status === "error") {
    if (state.error.code === "not_enrolled") {
      return <NotEnrolledPanel title="You haven’t enrolled in this course" />;
    }
    if (state.error.code === "not_found") {
      return <NotEnrolledPanel title="That lesson isn’t available" />;
    }
    return (
      <FailedState
        title={state.error.code === "auth_required" ? "Sign in needed" : "Couldn't load the lesson"}
        body={state.error.message}
        onRetry={reload}
      />
    );
  }

  const lessonView = state.data.lesson;
  const courseView = state.data.course;

  const prevHref = lessonView.prevLessonId
    ? `/learn/courses/${courseId}/lessons/${lessonView.prevLessonId}`
    : null;
  const nextHref = lessonView.nextLessonId
    ? `/learn/courses/${courseId}/lessons/${lessonView.nextLessonId}`
    : null;

  return (
    <div>
      {/* Breadcrumb + completion */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button href={`/learn/courses/${courseId}`} variant="outline" size="sm">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {lessonView.courseTitle}
        </Button>
        <CompletionToggle
          completed={completed ?? lessonView.lesson.completed}
          saving={toggling}
          onChange={setCompletion}
        />
      </div>

      {lessonView.lesson.type === "video" && lessonView.playback.mode === "direct" ? (
        <DirectPlayer
          view={lessonView}
          onProgress={(seconds) => debouncedSavePosition.schedule(seconds)}
          onCompleted={(done) => void setCompletion(done)}
          onEnded={() => {
            if (nextHref) {
              toast.push({
                variant: "info",
                title: "Up next is ready",
                description: "Jump to the next lesson below.",
              });
            }
          }}
        />
      ) : lessonView.lesson.type === "video" ? (
        <SimulatedPlayer
          view={lessonView}
          coverPreviewUrl={courseView.coverPreviewUrl}
          onProgress={(seconds) => debouncedSavePosition.schedule(seconds)}
          onCompleted={(done) => void setCompletion(done)}
          onEnded={() => {
            if (nextHref) {
              toast.push({
                variant: "info",
                title: "Up next is ready",
                description: "Jump to the next lesson below.",
              });
            }
          }}
        />
      ) : (
        <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs">
          <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Resource bundle</p>
          <h1 className="mt-1 text-xl font-bold text-ink">{lessonView.lesson.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-smoke">{lessonView.lesson.description}</p>
          <div className="mt-5">
            <ResourceDownloads view={lessonView} />
          </div>
          <p className="mt-4 text-[11px] text-smoke italic">
            Simulated files — secure delivery from object storage arrives in Prompt 5.
          </p>
        </div>
      )}

      {/* Lesson meta */}
      <div className="mt-4 rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
        <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">
          {lessonView.sectionTitle}
        </p>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {lessonView.lesson.title}
        </h1>
        {lessonView.lesson.description && lessonView.lesson.type === "video" ? (
          <p className="mt-2 text-sm leading-relaxed text-smoke">{lessonView.lesson.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {prevHref ? (
            <Button href={prevHref} variant="outline" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Previous lesson
            </Button>
          ) : (
            <span className="inline-flex items-center rounded-full border-2 border-dashed border-ink/30 px-4 py-2 text-xs font-bold text-smoke">
              This is the first lesson
            </span>
          )}
          {nextHref ? (
            <Button href={nextHref} variant="ink" size="sm">
              Next lesson
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button href={`/learn/courses/${courseId}`} variant="lime" size="sm">
              <ListVideo className="size-4" aria-hidden="true" />
              Back to curriculum — you’ve reached the end
            </Button>
          )}
        </div>
      </div>

      {/* Curriculum */}
      <h2 className="mt-6 mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-smoke uppercase">
        <ListVideo className="size-4" aria-hidden="true" />
        Course curriculum
      </h2>
      <CurriculumPanel course={courseView} currentLessonId={lessonId} />

      <p className="mt-5 text-xs text-smoke">
        Progress and playback position are saved to this demo session only — persistent accounts
        ship in Prompt 5. <Link href="/learn/support" className="font-semibold text-accent underline underline-offset-2">Something broken?</Link>
      </p>
    </div>
  );
}
