"use client";

import {
  BadgeIndianRupee,
  Check,
  ChevronDown,
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
        : Promise.resolve({
            ok: false as const,
            error: { code: "unavailable", message: "Storefront service unavailable" },
          }),
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

/** Payment method logos: UPI, Visa, Mastercard, and RuPay in a horizontal row under "Secure checkout". */
function PaymentLogosStrip() {
  return (
    <div className="mt-3.5 rounded-2xl border-2 border-ink/15 bg-cream/60 px-3 py-2.5">
      <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-bold tracking-[0.16em] text-smoke uppercase">
        <Lock className="size-3 text-moss" aria-hidden="true" />
        Secure checkout
      </p>
      <div
        className="mt-2 grid grid-cols-4 items-center gap-2"
        aria-label="Accepted payment methods: UPI, Visa, Mastercard, RuPay"
      >
        {/* UPI */}
        <span
          title="UPI"
          className="flex h-8 items-center justify-center rounded-lg border border-ink/20 bg-white px-2"
        >
          <svg
            viewBox="0 0 64 24"
            className="h-4 w-auto"
            role="img"
            aria-label="UPI"
          >
            <text
              x="4"
              y="17.5"
              fill="#262626"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="15"
              fontWeight="800"
              fontStyle="italic"
              letterSpacing="0.5"
            >
              UPI
            </text>
            <polygon points="44,4 52,12 44,20 47.5,12" fill="#F37021" />
            <polygon points="49.5,4 57.5,12 49.5,20 53,12" fill="#008C44" />
          </svg>
        </span>

        {/* Visa */}
        <span
          title="Visa"
          className="flex h-8 items-center justify-center rounded-lg border border-ink/20 bg-white px-2"
        >
          <svg
            viewBox="0 0 64 24"
            className="h-4 w-auto"
            role="img"
            aria-label="Visa"
          >
            <text
              x="7"
              y="18"
              fill="#1A1F71"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="16"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="0.8"
            >
              VISA
            </text>
            <path d="M7 5.5H15L16.5 8.5L9.5 6.8Z" fill="#F7B600" />
          </svg>
        </span>

        {/* Mastercard */}
        <span
          title="Mastercard"
          className="flex h-8 items-center justify-center rounded-lg border border-ink/20 bg-white px-2"
        >
          <svg
            viewBox="0 0 64 24"
            className="h-4.5 w-auto"
            role="img"
            aria-label="Mastercard"
          >
            <circle cx="25" cy="12" r="7.5" fill="#EB001B" />
            <circle cx="39" cy="12" r="7.5" fill="#F79E1B" fillOpacity="0.9" />
            <path
              d="M32 6.2A7.5 7.5 0 0 1 34.8 12A7.5 7.5 0 0 1 32 17.8A7.5 7.5 0 0 1 29.2 12A7.5 7.5 0 0 1 32 6.2Z"
              fill="#FF5F00"
            />
          </svg>
        </span>

        {/* RuPay */}
        <span
          title="RuPay"
          className="flex h-8 items-center justify-center rounded-lg border border-ink/20 bg-white px-2"
        >
          <svg
            viewBox="0 0 76 24"
            className="h-4 w-auto"
            role="img"
            aria-label="RuPay"
          >
            <text
              x="3"
              y="17"
              fill="#0C2340"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="13.5"
              fontWeight="800"
              fontStyle="italic"
            >
              RuPay
            </text>
            <polygon points="57,4.5 64,12 57,19.5 60,12" fill="#F37021" />
            <polygon points="62,4.5 69,12 62,19.5 65,12" fill="#008C44" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/** “What you’ll walk away with” card. */
function OutcomesCard({ outcomes, className }: { outcomes: string[]; className?: string }) {
  if (outcomes.length === 0) return null;
  return (
    <div
      className={cn(
        "rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8",
        className,
      )}
    >
      <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
        What you’ll walk away with
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:gap-4">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
              <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
            </span>
            {outcome}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Free-preview details panel rendered inside the Course Content Accordion in the Curriculum section. */
function FreePreviewCard({
  lesson,
  onPlay,
  className,
}: {
  lesson: PublicLessonMeta;
  onPlay: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-ink bg-ink p-4 text-cream shadow-hard-xs sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">Free preview</p>
        {lesson.durationLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-cream/25 bg-cream/10 px-2.5 py-0.5 text-[11px] font-semibold text-cream">
            <Clock3 className="size-3 text-lime" aria-hidden="true" />
            {lesson.durationLabel}
          </span>
        ) : null}
      </div>
      <h3 className="mt-1.5 text-base font-bold leading-snug sm:text-lg">{lesson.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-cream/75">
        {lesson.description || "Watch a full lesson before you decide."}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPlay}
          className="inline-flex items-center gap-2 rounded-full border-2 border-lime bg-lime px-3.5 py-1.5 text-xs font-bold text-ink transition-transform hover:-translate-y-0.5"
        >
          <Play className="size-3.5 fill-current" aria-hidden="true" />
          Watch now — no payment
        </button>
        <p className="flex items-center gap-1.5 text-[11px] text-cream/55">
          <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
          Preview playback is checked server-side; the rest of the course stays locked.
        </p>
      </div>
    </div>
  );
}

function SalesBody({ course }: { course: PublicCoursePage }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (course.sections[0]?.id) initial.add(course.sections[0].id);
    for (const section of course.sections) {
      if (section.lessons.some((lesson) => lesson.isPreview)) {
        initial.add(section.id);
      }
    }
    return initial;
  });

  const firstPreviewLesson =
    course.sections.flatMap((section) => section.lessons).find((lesson) => lesson.isPreview) ?? null;

  const [expandedPreviewLessonId, setExpandedPreviewLessonId] = useState<string | null>(
    firstPreviewLesson?.id ?? null,
  );
  const [previewLesson, setPreviewLesson] = useState<PublicLessonMeta | null>(null);

  const previewCount = course.sections.reduce(
    (total, section) => total + section.lessons.filter((lesson) => lesson.isPreview).length,
    0,
  );

  const allSectionsOpen =
    course.sections.length > 0 &&
    course.sections.every((section) => openSections.has(section.id));

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleAllSections = () => {
    if (allSectionsOpen) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(course.sections.map((section) => section.id)));
    }
  };

  return (
    <>
      {/*
        Storefront Course Detail Page:
        - Left column: vertically scrolling cards (Course overview, Outcomes, Curriculum with Course Content Accordion for free previews, Purchase terms).
        - Right column: fixed/sticky course card on the right side of the page.
      */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-10">
          {/* Left side — vertically scrolling cards */}
          <div className="min-w-0 space-y-6 sm:space-y-8 lg:col-start-1">
            {/* Course Overview Card */}
            <div className="rounded-3xl border-2 border-ink bg-parchment p-6 shadow-hard-xs sm:p-8">
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
                className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3 transition-transform hover:-translate-y-0.5 sm:p-4"
              >
                <ProfileAvatar
                  src={course.creator.avatarUrl}
                  name={course.creator.displayName}
                  sizePx={44}
                  className="size-11"
                />
                <span>
                  <span className="block text-sm font-bold text-ink">
                    {course.creator.displayName}
                  </span>
                  <span className="block text-xs text-accent">
                    @{course.creator.handle} · view all courses
                  </span>
                </span>
              </Link>
            </div>

            {/* Outcomes Card */}
            <OutcomesCard outcomes={course.outcomes} />

            {/* Curriculum Card with Course Content Accordion for Free Previews */}
            <div
              id="course-curriculum"
              className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    Curriculum
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-smoke">
                    {course.sections.length} section{course.sections.length === 1 ? "" : "s"} ·{" "}
                    {course.videoCount} video{course.videoCount === 1 ? "" : "s"} ·{" "}
                    {course.resourceCount} file{course.resourceCount === 1 ? "" : "s"}
                    {previewCount > 0
                      ? ` · ${previewCount} free preview${previewCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                {course.sections.length > 0 ? (
                  <button
                    type="button"
                    onClick={toggleAllSections}
                    className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-lime"
                  >
                    {allSectionsOpen ? "Collapse all" : "Expand all"}
                  </button>
                ) : null}
              </div>

              {/* Course Content Accordion */}
              <div className="mt-5 rounded-2xl border-2 border-ink bg-parchment/50 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-[0.16em] text-ink uppercase">
                      Course Content
                    </span>
                    {previewCount > 0 ? (
                      <span className="rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-ink uppercase">
                        {previewCount} Free preview{previewCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] font-semibold text-smoke">
                    Click a section or free preview to expand
                  </span>
                </div>

                <ol className="space-y-3">
                  {course.sections.map((section, sectionIndex) => {
                    const expanded = openSections.has(section.id);
                    const sectionPreviewCount = section.lessons.filter(
                      (lesson) => lesson.isPreview,
                    ).length;

                    return (
                      <li
                        key={section.id}
                        className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-hard-xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-parchment/70"
                        >
                          <span className="font-editorial text-lg text-accent italic">
                            {String(sectionIndex + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-sm font-bold text-ink sm:text-base">
                            {section.title}
                          </span>
                          {sectionPreviewCount > 0 ? (
                            <span className="hidden rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[9px] font-bold tracking-widest text-ink uppercase sm:inline-flex">
                              {sectionPreviewCount} free preview
                              {sectionPreviewCount === 1 ? "" : "s"}
                            </span>
                          ) : null}
                          <span className="text-xs font-semibold text-smoke">
                            {section.lessons.length} lesson
                            {section.lessons.length === 1 ? "" : "s"}
                          </span>
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-white transition-transform duration-200",
                              expanded ? "rotate-180 bg-lime" : "",
                            )}
                          >
                            <ChevronDown className="size-4 text-ink" aria-hidden="true" />
                          </span>
                        </button>

                        {expanded ? (
                          <ul className="divide-y divide-ink/10 border-t-2 border-ink/15 bg-white">
                            {section.lessons.map((lesson) => {
                              const previewExpanded =
                                lesson.isPreview && expandedPreviewLessonId === lesson.id;

                              return (
                                <li key={lesson.id} className="px-4 py-3">
                                  <div className="flex items-start gap-3">
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
                                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-cream">
                                        {lesson.type === "video" ? (
                                          <Play className="size-3.5" aria-hidden="true" />
                                        ) : (
                                          <FileText className="size-3.5" aria-hidden="true" />
                                        )}
                                      </span>
                                    )}

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                                          {lesson.title}
                                          {lesson.isPreview ? (
                                            <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                                              Free preview
                                            </span>
                                          ) : (
                                            <Lock
                                              className="size-3 text-smoke"
                                              aria-label="Locked until enrolled"
                                            />
                                          )}
                                        </p>

                                        {lesson.isPreview ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedPreviewLessonId(
                                                previewExpanded ? null : lesson.id,
                                              )
                                            }
                                            aria-expanded={previewExpanded}
                                            className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-0.5 text-[11px] font-bold text-ink transition-colors hover:bg-lime"
                                          >
                                            Preview details
                                            <ChevronDown
                                              className={cn(
                                                "size-3.5 transition-transform duration-200",
                                                previewExpanded ? "rotate-180" : "",
                                              )}
                                              aria-hidden="true"
                                            />
                                          </button>
                                        ) : null}
                                      </div>

                                      {lesson.description ? (
                                        <p className="mt-0.5 text-xs leading-relaxed text-smoke">
                                          {lesson.description}
                                        </p>
                                      ) : null}

                                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-smoke">
                                        <span>
                                          {lesson.type === "video"
                                            ? "Video"
                                            : `${lesson.resourceCount} downloadable file${lesson.resourceCount === 1 ? "" : "s"}`}
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
                                  </div>

                                  {previewExpanded ? (
                                    <div className="mt-3 pl-0 sm:pl-11">
                                      <FreePreviewCard
                                        lesson={lesson}
                                        onPlay={() => setPreviewLesson(lesson)}
                                      />
                                    </div>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* Purchase Terms Card */}
            <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
              <h3 className="text-sm font-bold tracking-[0.14em] text-smoke uppercase">
                Purchase terms
              </h3>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-smoke">
                <li>
                  {course.priceInPaise === 0
                    ? "· Free enrolment — no payment details needed."
                    : "· One-time payment in INR via UPI, cards, net-banking, or wallets."}
                </li>
                <li>· Access through your learner dashboard while the course is published.</li>
                <li>
                  · Course purchases are non-refundable except where required by applicable law.
                </li>
                <li>· Your receipt and dashboard login are emailed right after checkout.</li>
              </ul>
              <Button
                variant="accent"
                className="mt-4 w-full sm:w-auto"
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
          </div>

          {/* Right side — fixed course card */}
          <aside
            id="course-enrol-card"
            className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start"
          >
            <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard">
              <div className="relative aspect-[4/3] border-b-2 border-ink bg-parchment lg:aspect-[16/9]">
                {course.coverPreviewUrl ? (
                  <Image
                    src={course.coverPreviewUrl}
                    alt={`${course.title} course cover`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
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
                    {course.priceInPaise === 0 ? "Enrol free" : "Enroll now"}
                  </Button>
                )}

                {/* Secure checkout label + horizontal row of 4 logos (UPI, Visa, Mastercard, RuPay) */}
                <PaymentLogosStrip />

                {/* 4 included items in a vertical line */}
                <ul className="mt-4 flex flex-col gap-2.5">
                  {INCLUDED.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5 text-xs text-smoke">
                      <item.icon className="size-4 shrink-0 text-ink" aria-hidden="true" />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
                  Course purchases are non-refundable except where required by applicable law.{" "}
                  <Link
                    href="/refund-policy"
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    Read the purchase policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <PoweredByBanner />

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-ink tabular-nums">
              {priceLabel(course.priceInPaise)}
            </p>
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
              {course.priceInPaise === 0 ? "Enrol free" : "Enroll now"}
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
