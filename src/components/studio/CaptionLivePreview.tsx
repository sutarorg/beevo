"use client";

import React from "react";
import type {
  AspectRatioOption,
  CaptionAnimOption,
  CaptionBgOption,
  CaptionFontOption,
  CaptionPositionOption,
  CaptionSizeOption,
} from "@/lib/app-types";

interface CaptionLivePreviewProps {
  aspectRatio: AspectRatioOption;
  enabled: boolean;
  position: CaptionPositionOption;
  size: CaptionSizeOption;
  font: CaptionFontOption;
  wordHighlighting: boolean;
  background: CaptionBgOption;
  animation: CaptionAnimOption;
  sampleWords: string[];
}

export function CaptionLivePreview({
  aspectRatio,
  enabled,
  position,
  size,
  font,
  wordHighlighting,
  background,
  animation,
  sampleWords,
}: CaptionLivePreviewProps) {
  const frameAspectClass =
    aspectRatio === "16:9"
      ? "aspect-video max-w-[460px]"
      : aspectRatio === "9:16"
        ? "aspect-[9/16] max-w-[210px]"
        : "aspect-square max-w-[290px]";

  const positionClass =
    position === "top"
      ? "items-start pt-5"
      : position === "middle"
        ? "items-center"
        : "items-end pb-5";

  const sizeClass =
    size === "small"
      ? "text-[12.5px] leading-snug"
      : size === "large"
        ? "text-[18px] sm:text-[20px] leading-tight"
        : "text-[15px] sm:text-[16px] leading-snug";

  const fontClass =
    font === "sora"
      ? "font-display font-extrabold tracking-[-0.02em]"
      : font === "serif"
        ? "font-serif font-bold tracking-normal"
        : "font-sans font-extrabold tracking-[-0.01em]";

  const bgClass =
    background === "none"
      ? "bg-transparent px-1 py-0.5 [text-shadow:0_2px_8px_rgba(0,0,0,0.92)]"
      : background === "bar"
        ? "w-full bg-[#11100E]/82 px-3 py-2 text-center"
        : "rounded-[12px] bg-[#11100E]/82 px-3.5 py-2 shadow-lg";

  const animClass =
    animation === "pop"
      ? "transition-transform duration-200 scale-[1.02]"
      : animation === "fade"
        ? "transition-opacity duration-200"
        : "";

  const words = sampleWords.length > 0 ? sampleWords : ["Caption", "style", "preview", "frame"];
  const highlightIndex = Math.min(1, words.length - 1);

  return (
    <div className="rounded-[18px] border border-beevo-border bg-beevo-cream/45 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-beevo-honey-text">
          Live Caption Preview
        </span>
        <span className="rounded-full border border-beevo-border bg-white px-2.5 py-0.5 text-[11px] font-bold text-beevo-muted">
          {aspectRatio} &middot; {enabled ? `${position} · ${size}` : "Off"}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className={`relative flex w-full justify-center overflow-hidden rounded-[16px] border border-[#34302A] bg-gradient-to-br from-[#23201C] via-[#1B1916] to-[#2C2720] px-3 ${frameAspectClass} ${positionClass}`}
          aria-label="Live caption style preview frame"
        >
          {/* Subtle safe-area frame guides */}
          <div
            className="pointer-events-none absolute inset-3 rounded-[10px] border border-dashed border-white/10"
            aria-hidden="true"
          />

          {/* Top subtle badge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/35"
          >
            Viewport {aspectRatio}
          </span>

          {enabled ? (
            <div className={`relative z-10 max-w-full text-center ${bgClass} ${animClass}`}>
              <p className={`text-[#FFFDF7] ${sizeClass} ${fontClass}`}>
                {words.map((word, idx) => {
                  const isActive = wordHighlighting && idx === highlightIndex;
                  return (
                    <span
                      key={`${word}-${idx}`}
                      className={
                        isActive
                          ? "mx-[2px] inline-block rounded-[6px] bg-[#FFC928] px-1.5 py-0.5 text-[#1B1916]"
                          : "mx-[2px] inline-block"
                      }
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            </div>
          ) : (
            <div className="relative z-10 self-center rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-white/65">
              Captions disabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
