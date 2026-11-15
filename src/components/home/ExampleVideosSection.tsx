"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Film, Play, Sparkles, X } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EXAMPLE_DEMOS, type ExampleVideoDemo } from "@/lib/beevo-data";

interface ExampleVideosSectionProps {
  externalSelectedDemoId?: string | null;
  onClearExternalDemo?: () => void;
}

export function ExampleVideosSection({
  externalSelectedDemoId,
  onClearExternalDemo,
}: ExampleVideosSectionProps) {
  const [activeDemo, setActiveDemo] = useState<ExampleVideoDemo | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Allow hero "Watch Demo" button to open the showcase modal directly
  useEffect(() => {
    if (externalSelectedDemoId) {
      const found =
        EXAMPLE_DEMOS.find((d) => d.id === externalSelectedDemoId) ?? EXAMPLE_DEMOS[0];
      setActiveDemo(found);
    }
  }, [externalSelectedDemoId]);

  useEffect(() => {
    const handleOpenDemo = () => {
      setActiveDemo(EXAMPLE_DEMOS[0]);
    };
    window.addEventListener("beevo:open-demo", handleOpenDemo);
    return () => window.removeEventListener("beevo:open-demo", handleOpenDemo);
  }, []);

  const closeModal = () => {
    setActiveDemo(null);
    onClearExternalDemo?.();
  };

  useEffect(() => {
    if (!activeDemo) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDemo]);

  const scrollMobileRail = (dir: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section id="examples" aria-labelledby="examples-heading" className="bg-beevo-canvas py-14 md:py-[66px]">
      <div className="beevo-container">
        {/* Reference-matched Header Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Made with Beevo</Eyebrow>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                id="examples-heading"
                className="font-display text-[clamp(1.75rem,2.7vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                Example videos
              </h2>
              <span className="text-[12.5px] font-semibold text-beevo-muted">
                Illustrative Beevo demos
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {/* Mobile Carousel Controls */}
            <div className="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => scrollMobileRail(-1)}
                aria-label="Previous example video"
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollMobileRail(1)}
                aria-label="Next example video"
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Link
              href="/how-it-works#storyboard-demos"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-bold text-beevo-ink transition-colors hover:text-beevo-honey-text"
            >
              View all examples
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 4 Equal 16:9 Thumbnails — Horizontal Scroll-Snap on Mobile, 2x2 Tablet, 4-Up Desktop */}
        <div
          ref={railRef}
          className="beevo-scroll-rail -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        >
          {EXAMPLE_DEMOS.map((demo) => (
            <article
              key={demo.id}
              className="group w-[82vw] max-w-[310px] shrink-0 snap-start sm:w-auto sm:max-w-none"
            >
              <button
                type="button"
                onClick={() => setActiveDemo(demo)}
                aria-label={`Preview illustrative demo: ${demo.title} (${demo.duration})`}
                className="block w-full text-left focus-visible:rounded-[16px]"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-[14px] border border-beevo-ink/10 bg-beevo-cream shadow-beevo-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-beevo">
                  <Image
                    src={demo.image}
                    alt={demo.imageAlt}
                    fill
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 280px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {/* Centered HTML Play Control (never baked into image) */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-black/5 transition-colors group-hover:bg-black/15"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 bg-black/55 text-white shadow-md backdrop-blur-[2px] transition-transform duration-200 group-hover:scale-105 group-hover:bg-black/70">
                      <Play className="ml-0.5 h-4 w-4 fill-white" />
                    </span>
                  </span>
                </div>

                {/* Title left + Duration right */}
                <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
                  <h3 className="font-display text-[13.5px] font-bold leading-snug text-beevo-ink transition-colors group-hover:text-beevo-honey-text">
                    {demo.title}
                  </h3>
                  <span className="shrink-0 text-[12px] font-semibold tabular-nums text-beevo-muted">
                    {demo.duration}
                  </span>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Interactive Illustrative Storyboard Demo Modal */}
      {activeDemo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-beevo-border bg-[#FFFEFB] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Eyebrow>Illustrative Beevo Demo</Eyebrow>
                  <span className="inline-flex items-center gap-1 rounded-full bg-beevo-cream px-2.5 py-1 text-[11.5px] font-bold text-beevo-body">
                    <Clock className="h-3 w-3 text-beevo-honey-text" aria-hidden="true" />
                    {activeDemo.duration} &middot; {activeDemo.style} &middot; {activeDemo.aspectRatio}
                  </span>
                </div>
                <h3
                  id="demo-modal-title"
                  className="mt-2.5 font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink"
                >
                  {activeDemo.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close demo preview"
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink hover:bg-beevo-cream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-[16px] border border-beevo-border">
              <Image
                src={activeDemo.image}
                alt={activeDemo.imageAlt}
                fill
                sizes="(max-width: 768px) 92vw, 620px"
                className="object-cover"
              />
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-beevo-body">{activeDemo.summary}</p>

            {/* Prompt Sample */}
            <div className="mt-4 rounded-[14px] border border-beevo-border-warm bg-beevo-cream/65 p-4">
              <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-beevo-honey-text">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Example Prompt Input
              </p>
              <p className="mt-1.5 text-[13.5px] font-semibold leading-relaxed text-beevo-ink">
                &ldquo;{activeDemo.promptSample}&rdquo;
              </p>
            </div>

            {/* Dynamic Timeline Scene Breakdown */}
            <div className="mt-5">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-beevo-muted">
                <Film className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                Narration-Synced Storyboard Breakdown
              </p>
              <ol className="mt-3 space-y-2.5">
                {activeDemo.sceneBeats.map((beat, index) => (
                  <li
                    key={beat.timestamp}
                    className="rounded-[13px] border border-beevo-border bg-white p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12px] font-extrabold text-beevo-honey-text">
                        Scene {index + 1} &middot; {beat.timestamp}
                      </span>
                      <span className="rounded-md bg-beevo-cream px-2 py-0.5 text-[11px] font-semibold text-beevo-muted">
                        {beat.motion}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-beevo-body">
                      &ldquo;{beat.narration}&rdquo;
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-beevo-border pt-4 sm:flex-row">
              <p className="text-[12px] text-beevo-muted">
                Brand-created illustrative storyboard demo &mdash; not a customer testimonial.
              </p>
              <Link
                href="/get-started"
                onClick={closeModal}
                className="beevo-btn-primary min-h-[44px] w-full px-5 text-[13.5px] sm:w-auto"
              >
                Create Your Story
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
