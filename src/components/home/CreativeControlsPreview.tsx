"use client";

import React, { useState } from "react";
import {
  Captions,
  Clock,
  Globe,
  Layers,
  Monitor,
  Music2,
  Palette,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Volume2,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";

const ASPECT_OPTIONS = [
  { id: "16:9", label: "16:9 Landscape", note: "YouTube & presentations" },
  { id: "9:16", label: "9:16 Vertical", note: "Shorts & Reels" },
  { id: "1:1", label: "1:1 Square", note: "Social feeds" },
] as const;

const VOICE_OPTIONS = [
  "English (Warm Storyteller)",
  "Hindi (Natural Narrator)",
  "English (Bright Educator)",
  "Multilingual Catalog Voices",
] as const;

const PACING_OPTIONS = ["Calm Storybook", "Balanced Explainer", "Energetic"] as const;

export function CreativeControlsPreview() {
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_OPTIONS)[number]["id"]>("16:9");
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0]);
  const [pacing, setPacing] = useState<string>(PACING_OPTIONS[1]);
  const [speechSpeed, setSpeechSpeed] = useState<string>("1.0x");
  const [captionsOn, setCaptionsOn] = useState<boolean>(true);
  const [musicOn, setMusicOn] = useState<boolean>(true);

  // Confirmed Beevo billing rule: 25 credits per 15 seconds (100 credits = 1 minute)
  const requiredCredits = Math.round((durationSeconds / 15) * 25);
  const formattedDuration =
    durationSeconds < 60
      ? `${durationSeconds} sec`
      : durationSeconds % 60 === 0
      ? `${durationSeconds / 60} min`
      : `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;

  return (
    <section
      id="creative-controls"
      aria-labelledby="controls-heading"
      className="bg-beevo-canvas py-14 md:py-[72px]"
    >
      <div className="beevo-container">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Editorial Description */}
          <div className="lg:col-span-5">
            <Eyebrow>Creative Controls</Eyebrow>
            <h2
              id="controls-heading"
              className="mt-3.5 font-display text-[clamp(1.75rem,2.7vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
            >
              Direct every detail,{" "}
              <span className="text-beevo-honey-display">without timeline clutter.</span>
            </h2>
            <p className="mt-3.5 text-[15px] leading-[1.68] text-beevo-body">
              Configure your duration, aspect ratio, cartoon style, character preferences, voice
              language, speech speed, visual pacing, transitions, captions, and licensed background
              audio before rendering—then let Beevo assemble the synchronized MP4.
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  icon: Clock,
                  title: "Flexible duration up to 10 minutes",
                  text: "Billed cleanly at 25 credits per 15 seconds (100 credits per minute).",
                },
                {
                  icon: UserCheck,
                  title: "Character continuity preferences",
                  text: "Define recurring character traits carried across storyboard illustrations.",
                },
                {
                  icon: Globe,
                  title: "English, Hindi & supported catalog voices",
                  text: "Natural ElevenLabs narration with adjustable speed and real timestamps.",
                },
                {
                  icon: Music2,
                  title: "Approved licensed music & SFX",
                  text: "Optional background score and subtle sound cues mixed automatically.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 rounded-[14px] border border-beevo-border bg-white p-3.5 shadow-beevo-card"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink"
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-[13.5px] font-bold text-beevo-ink">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-beevo-muted">
                        {item.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Interactive Controls Schematic (honestly labeled as a controls schematic, NOT a fake screenshot) */}
          <div className="lg:col-span-7">
            <div className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                  <span className="font-display text-[14px] font-bold text-beevo-ink">
                    Project Controls Overview
                  </span>
                </div>
                <span className="rounded-full bg-beevo-cream px-2.5 py-1 text-[11px] font-bold text-beevo-muted">
                  Interactive Controls Schematic
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {/* Duration & Exact Credit Meter */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="schematic-duration"
                      className="flex items-center gap-1.5 text-[13px] font-bold text-beevo-ink"
                    >
                      <Clock className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Target Video Duration
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-beevo-canvas px-2.5 py-1 text-[12.5px] font-extrabold tabular-nums text-beevo-ink border border-beevo-border">
                        {formattedDuration}
                      </span>
                      <span className="rounded-md bg-beevo-yellow/40 px-2.5 py-1 text-[12.5px] font-extrabold tabular-nums text-beevo-ink">
                        {requiredCredits} credits
                      </span>
                    </div>
                  </div>
                  <input
                    id="schematic-duration"
                    type="range"
                    min={15}
                    max={600}
                    step={15}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    className="beevo-range mt-1"
                  />
                  <div className="mt-1.5 flex justify-between text-[11.5px] font-semibold text-beevo-muted">
                    <span>15 sec (25 cr)</span>
                    <span>3 min (300 cr)</span>
                    <span>10 min max (1,000 cr)</span>
                  </div>
                </div>

                {/* Aspect Ratio & Quality */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-beevo-ink">
                      <Monitor className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Aspect Ratio
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {ASPECT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAspectRatio(opt.id)}
                          aria-pressed={aspectRatio === opt.id}
                          className={`min-h-[44px] rounded-[11px] border px-2 py-2 text-center text-[12px] font-bold transition-colors ${
                            aspectRatio === opt.id
                              ? "border-beevo-yellow bg-beevo-cream text-beevo-ink"
                              : "border-beevo-border bg-beevo-canvas text-beevo-muted hover:border-beevo-border-warm"
                          }`}
                        >
                          {opt.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-beevo-ink">
                      <Layers className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Visual Pacing
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {PACING_OPTIONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPacing(p)}
                          aria-pressed={pacing === p}
                          className={`min-h-[44px] rounded-[11px] border px-2 py-1.5 text-center text-[11.5px] font-bold leading-tight transition-colors ${
                            pacing === p
                              ? "border-beevo-yellow bg-beevo-cream text-beevo-ink"
                              : "border-beevo-border bg-beevo-canvas text-beevo-muted hover:border-beevo-border-warm"
                          }`}
                        >
                          {p.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Voice Catalog & Speech Speed */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-7">
                    <label
                      htmlFor="schematic-voice"
                      className="flex items-center gap-1.5 text-[13px] font-bold text-beevo-ink"
                    >
                      <Volume2 className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Voice &amp; Language Catalog
                    </label>
                    <select
                      id="schematic-voice"
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="mt-2 min-h-[44px] w-full rounded-[11px] border border-beevo-border bg-beevo-canvas px-3 text-[13px] font-semibold text-beevo-ink"
                    >
                      {VOICE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <p className="flex items-center gap-1.5 text-[13px] font-bold text-beevo-ink">
                      <Sparkles className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Speech Speed
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {["0.9x", "1.0x", "1.1x"].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setSpeechSpeed(spd)}
                          aria-pressed={speechSpeed === spd}
                          className={`min-h-[44px] rounded-[11px] border text-[12px] font-bold transition-colors ${
                            speechSpeed === spd
                              ? "border-beevo-yellow bg-beevo-cream text-beevo-ink"
                              : "border-beevo-border bg-beevo-canvas text-beevo-muted"
                          }`}
                        >
                          {spd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Captions, Transitions & Licensed Audio Toggles */}
                <div className="grid grid-cols-1 gap-3 border-t border-beevo-border pt-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCaptionsOn((v) => !v)}
                    aria-pressed={captionsOn}
                    className={`flex min-h-[48px] items-center justify-between rounded-[12px] border px-3.5 py-2.5 text-left transition-colors ${
                      captionsOn
                        ? "border-beevo-yellow bg-beevo-cream/65"
                        : "border-beevo-border bg-beevo-canvas"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-bold text-beevo-ink">
                      <Captions className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Synced Captions
                    </span>
                    <span className="text-[12px] font-extrabold text-beevo-honey-text">
                      {captionsOn ? "Enabled" : "Off"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMusicOn((v) => !v)}
                    aria-pressed={musicOn}
                    className={`flex min-h-[48px] items-center justify-between rounded-[12px] border px-3.5 py-2.5 text-left transition-colors ${
                      musicOn
                        ? "border-beevo-yellow bg-beevo-cream/65"
                        : "border-beevo-border bg-beevo-canvas"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-bold text-beevo-ink">
                      <Music2 className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                      Licensed Music &amp; SFX
                    </span>
                    <span className="text-[12px] font-extrabold text-beevo-honey-text">
                      {musicOn ? "Included" : "Off"}
                    </span>
                  </button>
                </div>

                {/* Summary Output Preview Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-beevo-cream px-4 py-3 text-[12.5px] font-semibold text-beevo-body">
                  <span className="inline-flex items-center gap-1.5">
                    <Palette className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                    Output: <strong>MP4 ({aspectRatio})</strong> &middot; {pacing} &middot;{" "}
                    {speechSpeed}
                  </span>
                  <span className="font-bold text-beevo-ink">
                    {requiredCredits} credits ({formattedDuration})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
