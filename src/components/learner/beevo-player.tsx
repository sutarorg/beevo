"use client";

import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LearnerLessonView } from "@/lib/learner-types";
import { fetchSession } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

/**
 * Beevo's own lesson player.
 *
 * Renders a bare <video> (native controls off) inside Beevo chrome, streams
 * through the enrolment-checked media route, and applies the deterrence the
 * web platform allows:
 *   - no download / picture-in-picture / remote playback / native context menu;
 *   - no shareable object URL (same-origin range requests only, `no-store`);
 *   - a per-learner watermark so a recording is traceable;
 *   - playback pauses when the tab is hidden, and in-page screen capture
 *     requests are refused while a lesson is open.
 *
 * No browser can prevent a camera pointed at the screen; the watermark is the
 * honest backstop for that case.
 */

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function BeevoPlayer({
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
  const playback = view.playback.mode === "direct" ? view.playback : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(playback?.resumeAtSeconds ?? 0);
  const [duration, setDuration] = useState(playback?.durationSeconds ?? 0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [captureWarning, setCaptureWarning] = useState(false);
  const [watermark, setWatermark] = useState("Beevo");
  const resumeApplied = useRef(false);
  const lastSaved = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((session) => {
      if (!cancelled && session.user?.email) {
        setWatermark(session.user.email);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Deterrents that can be applied in-page.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mediaDevices = navigator.mediaDevices as MediaDevices | undefined;
    const original = mediaDevices?.getDisplayMedia?.bind(mediaDevices);
    if (mediaDevices && original) {
      const blocked = async (): Promise<MediaStream> => {
        video.pause();
        setCaptureWarning(true);
        window.setTimeout(() => setCaptureWarning(false), 6000);
        throw new DOMException("Screen capture isn't allowed for this lesson.", "NotAllowedError");
      };
      Object.defineProperty(mediaDevices, "getDisplayMedia", {
        value: blocked,
        configurable: true,
        writable: true,
      });
    }

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
        setPlaying(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["s", "u", "p"].includes(key)) {
        event.preventDefault();
      }
      if (event.key === "PrintScreen") {
        event.preventDefault();
        setCaptureWarning(true);
        window.setTimeout(() => setCaptureWarning(false), 2500);
        void navigator.clipboard?.writeText("").catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKeyDown);
      if (mediaDevices && original) {
        Object.defineProperty(mediaDevices, "getDisplayMedia", {
          value: original,
          configurable: true,
          writable: true,
        });
      }
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Persist progress while playing (every 5s) and on pause/seek.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (videoRef.current) {
        const seconds = Math.floor(videoRef.current.currentTime);
        if (seconds !== lastSaved.current) {
          lastSaved.current = seconds;
          onProgress(seconds);
        }
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [playing, onProgress]);

  useEffect(() => () => {
    const video = videoRef.current;
    if (video && Math.floor(video.currentTime) !== lastSaved.current) {
      onProgress(Math.floor(video.currentTime));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setError("Your browser blocked playback. Press play again."));
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.max(0, Math.min(seconds, duration || video.duration || 0));
    video.currentTime = next;
    setCurrent(next);
    lastSaved.current = Math.floor(next);
    onProgress(lastSaved.current);
  };

  const changeSpeed = (next: (typeof SPEEDS)[number]) => {
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const changeVolume = (next: number) => {
    setVolume(next);
    setMuted(next === 0);
    if (videoRef.current) {
      videoRef.current.volume = next;
      videoRef.current.muted = next === 0;
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const toggleFullscreen = async () => {
    if (!frameRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await frameRef.current.requestFullscreen();
      }
    } catch {
      setError("Your browser blocked fullscreen.");
    }
  };

  if (!playback) return null;

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div>
      <div
        ref={frameRef}
        className="group relative aspect-video overflow-hidden rounded-3xl border-2 border-ink bg-ink shadow-hard-sm select-none"
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <video
          ref={videoRef}
          className="h-full w-full bg-ink"
          src={playback.url}
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate noremoteplayback"
          // @ts-expect-error - non-standard but effective on Chromium
          disablepictureinpicture="true"
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (!video) return;
            if (Number.isFinite(video.duration) && video.duration > 0) setDuration(video.duration);
            if (!resumeApplied.current) {
              resumeApplied.current = true;
              if (playback.resumeAtSeconds > 0) {
                video.currentTime = Math.min(playback.resumeAtSeconds, Math.max(video.duration - 2, 0));
                setCurrent(video.currentTime);
              }
            }
            video.playbackRate = speed;
            video.volume = volume;
            setWaiting(false);
          }}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (!video) return;
            setCurrent(video.currentTime);
            if (video.buffered.length && video.duration > 0) {
              setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            const video = videoRef.current;
            if (video) {
              const seconds = Math.floor(video.currentTime);
              if (seconds !== lastSaved.current) {
                lastSaved.current = seconds;
                onProgress(seconds);
              }
            }
          }}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onEnded={() => {
            setPlaying(false);
            onCompleted(true);
            onEnded();
          }}
          onError={() => setError("The video couldn't be loaded. Reload the page to try again.")}
        />

        {/* Per-learner watermark — traceable if a recording is shared. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ userSelect: "none" }}
        >
          <span className="beevo-watermark beevo-watermark-a">{watermark}</span>
          <span className="beevo-watermark beevo-watermark-b">Beevo · {watermark}</span>
          <span className="beevo-watermark beevo-watermark-c">{watermark}</span>
        </div>

        {/* No top chrome: the only overlay above the video is the orange
            centre play button (plus the watermark and bottom console). */}

        {/* Centre play / pause */}
        {!error ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause lesson" : "Play lesson"}
            className={cn(
              "absolute top-1/2 left-1/2 grid size-18 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-cream bg-accent text-cream transition-transform hover:scale-105 active:scale-95",
              playing && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          >
            {waiting && playing ? (
              <Loader2 className="size-7 animate-spin" aria-hidden="true" />
            ) : playing ? (
              <Pause className="size-7" aria-hidden="true" />
            ) : (
              <Play className="ml-1 size-8" aria-hidden="true" />
            )}
          </button>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <p className="text-sm font-bold text-cream">Playback failed</p>
              <p className="mt-1 text-xs text-cream/70">{error}</p>
            </div>
          </div>
        )}

        {captureWarning ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/95 p-6 text-center">
            <div>
              <p className="text-sm font-bold text-lime">This lesson is protected</p>
              <p className="mt-1 text-xs leading-relaxed text-cream/80">
                Screen recording and downloads aren’t allowed. Your account is watermarked on the
                video.
              </p>
            </div>
          </div>
        ) : null}

        {/* Bottom console */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent px-3 pt-8 pb-3 sm:px-4">
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-cream/25">
              <span className="block h-full bg-cream/40" style={{ width: `${buffered}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={Math.min(current, duration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Seek"
              aria-valuetext={`${formatClock(current)} of ${formatClock(duration)}`}
              className="slider-accent relative w-full cursor-pointer"
              style={{ accentColor: "#d5f34e" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="grid size-9 place-items-center rounded-full border-2 border-cream/50 text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="ml-0.5 size-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => seek(0)}
                aria-label="Restart lesson"
                className="grid size-9 place-items-center rounded-full border-2 border-cream/50 text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
              <span className="font-mono text-[10px] text-cream/90 tabular-nums sm:text-[11px]">
                {formatClock(current)} / {formatClock(duration)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="grid size-9 place-items-center rounded-full border-2 border-cream/50 text-cream transition-colors hover:bg-cream hover:text-ink"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="size-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="size-4" aria-hidden="true" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  aria-label="Volume"
                  className="slider-accent w-16"
                  style={{ accentColor: "#d5f34e" }}
                />
              </div>
              <select
                value={speed}
                onChange={(event) => changeSpeed(Number(event.target.value) as (typeof SPEEDS)[number])}
                aria-label="Playback speed"
                className="rounded-lg border-2 border-cream/50 bg-ink px-1.5 py-1 font-mono text-[10px] font-bold text-cream"
              >
                {SPEEDS.map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label="Fullscreen"
                className="grid size-9 place-items-center rounded-full border-2 border-cream/50 text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                {fullscreen ? (
                  <Minimize className="size-4" aria-hidden="true" />
                ) : (
                  <Maximize className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-smoke italic">{playback.note}</p>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-24 overflow-hidden rounded-full border border-ink bg-parchment">
            <span className="block h-full bg-accent" style={{ width: `${progressPct}%` }} />
          </span>
          <span className="text-[10px] font-bold text-smoke tabular-nums">
            {Math.round(progressPct)}%
          </span>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-smoke/80">
        Streaming is tied to your account and watermarked. Downloads and screen capture are disabled.
      </p>
    </div>
  );
}
