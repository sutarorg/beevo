"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { PRICING_PACKS } from "@/lib/beevo-data";

export function CreditCalculator() {
  const [videoCount, setVideoCount] = useState<number>(4);
  const [secondsPerVideo, setSecondsPerVideo] = useState<number>(90);

  const totalSeconds = videoCount * secondsPerVideo;
  const totalCredits = Math.round((totalSeconds / 15) * 25);
  const totalMinutes = (totalSeconds / 60).toFixed(totalSeconds % 60 === 0 ? 0 : 2);

  const recommendedPack =
    PRICING_PACKS.find((p) => p.credits >= totalCredits) ?? PRICING_PACKS[PRICING_PACKS.length - 1];

  const formatSingleDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    if (mins === 0) return `${rem}s`;
    if (rem === 0) return `${mins} min`;
    return `${mins}m ${rem}s`;
  };

  return (
    <div className="rounded-[22px] border border-beevo-border bg-white p-6 shadow-beevo-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-beevo-yellow text-beevo-ink">
            <Calculator className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[18px] font-extrabold text-beevo-ink">
              Credit &amp; Duration Calculator
            </h2>
            <p className="text-[12.5px] font-medium text-beevo-muted">
              100 credits = 1 minute &middot; 25 credits = 15 seconds &middot; Up to 10 min per
              project
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="calc-videos" className="text-[13.5px] font-bold text-beevo-ink">
                Number of video projects
              </label>
              <span className="rounded-md bg-beevo-cream px-2.5 py-1 text-[13px] font-extrabold tabular-nums text-beevo-ink">
                {videoCount} {videoCount === 1 ? "project" : "projects"}
              </span>
            </div>
            <input
              id="calc-videos"
              type="range"
              min={1}
              max={15}
              step={1}
              value={videoCount}
              onChange={(e) => setVideoCount(Number(e.target.value))}
              className="beevo-range mt-1"
            />
            <div className="mt-0.5 flex justify-between text-[11.5px] font-semibold text-beevo-muted">
              <span>1 project</span>
              <span>8 projects</span>
              <span>15 projects</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="calc-duration" className="text-[13.5px] font-bold text-beevo-ink">
                Average length per project (max 10 min)
              </label>
              <span className="rounded-md bg-beevo-cream px-2.5 py-1 text-[13px] font-extrabold tabular-nums text-beevo-ink">
                {formatSingleDuration(secondsPerVideo)}
              </span>
            </div>
            <input
              id="calc-duration"
              type="range"
              min={15}
              max={600}
              step={15}
              value={secondsPerVideo}
              onChange={(e) => setSecondsPerVideo(Number(e.target.value))}
              className="beevo-range mt-1"
            />
            <div className="mt-1 flex justify-between text-[11.5px] font-semibold text-beevo-muted">
              <span>15 sec</span>
              <span>3 min</span>
              <span>10 min max</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[18px] border border-beevo-border-warm bg-beevo-cream/65 p-5 lg:col-span-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-beevo-honey-text">
              Estimated Credit Requirement
            </p>
            <p className="mt-2 font-display text-[32px] font-extrabold leading-none tabular-nums text-beevo-ink">
              {totalCredits.toLocaleString("en-IN")} credits
            </p>
            <p className="mt-1.5 text-[13px] font-semibold text-beevo-body">
              {totalMinutes} total minutes across {videoCount}{" "}
              {videoCount === 1 ? "project" : "projects"}
            </p>

            <div className="mt-4 rounded-[12px] border border-beevo-border bg-white px-4 py-3 text-[13px]">
              {totalCredits <= 1500 ? (
                <p className="text-beevo-body">
                  Best single pack match:{" "}
                  <strong className="text-beevo-ink">
                    {recommendedPack.name} ({recommendedPack.priceDisplay} &middot;{" "}
                    {recommendedPack.creditsLabel})
                  </strong>
                </p>
              ) : (
                <p className="text-beevo-body">
                  Combine multiple <strong className="text-beevo-ink">Studio (₹899)</strong> packs
                  as needed—credits stack cleanly and never expire under our published policy.
                </p>
              )}
            </div>
          </div>

          <Link
            href={`/get-started?pack=${recommendedPack.id}`}
            className="beevo-btn-primary mt-5 min-h-[44px] w-full text-[13.5px]"
          >
            Select {recommendedPack.name} Pack
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
