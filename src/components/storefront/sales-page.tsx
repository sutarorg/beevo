"use client";

import {
  BadgeIndianRupee,
  Check,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Infinity as InfinityIcon,
  Lock,
  Play,
  ShieldCheck,
  Video,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatINR, priceLabel } from "@/lib/domain";
import type { PublicCoursePage, PublicLessonMeta } from "@/lib/learner-types";
import { useAsyncData } from "@/lib/hooks";
import { getLearnerService } from "@/lib/services/learner";
import { getStorefrontService } from "@/lib/services/storefront";
import { cn } from "@/lib/utils";
import { CardListSkeleton, FailedState, Skeleton } from "@/components/creator/ui";
import { CourseNotFound, PoweredByBanner } from "@/components/storefront/cards";
// Loaded on demand: checkout and the video preview are only needed after the
// buyer clicks, so their JavaScript stays out of the first paint.
const CheckoutSheet = dynamic(
  () => import("@/components/storefront/checkout").then((module) => module.CheckoutSheet),
  { ssr: false },
);
const PreviewPlayerModal = dynamic(
  () => import("@/components/storefront/preview-player").then((module) => module.PreviewPlayerModal),
  { ssr: false },
);
import { Button } from "@/components/ui/button";
import { ProfileAvatar, Sticker } from "@/components/ui/primitives";

const INCLUDED = [
  { icon: Video, label: "Streamed video lessons" },
  { icon: Download, label: "Downloadable resources" },
  { icon: GraduationCap, label: "Learner dashboard access" },
  { icon: InfinityIcon, label: "Ongoing access while published" },
];

export function CourseSalesPage({ handle, slug }: { handle: string; slug: string }) {
  const service = getStorefrontService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getCourse(handle, slug)
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Storefront service unavailable" } }),
    [handle, slug],
  );

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-72" />
        <CardListSkeleton count={3} />
      </div>
    );
  }

  if (state.status === "error") {
    if (state.error.code === "not_found") return <CourseNotFound handle={handle} />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <FailedState title="Couldn't load this course" body={state.error.message} onRetry={reload} />
      </div>
    );
  }

  return <SalesBody course={state.data} />;
}

function SalesBody({ course }: { course: PublicCoursePage }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(course.sections[0]?.id ?? null);
  const [previewLesson, setPreviewLesson] = useState<PublicLessonMeta | null>(null);

  const freePreviewLesson = course.sections
    .flatMap((section) => section.lessons)
    .find((lesson) => lesson.isPreview);
  const previewCount = course.sections.reduce(
    (total, section) => total + section.lessons.filter((lesson) => lesson.isPreview).length,
    0,
  );

  return (
    <>
      {/* Hero */}
      <section className="border-b-2 border-ink bg-parchment">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs font-semibold text-smoke">
              <Link href={`/@${course.creator.handle}`} className="hover:text-accent">
                @{course.creator.handle}
              </Link>
              <span aria-hidden="true"> / </span>
              <span className="text-ink">{course.title}</span>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance text-ink sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-pretty text-smoke sm:text-base">
              {course.shortDescription}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Sticker color="lime">{course.lessonCount} lessons</Sticker>
              <Sticker color="cream">{course.durationLabel}</Sticker>
              <Sticker color="cream">{course.resourceCount} downloads</Sticker>
            </div>
            <Link
              href={`/@${course.creator.handle}`}
              className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3 transition-transform hover:-translate-y-0.5"
            >
              <ProfileAvatar
                src={course.creator.avatarUrl}
                name={course.creator.displayName}
                sizePx={44}
                className="size-11"
              />
              <span>
                <span className="block text-sm font-bold text-ink">{course.creator.displayName}</span>
                <span className="block text-xs text-accent">@{course.creator.handle} · view all courses</span>
              </span>
            </Link>
          </div>

          {/* Buy card */}
          <div className="lg:pt-8" id="course-enrol-card">
            <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard">
              <div className="relative aspect-[4/3] border-b-2 border-ink bg-parchment">
                {course.coverPreviewUrl ? (
                  <Image
                    src={course.coverPreviewUrl}
                    alt={`${course.title} course cover`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="grid h-full place-items-center font-editorial text-5xl text-ink/20 italic">
                    {course.title.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="font-editorial text-5xl leading-none text-ink italic">
                      {priceLabel(course.priceInPaise)}
                    </p>
                    <p className="mt-1 text-[11px] font-bold tracking-[0.14em] text-smoke uppercase">
                      {course.priceInPaise === 0 ? "free · enrol instantly" : "one time · INR"}
                    </p>
                  </div>
                  <ShieldCheck className="size-8 text-moss" aria-hidden="true" />
                </div>
                {purchased ? (
                  <Button href="/learn/courses" variant="lime" size="lg" className="mt-4 w-full">
                    <GraduationCap className="size-5" aria-hidden="true" />
                    In your library — start learning
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    size="lg"
                    className="mt-4 w-full"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    <BadgeIndianRupee className="size-5" aria-hidden="true" />
                    {course.priceInPaise === 0 ? "Enrol free" : "Enrol now"}
                  </Button>
                )}
                <ul className="mt-4 space-y-2">
                  {INCLUDED.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5 text-xs text-smoke">
                      <item.icon className="size-4 shrink-0 text-ink" aria-hidden="true" />
                      {item.label}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
                  Course purchases are non-refundable except where required by applicable law.{" "}
                  <Link href="/refund-policy" className="font-semibold text-accent underline underline-offset-2">
                    Read the purchase policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-8">
            {course.outcomes.length > 0 ? (
              <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
                <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  What you’ll walk away with
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {course.outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
                        <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                      </span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Curriculum */}
            <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Curriculum</h2>
                <p className="text-xs font-semibold text-smoke">
                  {course.sections.length} sections · {course.videoCount} videos · {course.resourceCount} files
                  {previewCount > 0
                    ? ` · ${previewCount} free preview${previewCount === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
              <ol className="mt-5 space-y-3">
                {course.sections.map((section, sectionIndex) => {
                  const expanded = expandedSection === section.id;
                  return (
                    <li key={section.id} className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-cream">
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expanded ? null : section.id)}
                        aria-expanded={expanded}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                      >
                        <span className="font-editorial text-lg text-accent italic">
                          {String(sectionIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-sm font-bold text-ink sm:text-base">{section.title}</span>
                        <span className="text-xs text-smoke">
                          {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}
                        </span>
                      </button>
                      {expanded ? (
                        <ul className="divide-y divide-ink/10 border-t border-ink/10">
                          {section.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-start gap-3 px-4 py-3">
                              {lesson.isPreview ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewLesson(lesson)}
                                  aria-label={`Play free preview: ${lesson.title}`}
                                  title="Watch the free preview"
                                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-lime transition-transform hover:-translate-y-0.5 hover:shadow-hard-xs"
                                >
                                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                                </button>
                              ) : (
                                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white">
                                  {lesson.type === "video" ? (
                                    <Play className="size-3.5" aria-hidden="true" />
                                  ) : (
                                    <FileText className="size-3.5" aria-hidden="true" />
                                  )}
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                                  {lesson.title}
                                  {lesson.isPreview ? (
                                    <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                                      Free preview
                                    </span>
                                  ) : (
                                    <Lock className="size-3 text-smoke" aria-label="Locked until enrolled" />
                                  )}
                                </p>
                                {lesson.description ? (
                                  <p className="mt-0.5 text-xs leading-relaxed text-smoke">{lesson.description}</p>
                                ) : null}
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-smoke">
                                  <span>
                                    {lesson.type === "video" ? "Video" : `${lesson.resourceCount} downloadable file${lesson.resourceCount === 1 ? "" : "s"}`}
                                  </span>
                                  {lesson.type === "video" ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock3 className="size-3" aria-hidden="true" />
                                      {lesson.durationLabel ?? "Duration unavailable"}
                                    </span>
                                  ) : null}
                                  {lesson.isPreview ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLesson(lesson)}
                                      className="font-bold text-accent underline underline-offset-2"
                                    >
                                      Watch free preview
                                    </button>
                                  ) : null}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {freePreviewLesson ? (
              <div className="rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-hard-xs">
                <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">Free preview</p>
                <h3 className="mt-2 text-lg font-bold leading-snug">{freePreviewLesson.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/70">
                  {freePreviewLesson.description || "Watch a full lesson before you decide."}
                  {freePreviewLesson.durationLabel ? ` · ${freePreviewLesson.durationLabel}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewLesson(freePreviewLesson)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-lime bg-lime px-3 py-1.5 text-xs font-bold text-ink transition-transform hover:-translate-y-0.5"
                >
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                  Watch now — no payment
                </button>
                <p className="mt-3 flex items-center gap-2 text-[11px] text-cream/50">
                  <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                  Preview playback is checked server-side; the rest of the course stays locked.
                </p>
              </div>
            ) : null}

            <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
              <h3 className="text-sm font-bold tracking-[0.14em] text-smoke uppercase">Purchase terms</h3>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-smoke">
                <li>
                  {course.priceInPaise === 0
                    ? "· Free enrolment — no payment details needed."
                    : "· One-time payment in INR via UPI, cards, net-banking, or wallets."}
                </li>
                <li>· Access through your learner dashboard while the course is published.</li>
                <li>· Course purchases are non-refundable except where required by applicable law.</li>
                <li>· Your receipt and dashboard login are emailed right after checkout.</li>
              </ul>
              <Button
                variant="accent"
                className="mt-4 w-full"
                onClick={() => setCheckoutOpen(true)}
                disabled={purchased}
              >
                {purchased
                  ? "Already in your library"
                  : course.priceInPaise === 0
                    ? "Enrol free"
                    : `Enrol for ${formatINR(course.priceInPaise)}`}
              </Button>
            </div>
          </aside>
        </div>

      </section>

      <PoweredByBanner />

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-ink tabular-nums">{priceLabel(course.priceInPaise)}</p>
            <p className="text-[10px] font-bold tracking-wider text-smoke uppercase">
              {course.priceInPaise === 0 ? "free access" : "one time"}
            </p>
          </div>
          {purchased ? (
            <Button href="/learn/courses" variant="lime" size="sm">
              Start learning
            </Button>
          ) : (
            <Button variant="accent" size="sm" onClick={() => setCheckoutOpen(true)}>
              {course.priceInPaise === 0 ? "Enrol free" : "Enrol now"}
            </Button>
          )}
        </div>
      </div>

      <CheckoutSheet
        course={course}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPurchased={() => {
          setPurchased(true);
          setCheckoutOpen(false);
        }}
      />

      <PreviewPlayerModal
        open={previewLesson !== null}
        lesson={previewLesson}
        handle={course.creator.handle}
        slug={course.slug}
        courseTitle={course.title}
        posterUrl={course.coverPreviewUrl}
        onClose={() => setPreviewLesson(null)}
      />
    </>
  );
}
