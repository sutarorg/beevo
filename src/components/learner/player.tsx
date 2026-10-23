"use client";

import {
  Check,
  CheckCheck,
  CloudDownload,
  FileText,
  Maximize,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LearnerLessonView } from "@/lib/learner-types";
import { simulatedDownloadText } from "@/lib/mocks/learner";
import { isMockAuth } from "@/lib/services/auth";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const SPEEDS = [1, 1.25, 1.5, 2] as const;

/**
 * Simulated lesson player — a configurable mock of the video surface the
 * real R2-backed player will take over in Prompt 5. Position persists via
 * onProgress (mock service → sessionStorage); nothing here streams media.
 */
export function SimulatedPlayer({
  view,
  coverPreviewUrl,
  onProgress,
  onCompleted,
  onEnded,
}: {
  view: LearnerLessonView;
  coverPreviewUrl: string | null;
  onProgress: (positionSeconds: number) => void;
  onCompleted: (completed: boolean) => void;
  onEnded: () => void;
}) {
  const toast = useToast();
  const duration = view.playback.durationSeconds;
  const [position, setPosition] = useState(view.playback.resumeAtSeconds);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(false);

  // Fake clock.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPosition((current) => {
        const next = Math.min(current + 0.25 * speed, duration);
        if (next >= duration && !endedRef.current) {
          endedRef.current = true;
          window.setTimeout(() => {
            setPlaying(false);
            onCompleted(true);
            onEnded();
          }, 300);
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing, speed, duration, onCompleted, onEnded]);

  // Persist position (mock) while playing.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => onProgress(Math.round(position)), 2000);
    return () => window.clearInterval(timer);
  }, [playing, position, onProgress]);

  const toggle = () => {
    if (endedRef.current) {
      endedRef.current = false;
      setPosition(0);
    }
    setPlaying((current) => !current);
  };

  const seek = (next: number) => {
    endedRef.current = false;
    setPosition(next);
    onProgress(next);
  };

  const restart = () => seek(0);

  const openFullscreen = () => {
    if (frameRef.current?.requestFullscreen) {
      frameRef.current.requestFullscreen().catch(() => {
        toast.push({ variant: "info", title: "Fullscreen blocked", description: "Your browser said no to fullscreen." });
      });
    }
  };

  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div>
      <div
        ref={frameRef}
        className="relative aspect-video overflow-hidden rounded-3xl border-2 border-ink bg-ink shadow-hard-sm"
      >
        {/* Poster-style backdrop */}
        <div className="absolute inset-0 opacity-25">
          {coverPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreviewUrl} alt="" className="h-full w-full scale-110 object-cover blur-md" />
          ) : null}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

        {/* Simulated watermark */}
        <span className="absolute top-3 left-3 rounded-full border border-cream/40 bg-ink/70 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-cream/80 uppercase">
          Simulated playback
        </span>
        <span className="absolute top-3 right-3 rounded-full border border-cream/40 bg-ink/70 px-2.5 py-1 font-mono text-[9px] text-cream/70">
          mock://{view.lesson.id}
        </span>

        {/* Center status */}
        <div className="absolute inset-0 grid place-items-center">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause lesson" : "Play lesson"}
            className="grid size-18 place-items-center rounded-full border-2 border-cream bg-accent text-cream shadow-hard-lime transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? (
              <Pause className="size-8" aria-hidden="true" />
            ) : (
              <Play className="ml-1 size-8" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Bottom console */}
        <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
          <input
            type="range"
            min={0}
            max={duration}
            value={Math.round(position)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek"
            aria-valuetext={`${formatClock(position)} of ${formatClock(duration)}`}
            className="slider-accent w-full"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="grid size-9 place-items-center rounded-full border-2 border-cream/60 text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="ml-0.5 size-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={restart}
                aria-label="Restart lesson"
                className="grid size-9 place-items-center rounded-full border-2 border-cream/60 text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
              <span className="font-mono text-[11px] text-cream/90 tabular-nums">
                {formatClock(position)} / {formatClock(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value) as (typeof SPEEDS)[number])}
                aria-label="Playback speed"
                className="rounded-lg border-2 border-cream/60 bg-ink px-2 py-1 font-mono text-[11px] font-bold text-cream"
              >
                {SPEEDS.map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openFullscreen}
                aria-label="Fullscreen"
                className="grid size-9 place-items-center rounded-full border-2 border-cream/60 text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                <Maximize className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-smoke italic">{view.playback.note}</p>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-24 overflow-hidden rounded-full border border-ink bg-parchment">
            <span className="block h-full bg-accent" style={{ width: `${pct}%` }} />
          </span>
          <span className="text-[10px] font-bold text-smoke tabular-nums">{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Real lesson player for `direct` playback — an actual <video> fed by the
 * server-authorized, short-lived delivery URL. Position + completion persist
 * through the same progress contract as the simulated player.
 */
export function DirectPlayer({
  view,
  onProgress,
  onCompleted,
  onEnded,
}: {
  view: LearnerLessonView;
  onProgress: (positionSeconds: number) => void;
  onCompleted: (completed: boolean) => void;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const playback = view.playback.mode === "direct" ? view.playback : null;
  const resumeDone = useRef(false);

  if (!playback) return null;

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-3xl border-2 border-ink bg-ink shadow-hard-sm">
        {error ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <p className="text-sm font-bold text-cream">Playback failed</p>
              <p className="mt-1 text-xs text-cream/70">{error} The short-lived delivery URL may have expired — reload the page.</p>
            </div>
          </div>
        ) : null}
        <video
          ref={videoRef}
          className="h-full w-full bg-ink"
          controls
          playsInline
          controlsList="nodownload"
          src={playback.url}
          onLoadedMetadata={() => {
            if (resumeDone.current || !videoRef.current) return;
            resumeDone.current = true;
            if (playback.resumeAtSeconds > 0) {
              videoRef.current.currentTime = playback.resumeAtSeconds;
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) onProgress(Math.floor(videoRef.current.currentTime));
          }}
          onEnded={() => {
            onCompleted(true);
            onEnded();
          }}
          onError={() => setError("The video could not be loaded.")}
        />
        <span className="pointer-events-none absolute top-3 right-3 rounded-full border border-cream/40 bg-ink/70 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-cream/80 uppercase">
          Secure delivery · expires {new Date(playback.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-smoke italic">{playback.note}</p>
        <p className="text-[10px] font-bold text-smoke uppercase tracking-[0.14em]">Progress saves automatically</p>
      </div>
    </div>
  );
}

/** Downloadable resource rows (live: server-authorized short-lived URLs). */
export function ResourceDownloads({ view }: { view: LearnerLessonView }) {
  const toast = useToast();
  if (view.lesson.resources.length === 0) return null;

  const download = async (resource: { id: string; fileName: string; sizeBytes: number }) => {
    if (!isMockAuth()) {
      try {
        const res = await fetch(`/api/v1/media/access?assetId=${resource.id}&download=1`, { credentials: "same-origin" });
        const json = (await res.json()) as { ok: boolean; data?: { url: string }; error?: { message: string } };
        if (!json.ok || !json.data?.url) {
          toast.push({
            variant: "error",
            title: "Download not available",
            description: json.error?.message ?? "You don't have access to this file.",
          });
          return;
        }
        const anchor = document.createElement("a");
        anchor.href = json.data.url;
        anchor.download = resource.fileName;
        anchor.rel = "noopener";
        anchor.click();
        toast.push({ variant: "success", title: "Download started" });
        return;
      } catch {
        toast.push({ variant: "error", title: "Download failed", description: "Could not reach the server." });
        return;
      }
    }
    const blob = new Blob([simulatedDownloadText(resource.fileName)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resource.fileName.replace(/\.[^.]+$/, "") + "-simulated.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.push({
      variant: "info",
      title: "Simulated download",
      description: "A placeholder file was generated in your browser — nothing came from storage.",
    });
  };

  return (
    <ul className="space-y-2">
      {view.lesson.resources.map((resource) => (
        <li
          key={resource.id}
          className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
            <FileText className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{resource.fileName}</p>
            <p className="text-[11px] text-smoke">{formatBytes(resource.sizeBytes)} · simulated file</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => download(resource)}>
            <CloudDownload className="size-4" aria-hidden="true" />
            Download
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Completed/not-completed toggle with clear labels. */
export function CompletionToggle({
  completed,
  saving,
  onChange,
}: {
  completed: boolean;
  saving: boolean;
  onChange: (completed: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!completed)}
      disabled={saving}
      aria-pressed={completed}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50",
        completed ? "bg-lime text-ink shadow-hard-xs" : "bg-white text-ink hover:bg-parchment",
      )}
    >
      {completed ? (
        <>
          <CheckCheck className="size-4" aria-hidden="true" /> Completed — tap to undo
        </>
      ) : (
        <>
          <Check className="size-4" aria-hidden="true" /> Mark lesson complete
        </>
      )}
    </button>
  );
}
