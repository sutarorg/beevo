"use client";

import {
  ArrowUpRight,
  BadgeIndianRupee,
  Check,
  CircleAlert,
  Eye,
  FileText,
  Globe,
  Share2,
  UserRound,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CourseEditor } from "@/lib/creator-types";
import { shareableOrigin } from "@/lib/config";
import { commissionBreakdown, formatINR, priceLabel } from "@/lib/domain";
import { readinessChecklist, type CourseService, type CourseStage } from "@/lib/services/courses";
import { cn, formatDate } from "@/lib/utils";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { AutosaveField, OutcomesEditor } from "@/components/creator/wizard/fields";
import { CoverUpload } from "@/components/creator/wizard/uploads";
import { StatusChip, CopyButton } from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
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
              "w-full max-w-56 rounded-xl border-2 bg-white px-4 py-3 text-xl font-bold text-ink tabular-nums placeholder:text-ink/25 focus:ring-4 focus:ring-accent/15 focus:outline-none",
              error ? "border-accent-deep" : "border-ink focus:border-accent",
            )}
          />
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs font-bold text-accent-deep">{error}</p>
        ) : null}

        {isFree ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-ink bg-lime px-4 py-3">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-white text-[10px] font-black tracking-widest">
              ₹0
            </span>
            <div>
              <p className="text-sm font-bold text-ink">FREE course</p>
              <p className="text-[11px] text-ink/80">
                No payment step. Anyone with the link can enrol and get dashboard access.
              </p>
            </div>
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
  const lessonTotal = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  return (
    <Modal open={open} onClose={onClose} title="Storefront preview" wide>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-ink uppercase">
          {course.status === "published" ? "Storefront preview" : "Draft preview"}
        </span>
        <p className="text-[11px] text-smoke">How your sales page looks to buyers.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border-2 border-ink bg-white">
        <div className="relative aspect-[16/9] bg-parchment">
          {course.cover?.previewUrl ? (
            <Image src={course.cover.previewUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-smoke">No cover yet</div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full border-2 border-ink bg-lime px-3 py-1 text-sm font-bold shadow-hard-xs">
            {course.priceInPaise !== null ? priceLabel(course.priceInPaise) : "No price"}
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
            @{course.creatorHandle}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {course.title || "Untitled course"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-smoke">
            {course.shortDescription || "No description yet."}
          </p>
          {course.outcomes.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {course.outcomes.slice(0, 4).map((outcome, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {outcome}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 border-t-2 border-dashed border-ink/20 pt-4">
            <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">
              Curriculum · {course.sections.length} sections · {lessonTotal} lessons
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {course.sections.slice(0, 3).map((section, index) => (
                <li key={section.id} className="text-sm text-ink">
                  <span className="font-editorial mr-1.5 text-accent italic">{index + 1}.</span>
                  {section.title}
                </li>
              ))}
              {course.sections.length > 3 ? (
                <li className="text-xs text-smoke">+ {course.sections.length - 3} more sections</li>
              ) : null}
            </ul>
          </div>
          <div aria-hidden="true" className="pointer-events-none mt-5">
            <div className="flex w-full items-center justify-center rounded-full border-2 border-ink bg-accent py-3 text-sm font-bold text-cream opacity-70">
              Enrol now
            </div>
            <p className="mt-2 text-center text-[11px] text-smoke">
              Purchases are disabled in this preview.
            </p>
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
