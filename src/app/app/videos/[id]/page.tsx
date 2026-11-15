import React from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Download, Film, Sparkles } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getVideoDetail } from "@/lib/app-api";
import { formatDurationLabel } from "@/lib/app-types";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Video Detail",
  description: "Play and download your completed Beevo cartoon MP4 video.",
  path: "/app/videos/detail",
  noIndex: true,
});

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = getVideoDetail(id);
  const video = result.data;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/videos"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Videos
        </Link>
        <span className="rounded-full border border-beevo-border bg-white px-3 py-1 text-[11.5px] font-bold text-beevo-muted">
          Video ID: {id}
        </span>
      </div>

      {!video ? (
        <section className="rounded-[24px] border border-dashed border-beevo-border-warm bg-white p-6 text-center shadow-beevo-card sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-beevo-cream text-beevo-honey-text">
            <Film className="h-6 w-6" aria-hidden="true" />
          </div>
          <Eyebrow className="mt-4">Video Playback</Eyebrow>
          <h1 className="mt-3 font-display text-[22px] font-extrabold tracking-[-0.02em] text-beevo-ink sm:text-[26px]">
            No rendered MP4 loaded for this video ID
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-beevo-body">
            Video playback and MP4 download connect to verified Cloudflare R2 storage in Phase 4.
            Beevo never displays mock videos or synthetic preview timelines in place of your real
            exports.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app/create" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Create New Video
            </Link>
            <Link href="/app/videos" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
              Return to Video Library
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Clean MP4 Player (NO fake timeline editor) */}
          <section className="rounded-[24px] border border-beevo-border bg-white p-4 shadow-beevo-card sm:p-5 lg:col-span-8">
            <div className="overflow-hidden rounded-[16px] bg-beevo-dark">
              {video.mp4Url ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={video.thumbnailUrl ?? undefined}
                  src={video.mp4Url}
                  className="aspect-video w-full"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center p-6 text-center text-[14px] text-white/75">
                  MP4 file is not available yet.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-[22px] font-extrabold text-beevo-ink">
                  {video.title}
                </h1>
                <p className="mt-0.5 text-[13px] text-beevo-muted">
                  Created {new Date(video.createdAt).toLocaleDateString()} &middot;{" "}
                  {formatDurationLabel(video.durationSeconds)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {video.mp4Url && (
                  <a
                    href={video.mp4Url}
                    download
                    className="beevo-btn-primary min-h-[44px] px-5 text-[13.5px]"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download MP4
                  </a>
                )}
                <Link
                  href="/app/create"
                  className="beevo-btn-secondary min-h-[44px] px-4 text-[13.5px]"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  New from Idea
                </Link>
              </div>
            </div>
          </section>

          {/* Video Metadata */}
          <aside className="rounded-[24px] border border-beevo-border bg-white p-5 shadow-beevo-card lg:col-span-4">
            <h2 className="font-display text-[17px] font-extrabold text-beevo-ink">
              Export Details
            </h2>
            <dl className="mt-4 divide-y divide-beevo-border/80 text-[13px]">
              <div className="flex justify-between py-2.5">
                <dt className="text-beevo-muted">Duration</dt>
                <dd className="font-bold text-beevo-ink">
                  {formatDurationLabel(video.durationSeconds)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-beevo-muted">Format</dt>
                <dd className="font-bold text-beevo-ink">
                  {video.aspectRatio} &middot; {video.resolution}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-beevo-muted">Visual Style</dt>
                <dd className="font-bold text-beevo-ink">{video.styleName}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-beevo-muted">Status</dt>
                <dd className="font-bold capitalize text-beevo-ink">{video.status}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-[14px] bg-beevo-canvas p-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-beevo-muted">
                Original Idea
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-beevo-body">
                {video.originalIdea}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
