import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Download,
  Film,
  Image as ImageIcon,
  Layers,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getGenerationJob } from "@/lib/app-api";
import {
  formatDurationLabel,
  GENERATION_STAGE_DEFINITIONS,
  type StageState,
} from "@/lib/app-types";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Live Generation Workspace",
  description:
    "Track real-time script, storyboard, image, narration, timeline, FFmpeg render, and Cloudflare R2 upload progress.",
  path: "/app/generations/live",
  noIndex: true,
});

function StageIcon({ state }: { state: StageState }) {
  if (state === "completed") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
  }
  if (state === "failed") {
    return <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
  }
  if (state === "in_progress") {
    return <Sparkles className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />;
  }
  return <Circle className="h-4 w-4 text-beevo-muted/55" aria-hidden="true" />;
}

export default async function GenerationProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = getGenerationJob(id);
  const job = result.data;

  const stages = job
    ? job.stages
    : GENERATION_STAGE_DEFINITIONS.map((def) => ({
        key: def.key,
        label: def.label,
        engine: def.engine,
        state: "pending" as StageState,
        detail: null,
      }));

  const completedImages = job
    ? job.generatedImages.filter((img) => img.status === "completed").length
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Generation Header */}
      <header className="rounded-[24px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow showSparkle>Live Generation Monitor</Eyebrow>
              <span className="rounded-full border border-beevo-border bg-beevo-canvas px-2.5 py-0.5 text-[11px] font-bold text-beevo-muted">
                Job ID: {id}
              </span>
              <span className="rounded-full bg-beevo-cream px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-beevo-honey-text">
                {job ? job.status : "Awaiting live job"}
              </span>
            </div>

            <h1 className="mt-2.5 font-display text-[clamp(1.5rem,3vw,2.15rem)] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
              {job ? job.projectTitle : "No active generation connected for this ID"}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-beevo-body">
              {job
                ? "Following real-time worker telemetry across script, storyboard, visuals, voiceover, and FFmpeg rendering."
                : "Real-time job streaming connects in Phase 4 (Supabase Realtime + worker pipeline). Below is the live workspace layout with zero simulated progress or fake frames."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-[14px] border border-beevo-border bg-beevo-canvas px-3.5 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-beevo-muted">
                Duration
              </p>
              <p className="font-display text-[15px] font-extrabold tabular-nums text-beevo-ink">
                {job ? formatDurationLabel(job.requestedDurationSeconds) : "—"}
              </p>
            </div>
            <div className="rounded-[14px] border border-beevo-border-warm bg-beevo-cream/85 px-3.5 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-beevo-honey-text">
                Credit Reserve
              </p>
              <p className="font-display text-[15px] font-extrabold tabular-nums text-beevo-ink">
                {job ? `${job.credits.reservedCredits.toLocaleString()} cr` : "—"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Completion Video Player (STRICTLY rendered only when R2 MP4 is genuinely verified) */}
      {job?.completedVideo?.r2Verified && job.completedVideo.mp4Url && (
        <section
          aria-labelledby="completed-video-heading"
          className="rounded-[24px] border-2 border-emerald-300 bg-white p-5 shadow-beevo sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h2
                id="completed-video-heading"
                className="font-display text-[19px] font-extrabold text-beevo-ink"
              >
                Final Video Ready (Cloudflare R2 Verified)
              </h2>
            </div>
            <a
              href={job.completedVideo.mp4Url}
              download
              className="beevo-btn-primary min-h-[44px] px-5 text-[13.5px]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download MP4
            </a>
          </div>
          <div className="mt-4 overflow-hidden rounded-[16px] bg-beevo-dark">
            <video
              controls
              playsInline
              preload="metadata"
              src={job.completedVideo.mp4Url}
              className="aspect-video w-full"
            />
          </div>
        </section>
      )}

      {/* Error State Panel (Only when real job fails) */}
      {job?.status === "failed" && (
        <section
          role="alert"
          className="rounded-[20px] border border-red-200 bg-red-50/90 p-5 text-red-900"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <div>
                <h2 className="font-display text-[16px] font-extrabold text-red-950">
                  Generation did not complete
                </h2>
                <p className="mt-1 text-[13.5px] leading-relaxed">
                  {job.errorMessage ??
                    "An unexpected render error interrupted this video. Reserved credits have been automatically refunded to your wallet."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/create"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-red-900 px-4 text-[13px] font-bold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry Setup
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-[42px] items-center rounded-full border border-red-300 bg-white px-4 text-[13px] font-bold text-red-900"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 10-Stage Pipeline Stepper + Telemetry Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Exact 10 Pipeline Stages */}
        <section
          aria-labelledby="pipeline-stages-heading"
          className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card lg:col-span-5"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                id="pipeline-stages-heading"
                className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
              >
                10-Stage Render Pipeline
              </h2>
              <p className="text-[12.5px] text-beevo-muted">
                Every stage transitions only from real worker events.
              </p>
            </div>
            <span className="rounded-full bg-beevo-canvas px-2.5 py-1 text-[11.5px] font-bold text-beevo-muted">
              10 stages
            </span>
          </div>

          <ol className="mt-4 space-y-2">
            {stages.map((stage, index) => (
              <li
                key={stage.key}
                className={`flex items-center justify-between gap-3 rounded-[14px] border px-3.5 py-2.5 ${
                  stage.state === "in_progress"
                    ? "border-2 border-beevo-yellow bg-beevo-cream/80"
                    : stage.state === "completed"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : stage.state === "failed"
                        ? "border-red-200 bg-red-50/60"
                        : "border-beevo-border/80 bg-beevo-canvas"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-extrabold tabular-nums text-beevo-muted shadow-sm">
                    {index + 1}
                  </span>
                  <StageIcon state={stage.state} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-extrabold text-beevo-ink">
                      {stage.label}
                    </p>
                    <p className="text-[11.5px] text-beevo-muted">{stage.engine}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold capitalize text-beevo-muted">
                  {stage.state.replace("_", " ")}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Right: Live Image Grid + Narration + Timeline + Rendering + Credit Summary */}
        <div className="space-y-6 lg:col-span-7">
          {/* Live Image Generation Grid */}
          <section
            aria-labelledby="live-images-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                <h2
                  id="live-images-heading"
                  className="font-display text-[17px] font-extrabold text-beevo-ink"
                >
                  Live Scene Illustrations
                </h2>
              </div>
              <span className="rounded-full bg-beevo-cream px-3 py-1 text-[12px] font-extrabold tabular-nums text-beevo-ink">
                {job && job.expectedImageCount !== null
                  ? `Generated images: ${completedImages} / ${job.expectedImageCount}`
                  : "Generated images: Pending storyboard plan"}
              </span>
            </div>

            {job && job.generatedImages.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {job.generatedImages.map((img) => (
                  <div
                    key={img.sceneId}
                    className="overflow-hidden rounded-[12px] border border-beevo-border bg-beevo-canvas"
                  >
                    {img.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={img.imageUrl}
                        alt={`Generated frame for scene ${img.sceneIndex}`}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-[12px] font-semibold text-beevo-muted">
                        Scene {img.sceneIndex} &middot; {img.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[16px] border border-dashed border-beevo-border-warm bg-beevo-cream/40 px-5 py-8 text-center">
                <p className="text-[14px] font-bold text-beevo-ink">
                  Dynamic frame count resolves after storyboard approval
                </p>
                <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-beevo-muted">
                  Beevo never hardcodes a fixed image count. Once your storyboard is approved,
                  each fal.ai illustration streams directly into this grid as it finishes.
                </p>
              </div>
            )}
          </section>

          {/* Narration & Dynamic Timeline Widgets */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Narration Widget */}
            <section
              aria-labelledby="narration-widget-heading"
              className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card"
            >
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                <h2
                  id="narration-widget-heading"
                  className="font-display text-[16px] font-extrabold text-beevo-ink"
                >
                  Narration &amp; Alignment
                </h2>
              </div>
              <dl className="mt-3.5 space-y-2 text-[13px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Voice</dt>
                  <dd className="font-bold text-beevo-ink">
                    {job?.narration.voiceName ?? "Not assigned yet"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Audio Duration</dt>
                  <dd className="font-bold tabular-nums text-beevo-ink">
                    {job?.narration.actualDurationSeconds
                      ? formatDurationLabel(job.narration.actualDurationSeconds)
                      : "Pending"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Word Alignment</dt>
                  <dd className="font-bold capitalize text-beevo-ink">
                    {job?.narration.alignmentStatus ?? "Pending"}
                  </dd>
                </div>
              </dl>
              {job?.narration.audioPreviewUrl ? (
                <audio
                  controls
                  src={job.narration.audioPreviewUrl}
                  className="mt-4 w-full"
                />
              ) : (
                <p className="mt-3.5 rounded-[12px] bg-beevo-canvas px-3 py-2.5 text-[12px] text-beevo-muted">
                  Audio preview unlocks once ElevenLabs narration finishes synthesizing.
                </p>
              )}
            </section>

            {/* Rendering & Upload Widget */}
            <section
              aria-labelledby="rendering-widget-heading"
              className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card"
            >
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                <h2
                  id="rendering-widget-heading"
                  className="font-display text-[16px] font-extrabold text-beevo-ink"
                >
                  FFmpeg Render &amp; R2 Upload
                </h2>
              </div>
              <dl className="mt-3.5 space-y-2 text-[13px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Render Stage</dt>
                  <dd className="font-bold text-beevo-ink">
                    {job ? job.rendering.stageLabel : "Idle"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">Frame Output</dt>
                  <dd className="font-bold tabular-nums text-beevo-ink">
                    {job?.rendering.processedFrames !== null &&
                    job?.rendering.totalFrames !== null &&
                    job
                      ? `${job.rendering.processedFrames} / ${job.rendering.totalFrames}`
                      : "Awaiting worker"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-beevo-muted">R2 Verification</dt>
                  <dd className="inline-flex items-center gap-1 font-bold capitalize text-beevo-ink">
                    <UploadCloud className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                    {job ? job.rendering.uploadState : "Pending"}
                  </dd>
                </div>
              </dl>
              <p className="mt-3.5 rounded-[12px] bg-beevo-canvas px-3 py-2.5 text-[12px] text-beevo-muted">
                Download links appear only after the final MP4 passes Cloudflare R2 validation.
              </p>
            </section>
          </div>

          {/* Dynamic Timeline Widget */}
          <section
            aria-labelledby="timeline-widget-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                <h2
                  id="timeline-widget-heading"
                  className="font-display text-[16.5px] font-extrabold text-beevo-ink"
                >
                  Dynamic Timeline Sequence
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-beevo-muted">
                {job?.timeline.captionsReady ? "Captions synced" : "Awaiting audio alignment"}
              </span>
            </div>

            {job && job.timeline.segments.length > 0 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {job.timeline.segments.map((seg) => (
                  <div
                    key={seg.sceneId}
                    className="min-w-[140px] rounded-[12px] border border-beevo-border bg-beevo-canvas p-3"
                  >
                    <p className="text-[12px] font-extrabold text-beevo-ink">
                      Scene {seg.sceneNumber}
                    </p>
                    <p className="mt-0.5 text-[11.5px] tabular-nums text-beevo-muted">
                      {seg.startSeconds.toFixed(1)}s – {seg.endSeconds.toFixed(1)}s
                    </p>
                    <p className="mt-1 text-[11px] capitalize text-beevo-honey-text">
                      {seg.transition}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-[14px] border border-beevo-border bg-beevo-canvas px-4 py-3.5 text-[13px] text-beevo-muted">
                Scene durations, transitions, and synchronized caption intervals populate here
                automatically once narration timestamps are computed.
              </p>
            )}
          </section>

          {/* Credit Settlement Summary */}
          <section
            aria-labelledby="credit-summary-heading"
            className="rounded-[22px] border border-beevo-border-warm bg-beevo-cream/65 p-5"
          >
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              <h2
                id="credit-summary-heading"
                className="font-display text-[16px] font-extrabold text-beevo-ink"
              >
                Credit Settlement Summary
              </h2>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[14px] border border-beevo-border bg-white p-3.5">
                <p className="text-[11.5px] font-bold text-beevo-muted">Starting Balance</p>
                <p className="mt-1 font-display text-[18px] font-extrabold tabular-nums text-beevo-ink">
                  {job?.credits.startingBalance !== null && job
                    ? `${job.credits.startingBalance.toLocaleString()} cr`
                    : "—"}
                </p>
              </div>
              <div className="rounded-[14px] border border-beevo-border bg-white p-3.5">
                <p className="text-[11.5px] font-bold text-beevo-muted">Reserved Credits</p>
                <p className="mt-1 font-display text-[18px] font-extrabold tabular-nums text-beevo-ink">
                  {job ? `${job.credits.reservedCredits.toLocaleString()} cr` : "—"}
                </p>
              </div>
              <div className="rounded-[14px] border border-beevo-border bg-white p-3.5">
                <p className="text-[11.5px] font-bold text-beevo-muted">Settlement Status</p>
                <p className="mt-1 font-display text-[15px] font-extrabold capitalize text-beevo-ink">
                  {job ? job.credits.settlementType : "Not reserved"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-beevo-body">
                Failed jobs automatically release and refund reserved credits.
              </p>
              <Link
                href="/app/create"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-beevo-dark px-4 text-[12.5px] font-bold text-[#FFFDF7]"
              >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                New Video in Studio
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
