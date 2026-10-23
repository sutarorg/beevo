"use client";

import { GraduationCap, Play, Search } from "lucide-react";
import { useAsyncData } from "@/lib/hooks";
import { getLearnerService } from "@/lib/services/learner";
import { formatDateTime } from "@/lib/utils";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
  StatCard,
} from "@/components/creator/ui";
import { LibraryCourseCard } from "@/components/learner/course-ui";
import { Button } from "@/components/ui/button";

export default function LearnerCoursesPage() {
  const service = getLearnerService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getLibrary()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );

  return (
    <div>
      <PageHeader title="My learning" sub="Your purchased courses — pick up exactly where you left off.">
      </PageHeader>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={3} />
      ) : state.status === "error" ? (
        <FailedState
          title={state.error.code === "auth_required" ? "Sign in needed" : "Couldn't load your library"}
          body={state.error.message}
          onRetry={reload}
        />
      ) : state.data.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-6 text-smoke" aria-hidden="true" />}
          title="No courses yet"
          body="Courses you buy through a creator's storefront link land here instantly. There is no catalogue to browse — that's by design."
        >
          <Button href="/@meera-shoots" variant="accent" size="sm">
            <Search className="size-4" aria-hidden="true" />
            Browse courses
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {/* Continue learning */}
          {state.data.some((course) => course.lastAccessedLessonId && !course.completedAll) ? (
            <ContinueLearningCard />
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<GraduationCap className="size-4.5" aria-hidden="true" />}
              label="Courses"
              value={String(state.data.length)}
            />
            <StatCard
              icon={<Play className="size-4.5" aria-hidden="true" />}
              label="In progress"
              value={String(state.data.filter((course) => course.progressPct > 0 && !course.completedAll).length)}
            />
            <StatCard
              icon={<GraduationCap className="size-4.5" aria-hidden="true" />}
              label="Completed"
              value={String(state.data.filter((course) => course.completedAll).length)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {state.data.map((course) => (
              <LibraryCourseCard key={course.courseId} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContinueLearningCard() {
  const service = getLearnerService();
  const { state } = useAsyncData(
    () =>
      service
        ? service.getLibrary()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  if (state.status !== "success") return null;
  const course = state.data.find((item) => item.lastAccessedLessonId && !item.completedAll);
  if (!course) return null;
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-hard-sm">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold tracking-[0.2em] text-lime uppercase">Continue learning</p>
        <h2 className="mt-1.5 truncate text-xl font-bold">{course.title}</h2>
        <p className="mt-0.5 text-xs text-cream/60">
          {course.progressPct}% complete
          {course.lastAccessedAt ? ` · last viewed ${formatDateTime(course.lastAccessedAt)}` : ""}
        </p>
      </div>
      <Button
        href={`/learn/courses/${course.courseId}/lessons/${course.lastAccessedLessonId}`}
        variant="lime"
      >
        <Play className="size-4" aria-hidden="true" />
        Resume lesson
      </Button>
    </section>
  );
}
