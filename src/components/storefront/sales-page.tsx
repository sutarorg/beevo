"use client";

import {
  ArrowUpRight,
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
import { priceLabel } from "@/lib/domain";
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
  { icon: Video, label: "Video lessons" },
  { icon: Download, label: "Resources" },
  { icon: GraduationCap, label: "Learner dashboard" },
  { icon: InfinityIcon, label: "Access while published" },
];

/**
 * Low-brightness "Secure checkout" label above a horizontal line of 4 monochrome
 * grey payment logos (UPI, Visa, Mastercard, RuPay) with no background block.
 */
function SecureCheckoutLogos() {
  return (
    <div className="mt-3.5 flex flex-col items-center">
      <p className="text-center text-[11px] font-medium tracking-wide text-neutral-400">
        Secure checkout
      </p>
      <div
        className="mt-2 flex flex-wrap items-center justify-center gap-5 text-neutral-400 sm:gap-6"
        aria-label="Accepted payment methods: UPI, Visa, Mastercard, and RuPay"
      >
        {/* UPI */}
        <svg
          viewBox="0 0 54 20"
          className="h-3.5 w-auto shrink-0"
          role="img"
          aria-label="UPI"
        >
          <path
            d="M4.2 3.5H7.4L5.5 13.3H9.5L8.9 16.5H3.5C1.9 16.5 1.3 15.4 1.7 13.6L4.2 3.5ZM11.8 3.5H15L12.4 16.5H9.2L11.8 3.5ZM17.6 3.5H25.6C28.5 3.5 29.7 5.1 29.1 7.8C28.5 10.6 26.5 12 23.5 12H19.1L18.2 16.5H15L17.6 3.5ZM20.3 6.2L19.6 9.4H23.3C24.8 9.4 25.6 8.8 25.9 7.8C26.1 6.8 25.5 6.2 24 6.2H20.3ZM31.8 3.5H35L32.4 16.5H29.2L31.8 3.5Z"
            fill="currentColor"
            fillRule="evenodd"
          />
          <polygon points="37.5,3.5 44.5,10 35.5,16.5 39.2,10" fill="currentColor" />
          <polygon
            points="43,3.5 50,10 41,16.5 44.7,10"
            fill="currentColor"
            fillOpacity="0.6"
          />
        </svg>

        {/* Visa */}
        <svg
          viewBox="0 0 56 20"
          className="h-3.5 w-auto shrink-0"
          role="img"
          aria-label="Visa"
        >
          <text
            x="1"
            y="15.5"
            fill="currentColor"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
            fontSize="15.5"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="0.8"
          >
            VISA
          </text>
        </svg>

        {/* Mastercard */}
        <svg
          viewBox="0 0 36 22"
          className="h-4 w-auto shrink-0"
          role="img"
          aria-label="Mastercard"
        >
          <circle cx="13" cy="11" r="7.5" fill="currentColor" fillOpacity="0.75" />
          <circle cx="23" cy="11" r="7.5" fill="currentColor" fillOpacity="0.5" />
          <path
            d="M18 5.45A7.5 7.5 0 0 1 20.5 11A7.5 7.5 0 0 1 18 16.55A7.5 7.5 0 0 1 15.5 11A7.5 7.5 0 0 1 18 5.45Z"
            fill="currentColor"
          />
        </svg>

        {/* RuPay */}
        <svg
          viewBox="0 0 72 20"
          className="h-3.5 w-auto shrink-0"
          role="img"
          aria-label="RuPay"
        >
          <text
            x="1"
            y="15"
            fill="currentColor"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
            fontSize="14"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="0.2"
          >
            RuPay
          </text>
          <polygon points="53,3.5 60,10 53,16.5 56,10" fill="currentColor" />
          <polygon
            points="58,3.5 65,10 58,16.5 61,10"
            fill="currentColor"
            fillOpacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}

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
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
        <Skeleton className="h-64" />
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
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (course.sections[0]?.id) initial.add(course.sections[0].id);
    return initial;
  });
  const [previewLesson, setPreviewLesson] = useState<PublicLessonMeta | null>(null);

  const isFreeCourse = course.priceInPaise === 0;
  // On a ₹0 course the whole course is free, so preview lessons are simply
  // "Preview"; "Free preview" is only meaningful on a paid course.
  const previewNoun = isFreeCourse ? "preview" : "free preview";
  const previewNounPlural = isFreeCourse ? "previews" : "free previews";
  const freePreviewLesson = course.sections
    .flatMap((section) => section.lessons)
    .find((lesson) => lesson.isPreview);
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
        Unified responsive 2-column course detail layout:
        - Row 1 has a full-bleed parchment backdrop (`border-b-2 border-ink bg-parchment`).
        - On desktop (`lg`), the Hero header sits in Row 1 Left, the Body sections sit in
          Row 2 Left directly below the Hero border (with zero dead space), and the
          Buy Card (`#course-enrol-card`) spans Rows 1–2 on the Right as a sticky sidebar.
        - On mobile (`< lg`), the Hero header and Buy Card sit inside the parchment top
          section, followed by the Body cards below.
        - Spacing rhythm is uniform: every gap between cards is 2rem (`gap-8` /
          `space-y-8` / `lg:gap-x-8`), section edges use the same padding on both
          sides of the hero border, and every card shares `p-6 sm:p-8` padding.
      */}
      <div className="overflow-x-clip">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-y-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-0">
          {/* Full-bleed Hero background */}
          <div
            aria-hidden="true"
            className="pointer-events-none relative left-1/2 col-span-full row-start-1 row-end-3 -ml-[50vw] w-screen border-b-2 border-ink bg-parchment lg:row-end-2"
          />

          {/* Hero Left — Course Identity & Creator */}
          <header className="relative z-10 pt-8 sm:pt-12 lg:col-start-1 lg:row-start-1 lg:py-12">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs font-semibold text-smoke"
            >
              {/* Back-to-storefront is plain text (@username) — no button background. */}
              <Link
                href={`/@${course.creator.handle}`}
                className="font-bold text-accent underline-offset-2 hover:underline"
              >
                @{course.creator.handle}
              </Link>
              <span aria-hidden="true" className="text-smoke/60">
                /
              </span>
              <span className="truncate font-bold text-ink">{course.title}</span>
            </nav>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink sm:text-5xl lg:leading-[1.08]">
              {course.title}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-pretty text-smoke sm:text-base">
              {course.shortDescription}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Sticker color="lime">
                {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
              </Sticker>
              <Sticker color="cream">{course.durationLabel}</Sticker>
              <Sticker color="cream">
                {course.resourceCount} {course.resourceCount === 1 ? "download" : "downloads"}
              </Sticker>
              {previewCount > 0 ? (
                <Sticker color="ink">
                  {previewCount} {previewCount === 1 ? previewNoun : previewNounPlural}
                </Sticker>
              ) : null}
            </div>

            <Link
              href={`/@${course.creator.handle}`}
              className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white p-3.5 shadow-hard-xs transition-transform hover:-translate-y-0.5 sm:p-4"
            >
              <span className="flex min-w-0 items-center gap-3">
                <ProfileAvatar
                  src={course.creator.avatarUrl}
                  name={course.creator.displayName}
                  sizePx={48}
                  className="size-12"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink sm:text-base">
                    {course.creator.displayName}
                  </span>
                  <span className="block truncate text-xs font-semibold text-accent">
                    @{course.creator.handle} · {course.creator.niche || "Creator"}
                  </span>
                </span>
              </span>
              <span className="hidden shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-cream px-3 py-1 text-[11px] font-bold text-ink transition-colors group-hover:bg-lime sm:inline-flex">
                View storefront
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </header>

          {/* Right Column — Sticky Course Enrol Card */}
          <aside
            id="course-enrol-card"
            className="relative z-10 pb-8 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:py-12 lg:sticky lg:top-6"
          >
            <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard">
              {/* Course thumbnail is always 16:9, matching the uploaded cover. */}
              <div className="relative aspect-video border-b-2 border-ink bg-parchment">
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
                {freePreviewLesson ? (
                  <button
                    type="button"
                    onClick={() => setPreviewLesson(freePreviewLesson)}
                    className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-lime px-3.5 py-1.5 text-xs font-bold text-ink shadow-hard-xs transition-transform hover:-translate-y-0.5"
                  >
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                    Watch {previewNoun}
                  </button>
                ) : null}
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="font-editorial text-5xl leading-none text-ink italic">
                      {priceLabel(course.priceInPaise)}
                    </p>
                    <p className="mt-1.5 text-[11px] font-bold tracking-[0.14em] text-smoke uppercase">
                      {course.priceInPaise === 0 ? "free · enrol instantly" : "one time · INR"}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-2xl border-2 border-ink bg-lime/40">
                    <ShieldCheck className="size-5 text-moss" aria-hidden="true" />
                  </span>
                </div>

                {purchased ? (
                  <Button href="/learn/courses" variant="lime" size="lg" className="mt-5 w-full">
                    <GraduationCap className="size-5" aria-hidden="true" />
                    In your library — start learning
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    size="lg"
                    className="mt-5 w-full"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    <BadgeIndianRupee className="size-5" aria-hidden="true" />
                    {course.priceInPaise === 0 ? "Enroll free" : "Enroll now"}
                  </Button>
                )}

                {/* Small low-brightness "Secure checkout" label + 4 grey payment logos in a horizontal line */}
                <SecureCheckoutLogos />

                <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-4">
                  <p className="text-[11px] font-bold tracking-[0.14em] text-smoke uppercase">
                    This course includes
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {INCLUDED.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center gap-2.5 text-xs font-medium text-smoke"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-ink/20 bg-cream">
                          <item.icon className="size-3.5 text-ink" aria-hidden="true" />
                        </span>
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-5 rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
                  Non-refundable ·{" "}
                  <Link
                    href="/refund-policy"
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    Purchase policy
                  </Link>
                </p>
              </div>
            </div>
          </aside>

          {/* Body Left — Outcomes, Free Preview, Curriculum & Purchase Terms */}
          <div className="relative z-10 space-y-8 pb-8 lg:col-start-1 lg:row-start-2 lg:py-12">
            {course.outcomes.length > 0 ? (
              <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    What you’ll walk away with
                  </h2>
                  <span className="text-xs font-semibold text-smoke">
                    {course.outcomes.length} key {course.outcomes.length === 1 ? "outcome" : "outcomes"}
                  </span>
                </div>
                {/* Each outcome stretches the full width of the card (single
                    column), so a sentence has room to sit on one line instead
                    of being squeezed into a half-width cell and wrapping. */}
                <ul className="mt-5 grid gap-3">
                  {course.outcomes.map((outcome, index) => (
                    <li
                      key={index}
                      className="flex w-full items-start gap-3 rounded-2xl border-2 border-ink/10 bg-cream/60 p-3.5 text-sm font-medium text-ink"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
                        <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                      </span>
                      <span className="flex-1 leading-snug">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {freePreviewLesson ? (
              <div className="rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-hard-xs sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">
                      {isFreeCourse ? "Preview lesson" : "Free preview lesson"}
                    </p>
                    <h3 className="mt-1.5 text-lg font-bold leading-snug sm:text-xl">
                      {freePreviewLesson.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-cream/75">
                      {freePreviewLesson.description || "Watch a full lesson before you decide."}
                      {freePreviewLesson.durationLabel ? ` · ${freePreviewLesson.durationLabel}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewLesson(freePreviewLesson)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-lime bg-lime px-4 py-2 text-xs font-bold text-ink transition-transform hover:-translate-y-0.5"
                  >
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                    Watch now
                  </button>
                </div>
                <p className="mt-3.5 flex items-center gap-2 border-t border-cream/15 pt-3 text-[11px] text-cream/55">
                  <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                  Preview playback is checked server-side; the rest of the course stays locked.
                </p>
              </div>
            ) : null}

            {/* Curriculum */}
            <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    Curriculum
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-smoke">
                    {course.sections.length} {course.sections.length === 1 ? "section" : "sections"} ·{" "}
                    {course.videoCount} {course.videoCount === 1 ? "video" : "videos"} ·{" "}
                    {course.resourceCount} {course.resourceCount === 1 ? "file" : "files"}
                    {previewCount > 0
                      ? ` · ${previewCount} ${previewCount === 1 ? previewNoun : previewNounPlural}`
                      : ""}
                  </p>
                </div>
                {course.sections.length > 1 ? (
                  <button
                    type="button"
                    onClick={toggleAllSections}
                    className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-lime"
                  >
                    {allSectionsOpen ? "Collapse all" : "Expand all"}
                  </button>
                ) : null}
              </div>

              <ol className="mt-5 space-y-3">
                {course.sections.map((section, sectionIndex) => {
                  const expanded = openSections.has(section.id);
                  return (
                    <li
                      key={section.id}
                      className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-cream"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        aria-expanded={expanded}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-parchment/60"
                      >
                        <span className="font-editorial text-lg text-accent italic">
                          {String(sectionIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-sm font-bold text-ink sm:text-base">
                          {section.title}
                        </span>
                        <span className="text-xs font-medium text-smoke">
                          {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-smoke transition-transform duration-200",
                            expanded && "rotate-180 text-ink",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {expanded ? (
                        <ul className="divide-y divide-ink/10 border-t border-ink/10 bg-white">
                          {section.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-start gap-3 px-4 py-3.5">
                              {lesson.isPreview ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewLesson(lesson)}
                                  aria-label={`Play ${previewNoun}: ${lesson.title}`}
                                  title={`Watch the ${previewNoun}`}
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
                                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                                  {lesson.title}
                                  {lesson.isPreview ? null : (
                                    <Lock
                                      className="size-3 text-smoke"
                                      aria-label="Locked until enrolled"
                                    />
                                  )}
                                </p>
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
                                      Watch {previewNoun}
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

            {/* Purchase Terms — enrolment happens from the buy card / mobile
                buy bar, so this card is terms only (no duplicate enrol button). */}
            <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
              <h3 className="text-sm font-bold tracking-[0.14em] text-smoke uppercase">
                Purchase terms
              </h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-smoke">
                <li>
                  {course.priceInPaise === 0
                    ? "· Free enrolment — no payment details needed."
                    : "· One-time payment in INR via UPI, cards, net-banking, or wallets."}
                </li>
                <li>· Access through your learner dashboard while the course is published.</li>
                <li>· Course purchases are non-refundable except where required by applicable law.</li>
                <li>· Your receipt and dashboard login are emailed right after checkout.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <PoweredByBanner />

      {/*
        Spacer matching the fixed mobile buy bar's height (plus safe-area),
        painted in the footer's ink colour. Without it the page could not
        scroll far enough — the buy bar permanently covered the bottom of
        the "This storefront runs on Beevo." footer. With it, the page
        scrolls to the very end and the whole footer sits clear of the bar.
      */}
      <div
        aria-hidden="true"
        className="h-[calc(5.5rem+env(safe-area-inset-bottom))] bg-ink lg:hidden"
      />

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
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
              {course.priceInPaise === 0 ? "Enroll free" : "Enroll now"}
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
        isFreeCourse={isFreeCourse}
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
