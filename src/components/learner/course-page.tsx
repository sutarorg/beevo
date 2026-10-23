"use client";

import { BadgeCheck, ListVideo, Play } from "lucide-react";
import Image from "next/image";
import { useAsyncData } from "@/lib/hooks";
import { getLearnerService } from "@/lib/services/learner";
import { CardListSkeleton, FailedState, PageHeader } from "@/components/creator/ui";
import { CurriculumPanel, NotEnrolledPanel, ProgressRing } from "@/components/learner/course-ui";
import { Button } from "@/components/ui/button";

export function LearnerCoursePage({ courseId }: { courseId: string }) {
  const service = getLearnerService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getCourse(courseId)
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [courseId],
  );

  if (state.status === "loading" || state.status === "idle") {
    return <CardListSkeleton count={3} />;
  }

  if (state.status === "error") {
    if (state.error.code === "not_enrolled") {
      return <NotEnrolledPanel title="You haven’t enrolled in this course" />;
    }
    if (state.error.code === "not_found") {
      return <NotEnrolledPanel title="This course is no longer available" />;
    }
    return (
      <FailedState
        title={state.error.code === "auth_required" ? "Sign in needed" : "Couldn't load the course"}
        body={state.error.message}
        onRetry={reload}
      />
    );
  }

  const course = state.data;
  const resumeLessonId = course.lastAccessedLessonId ?? course.sections[0]?.lessons[0]?.id ?? null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard-xs">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
          <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-parchment sm:h-32 sm:w-52">
            {course.coverPreviewUrl ? (
              <Image
                src={course.coverPreviewUrl}
                alt={`${course.title} cover`}
                fill
                sizes="(max-width: 640px) 100vw, 208px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center font-editorial text-4xl text-ink/20 italic">
                {course.title.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">
              by {course.creatorName}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {course.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ProgressRing pct={course.progressPct} size={52} />
              <div className="text-xs text-smoke">
                <p className="font-bold text-ink">
                  {course.completedLessons} of {course.totalLessons} lessons complete
                </p>
                {course.completedAll ? (
                  <p className="font-bold text-moss">Finished — nice work.</p>
                ) : (
                  <p>Your spot is saved automatically.</p>
                )}
              </div>
            </div>
            {resumeLessonId ? (
              <Button
                href={`/learn/courses/${course.courseId}/lessons/${resumeLessonId}`}
                variant="accent"
                size="sm"
                className="mt-3"
              >
                <Play className="size-4" aria-hidden="true" />
                {course.progressPct === 0
                  ? "Start the first lesson"
                  : course.completedAll
                    ? "Rewatch from your last lesson"
                    : "Resume where you left off"}
              </Button>
            ) : null}
          </div>
        </div>
        {course.completedAll ? (
          <div className="flex items-center gap-3 border-t-2 border-ink bg-lime/50 px-5 py-3 sm:px-6">
            <BadgeCheck className="size-5 shrink-0 text-moss" aria-hidden="true" />
            <p className="text-sm font-bold text-ink">
              Course complete — every lesson checked off. It stays in your library for rewatching.
            </p>
          </div>
        ) : null}
      </div>

      <PageHeader
        title="Curriculum"
        sub="Expand a section and jump anywhere — order is up to you."
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-smoke">
          <ListVideo className="size-4" aria-hidden="true" />
          {course.totalLessons} lessons
        </span>
      </PageHeader>

      <CurriculumPanel course={course} />
    </div>
  );
}
