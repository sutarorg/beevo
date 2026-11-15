"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight, Download, Pencil, Play, Sparkles } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface HeroSectionProps {
  onWatchDemo?: () => void;
}

const SIGNPOST_ITEMS = [
  {
    label: "Describe it",
    icon: Pencil,
    desktopPos: "left-[72.4%] top-[51.2%] w-[24.2%] h-[9.4%]",
    mobilePos: "left-[53.2%] top-[32.0%] w-[37.4%] h-[10.4%]",
  },
  {
    label: "Generate it",
    icon: Sparkles,
    desktopPos: "left-[72.0%] top-[61.0%] w-[24.2%] h-[9.4%]",
    mobilePos: "left-[53.2%] top-[44.4%] w-[37.4%] h-[10.4%]",
  },
  {
    label: "Download it",
    icon: Download,
    desktopPos: "left-[71.7%] top-[70.9%] w-[24.2%] h-[9.4%]",
    mobilePos: "left-[53.2%] top-[56.8%] w-[37.4%] h-[10.4%]",
  },
];

export function HeroSection({ onWatchDemo }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-x-clip bg-beevo-canvas pb-9 pt-5 md:pb-12 md:pt-2 lg:pb-14"
    >
      {/* Desktop & Wide Tablet Split Hero */}
      <div className="beevo-container relative">
        <div className="relative flex flex-col md:min-h-[430px] md:flex-row md:items-center lg:min-h-[470px] xl:min-h-[505px]">
          {/* Left Content Column (~44-46% on desktop) */}
          <div className="relative z-20 w-full pt-2 md:w-[50%] md:py-9 lg:w-[46%] lg:py-11">
            <Eyebrow showSparkle>AI Cartoon Video Generator</Eyebrow>

            <h1
              id="hero-heading"
              className="mt-4 font-display text-[clamp(2.1rem,4.05vw,3.45rem)] font-extrabold leading-[1.09] tracking-[-0.04em] text-beevo-ink"
            >
              <span className="block">Turn your ideas</span>
              <span className="block text-beevo-honey-display">into cartoon videos</span>
              <span className="block">in minutes.</span>
            </h1>

            <p className="mt-4 max-w-[405px] text-[15px] font-medium leading-[1.62] text-beevo-body md:text-[15.5px]">
              Just describe your idea or paste your script. Beevo creates a complete illustrated
              cartoon video with a story, original scenes, natural voiceover and music. No animation
              skills required.
            </p>

            {/* Dual Pill CTAs */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/get-started"
                className="beevo-btn-primary min-h-[46px] whitespace-nowrap px-6 text-[14px] sm:w-auto"
              >
                Create Your First Video
                <ChevronRight className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (onWatchDemo) {
                    onWatchDemo();
                  } else {
                    window.dispatchEvent(new CustomEvent("beevo:open-demo"));
                  }
                }}
                className="beevo-btn-secondary min-h-[46px] whitespace-nowrap px-5 text-[14px] sm:w-auto"
              >
                Watch Demo
                <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
              </button>
            </div>

            {/* Factual Reassurance Row */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-semibold text-beevo-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink"
                  aria-hidden="true"
                >
                  <Check className="h-2.5 w-2.5 stroke-[3.2]" />
                </span>
                No animation skills required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink"
                  aria-hidden="true"
                >
                  <Check className="h-2.5 w-2.5 stroke-[3.2]" />
                </span>
                One-time credit purchases
              </span>
            </div>
          </div>

          {/* Right Desktop / Tablet Artwork Column (exact natural aspect ratio so HTML signpost overlays stay locked to the planks) */}
          <div className="relative z-10 hidden md:block md:w-[60%] md:-ml-[10%] md:self-end lg:w-[65%] lg:-ml-[11%]">
            <div className="relative aspect-[1312/816] w-full overflow-hidden rounded-b-[16px]">
              <Image
                src="/images/beevo/hero-beevo-desktop.webp"
                alt="Friendly 3D Beevo bumblebee mascot wearing round glasses standing in a sunlit meadow beside a three-plank wooden signpost"
                fill
                priority
                sizes="(max-width: 1024px) 62vw, 760px"
                className="object-contain object-right-bottom select-none"
              />

              {/* Seamless left & top edge ivory dissolve into page canvas */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[26%] bg-gradient-to-r from-[#FFFEFB] via-[#FFFEFB]/80 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-[#FFFEFB] to-transparent"
              />
              {/* Gentle bottom ivory transition behind overlapping benefit strip */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[9%] bg-gradient-to-t from-[#FFFEFB]/75 via-[#FFFEFB]/15 to-transparent"
              />

              {/* Real Semantic HTML Wooden Signpost Labels (zero rasterized text!) */}
              <ol
                aria-label="Three-step video creation summary"
                className="pointer-events-none absolute inset-0"
              >
                {SIGNPOST_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className={`absolute flex rotate-[2.7deg] items-center justify-center gap-1.5 px-1.5 text-[#FFFDF7] ${item.desktopPos}`}
                    >
                      <Icon
                        className="h-[clamp(11px,1.15vw,15px)] w-[clamp(11px,1.15vw,15px)] shrink-0 text-[#FFD859] drop-shadow-[0_1.5px_2px_rgba(32,16,3,0.9)]"
                        aria-hidden="true"
                      />
                      <span className="font-display text-[clamp(10.5px,1.18vw,15.5px)] font-bold tracking-[-0.015em] text-[#FFFDF7] drop-shadow-[0_1.5px_2.5px_rgba(32,16,3,0.92)] whitespace-nowrap">
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Dedicated Portrait Mobile Hero Composition (< 768px) */}
          <div className="relative mt-7 md:hidden">
            <div className="relative mx-auto aspect-[928/1152] w-full max-w-[410px] overflow-hidden rounded-[22px] border border-beevo-border/70 shadow-beevo">
              <Image
                src="/images/beevo/hero-beevo-mobile.webp"
                alt="Friendly 3D Beevo bumblebee mascot in a sunny meadow next to a rustic wooden signpost"
                fill
                priority
                sizes="(max-width: 768px) 92vw, 410px"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FFFEFB]/80 to-transparent"
              />

              {/* Real Semantic HTML Signpost Labels mapped to portrait mobile artwork */}
              <ol
                aria-label="Three-step video creation summary"
                className="pointer-events-none absolute inset-0"
              >
                {SIGNPOST_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={`m-${item.label}`}
                      className={`absolute flex items-center justify-center gap-1.5 px-1 text-white ${item.mobilePos}`}
                    >
                      <Icon
                        className="h-3.5 w-3.5 shrink-0 text-[#FFD859] drop-shadow-[0_1px_2px_rgba(32,16,3,0.85)]"
                        aria-hidden="true"
                      />
                      <span className="font-display text-[clamp(11px,3.2vw,14px)] font-bold tracking-[-0.015em] text-[#FFFDF7] drop-shadow-[0_1px_2px_rgba(32,16,3,0.9)] whitespace-nowrap">
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
