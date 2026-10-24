"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Loader2, Play, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PublicLessonMeta, PublicPreviewPlayback } from "@/lib/learner-types";
import { getStorefrontService } from "@/lib/services/storefront";
import { Button } from "@/components/ui/button";

/**
 * Free preview player.
 *
 * Opened by the Play icon on a lesson the creator marked as a free preview in
 * the public curriculum. Playback metadata comes from the server (which
 * re-checks that the lesson is a preview on a published course); nothing about
 * the rest of the course is exposed here. Rendered in a portal so the card is
 * never clipped by a scrolling curriculum list.
 */
export function PreviewPlayerModal({
  open,
  lesson,
  handle,
  slug,
  courseTitle,
  posterUrl,
  onClose,
}: {
  open: boolean;
  lesson: PublicLessonMeta | null;
  handle: string;
  slug: string;
  courseTitle: string;
  posterUrl: string | null;
  onClose: () => void;
}) {
  const [playback, setPlayback] = useState<PublicPreviewPlayback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lesson) return;
    let cancelled = false;
    setPlayback(null);
    setError(null);
    setLoading(true);
    const service = getStorefrontService();
    if (!service) {
      setLoading(false);
      setError("The preview player isn't available right now. Try again in a moment.");
      return;
    }
    service
      .getPreviewPlayback(handle, slug, lesson.id)
      .then((result) => {
        if (cancelled) return;
        setLoading(false);
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        if (!result.data.url) {
          setError("This preview video isn't ready yet. Check back shortly.");
          return;
        }
        setPlayback(result.data);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError("We couldn't load the preview. Check your connection and retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, lesson, handle, slug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const card = (
    <AnimatePresence>
      {open && lesson ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-ink/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[86] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={`Free preview: ${lesson.title}`}
              className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-hard sm:max-w-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-white px-5 py-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
                    <Play className="size-3 fill-current" aria-hidden="true" />
                    Free preview
                  </p>
                  <h2 className="mt-0.5 truncate text-sm font-bold text-ink sm:text-base">
                    {lesson.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close preview"
                  className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream transition-colors hover:bg-lime"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="overflow-y-auto">
                <div className="relative aspect-video w-full border-b-2 border-ink bg-ink">
                  {playback?.url ? (
                    <video
                      key={playback.lessonId}
                      src={playback.url}
                      poster={posterUrl ?? undefined}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={(event) => event.preventDefault()}
                      className="size-full bg-ink object-contain"
                    >
                      Your browser can&apos;t play this video.
                    </video>
                  ) : (
                    <div className="grid h-full place-items-center px-6 text-center">
                      {loading ? (
                        <span className="flex flex-col items-center gap-2 text-cream/80">
                          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                          <span className="text-xs font-semibold">Loading the preview…</span>
                        </span>
                      ) : (
                        <span className="flex flex-col items-center gap-2 text-cream/80">
                          <TriangleAlert className="size-6 text-lime" aria-hidden="true" />
                          <span className="max-w-sm text-xs leading-relaxed">
                            {error ?? "This preview is unavailable right now."}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-5">
                  {lesson.description ? (
                    <p className="text-sm leading-relaxed text-smoke">{lesson.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-[11px] font-bold text-ink">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {playback?.durationLabel ?? lesson.durationLabel ?? "Duration unavailable"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lime px-3 py-1 text-[11px] font-bold text-ink">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Preview lesson · no payment needed
                    </span>
                  </div>
                  <p className="rounded-xl bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
                    You&apos;re watching one lesson from{" "}
                    <span className="font-semibold text-ink">{courseTitle}</span>. The rest of the
                    curriculum unlocks after purchase.
                  </p>
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                      Back to curriculum
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        onClose();
                        // Bring the buyer straight to the purchase card.
                        window.requestAnimationFrame(() => {
                          document
                            .getElementById("course-enrol-card")
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                        });
                      }}
                    >
                      Enrol to watch everything
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );

  // Server render has no portal target; the dialog is closed then anyway.
  if (typeof document === "undefined") return null;
  return createPortal(card, document.body);
}
