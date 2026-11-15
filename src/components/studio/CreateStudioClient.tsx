"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ClipboardPaste,
  Clock,
  Coins,
  Film,
  ImagePlus,
  Info,
  Mic,
  Minus,
  Music,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Subtitles,
  Trash2,
  UserRound,
  Video,
  Volume2,
  Wand2,
  X,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CaptionLivePreview } from "@/components/studio/CaptionLivePreview";
import { VISUAL_STYLES } from "@/lib/beevo-data";
import { getMusicCatalog, getVoiceCatalog } from "@/lib/app-api";
import {
  calculateEstimatedCredits,
  formatDurationLabel,
  getResolutionDimensions,
  SUPPORTED_ELEVENLABS_LANGUAGES,
  type AspectRatioOption,
  type CameraMovementOption,
  type CaptionAnimOption,
  type CaptionBgOption,
  type CaptionFontOption,
  type CaptionPositionOption,
  type CaptionSizeOption,
  type MusicMoodOption,
  type NarrationToneOption,
  type ResolutionOption,
  type SfxStyleOption,
  type TransitionOption,
  type VisualPacingOption,
} from "@/lib/app-types";

interface LocalReferenceFile {
  id: string;
  name: string;
  sizeBytes: number;
  previewUrl: string;
}

const DURATION_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
  { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 },
] as const;

const ASPECT_RATIO_OPTIONS: {
  value: AspectRatioOption;
  title: string;
  subtitle: string;
  previewClass: string;
}[] = [
  {
    value: "16:9",
    title: "16:9 Landscape",
    subtitle: "YouTube & explainers",
    previewClass: "h-[30px] w-[54px]",
  },
  {
    value: "9:16",
    title: "9:16 Vertical",
    subtitle: "Shorts & Reels",
    previewClass: "h-[46px] w-[26px]",
  },
  {
    value: "1:1",
    title: "1:1 Square",
    subtitle: "Social feeds",
    previewClass: "h-[38px] w-[38px]",
  },
];

const NARRATION_TONES: { value: NarrationToneOption; label: string; desc: string }[] = [
  {
    value: "friendly_storyteller",
    label: "Friendly Storyteller",
    desc: "Warm, inviting cartoon narration",
  },
  {
    value: "educational_teacher",
    label: "Educational Teacher",
    desc: "Clear, structured explanations",
  },
  {
    value: "energetic_narrator",
    label: "Energetic Narrator",
    desc: "Upbeat hook & lively pacing",
  },
  {
    value: "documentary_narrator",
    label: "Documentary Narrator",
    desc: "Measured, grounded authority",
  },
  {
    value: "calm_narrator",
    label: "Calm Narrator",
    desc: "Gentle, soothing story cadence",
  },
];

const VISUAL_PACING_OPTIONS: {
  value: VisualPacingOption;
  label: string;
  badge: string;
  desc: string;
}[] = [
  {
    value: "calm",
    label: "Calm",
    badge: "Longer holds",
    desc: "Fewer visual cuts with gentle lingering moments for storytelling.",
  },
  {
    value: "balanced",
    label: "Balanced",
    badge: "Recommended",
    desc: "Natural rhythm matching narration sentences and topic shifts.",
  },
  {
    value: "dynamic",
    label: "Dynamic",
    badge: "Frequent cuts",
    desc: "Brisk scene changes tuned for fast explainers and short-form hooks.",
  },
];

const CAMERA_OPTIONS: { value: CameraMovementOption; label: string }[] = [
  { value: "automatic", label: "Automatic" },
  { value: "slow_zoom", label: "Slow Zoom" },
  { value: "dynamic_zoom", label: "Dynamic Zoom" },
  { value: "pan", label: "Pan" },
  { value: "mixed", label: "Mixed" },
];

const TRANSITION_OPTIONS: { value: TransitionOption; label: string }[] = [
  { value: "automatic", label: "Automatic" },
  { value: "crossfade", label: "Crossfade" },
  { value: "zoom", label: "Zoom" },
  { value: "slide", label: "Slide" },
  { value: "cut", label: "Cut" },
];

const MUSIC_MOODS: { value: MusicMoodOption; label: string }[] = [
  { value: "happy", label: "Happy" },
  { value: "cinematic", label: "Cinematic" },
  { value: "playful", label: "Playful" },
  { value: "emotional", label: "Emotional" },
  { value: "relaxing", label: "Relaxing" },
  { value: "educational", label: "Educational" },
];

const SFX_STYLES: { value: SfxStyleOption; label: string }[] = [
  { value: "automatic", label: "Automatic" },
  { value: "cartoon", label: "Cartoon" },
  { value: "cinematic", label: "Cinematic" },
  { value: "subtle", label: "Subtle" },
];

export function CreateStudioClient() {
  // 1. Prompt / Idea
  const [prompt, setPrompt] = useState("");
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  // 2. Duration & Credits
  const [durationSeconds, setDurationSeconds] = useState<number>(60);

  // 3. Format & Resolution
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("16:9");
  const [resolution, setResolution] = useState<ResolutionOption>("1080p");

  // 4. Visual Style
  const [styleId, setStyleId] = useState<string>(VISUAL_STYLES[0].id);

  // 5. Characters
  const [characterConsistency, setCharacterConsistency] = useState<boolean>(true);
  const [characterMode, setCharacterMode] = useState<"automatic" | "custom">("automatic");
  const [mainCharacter, setMainCharacter] = useState("");
  const [supportingCharacters, setSupportingCharacters] = useState<string[]>([""]);
  const [characterVisualNotes, setCharacterVisualNotes] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<LocalReferenceFile[]>([]);
  const referenceFilesRef = useRef<LocalReferenceFile[]>([]);

  // 6. Voice & Narration
  const [language, setLanguage] = useState<string>("en");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [narrationTone, setNarrationTone] = useState<NarrationToneOption>("friendly_storyteller");
  const [narrationSpeed, setNarrationSpeed] = useState<number>(1.0);

  // 7. Pacing, Camera & Transitions
  const [visualPacing, setVisualPacing] = useState<VisualPacingOption>("balanced");
  const [cameraMovement, setCameraMovement] = useState<CameraMovementOption>("automatic");
  const [transition, setTransition] = useState<TransitionOption>("automatic");

  // 8. Captions
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(true);
  const [captionPosition, setCaptionPosition] = useState<CaptionPositionOption>("bottom");
  const [captionSize, setCaptionSize] = useState<CaptionSizeOption>("medium");
  const [captionFont, setCaptionFont] = useState<CaptionFontOption>("sora");
  const [captionWordHighlight, setCaptionWordHighlight] = useState<boolean>(true);
  const [captionBackground, setCaptionBackground] = useState<CaptionBgOption>("pill");
  const [captionAnimation, setCaptionAnimation] = useState<CaptionAnimOption>("pop");

  // 9. Music & SFX
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [musicMood, setMusicMood] = useState<MusicMoodOption>("playful");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [musicVolume, setMusicVolume] = useState<number>(28);
  const [musicFade, setMusicFade] = useState<boolean>(true);
  const [musicAutoDucking, setMusicAutoDucking] = useState<boolean>(true);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [sfxStyle, setSfxStyle] = useState<SfxStyleOption>("automatic");

  // 10. Advanced Controls (Collapsed by default)
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [customImageInstructions, setCustomImageInstructions] = useState("");
  const [pronunciationNotes, setPronunciationNotes] = useState("");
  const [voiceStability, setVoiceStability] = useState<number>(0.55);
  const [voiceSimilarity, setVoiceSimilarity] = useState<number>(0.75);
  const [subtitleMaxWords, setSubtitleMaxWords] = useState<number>(5);
  const [frameRate, setFrameRate] = useState<24 | 30>(30);
  const [customSceneInstructions, setCustomSceneInstructions] = useState("");

  // Submission feedback
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  // Live catalog queries (honestly empty until Phase 4)
  const voiceCatalog = useMemo(() => getVoiceCatalog(), []);
  const musicCatalog = useMemo(() => getMusicCatalog(), []);

  useEffect(() => {
    referenceFilesRef.current = referenceFiles;
  }, [referenceFiles]);

  useEffect(() => {
    return () => {
      referenceFilesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  const estimatedCredits = calculateEstimatedCredits(durationSeconds);
  const selectedStyle = VISUAL_STYLES.find((s) => s.id === styleId) ?? VISUAL_STYLES[0];
  const dimensions = getResolutionDimensions(aspectRatio, resolution);

  const trimmedPrompt = prompt.trim();
  const charCount = prompt.length;
  const wordCount = trimmedPrompt ? trimmedPrompt.split(/\s+/).length : 0;
  const estimatedSpokenSeconds = Math.round((wordCount / 140) * 60);

  const captionPreviewWords = useMemo(() => {
    if (!trimmedPrompt) return [];
    const tokens = trimmedPrompt.split(/\s+/).filter(Boolean);
    return tokens.slice(0, Math.max(3, Math.min(subtitleMaxWords, 6)));
  }, [trimmedPrompt, subtitleMaxWords]);

  const handlePaste = async () => {
    setClipboardNotice(null);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPrompt((prev) => (prev ? `${prev}\n${text}` : text));
          setSubmitError(null);
        } else {
          setClipboardNotice("Clipboard is currently empty.");
        }
      } else {
        setClipboardNotice("Paste directly inside the text box using Ctrl+V or Cmd+V.");
      }
    } catch {
      setClipboardNotice("Browser clipboard permission blocked — paste directly with Ctrl+V / Cmd+V.");
    }
  };

  const handleStepDuration = (delta: number) => {
    setDurationSeconds((prev) => Math.max(15, Math.min(600, prev + delta)));
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const added: LocalReferenceFile[] = [];
    for (let i = 0; i < fileList.length; i += 1) {
      const file = fileList[i];
      if (!file.type.startsWith("image/")) continue;
      added.push({
        id: `${file.name}-${Date.now()}-${i}`,
        name: file.name,
        sizeBytes: file.size,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setReferenceFiles((prev) => [...prev, ...added].slice(0, 6));
    e.target.value = "";
  };

  const handleRemoveReference = (id: string) => {
    setReferenceFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleAddSupportingCharacter = () => {
    setSupportingCharacters((prev) => (prev.length < 6 ? [...prev, ""] : prev));
  };

  const handleUpdateSupportingCharacter = (idx: number, value: string) => {
    setSupportingCharacters((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };

  const handleRemoveSupportingCharacter = (idx: number) => {
    setSupportingCharacters((prev) =>
      prev.length <= 1 ? [""] : prev.filter((_, i) => i !== idx)
    );
  };

  const handleGenerateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitNotice(null);

    if (trimmedPrompt.length < 10) {
      setSubmitError("Please write a short story idea or script (at least 10 characters) first.");
      return;
    }

    setSubmitError(null);
    setSubmitNotice(
      `Your ${formatDurationLabel(durationSeconds)} ${selectedStyle.name} configuration (${estimatedCredits.toLocaleString()} estimated credits, ${aspectRatio} ${resolution}) is validated and ready. Live script & storyboard generation via OpenAI, fal.ai, ElevenLabs, and FFmpeg connects in Phase 4 — no credits were reserved.`
    );
  };

  return (
    <form onSubmit={handleGenerateSubmit} noValidate className="space-y-6 pb-8">
      {/* Studio Heading */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Eyebrow showSparkle>Creation Studio</Eyebrow>
          <h1 className="mt-2.5 font-display text-[clamp(1.65rem,3.3vw,2.4rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-beevo-ink">
            Bring your idea to life.
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-beevo-body">
            Describe your story or paste a script below, pick a visual style and cadence, and
            preview how Beevo will direct your illustrated cartoon video.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-beevo-border-warm bg-beevo-cream px-3.5 py-1.5 text-[12.5px] font-extrabold tabular-nums text-beevo-ink">
            <Coins className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
            {estimatedCredits.toLocaleString()} est. credits
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-beevo-border bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-beevo-body">
            <Clock className="h-3.5 w-3.5 text-beevo-muted" aria-hidden="true" />
            {formatDurationLabel(durationSeconds)} &middot; {aspectRatio}
          </span>
        </div>
      </header>

      {/* Responsive Workspace Grid: Main Creation Canvas + Sticky Summary Rail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Primary Studio Controls */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. IDEA / PROMPT EDITOR (HERO OF THE SCREEN) */}
          <section
            aria-labelledby="studio-prompt-heading"
            className="rounded-[24px] border-2 border-beevo-border-warm bg-white p-5 shadow-beevo sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFC928] text-beevo-ink shadow-sm">
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="studio-prompt-heading"
                    className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    1. Story Idea or Script
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Start with a one-line premise or paste your own narration script.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-beevo-border bg-beevo-canvas px-3.5 text-[12.5px] font-bold text-beevo-ink transition-colors hover:bg-beevo-cream"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt("");
                    setClipboardNotice(null);
                    setSubmitError(null);
                  }}
                  disabled={prompt.length === 0}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-3.5 text-[12.5px] font-bold text-beevo-muted transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="studio-prompt-input" className="sr-only">
                Describe your video idea or paste your script
              </label>
              <textarea
                id="studio-prompt-input"
                rows={6}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                placeholder="Write your idea, lesson, or full script here. Mention your setting, audience, or key moments you want illustrated..."
                className="min-h-[176px] w-full resize-y rounded-[16px] border border-beevo-border bg-beevo-canvas p-4 text-[15px] leading-[1.65] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
              />
            </div>

            {clipboardNotice && (
              <p className="mt-2 text-[12.5px] font-medium text-beevo-muted">{clipboardNotice}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-beevo-border/80 pt-3 text-[12.5px]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-semibold text-beevo-muted tabular-nums">
                <span>{charCount.toLocaleString()} characters</span>
                <span>{wordCount.toLocaleString()} words</span>
                <span>
                  Est. script length:{" "}
                  <strong className="text-beevo-ink">
                    {wordCount > 0
                      ? `~${formatDurationLabel(Math.max(5, estimatedSpokenSeconds))}`
                      : "0s"}
                  </strong>
                </span>
              </div>
              <span className="text-[12px] text-beevo-muted">
                Target video: <strong className="text-beevo-ink">{formatDurationLabel(durationSeconds)}</strong>
              </span>
            </div>
          </section>

          {/* 2. DURATION & CREDIT CALCULATOR */}
          <section
            aria-labelledby="studio-duration-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="studio-duration-heading"
                    className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    2. Duration &amp; Credit Estimate
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Choose a preset or fine-tune in 15-second steps (max 10 minutes).
                  </p>
                </div>
              </div>
              <div className="rounded-[14px] border border-beevo-border-warm bg-beevo-cream px-3.5 py-2 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-beevo-honey-text">
                  Estimated Cost
                </p>
                <p className="font-display text-[20px] font-extrabold leading-tight tabular-nums text-beevo-ink">
                  {estimatedCredits.toLocaleString()} credits
                </p>
              </div>
            </div>

            {/* Presets */}
            <div
              role="group"
              aria-label="Duration presets"
              className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6"
            >
              {DURATION_PRESETS.map((preset) => {
                const active = durationSeconds === preset.seconds;
                const presetCredits = calculateEstimatedCredits(preset.seconds);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDurationSeconds(preset.seconds)}
                    aria-pressed={active}
                    className={`flex min-h-[54px] flex-col items-center justify-center rounded-[14px] border px-2 py-2 transition-all ${
                      active
                        ? "border-2 border-beevo-yellow bg-beevo-cream font-extrabold text-beevo-ink shadow-sm"
                        : "border-beevo-border bg-beevo-canvas text-beevo-body hover:border-beevo-border-warm"
                    }`}
                  >
                    <span className="font-display text-[14.5px] font-extrabold leading-none">
                      {preset.label}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold tabular-nums text-beevo-muted">
                      {presetCredits} cr
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom 15-second Increment Slider & Stepper */}
            <div className="mt-5 rounded-[16px] border border-beevo-border bg-beevo-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="duration-slider"
                  className="text-[13px] font-bold text-beevo-ink"
                >
                  Custom Duration:{" "}
                  <span className="font-display text-[15px] tabular-nums text-beevo-honey-text">
                    {formatDurationLabel(durationSeconds)} ({durationSeconds}s)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepDuration(-15)}
                    disabled={durationSeconds <= 15}
                    aria-label="Decrease duration by 15 seconds"
                    className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink hover:bg-beevo-cream disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-[66px] text-center text-[12.5px] font-bold tabular-nums text-beevo-body">
                    15s steps
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepDuration(15)}
                    disabled={durationSeconds >= 600}
                    aria-label="Increase duration by 15 seconds"
                    className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink hover:bg-beevo-cream disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <input
                id="duration-slider"
                type="range"
                min={15}
                max={600}
                step={15}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="mt-3.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-beevo-border accent-[#FFC928]"
              />
              <div className="mt-1.5 flex justify-between text-[11px] font-semibold tabular-nums text-beevo-muted">
                <span>15s (25 cr)</span>
                <span>5m (500 cr)</span>
                <span>10m max (1,000 cr)</span>
              </div>

              <p className="mt-3 border-t border-beevo-border/75 pt-2.5 text-[12px] leading-relaxed text-beevo-muted">
                Formula: <strong className="text-beevo-body">25 credits per 15-second block</strong>{" "}
                (<code className="font-mono text-[11.5px]">ceil(duration / 15) × 25</code>).
                Credits are reserved on start and refunded automatically if a render fails.
              </p>
            </div>
          </section>

          {/* 3. FORMAT & RESOLUTION */}
          <section
            aria-labelledby="studio-format-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                <Film className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="studio-format-heading"
                  className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                >
                  3. Aspect Ratio &amp; Resolution
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Choose the frame shape and export clarity for your publishing platform.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ASPECT_RATIO_OPTIONS.map((opt) => {
                const active = aspectRatio === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAspectRatio(opt.value)}
                    aria-pressed={active}
                    className={`flex min-h-[116px] flex-col items-center justify-center rounded-[16px] border p-4 text-center transition-all ${
                      active
                        ? "border-2 border-beevo-yellow bg-beevo-cream/85 shadow-sm"
                        : "border-beevo-border bg-beevo-canvas hover:border-beevo-border-warm"
                    }`}
                  >
                    <div className="flex h-[50px] items-center justify-center">
                      <div
                        aria-hidden="true"
                        className={`rounded-[6px] border-2 ${opt.previewClass} ${
                          active
                            ? "border-beevo-ink bg-[#FFC928]/45"
                            : "border-beevo-muted/60 bg-white"
                        }`}
                      />
                    </div>
                    <span className="mt-2 font-display text-[14px] font-extrabold text-beevo-ink">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 text-[12px] text-beevo-muted">{opt.subtitle}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-beevo-border bg-beevo-canvas px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-beevo-ink">Output Resolution</p>
                <p className="text-[12px] text-beevo-muted">
                  Export dimensions: <strong className="text-beevo-ink tabular-nums">{dimensions}</strong>
                </p>
              </div>
              <div
                role="group"
                aria-label="Resolution"
                className="inline-flex rounded-full border border-beevo-border bg-white p-1"
              >
                {(["720p", "1080p"] as ResolutionOption[]).map((res) => {
                  const active = resolution === res;
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      aria-pressed={active}
                      className={`min-h-[38px] rounded-full px-4 text-[13px] font-extrabold transition-colors ${
                        active
                          ? "bg-[#FFC928] text-beevo-ink shadow-sm"
                          : "text-beevo-muted hover:text-beevo-ink"
                      }`}
                    >
                      {res}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. VISUAL STYLE SELECTOR (ALL 8 ORIGINAL PHASE 1 GENERATED STYLES) */}
          <section
            aria-labelledby="studio-style-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="studio-style-heading"
                    className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    4. Visual Style
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Select one consistent illustration direction across every scene in your video.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-beevo-cream px-3 py-1 text-[12px] font-bold text-beevo-ink">
                Selected: {selectedStyle.name}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VISUAL_STYLES.map((style) => {
                const active = style.id === styleId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setStyleId(style.id)}
                    aria-pressed={active}
                    className={`group relative flex flex-col overflow-hidden rounded-[16px] border text-left transition-all ${
                      active
                        ? "border-2 border-beevo-yellow bg-beevo-cream/60 shadow-beevo-yellow-sm ring-2 ring-[#FFC928]/35"
                        : "border-beevo-border bg-beevo-canvas hover:border-beevo-border-warm"
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-beevo-cream">
                      <Image
                        src={style.image}
                        alt={`${style.name} cartoon illustration style`}
                        fill
                        sizes="(max-width: 640px) 45vw, 220px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {active && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFC928] text-beevo-ink shadow">
                          <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-display text-[13px] font-extrabold leading-snug text-beevo-ink">
                        {style.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-beevo-muted">
                        {style.mood}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. CHARACTERS */}
          <section
            aria-labelledby="studio-characters-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="studio-characters-heading"
                    className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    5. Characters &amp; Consistency
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Keep faces, outfits, and colors recognizable across scenes.
                  </p>
                </div>
              </div>

              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-full border border-beevo-border bg-beevo-canvas px-3.5 py-1.5">
                <span className="text-[12.5px] font-bold text-beevo-ink">
                  Character Consistency
                </span>
                <input
                  type="checkbox"
                  checked={characterConsistency}
                  onChange={(e) => setCharacterConsistency(e.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#FFC928]"
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {(
                [
                  {
                    id: "automatic",
                    title: "Automatic Cast",
                    desc: "Beevo designs matching characters directly from your script.",
                  },
                  {
                    id: "custom",
                    title: "Custom Characters",
                    desc: "Define lead & supporting cast or attach reference images.",
                  },
                ] as const
              ).map((mode) => {
                const active = characterMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCharacterMode(mode.id)}
                    aria-pressed={active}
                    className={`rounded-[14px] border p-3.5 text-left transition-all ${
                      active
                        ? "border-2 border-beevo-yellow bg-beevo-cream/80"
                        : "border-beevo-border bg-beevo-canvas hover:border-beevo-border-warm"
                    }`}
                  >
                    <p className="font-display text-[13.5px] font-extrabold text-beevo-ink">
                      {mode.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-beevo-muted">{mode.desc}</p>
                  </button>
                );
              })}
            </div>

            {characterMode === "custom" && (
              <div className="mt-4 space-y-4 rounded-[16px] border border-beevo-border bg-beevo-canvas p-4">
                <div>
                  <label
                    htmlFor="main-character-input"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    Main Character Description
                  </label>
                  <textarea
                    id="main-character-input"
                    rows={2}
                    value={mainCharacter}
                    onChange={(e) => setMainCharacter(e.target.value)}
                    placeholder="Describe appearance, age, outfit, hair, and personality..."
                    className="mt-1.5 w-full rounded-[12px] border border-beevo-border bg-white p-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-beevo-ink">
                      Supporting Characters
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSupportingCharacter}
                      disabled={supportingCharacters.length >= 6}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-beevo-border bg-white px-3 text-[12px] font-bold text-beevo-ink hover:bg-beevo-cream disabled:opacity-45"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Add Character
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {supportingCharacters.map((charDesc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={charDesc}
                          onChange={(e) => handleUpdateSupportingCharacter(idx, e.target.value)}
                          aria-label={`Supporting character ${idx + 1}`}
                          placeholder={`Supporting character ${idx + 1} description...`}
                          className="min-h-[44px] flex-1 rounded-[12px] border border-beevo-border bg-white px-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSupportingCharacter(idx)}
                          aria-label={`Remove supporting character ${idx + 1}`}
                          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] border border-beevo-border bg-white text-beevo-muted hover:text-red-700"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="character-visual-notes"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    Visual Consistency Notes
                  </label>
                  <input
                    id="character-visual-notes"
                    type="text"
                    value={characterVisualNotes}
                    onChange={(e) => setCharacterVisualNotes(e.target.value)}
                    placeholder="Optional notes (e.g., always wears yellow raincoat, warm daylight lighting)..."
                    className="mt-1.5 min-h-[44px] w-full rounded-[12px] border border-beevo-border bg-white px-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
                  />
                </div>

                {/* Real Local Reference Image Upload Preview */}
                <div>
                  <span className="block text-[13px] font-bold text-beevo-ink">
                    Optional Reference Images (up to 6)
                  </span>
                  <p className="mt-0.5 text-[12px] text-beevo-muted">
                    Upload local PNG, JPG, or WebP character sketches for instant browser preview.
                  </p>
                  <label className="mt-2.5 flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-beevo-border-warm bg-white px-4 py-3 text-[13px] font-bold text-beevo-ink transition-colors hover:bg-beevo-cream/60">
                    <ImagePlus className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                    <span>Choose reference images from device</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handleReferenceUpload}
                      className="sr-only"
                    />
                  </label>

                  {referenceFiles.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {referenceFiles.map((file) => (
                        <div
                          key={file.id}
                          className="relative overflow-hidden rounded-[12px] border border-beevo-border bg-white p-1.5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.previewUrl}
                            alt={`Uploaded reference: ${file.name}`}
                            className="h-24 w-full rounded-[8px] object-cover"
                          />
                          <div className="mt-1.5 flex items-center justify-between gap-1 px-1">
                            <span className="truncate text-[11px] font-semibold text-beevo-body">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveReference(file.id)}
                              aria-label={`Remove ${file.name}`}
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-beevo-muted hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 6. VOICE & NARRATION */}
          <section
            aria-labelledby="studio-voice-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                <Mic className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="studio-voice-heading"
                  className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                >
                  6. Voice &amp; Narration
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Powered by ElevenLabs multilingual narration with word-level caption alignment.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="narration-language"
                  className="block text-[13px] font-bold text-beevo-ink"
                >
                  Narration Language
                </label>
                <select
                  id="narration-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3 text-[14px] font-semibold text-beevo-ink focus:border-beevo-ink"
                >
                  {SUPPORTED_ELEVENLABS_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="narration-voice"
                  className="block text-[13px] font-bold text-beevo-ink"
                >
                  Voice Selection
                </label>
                {voiceCatalog.data.length > 0 ? (
                  <select
                    id="narration-voice"
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3 text-[14px] font-semibold text-beevo-ink"
                  >
                    {voiceCatalog.data.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} ({voice.languageLabel})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    id="narration-voice"
                    className="mt-1.5 flex min-h-[46px] items-center gap-2 rounded-[12px] border border-dashed border-beevo-border-warm bg-beevo-cream/55 px-3 py-2 text-[12.5px] font-semibold text-beevo-body"
                  >
                    <Info className="h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
                    <span>
                      Live ElevenLabs voices &amp; audio previews load once connected in Phase 4.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tone Presets */}
            <div className="mt-4">
              <span className="block text-[13px] font-bold text-beevo-ink">Narration Tone</span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {NARRATION_TONES.map((tone) => {
                  const active = narrationTone === tone.value;
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setNarrationTone(tone.value)}
                      aria-pressed={active}
                      className={`rounded-[13px] border p-3 text-left transition-all ${
                        active
                          ? "border-2 border-beevo-yellow bg-beevo-cream/85"
                          : "border-beevo-border bg-beevo-canvas hover:border-beevo-border-warm"
                      }`}
                    >
                      <p className="text-[13px] font-extrabold text-beevo-ink">{tone.label}</p>
                      <p className="mt-0.5 text-[11.5px] text-beevo-muted">{tone.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Narration Speed */}
            <div className="mt-4 rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="narration-speed" className="text-[13px] font-bold text-beevo-ink">
                  Narration Speed
                </label>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[12.5px] font-extrabold tabular-nums text-beevo-ink">
                  {narrationSpeed.toFixed(2)}×
                </span>
              </div>
              <input
                id="narration-speed"
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={narrationSpeed}
                onChange={(e) => setNarrationSpeed(Number(e.target.value))}
                className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-beevo-border accent-[#FFC928]"
              />
              <div className="mt-1 flex justify-between text-[11px] font-semibold text-beevo-muted">
                <span>0.75× Slower</span>
                <span>1.00× Natural</span>
                <span>1.25× Brisk</span>
              </div>
            </div>
          </section>

          {/* 7. VISUAL PACING, CAMERA & TRANSITIONS */}
          <section
            aria-labelledby="studio-motion-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                <Video className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="studio-motion-heading"
                  className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                >
                  7. Visual Pacing, Camera &amp; Transitions
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Scene count is determined dynamically by your AI storyboard—never a rigid fixed
                  count.
                </p>
              </div>
            </div>

            {/* Visual Pacing */}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {VISUAL_PACING_OPTIONS.map((opt) => {
                const active = visualPacing === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisualPacing(opt.value)}
                    aria-pressed={active}
                    className={`rounded-[15px] border p-3.5 text-left transition-all ${
                      active
                        ? "border-2 border-beevo-yellow bg-beevo-cream/85 shadow-sm"
                        : "border-beevo-border bg-beevo-canvas hover:border-beevo-border-warm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[14px] font-extrabold text-beevo-ink">
                        {opt.label}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-beevo-honey-text">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-snug text-beevo-muted">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Camera Movement & Transitions */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-[13px] font-bold text-beevo-ink">
                  Camera Movement (FFmpeg Motion)
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CAMERA_OPTIONS.map((cam) => {
                    const active = cameraMovement === cam.value;
                    return (
                      <button
                        key={cam.value}
                        type="button"
                        onClick={() => setCameraMovement(cam.value)}
                        aria-pressed={active}
                        className={`min-h-[40px] rounded-full border px-3.5 text-[12.5px] font-bold transition-colors ${
                          active
                            ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                            : "border-beevo-border bg-beevo-canvas text-beevo-body hover:bg-beevo-cream"
                        }`}
                      >
                        {cam.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-[13px] font-bold text-beevo-ink">
                  Scene Transitions
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TRANSITION_OPTIONS.map((tr) => {
                    const active = transition === tr.value;
                    return (
                      <button
                        key={tr.value}
                        type="button"
                        onClick={() => setTransition(tr.value)}
                        aria-pressed={active}
                        className={`min-h-[40px] rounded-full border px-3.5 text-[12.5px] font-bold transition-colors ${
                          active
                            ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                            : "border-beevo-border bg-beevo-canvas text-beevo-body hover:bg-beevo-cream"
                        }`}
                      >
                        {tr.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 8. CAPTIONS WITH LIVE PREVIEW */}
          <section
            aria-labelledby="studio-captions-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <Subtitles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="studio-captions-heading"
                    className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    8. Captions &amp; Live Style Preview
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Synchronized subtitles rendered directly into your final video.
                  </p>
                </div>
              </div>

              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-full border border-beevo-border bg-beevo-canvas px-3.5 py-1.5">
                <span className="text-[12.5px] font-bold text-beevo-ink">Enable Captions</span>
                <input
                  type="checkbox"
                  checked={captionsEnabled}
                  onChange={(e) => setCaptionsEnabled(e.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#FFC928]"
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-12">
              <div className="space-y-3.5 md:col-span-6">
                {/* Position */}
                <div>
                  <span className="block text-[12.5px] font-bold text-beevo-ink">Position</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {(["bottom", "middle", "top"] as CaptionPositionOption[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        disabled={!captionsEnabled}
                        onClick={() => setCaptionPosition(pos)}
                        aria-pressed={captionPosition === pos}
                        className={`min-h-[40px] rounded-[10px] border text-[12.5px] font-bold capitalize transition-colors disabled:opacity-45 ${
                          captionPosition === pos
                            ? "border-2 border-beevo-yellow bg-beevo-cream text-beevo-ink"
                            : "border-beevo-border bg-beevo-canvas text-beevo-body"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <span className="block text-[12.5px] font-bold text-beevo-ink">Size</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {(["small", "medium", "large"] as CaptionSizeOption[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        disabled={!captionsEnabled}
                        onClick={() => setCaptionSize(sz)}
                        aria-pressed={captionSize === sz}
                        className={`min-h-[40px] rounded-[10px] border text-[12.5px] font-bold capitalize transition-colors disabled:opacity-45 ${
                          captionSize === sz
                            ? "border-2 border-beevo-yellow bg-beevo-cream text-beevo-ink"
                            : "border-beevo-border bg-beevo-canvas text-beevo-body"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Style */}
                <div>
                  <span className="block text-[12.5px] font-bold text-beevo-ink">Font Style</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: "sora", label: "Sora" },
                        { id: "manrope", label: "Manrope" },
                        { id: "serif", label: "Serif" },
                      ] as const
                    ).map((ft) => (
                      <button
                        key={ft.id}
                        type="button"
                        disabled={!captionsEnabled}
                        onClick={() => setCaptionFont(ft.id)}
                        aria-pressed={captionFont === ft.id}
                        className={`min-h-[40px] rounded-[10px] border text-[12.5px] font-bold transition-colors disabled:opacity-45 ${
                          captionFont === ft.id
                            ? "border-2 border-beevo-yellow bg-beevo-cream text-beevo-ink"
                            : "border-beevo-border bg-beevo-canvas text-beevo-body"
                        }`}
                      >
                        {ft.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background & Animation */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="caption-bg-select"
                      className="block text-[12.5px] font-bold text-beevo-ink"
                    >
                      Background
                    </label>
                    <select
                      id="caption-bg-select"
                      disabled={!captionsEnabled}
                      value={captionBackground}
                      onChange={(e) => setCaptionBackground(e.target.value as CaptionBgOption)}
                      className="mt-1.5 min-h-[42px] w-full rounded-[10px] border border-beevo-border bg-beevo-canvas px-2.5 text-[13px] font-semibold text-beevo-ink disabled:opacity-45"
                    >
                      <option value="pill">Dark Pill</option>
                      <option value="bar">Full Bar</option>
                      <option value="none">None (Shadow)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="caption-anim-select"
                      className="block text-[12.5px] font-bold text-beevo-ink"
                    >
                      Animation
                    </label>
                    <select
                      id="caption-anim-select"
                      disabled={!captionsEnabled}
                      value={captionAnimation}
                      onChange={(e) => setCaptionAnimation(e.target.value as CaptionAnimOption)}
                      className="mt-1.5 min-h-[42px] w-full rounded-[10px] border border-beevo-border bg-beevo-canvas px-2.5 text-[13px] font-semibold text-beevo-ink disabled:opacity-45"
                    >
                      <option value="pop">Pop</option>
                      <option value="fade">Fade</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 py-2">
                  <span className="text-[13px] font-bold text-beevo-ink">
                    Word-by-Word Highlighting
                  </span>
                  <input
                    type="checkbox"
                    disabled={!captionsEnabled}
                    checked={captionWordHighlight}
                    onChange={(e) => setCaptionWordHighlight(e.target.checked)}
                    className="h-5 w-5 cursor-pointer accent-[#FFC928] disabled:opacity-45"
                  />
                </label>
              </div>

              <div className="md:col-span-6">
                <CaptionLivePreview
                  aspectRatio={aspectRatio}
                  enabled={captionsEnabled}
                  position={captionPosition}
                  size={captionSize}
                  font={captionFont}
                  wordHighlighting={captionWordHighlight}
                  background={captionBackground}
                  animation={captionAnimation}
                  sampleWords={captionPreviewWords}
                />
              </div>
            </div>
          </section>

          {/* 9. BACKGROUND MUSIC & SOUND EFFECTS */}
          <section
            aria-labelledby="studio-audio-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <Music className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="studio-audio-heading"
                    className="font-display text-[17.5px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    9. Background Music &amp; Sound Effects
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Licensed music with smart narration ducking plus subtle cartoon sound effects.
                  </p>
                </div>
              </div>

              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-full border border-beevo-border bg-beevo-canvas px-3.5 py-1.5">
                <span className="text-[12.5px] font-bold text-beevo-ink">Background Music</span>
                <input
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(e) => setMusicEnabled(e.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#FFC928]"
                />
              </label>
            </div>

            {musicEnabled && (
              <div className="mt-4 space-y-4">
                <div>
                  <span className="block text-[13px] font-bold text-beevo-ink">Music Mood</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MUSIC_MOODS.map((mood) => {
                      const active = musicMood === mood.value;
                      return (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setMusicMood(mood.value)}
                          aria-pressed={active}
                          className={`min-h-[40px] rounded-full border px-3.5 text-[12.5px] font-bold transition-colors ${
                            active
                              ? "border-2 border-beevo-yellow bg-beevo-cream text-beevo-ink"
                              : "border-beevo-border bg-beevo-canvas text-beevo-body hover:bg-beevo-cream/60"
                          }`}
                        >
                          {mood.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Licensed Track Catalog (Honest Empty State until Phase 4) */}
                <div>
                  <span className="block text-[13px] font-bold text-beevo-ink">
                    Licensed Music Track
                  </span>
                  {musicCatalog.data.length > 0 ? (
                    <select
                      aria-label="Licensed music track"
                      value={selectedTrackId}
                      onChange={(e) => setSelectedTrackId(e.target.value)}
                      className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3 text-[13.5px] font-semibold text-beevo-ink"
                    >
                      {musicCatalog.data.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.title} ({track.mood})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1.5 flex items-start gap-2.5 rounded-[12px] border border-dashed border-beevo-border-warm bg-beevo-cream/55 px-3.5 py-3 text-[12.5px] leading-relaxed text-beevo-body">
                      <Info
                        className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text"
                        aria-hidden="true"
                      />
                      <span>
                        Licensed royalty-free tracks for the{" "}
                        <strong className="capitalize text-beevo-ink">{musicMood}</strong> mood load
                        from Beevo&apos;s audio catalog once backend storage connects in Phase 4.
                      </span>
                    </div>
                  )}
                </div>

                {/* Volume + Fade + Auto-ducking */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="music-volume" className="text-[13px] font-bold text-beevo-ink">
                        Music Volume
                      </label>
                      <span className="text-[12.5px] font-extrabold tabular-nums text-beevo-ink">
                        {musicVolume}%
                      </span>
                    </div>
                    <input
                      id="music-volume"
                      type="range"
                      min={0}
                      max={100}
                      step={2}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                      className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-beevo-border accent-[#FFC928]"
                    />
                  </div>

                  <div className="flex flex-col justify-center gap-2 rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
                    <label className="flex min-h-[36px] cursor-pointer items-center justify-between gap-2 text-[13px] font-bold text-beevo-ink">
                      <span>Smooth Fade In / Out</span>
                      <input
                        type="checkbox"
                        checked={musicFade}
                        onChange={(e) => setMusicFade(e.target.checked)}
                        className="h-5 w-5 cursor-pointer accent-[#FFC928]"
                      />
                    </label>
                    <label className="flex min-h-[36px] cursor-pointer items-center justify-between gap-2 text-[13px] font-bold text-beevo-ink">
                      <span>Auto-Duck Under Voiceover</span>
                      <input
                        type="checkbox"
                        checked={musicAutoDucking}
                        onChange={(e) => setMusicAutoDucking(e.target.checked)}
                        className="h-5 w-5 cursor-pointer accent-[#FFC928]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* SFX */}
            <div className="mt-5 border-t border-beevo-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                  <span className="text-[14px] font-extrabold text-beevo-ink">
                    Sound Effects (SFX)
                  </span>
                </div>
                <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 text-[13px] font-bold text-beevo-ink">
                  <span>Enable SFX</span>
                  <input
                    type="checkbox"
                    checked={sfxEnabled}
                    onChange={(e) => setSfxEnabled(e.target.checked)}
                    className="h-5 w-5 cursor-pointer accent-[#FFC928]"
                  />
                </label>
              </div>

              {sfxEnabled && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SFX_STYLES.map((sfx) => {
                    const active = sfxStyle === sfx.value;
                    return (
                      <button
                        key={sfx.value}
                        type="button"
                        onClick={() => setSfxStyle(sfx.value)}
                        aria-pressed={active}
                        className={`min-h-[40px] rounded-full border px-4 text-[12.5px] font-bold transition-colors ${
                          active
                            ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                            : "border-beevo-border bg-beevo-canvas text-beevo-body hover:bg-beevo-cream"
                        }`}
                      >
                        {sfx.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 10. COLLAPSIBLE ADVANCED CONTROLS */}
          <section className="rounded-[22px] border border-beevo-border bg-white shadow-beevo-card">
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              aria-expanded={advancedOpen}
              aria-controls="advanced-studio-controls"
              className="flex min-h-[60px] w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <span className="block font-display text-[16.5px] font-extrabold text-beevo-ink">
                    Advanced Studio Controls
                  </span>
                  <span className="text-[12.5px] text-beevo-muted">
                    Optional fine-tuning for voice stability, pronunciation, subtitle density, and
                    frame rate.
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-beevo-muted transition-transform ${
                  advancedOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {advancedOpen && (
              <div
                id="advanced-studio-controls"
                className="space-y-4 border-t border-beevo-border px-5 py-5 sm:px-6"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="adv-image-notes"
                      className="block text-[13px] font-bold text-beevo-ink"
                    >
                      Custom Image Instructions
                    </label>
                    <textarea
                      id="adv-image-notes"
                      rows={2}
                      value={customImageInstructions}
                      onChange={(e) => setCustomImageInstructions(e.target.value)}
                      placeholder="Optional lighting, framing, or color palette cues..."
                      className="mt-1.5 w-full rounded-[12px] border border-beevo-border bg-beevo-canvas p-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="adv-pronunciation"
                      className="block text-[13px] font-bold text-beevo-ink"
                    >
                      Pronunciation Notes
                    </label>
                    <textarea
                      id="adv-pronunciation"
                      rows={2}
                      value={pronunciationNotes}
                      onChange={(e) => setPronunciationNotes(e.target.value)}
                      placeholder="Clarify brand names, acronyms, or character pronunciations..."
                      className="mt-1.5 w-full rounded-[12px] border border-beevo-border bg-beevo-canvas p-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
                    <div className="flex justify-between text-[13px] font-bold text-beevo-ink">
                      <label htmlFor="adv-voice-stability">Voice Stability</label>
                      <span className="tabular-nums">{voiceStability.toFixed(2)}</span>
                    </div>
                    <input
                      id="adv-voice-stability"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={voiceStability}
                      onChange={(e) => setVoiceStability(Number(e.target.value))}
                      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-beevo-border accent-[#FFC928]"
                    />
                  </div>

                  <div className="rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
                    <div className="flex justify-between text-[13px] font-bold text-beevo-ink">
                      <label htmlFor="adv-voice-similarity">Voice Similarity</label>
                      <span className="tabular-nums">{voiceSimilarity.toFixed(2)}</span>
                    </div>
                    <input
                      id="adv-voice-similarity"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={voiceSimilarity}
                      onChange={(e) => setVoiceSimilarity(Number(e.target.value))}
                      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-beevo-border accent-[#FFC928]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
                    <div className="flex justify-between text-[13px] font-bold text-beevo-ink">
                      <label htmlFor="adv-max-words">Subtitle Max Words per Line</label>
                      <span className="tabular-nums">{subtitleMaxWords} words</span>
                    </div>
                    <input
                      id="adv-max-words"
                      type="range"
                      min={3}
                      max={10}
                      step={1}
                      value={subtitleMaxWords}
                      onChange={(e) => setSubtitleMaxWords(Number(e.target.value))}
                      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-beevo-border accent-[#FFC928]"
                    />
                  </div>

                  <div className="rounded-[14px] border border-beevo-border bg-beevo-canvas p-3.5">
                    <span className="block text-[13px] font-bold text-beevo-ink">
                      Export Frame Rate
                    </span>
                    <div className="mt-2 flex gap-2">
                      {([24, 30] as const).map((fps) => (
                        <button
                          key={fps}
                          type="button"
                          onClick={() => setFrameRate(fps)}
                          aria-pressed={frameRate === fps}
                          className={`min-h-[40px] flex-1 rounded-[10px] border text-[13px] font-extrabold ${
                            frameRate === fps
                              ? "border-2 border-beevo-yellow bg-beevo-cream text-beevo-ink"
                              : "border-beevo-border bg-white text-beevo-body"
                          }`}
                        >
                          {fps} fps
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="adv-scene-notes"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    Custom Scene Instructions
                  </label>
                  <textarea
                    id="adv-scene-notes"
                    rows={2}
                    value={customSceneInstructions}
                    onChange={(e) => setCustomSceneInstructions(e.target.value)}
                    placeholder="Optional guidance for scene opening hook, chapter beats, or ending callout..."
                    className="mt-1.5 w-full rounded-[12px] border border-beevo-border bg-beevo-canvas p-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Sticky Production Summary Rail */}
        <aside className="lg:col-span-4">
          <div className="rounded-[24px] border border-beevo-border bg-white p-5 shadow-beevo lg:sticky lg:top-[88px]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-beevo-ink">
                Production Summary
              </h2>
              <span className="rounded-full bg-beevo-cream px-2.5 py-0.5 text-[11.5px] font-bold text-beevo-honey-text">
                {frameRate} fps
              </span>
            </div>

            {/* Selected Style Preview Card */}
            <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-beevo-border bg-beevo-canvas p-2.5">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[10px]">
                <Image
                  src={selectedStyle.image}
                  alt={selectedStyle.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-beevo-muted">
                  Art Direction
                </p>
                <p className="truncate font-display text-[14.5px] font-extrabold text-beevo-ink">
                  {selectedStyle.name}
                </p>
                <p className="text-[12px] text-beevo-muted">
                  {aspectRatio} &middot; {resolution} ({dimensions})
                </p>
              </div>
            </div>

            {/* Configuration Checklist */}
            <dl className="mt-4 divide-y divide-beevo-border/75 text-[13px]">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-beevo-muted">Target Duration</dt>
                <dd className="font-extrabold tabular-nums text-beevo-ink">
                  {formatDurationLabel(durationSeconds)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-beevo-muted">Visual Pacing</dt>
                <dd className="font-bold capitalize text-beevo-ink">{visualPacing} (Dynamic)</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-beevo-muted">Characters</dt>
                <dd className="font-bold text-beevo-ink">
                  {characterMode === "automatic" ? "Auto" : "Custom"} &middot;{" "}
                  {characterConsistency ? "Consistent" : "Flexible"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-beevo-muted">Narration</dt>
                <dd className="font-bold text-beevo-ink">
                  {SUPPORTED_ELEVENLABS_LANGUAGES.find((l) => l.code === language)?.label.split(
                    " "
                  )[0] ?? language}{" "}
                  &middot; {narrationSpeed.toFixed(2)}×
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-beevo-muted">Captions &amp; Audio</dt>
                <dd className="font-bold text-beevo-ink">
                  {captionsEnabled ? "Captions On" : "No Captions"} &middot;{" "}
                  {musicEnabled ? musicMood : "No Music"}
                </dd>
              </div>
            </dl>

            {/* Credit Reservation Box */}
            <div className="mt-4 rounded-[16px] border border-beevo-border-warm bg-beevo-cream/85 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-bold text-beevo-body">
                  Estimated Credit Reserve
                </span>
                <span className="font-display text-[22px] font-extrabold tabular-nums text-beevo-ink">
                  {estimatedCredits.toLocaleString()} cr
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-beevo-muted">
                Exact scene count is planned after script &amp; storyboard review. Failed jobs are
                refunded automatically.
              </p>
            </div>

            {submitError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[12.5px] font-semibold text-red-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            {submitNotice && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 space-y-2 rounded-[12px] border border-beevo-border-warm bg-beevo-cream/80 p-3.5 text-[12.5px] leading-relaxed text-beevo-body"
              >
                <p className="font-bold text-beevo-ink">Ready for Phase 4 Pipeline</p>
                <p>{submitNotice}</p>
                <Link
                  href="/app/projects/draft/storyboard"
                  className="inline-flex items-center gap-1 font-bold text-beevo-ink underline decoration-beevo-yellow decoration-2 underline-offset-4"
                >
                  Inspect Storyboard Workspace →
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="beevo-btn-primary mt-5 min-h-[50px] w-full text-[15px]"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Plan Storyboard
            </button>

            <p className="mt-2.5 text-center text-[11.5px] text-beevo-muted">
              Need more credits?{" "}
              <Link
                href="/app/credits"
                className="font-bold text-beevo-ink underline underline-offset-2 hover:text-beevo-honey-text"
              >
                View one-time packs
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}
