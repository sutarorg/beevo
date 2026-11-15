"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { VISUAL_STYLES } from "@/lib/beevo-data";

export function VisualStyleShowcase() {
  const [selectedId, setSelectedId] = useState<string>(VISUAL_STYLES[0].id);
  const selected = VISUAL_STYLES.find((s) => s.id === selectedId) ?? VISUAL_STYLES[0];

  return (
    <section
      id="visual-styles"
      aria-labelledby="styles-heading"
      className="bg-beevo-cream/70 py-14 md:py-[72px]"
    >
      <div className="beevo-container">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>8 Supported Visual Styles</Eyebrow>
            <h2
              id="styles-heading"
              className="mt-3.5 font-display text-[clamp(1.75rem,2.8vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
            >
              Same story moment.{" "}
              <span className="text-beevo-honey-display">Eight distinct looks.</span>
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-beevo-body">
              Compare how Beevo renders the same sunny meadow scene across all eight visual style
              families. Pick the artistic direction that fits your audience—from playful 3D film
              renders to calm flat vector explainers.
            </p>
          </div>
          <p className="text-[12.5px] font-semibold text-beevo-muted">
            Visual-style examples &middot; All 8 included in every credit pack
          </p>
        </div>

        {/* Active Spotlight Preview Strip */}
        <div className="mt-7 overflow-hidden rounded-[20px] border border-beevo-border bg-white shadow-beevo-card">
          <div className="grid grid-cols-1 items-center lg:grid-cols-12">
            <div className="relative aspect-video w-full overflow-hidden bg-beevo-cream lg:col-span-7">
              <Image
                src={selected.image}
                alt={`${selected.name} visual style example showing Beevo in a sunny meadow`}
                fill
                sizes="(max-width: 1024px) 100vw, 660px"
                className="object-cover"
              />
            </div>
            <div className="p-6 lg:col-span-5 lg:p-8">
              <span className="inline-flex rounded-full bg-beevo-cream px-3 py-1 text-[11.5px] font-extrabold text-beevo-honey-text">
                Selected Style Example
              </span>
              <h3 className="mt-3 font-display text-[24px] font-extrabold tracking-[-0.025em] text-beevo-ink">
                {selected.name}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.65] text-beevo-body">
                {selected.mood}
              </p>
              <div className="mt-4 rounded-[12px] border border-beevo-border bg-beevo-canvas px-4 py-3">
                <p className="text-[11.5px] font-bold uppercase tracking-wider text-beevo-muted">
                  Well suited for
                </p>
                <p className="mt-1 text-[13.5px] font-bold text-beevo-ink">{selected.bestFor}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 8-Style Aligned Comparison Grid (2-col mobile, 4-col desktop) */}
        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
          {VISUAL_STYLES.map((style) => {
            const isSelected = style.id === selected.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedId(style.id)}
                aria-pressed={isSelected}
                className={`group overflow-hidden rounded-[15px] border bg-white p-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-beevo-yellow shadow-beevo-popular"
                    : "border-beevo-border shadow-beevo-card hover:-translate-y-0.5 hover:border-beevo-border-warm"
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-beevo-cream">
                  <Image
                    src={style.image}
                    alt={`${style.name} style example of Beevo in a meadow`}
                    fill
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 23vw, 270px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2.5">
                  <span className="font-display text-[13px] font-bold text-beevo-ink sm:text-[13.5px]">
                    {style.name}
                  </span>
                  {isSelected && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-beevo-yellow" aria-hidden="true" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
