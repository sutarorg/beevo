"use client";

import { Check, ChevronDown, FileText, Lock, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LearnerCourseCard, LearnerCourseView, LearnerSectionView } from "@/lib/learner-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ProgressRing({ pct, size = 54 }: { pct: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className="relative shrink-0"
      role="img"
      aria-label={`Progress ${pct}%`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-sand)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-ink tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

/** Course card in the learner library. */
export function LibraryCourseCard({ course }: { course: LearnerCourseCard }) {
  const resumeHref = course.lastAccessedLessonId
    ? `/learn/courses/${course.courseId}/lessons/${course.lastAccessedLessonId}`
    : `/learn/courses/${course.courseId}`;
  return (
    <article className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard-xs">
      <div className="flex gap-4 p-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-parchment sm:size-24">
          {course.coverPreviewUrl ? (
            <Image
              src={course.coverPreviewUrl}
              alt={`${course.title} cover`}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center font-editorial text-3xl text-ink/25 italic">
              {course.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-ink">{course.title}</h2>
          <p className="mt-0.5 text-xs text-smoke">by {course.creatorName}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <ProgressRing pct={course.progressPct} size={46} />
            <div className="text-xs text-smoke">
              <p className="font-bold text-ink">
                {course.completedLessons}/{course.totalLessons} lessons
              </p>
              {course.completedAll ? (
                <p className="font-bold text-moss">Course complete</p>
              ) : course.progressPct === 0 ? (
                <p>Not started yet</p>
              ) : (
                <p>In progress</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t-2 border-ink/10 px-4 py-3">
        <Button href={resumeHref} variant="accent" size="sm" className="flex-1">
          <Play className="size-3.5" aria-hidden="true" />
          {course.progressPct === 0 ? "Start course" : course.completedAll ? "Rewatch" : "Continue"}
        </Button>
        <Button href={`/learn/courses/${course.courseId}`} variant="outline" size="sm">
          Curriculum
        </Button>
      </div>
    </article>
  );
}

/** Expandable curriculum with per-lesson states; rows link to lesson pages. */
export function CurriculumPanel({
  course,
  currentLessonId = null,
}: {
  course: LearnerCourseView;
  currentLessonId?: string | null;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (currentLessonId) {
      for (const section of course.sections) {
        if (section.lessons.some((lesson) => lesson.id === currentLessonId)) {
          initial.add(section.id);
        }
      }
    }
    if (initial.size === 0 && course.sections[0]) initial.add(course.sections[0].id);
    return initial;
  });

  const toggle = (sectionId: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <ol className="space-y-2.5">
      {course.sections.map((section, sectionIndex) => (
        <SectionBlock
          key={section.id}
          section={section}
          index={sectionIndex}
          courseId={course.courseId}
          open={openSections.has(section.id)}
          onToggle={() => toggle(section.id)}
          currentLessonId={currentLessonId}
        />
      ))}
    </ol>
  );
}

function SectionBlock({
  section,
  index,
  courseId,
  open,
  onToggle,
  currentLessonId,
}: {
  section: LearnerSectionView;
  index: number;
  courseId: string;
  open: boolean;
  onToggle: () => void;
  currentLessonId: string | null;
}) {
  const completed = section.lessons.filter((lesson) => lesson.completed).length;
  return (
    <li className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ChevronDown
          className={cn("size-4 shrink-0 text-smoke transition-transform", open ? "" : "-rotate-90")}
          aria-hidden="true"
        />
        <span className="font-editorial text-base text-accent italic">{String(index + 1).padStart(2, "0")}</span>
        <span className="flex-1 truncate text-sm font-bold text-ink">{section.title}</span>
        <span className="text-[11px] font-semibold text-smoke">
          {completed}/{section.lessons.length}
        </span>
      </button>
      {open ? (
        <ul className="divide-y divide-ink/10 border-t border-ink/10">
          {section.lessons.map((lesson) => {
            const isCurrent = lesson.id === currentLessonId;
            const row = (
              <>
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2",
                    lesson.completed
                      ? "border-ink bg-lime"
                      : isCurrent
                        ? "border-ink bg-accent text-cream"
                        : "border-ink/25 bg-parchment",
                  )}
                >
                  {lesson.completed ? (
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  ) : lesson.type === "video" ? (
                    <Play className="size-3" aria-hidden="true" />
                  ) : (
                    <FileText className="size-3" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm", isCurrent ? "font-bold text-accent" : "font-semibold text-ink")}>
                    {lesson.title}
                  </span>
                  <span className="text-[11px] text-smoke">
                    {lesson.type === "video" ? "Video" : `${lesson.resources.length} file${lesson.resources.length === 1 ? "" : "s"}`}
                    {lesson.durationLabel ? ` · ${lesson.durationLabel}` : ""}
                    {lesson.positionSeconds > 10 && !lesson.completed ? " · in progress" : ""}
                  </span>
                </span>
                {isCurrent ? (
                  <span className="shrink-0 rounded-full border-2 border-ink bg-accent px-2 py-0.5 text-[9px] font-bold tracking-widest text-cream uppercase">
                    Now
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={lesson.id}>
                <Link
                  href={`/learn/courses/${courseId}/lessons/${lesson.id}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-colors",
                    isCurrent ? "bg-lime/30" : "hover:bg-cream",
                  )}
                >
                  {row}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function NotEnrolledPanel({
  creatorHandle,
  slug,
  title,
}: {
  creatorHandle?: string;
  slug?: string;
  title: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-8 text-center shadow-hard-xs">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-parchment">
        <Lock className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-smoke">
        This course is only available after purchase. If you just bought it, give the library a
        refresh.
      </p>
      {creatorHandle && slug ? (
        <Button href={`/@${creatorHandle}/${slug}`} variant="accent" size="sm" className="mt-5">
          View the course page
        </Button>
      ) : (
        <Button href="/learn/courses" variant="outline" size="sm" className="mt-5">
          Back to My learning
        </Button>
      )}
    </div>
  );
}
