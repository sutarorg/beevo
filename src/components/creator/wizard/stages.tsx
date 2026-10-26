"use client";

import {
  ArrowUpRight,
  BadgeIndianRupee,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  Globe,
  Lock,
  Play,
  Share2,
  ShieldCheck,
  UserRound,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CourseEditor } from "@/lib/creator-types";
import { shareableOrigin } from "@/lib/config";
import { useAsyncData } from "@/lib/hooks";
import { commissionBreakdown, formatINR, priceLabel } from "@/lib/domain";
import { readinessChecklist, type CourseService, type CourseStage } from "@/lib/services/courses";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { cn, formatDate, isMissingDuration, parseDurationLabel } from "@/lib/utils";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { AutosaveField, OutcomesEditor } from "@/components/creator/wizard/fields";
import { CoverUpload } from "@/components/creator/wizard/uploads";
import { StatusChip, CopyButton } from "@/components/creator/ui";
import {
  COURSE_INCLUDES,
  SecureCheckoutLogos,
} from "@/components/storefront/sales-page";
import { Button } from "@/components/ui/button";
import { ProfileAvatar, Sticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export function coursePublicUrl(course: CourseEditor): string {
  return `${shareableOrigin()}/@${course.creatorHandle}/${course.slug ?? "draft"}`;
}

// ---------------------------------------------------------------------------
// Stage 1 — Course details
// ---------------------------------------------------------------------------

export function DetailsStage({
  course,
  service,
  setCourse,
  readOnly = false,
}: {
  course: CourseEditor;
  service: CourseService;
  setCourse: (course: CourseEditor) => void;
  readOnly?: boolean;
}) {
  const [coverSaving, setCoverSaving] = useState(false);

  const save = async (patch: Parameters<CourseService["saveDetails"]>[1]) => {
    const result = await service.saveDetails(course.id, patch);
    if (result.ok) setCourse(result.data);
    return result;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Course details</h2>
        <p className="mt-0.5 text-sm text-smoke">
          What buyers see on your sales page. Everything autosaves as you type.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-parchment/70 p-3.5">
        <span className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-lime">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">
            Publishing as {course.creatorName || "your profile"}
          </p>
          <p className="truncate text-xs text-smoke">
            {course.creatorHandle
              ? `@${course.creatorHandle} — the identity from your creator profile.`
              : "Add a handle in your profile to activate your storefront link."}
          </p>
        </div>
        <Link
          href="/creator/profile"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent underline underline-offset-2"
        >
          Edit profile <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <AutosaveField
        id="course-title"
        label="Course title"
        initialValue={course.title}
        placeholder="e.g. Film Photography Foundations"
        maxLength={120}
        disabled={readOnly}
        validate={(value) => {
          if (!value.trim()) return "Your course needs a title.";
          if (value.trim().length < 4) return "A touch longer — give buyers something to remember.";
          return undefined;
        }}
        onSave={(value) => save({ title: value.trim() })}
      />

      <AutosaveField
        id="course-description"
        label="Short description"
        initialValue={course.shortDescription}
        placeholder="One or two sentences that sell the outcome, not the syllabus."
        hint="Shown on your storefront and in link previews."
        multiline
        maxLength={220}
        disabled={readOnly}
        validate={(value) => {
          if (!value.trim()) return "Your course needs a short description.";
          if (value.trim().length < 10) return "Say a little more (at least 10 characters).";
          return undefined;
        }}
        onSave={(value) => save({ shortDescription: value.trim() })}
      />

      <OutcomesEditor
        initialOutcomes={course.outcomes}
        disabled={readOnly}
        onSave={(outcomes) => save({ outcomes })}
      />

      <CoverUpload
        courseId={course.id}
        cover={course.cover}
        saving={coverSaving}
        disabled={readOnly}
        onSave={async (cover) => {
          setCoverSaving(true);
          const result = await save({ cover });
          setCoverSaving(false);
          return result;
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage 3 — Pricing
// ---------------------------------------------------------------------------

export function PricingStage({
  course,
  service,
  setCourse,
  readOnly = false,
  goToReview,
}: {
  course: CourseEditor;
  service: CourseService;
  setCourse: (course: CourseEditor) => void;
  readOnly?: boolean;
  goToReview: () => void;
}) {
  const toast = useToast();
  const [rupees, setRupees] = useState(
    course.priceInPaise !== null ? String(course.priceInPaise / 100) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = Number(rupees);
  const validNumber = rupees.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
  const isFree = validNumber && Math.round(parsed * 100) === 0;
  const preview = validNumber && !isFree ? commissionBreakdown(Math.round(parsed * 100)) : null;
  const dirty = validNumber && Math.round(parsed * 100) !== course.priceInPaise;

  const savePrice = async () => {
    if (!validNumber) {
      setError("Enter a price of ₹0 or more in whole or decimal rupees.");
      return;
    }
    if (parsed > 500000) {
      setError("Keep the price under ₹5,00,000.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await service.setPrice(course.id, Math.round(parsed * 100));
    setSaving(false);
    if (!result.ok) {
      // Failure: keep the typed value, offer to retry by pressing Save again.
      setError(result.error.message);
      toast.push({
        variant: "error",
        title: "Price not saved",
        description: "Your typed price is preserved — press Save price to retry.",
      });
      return;
    }
    setCourse(result.data);
    const savedPrice = result.data.priceInPaise ?? 0;
    toast.push({
      variant: "success",
      title: "Price saved",
      description:
        savedPrice === 0
          ? "Listed as a FREE course — buyers enrol instantly with no payment."
          : `${formatINR(savedPrice)} per enrolment.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Pricing</h2>
        <p className="mt-0.5 text-sm text-smoke">
          One price in rupees. Buyers pay once and keep access through their learner dashboard.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
        <label htmlFor="course-price" className="block text-sm font-semibold text-ink">
          Course price (INR)
        </label>
        <p className="mt-1 text-xs text-smoke">
          Set it to 0 to publish this as a free course. Free courses show a FREE badge and skip
          payment entirely.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-parchment text-xl font-bold">
            ₹
          </span>
          <input
            id="course-price"
            inputMode="decimal"
            value={rupees}
            disabled={readOnly}
            onChange={(event) => {
              setRupees(event.target.value.replace(/[^0-9.]/g, ""));
              setError(null);
            }}
            placeholder="999"
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              "w-full max-w-56 rounded-xl border-2 bg-white px-4 py-3 text-xl font-bold text-ink tabular-nums placeholder:text-smoke focus:ring-4 focus:ring-accent/15 focus:outline-none",
              error ? "border-accent-deep" : "border-ink focus:border-accent",
            )}
          />
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs font-bold text-accent-deep">{error}</p>
        ) : null}

        {isFree ? (
          <div className="mt-4 rounded-2xl border-2 border-ink bg-lime px-4 py-3">
            <p className="text-sm font-bold text-ink">FREE course</p>
            <p className="text-[11px] text-ink/80">
              No payment step. Anyone with the link can enrol and get dashboard access.
            </p>
          </div>
        ) : null}

        {preview ? (
          <dl className="mt-5 space-y-2.5 rounded-2xl border-2 border-ink bg-parchment/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <dt className="font-semibold text-smoke">Buyer pays</dt>
              <dd className="font-bold text-ink tabular-nums">{formatINR(preview.grossInPaise, { decimals: true })}</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="font-semibold text-smoke">Platform commission (8%)</dt>
              <dd className="font-bold text-accent tabular-nums">−{formatINR(preview.platformFeeInPaise, { decimals: true })}</dd>
            </div>
            <div className="flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-2.5 text-sm">
              <dt className="font-semibold text-ink">Your share before other deductions (92%)</dt>
              <dd className="font-editorial text-xl text-ink italic tabular-nums">
                {formatINR(preview.creatorShareInPaise, { decimals: true })}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={savePrice}
            loading={saving}
            disabled={readOnly || !dirty}
          >
            {saving ? "Saving…" : "Save price"}
          </Button>
          {!readOnly ? (
            <Button type="button" variant="outline" size="sm" onClick={goToReview} disabled={course.priceInPaise === null}>
              Continue to review
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-parchment/50 p-4 text-xs leading-relaxed text-smoke">
        <p className="font-bold text-ink">How this estimate works</p>
        <p className="mt-1">
          Commission is computed in integer paise: fee = Math.round(price × 8%), i.e. rounded to the
          nearest paise (half up). Example: ₹1,000 → ₹80 fee → ₹920 remaining before other
          deductions. Free courses (₹0) have no sale, so no commission is charged. This is a
          frontend estimate only — the authoritative calculation happens server-side at checkout,
          and payment-gateway charges and applicable taxes are settled separately per the
          provider&apos;s terms.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storefront preview
// ---------------------------------------------------------------------------

export function StorefrontPreviewModal({
  course,
  open,
  onClose,
}: {
  course: CourseEditor;
  open: boolean;
  onClose: () => void;
}) {
  /*
    This is a faithful replica of the live course detail page
    (CourseSalesPage at /@handle/slug) — same sections, same order, same
    visual language — so what the creator previews is exactly what buyers
    get. Stats are derived with the same formulas the storefront data layer
    uses, so the numbers match the live page. Only the accordion is
    interactive here; enrolment and playback stay decorative.
  */
  const { state: profileState } = useAsyncData(() => {
    const service = getCreatorDataService();
    return service
      ? service.getProfile()
      : Promise.resolve({
          ok: false as const,
          error: { code: "unavailable", message: "Service unavailable" },
        });
  }, []);
  const profile = profileState.status === "success" ? profileState.data : null;
  const creator = {
    handle: course.creatorHandle,
    displayName: profile?.displayName || course.creatorName,
    avatarUrl: profile?.avatarUrl ?? null,
    niche: profile?.niche || "",
  };

  const isFreeCourse = (course.priceInPaise ?? 0) === 0;
  // On a ₹0 course the whole course is free, so preview lessons are simply
  // "preview"; "free preview" is only meaningful on a paid course.
  const previewNoun = isFreeCourse ? "preview" : "free preview";
  const previewNounPlural = isFreeCourse ? "previews" : "free previews";
  const allLessons = course.sections.flatMap((section) => section.lessons);
  const previewable = (lesson: { type: string; isPreview?: boolean }) =>
    lesson.type === "video" && lesson.isPreview === true;
  const freePreviewLesson = allLessons.find(previewable) ?? null;
  const previewCount = allLessons.filter(previewable).length;
  const lessonCount = allLessons.length;
  const videoCount = allLessons.filter((lesson) => lesson.type === "video").length;
  const resourceCount = allLessons.reduce(
    (sum, lesson) => sum + (lesson.type === "resources" ? lesson.media.length : 0),
    0,
  );
  // Real runtime from measured video durations; the same estimate fallback
  // as the live page when nothing has been measured yet.
  const measuredSeconds = allLessons.reduce(
    (sum, lesson) =>
      lesson.type === "video" ? sum + parseDurationLabel(lesson.media[0]?.durationLabel) : sum,
    0,
  );
  const totalSeconds = measuredSeconds > 0 ? measuredSeconds : Math.max(videoCount, 1) * 8 * 60;
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const durationLabel =
    totalMinutes < 60
      ? `${totalMinutes}m`
      : `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 === 0 ? "" : ` ${totalMinutes % 60}m`}`;

  const lessonDurationOf = (lesson: (typeof allLessons)[number]): string | undefined =>
    isMissingDuration(lesson.media[0]?.durationLabel) ? undefined : lesson.media[0]?.durationLabel;

  // Curriculum accordion — same behaviour as the live page (first section open).
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (course.sections[0]?.id) initial.add(course.sections[0].id);
    return initial;
  });
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
    if (allSectionsOpen) setOpenSections(new Set());
    else setOpenSections(new Set(course.sections.map((section) => section.id)));
  };

  return (
    <Modal open={open} onClose={onClose} title="Storefront preview" wide>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-ink uppercase">
          {course.status === "published" ? "Preview" : "Draft preview"}
        </span>
        <p className="text-[11px] text-smoke">
          The live course page, exactly as buyers see it — purchases are disabled here.
        </p>
      </div>

      {/* Replica of the live course detail page. */}
      <div className="overflow-hidden rounded-2xl border-2 border-ink">
        {/* Hero — parchment backdrop, breadcrumb → title → stats → creator card */}
        <div className="border-b-2 border-ink bg-parchment px-5 pt-8 pb-8 sm:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-smoke">
              <li>
                <Link
                  href={`/@${course.creatorHandle}`}
                  className="font-bold text-accent-deep underline-offset-2 hover:underline"
                >
                  @{course.creatorHandle}
                </Link>
              </li>
              <li aria-hidden="true" className="text-smoke/60">
                /
              </li>
              <li aria-current="page" className="min-w-0">
                <span className="block truncate font-bold text-ink">{course.title || "Untitled course"}</span>
              </li>
            </ol>
          </nav>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink">
            {course.title || "Untitled course"}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-pretty text-smoke">
            {course.shortDescription || "No description yet."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Sticker color="lime">
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </Sticker>
            <Sticker color="cream">{durationLabel}</Sticker>
            <Sticker color="cream">
              {resourceCount} {resourceCount === 1 ? "download" : "downloads"}
            </Sticker>
            {previewCount > 0 ? (
              <Sticker color="ink">
                {previewCount} {previewCount === 1 ? previewNoun : previewNounPlural}
              </Sticker>
            ) : null}
          </div>

          <Link
            href={`/@${course.creatorHandle}`}
            className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white p-3.5 shadow-hard-xs sm:p-4"
          >
            <span className="flex min-w-0 items-center gap-3">
              <ProfileAvatar
                src={creator.avatarUrl}
                name={creator.displayName}
                sizePx={48}
                className="size-12"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink sm:text-base">
                  {creator.displayName}
                </span>
                <span className="block truncate text-xs font-semibold text-accent-deep">
                  @{creator.handle} · {creator.niche || "Creator"}
                </span>
              </span>
            </span>
            <span className="hidden shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-cream px-3 py-1 text-[11px] font-bold text-ink transition-colors group-hover:bg-lime sm:inline-flex">
              View storefront
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>

        {/* Body — same mobile flow as the live page: enrol card, then the sections. */}
        <div className="space-y-8 bg-cream px-5 py-8 sm:px-8">
          {/* Enrol card — cover, price, secure checkout, includes, policy */}
          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard">
            {/* Course thumbnail is always 16:9, matching the uploaded cover. */}
            <div className="relative aspect-video border-b-2 border-ink bg-parchment">
              {course.cover?.previewUrl ? (
                <Image
                  src={course.cover.previewUrl}
                  alt={`${course.title || "Course"} course cover`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center font-editorial text-5xl text-ink/20 italic">
                  {(course.title || "C").slice(0, 1)}
                </div>
              )}
              {freePreviewLesson ? (
                <span className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-lime px-3.5 py-1.5 text-xs font-bold text-ink shadow-hard-xs">
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                  Watch {previewNoun}
                </span>
              ) : null}
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="font-editorial text-5xl leading-none text-ink italic">
                    {course.priceInPaise !== null ? priceLabel(course.priceInPaise) : "No price"}
                  </p>
                  <p className="mt-1.5 text-[11px] font-bold tracking-[0.14em] text-smoke uppercase">
                    {course.priceInPaise === null
                      ? "price not set"
                      : isFreeCourse
                        ? "free · enrol instantly"
                        : "one time · INR"}
                  </p>
                </div>
                <span className="grid size-10 place-items-center rounded-2xl border-2 border-ink bg-lime/40">
                  <ShieldCheck className="size-5 text-moss" aria-hidden="true" />
                </span>
              </div>

              <div aria-hidden="true" className="pointer-events-none">
                <Button
                  type="button"
                  variant="accent"
                  size="lg"
                  tabIndex={-1}
                  className="mt-5 w-full"
                >
                  <BadgeIndianRupee className="size-5" aria-hidden="true" />
                  {isFreeCourse ? "Enroll free" : "Enroll now"}
                </Button>
              </div>

              {/* Small low-brightness "Secure checkout" label + 4 grey payment logos */}
              <SecureCheckoutLogos />

              <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-4">
                <p className="text-[11px] font-bold tracking-[0.14em] text-smoke uppercase">
                  This course includes
                </p>
                <ul className="mt-3 space-y-2.5">
                  {COURSE_INCLUDES.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5 text-xs font-medium text-smoke">
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
                  className="font-semibold text-accent-deep underline underline-offset-2"
                >
                  Purchase policy
                </Link>
              </p>
            </div>
          </div>

          {/* Outcomes */}
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

          {/* Free preview lesson */}
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
                    {lessonDurationOf(freePreviewLesson) ? ` · ${lessonDurationOf(freePreviewLesson)}` : ""}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-lime bg-lime px-4 py-2 text-xs font-bold text-ink">
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                  Watch now
                </span>
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
                <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Curriculum</h2>
                <p className="mt-1 text-xs font-semibold text-smoke">
                  {course.sections.length} {course.sections.length === 1 ? "section" : "sections"} ·{" "}
                  {videoCount} {videoCount === 1 ? "video" : "videos"} ·{" "}
                  {resourceCount} {resourceCount === 1 ? "file" : "files"}
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
                  <li key={section.id} className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-cream">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-parchment/60"
                    >
                      <span className="font-editorial text-lg text-accent-deep italic">
                        {String(sectionIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-sm font-bold text-ink sm:text-base">{section.title}</span>
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
                        {section.lessons.map((lesson) => {
                          const isPreview = previewable(lesson);
                          return (
                            <li key={lesson.id} className="flex items-start gap-3 px-4 py-3.5">
                              <span
                                className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink ${
                                  isPreview ? "bg-lime" : "bg-cream"
                                }`}
                              >
                                {lesson.type === "video" ? (
                                  <Play className={`size-3.5 ${isPreview ? "fill-current" : ""}`} aria-hidden="true" />
                                ) : (
                                  <FileText className="size-3.5" aria-hidden="true" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                                  {lesson.title}
                                  {isPreview ? null : (
                                    <Lock
                                      className="size-3 text-smoke"
                                      role="img"
                                      aria-label="Locked until enrolled"
                                    />
                                  )}
                                </p>
                                {lesson.description ? (
                                  <p className="mt-0.5 text-xs leading-relaxed text-smoke">{lesson.description}</p>
                                ) : null}
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-smoke">
                                  <span>
                                    {lesson.type === "video"
                                      ? "Video"
                                      : `${lesson.media.length} downloadable file${lesson.media.length === 1 ? "" : "s"}`}
                                  </span>
                                  {lesson.type === "video" ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock3 className="size-3" aria-hidden="true" />
                                      {lessonDurationOf(lesson) ?? "Duration unavailable"}
                                    </span>
                                  ) : null}
                                  {isPreview ? (
                                    <span className="font-bold text-accent-deep underline underline-offset-2">
                                      Watch {previewNoun}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
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

          {/* Purchase terms */}
          <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-xs sm:p-8">
            <h3 className="text-sm font-bold tracking-[0.14em] text-smoke uppercase">Purchase terms</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-smoke">
              <li>
                {isFreeCourse
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
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Stage 4 — Review & publish
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<"details" | "curriculum" | "pricing", string> = {
  details: "Course details",
  curriculum: "Curriculum",
  pricing: "Pricing",
};

export function ReviewStage({
  course,
  service,
  setCourse,
  goToStage,
  onOpenPreview,
  readOnly = false,
}: {
  course: CourseEditor;
  service: CourseService;
  setCourse: (course: CourseEditor) => void;
  goToStage: (stage: CourseStage) => void;
  onOpenPreview: () => void;
  readOnly?: boolean;
}) {
  const toast = useToast();
  const [publishing, setPublishing] = useState(false);
  const [publishErrors, setPublishErrors] = useState<Record<string, string[]> | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  const checklist = readinessChecklist(course);
  const publicUrl = coursePublicUrl(course);

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

  const publish = async () => {
    setPublishing(true);
    setPublishErrors(null);
    const result = await service.publish(course.id);
    setPublishing(false);
    if (!result.ok) {
      // Failure preserves the draft and identifies the problem(s).
      setPublishErrors(result.error.fieldErrors ?? { review: [result.error.message] });
      toast.push({
        variant: "error",
        title: "Not ready to publish",
        description: result.error.message,
      });
      return;
    }
    setCourse(result.data);
    setJustPublished(true);
  };

  const unpublish = async () => {
    setUnpublishing(true);
    const result = await service.unpublish(course.id);
    setUnpublishing(false);
    setConfirmUnpublish(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't unpublish", description: result.error.message });
      return;
    }
    setCourse(result.data);
    setJustPublished(false);
    toast.push({ variant: "info", title: "Course unpublished", description: "New buyers can no longer purchase it. Enrolled students keep access." });
  };

  const share = async () => {
    const shareData = {
      title: course.title,
      text: `My course “${course.title}” is live — check it out.`,
      url: publicUrl,
    };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User closed the share sheet or it failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.push({ variant: "success", title: "Link copied instead", description: "Sharing isn't available here, so we copied it." });
    } catch {
      toast.push({ variant: "error", title: "Couldn't share", description: "Copy the link manually instead." });
    }
  };

  // After a successful publish.
  if (justPublished && course.status === "published") {
    return (
      <div className="rounded-3xl border-2 border-ink bg-white p-6 text-center shadow-hard sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-sm">
          <Globe className="size-8" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          “{course.title}” is live
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-smoke">
          Your storefront link is ready. Share it where your audience already is — bio, video
          descriptions, newsletters, group chats.
        </p>
        <div className="mx-auto mt-5 max-w-lg rounded-2xl border-2 border-ink bg-parchment/70 px-4 py-3">
          <p className="truncate text-sm font-bold text-ink">{publicUrl}</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <CopyButton text={publicUrl} variant="ink" />
          <Button type="button" variant="lime" size="sm" onClick={share}>
            <Share2 className="size-4" aria-hidden="true" />
            Share
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onOpenPreview}>
            <Eye className="size-4" aria-hidden="true" />
            Preview storefront
          </Button>
        </div>
        <p className="mx-auto mt-5 max-w-md text-[11px] leading-relaxed text-smoke">
          Your course page is now public. Anyone with the link can read the sales page and check out
          securely.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 border-t-2 border-dashed border-ink/15 pt-5">
          <Button href="/creator/courses" variant="ink" size="sm">
            Back to My Courses
          </Button>
          <Button href="/creator/dashboard" variant="outline" size="sm">
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Review & publish</h2>
          <p className="mt-0.5 text-sm text-smoke">
            Complete the checklist, preview the storefront, then publish.
          </p>
        </div>
        <StatusChip status={course.status} />
      </div>

      {course.status === "published" ? (
        <div className="rounded-2xl border-2 border-ink bg-lime/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">
                Live since {course.publishedAt ? formatDate(course.publishedAt) : "—"}
              </p>
              <p className="mt-1 truncate text-xs text-smoke">{publicUrl}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={publicUrl} />
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmUnpublish(true)}>
                Unpublish
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="divide-y-2 divide-ink/10 rounded-3xl border-2 border-ink bg-white shadow-hard-xs">
        {checklist.map((item) => (
          <li key={item.key} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink",
                item.ok ? "bg-lime" : "bg-parchment",
              )}
            >
              {item.ok ? (
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              ) : (
                <X className="size-4 text-accent" strokeWidth={3} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-bold", item.ok ? "text-ink" : "text-smoke")}>{item.label}</p>
              {item.detail && !item.ok ? <p className="text-xs text-smoke">{item.detail}</p> : null}
            </div>
            {!item.ok ? (
              <Button type="button" size="sm" variant="outline" onClick={() => goToStage(item.stage)}>
                Fix in {STAGE_LABELS[item.stage]}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {publishErrors ? (
        <div role="alert" className="rounded-2xl border-2 border-accent-deep bg-accent/5 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-accent-deep">
            <CircleAlert className="size-4.5" aria-hidden="true" />
            The service says this course isn&apos;t ready. Your draft is untouched.
          </p>
          <ul className="mt-3 space-y-1.5">
            {Object.entries(publishErrors).map(([stage, messages]) =>
              messages.map((message) => (
                <li key={`${stage}-${message}`}>
                  <button
                    type="button"
                    onClick={() => goToStage(stage as CourseStage)}
                    className="inline-flex items-center gap-1.5 text-left text-xs font-semibold text-accent-deep underline underline-offset-2"
                  >
                    <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                    {message}
                    {stage in STAGE_LABELS ? ` — ${STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}` : ""}
                  </button>
                </li>
              )),
            )}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button type="button" variant="outline" onClick={onOpenPreview}>
          <Eye className="size-4" aria-hidden="true" />
          Preview storefront
        </Button>
        {!readOnly ? (
          <>
            <Button type="button" variant="outline" onClick={saveDraft} loading={savingDraft}>
              Save draft
            </Button>
            {course.status !== "published" ? (
              <Button type="button" variant="accent" onClick={publish} loading={publishing}>
                <BadgeIndianRupee className="size-4" aria-hidden="true" />
                Publish course
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
      <p className="text-[11px] leading-relaxed text-smoke">
        Publishing validates the same readiness checklist the server enforces. Once published, your
        course page goes live on your storefront and can be purchased through your link.
      </p>

      <ConfirmDialog
        open={confirmUnpublish}
        title="Unpublish this course?"
        body={
          <>
            New buyers will no longer be able to purchase{" "}
            <span className="font-semibold text-ink">“{course.title}”</span>. Students who already
            enrolled keep their access. You can re-publish anytime.
          </>
        }
        confirmLabel="Unpublish"
        danger
        loading={unpublishing}
        onConfirm={unpublish}
        onCancel={() => setConfirmUnpublish(false)}
      />
    </div>
  );
}

// Icons referenced by the curriculum in the preview (kept tree-shakeable).
export const PREVIEW_ICONS = { Video, FileText };
