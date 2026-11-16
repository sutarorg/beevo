import type { AlignedWord } from "@/features/alignment/engine";

export interface CaptionStyleConfig {
  enabled: boolean;
  mode: "word_highlight" | "sentence" | "off";
  position: "bottom" | "middle" | "top";
  size: "small" | "medium" | "large";
  font: string;
  color: string;
  highlightColor: string;
  backgroundColor: string;
}

export interface CaptionCue {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  words: AlignedWord[];
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const ARABIC_REGEX = /[\u0600-\u06FF]/;
const CJK_REGEX = /[\u3040-\u30FF\u4E00-\u9FFF]/;

/**
 * Resolves a verified Unicode font installed in the Railway FFmpeg Docker image
 * so Hindi/Devanagari, Arabic, CJK, and Latin scripts render without broken glyphs.
 */
export function resolveUnicodeCaptionFont(requestedFont: string, sampleText: string): string {
  if (DEVANAGARI_REGEX.test(sampleText)) return "Noto Sans Devanagari";
  if (ARABIC_REGEX.test(sampleText)) return "Noto Sans Arabic";
  if (CJK_REGEX.test(sampleText)) return "Noto Sans CJK";
  return requestedFont.trim() || "Noto Sans";
}

function hexToAssColor(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const rr = clean.slice(0, 2) || "FF";
  const gg = clean.slice(2, 4) || "FF";
  const bb = clean.slice(4, 6) || "FF";
  // ASS uses &HAABBGGRR (alpha 00 = opaque, FF = transparent)
  const alphaHex =
    clean.length === 8
      ? (255 - Number.parseInt(clean.slice(6, 8), 16)).toString(16).padStart(2, "0").toUpperCase()
      : "00";
  return `&H${alphaHex}${bb.toUpperCase()}${gg.toUpperCase()}${rr.toUpperCase()}`;
}

function formatAssTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const cs = Math.floor((clamped - Math.floor(clamped)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function formatSrtTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.floor((clamped - Math.floor(clamped)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function escapeAssText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "(").replace(/\}/g, ")");
}

/**
 * Groups aligned words into readable caption cues (3–6 words per cue or sentence break).
 */
export function buildCaptionCues(words: AlignedWord[], maxWordsPerCue = 5): CaptionCue[] {
  if (words.length === 0) return [];
  const cues: CaptionCue[] = [];
  let batch: AlignedWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    batch.push(word);

    const endsSentence = /[.!?।]$/.test(word.text);
    const nextPause =
      i + 1 < words.length && words[i + 1].startSeconds - word.endSeconds > 0.45;
    const hitLimit = batch.length >= maxWordsPerCue;

    if (endsSentence || nextPause || hitLimit || i === words.length - 1) {
      cues.push({
        index: cues.length + 1,
        startSeconds: batch[0].startSeconds,
        endSeconds: Math.max(batch[0].startSeconds + 0.25, batch[batch.length - 1].endSeconds),
        text: batch.map((w) => w.text).join(" "),
        words: batch,
      });
      batch = [];
    }
  }

  return cues;
}

/**
 * Generates an Advanced SubStation Alpha (.ass) subtitle document with optional
 * karaoke word highlighting (\kf) and full Unicode font configuration for libass.
 */
export function generateAssSubtitles(params: {
  words: AlignedWord[];
  style: CaptionStyleConfig;
  videoWidth: number;
  videoHeight: number;
}): { assContent: string; cues: CaptionCue[]; resolvedFont: string } {
  const cues = buildCaptionCues(
    params.words,
    params.style.mode === "word_highlight" ? 5 : 8
  );
  const sampleText = params.words.map((w) => w.text).join(" ");
  const resolvedFont = resolveUnicodeCaptionFont(params.style.font, sampleText);

  const baseSize = params.videoHeight >= 1080 ? 54 : 38;
  const fontSize =
    params.style.size === "small"
      ? Math.round(baseSize * 0.8)
      : params.style.size === "large"
        ? Math.round(baseSize * 1.2)
        : baseSize;

  // ASS alignment: 2 = bottom-center, 5 = middle-center, 8 = top-center
  const alignment =
    params.style.position === "top" ? 8 : params.style.position === "middle" ? 5 : 2;
  const marginV = Math.round(params.videoHeight * 0.075);

  const primaryColour = hexToAssColor(params.style.highlightColor);
  const secondaryColour = hexToAssColor(params.style.color);
  const backColour = hexToAssColor(params.style.backgroundColor);

  const lines: string[] = [
    "[Script Info]",
    "Title: Beevo Synchronized Captions",
    "ScriptType: v4.00+",
    `PlayResX: ${params.videoWidth}`,
    `PlayResY: ${params.videoHeight}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: BeevoDefault,${resolvedFont},${fontSize},${primaryColour},${secondaryColour},&H00171717,${backColour},-1,0,0,0,100,100,0,0,3,3,0,${alignment},48,48,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  for (const cue of cues) {
    const startStr = formatAssTime(cue.startSeconds);
    const endStr = formatAssTime(cue.endSeconds);
    let dialogueText: string;

    if (params.style.mode === "word_highlight") {
      dialogueText = cue.words
        .map((w) => {
          const centis = Math.max(5, Math.round((w.endSeconds - w.startSeconds) * 100));
          return `{\\kf${centis}}${escapeAssText(w.text)}`;
        })
        .join(" ");
    } else {
      dialogueText = escapeAssText(cue.text);
    }

    lines.push(`Dialogue: 0,${startStr},${endStr},BeevoDefault,,0,0,0,,${dialogueText}`);
  }

  return {
    assContent: `${lines.join("\n")}\n`,
    cues,
    resolvedFont,
  };
}

/**
 * Generates standard SubRip (.srt) captions for external accessibility downloads.
 */
export function generateSrtSubtitles(words: AlignedWord[]): string {
  const cues = buildCaptionCues(words, 7);
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${formatSrtTime(cue.startSeconds)} --> ${formatSrtTime(cue.endSeconds)}\n${cue.text}\n`
    )
    .join("\n");
}
