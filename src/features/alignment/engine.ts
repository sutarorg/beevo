import type { ElevenLabsCharacterAlignment } from "@/lib/elevenlabs/client";

export interface AlignedWord {
  index: number;
  text: string;
  normalized: string;
  startSeconds: number;
  endSeconds: number;
  charStartIndex: number;
  charEndIndex: number;
}

export interface AlignedSentence {
  index: number;
  text: string;
  wordStartIndex: number;
  wordEndIndex: number;
  startSeconds: number;
  endSeconds: number;
}

export interface AlignmentSceneInput {
  sceneId: string;
  sceneNumber: number;
  narrationText: string;
  transition?: string;
  cameraInstruction?: string;
}

export interface AlignedSceneTiming {
  sceneId: string;
  sceneNumber: number;
  beatIndex: number;
  totalBeatsForScene: number;
  narrationText: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  wordStartIndex: number;
  wordEndIndex: number;
  transitionWindowSeconds: number;
  transition: string;
  cameraInstruction: string;
  needsAdditionalImage: boolean;
}

export interface AlignmentEngineOutput {
  words: AlignedWord[];
  sentences: AlignedSentence[];
  sceneTimings: AlignedSceneTiming[];
  totalAudioDurationSeconds: number;
  recommendedExtraBeats: number;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

/**
 * Normalizes a single word token across Latin, Devanagari, and Unicode scripts
 * without destroying non-ASCII letters/combining marks.
 */
export function normalizeToken(raw: string): string {
  return raw
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, "")
    .trim();
}

/**
 * Step 1–3: Converts character-level ElevenLabs timestamps into exact word timings,
 * preserving original character indices and punctuation cleanly.
 */
export function buildWordTimingsFromCharacters(
  alignment: ElevenLabsCharacterAlignment
): AlignedWord[] {
  const words: AlignedWord[] = [];
  const len = Math.min(
    alignment.characters.length,
    alignment.character_start_times_seconds.length,
    alignment.character_end_times_seconds.length
  );

  let buf = "";
  let charStart = -1;
  let startSec = 0;
  let endSec = 0;

  const flush = (charEnd: number) => {
    const trimmed = buf.trim();
    if (!trimmed) {
      buf = "";
      charStart = -1;
      return;
    }
    const normalized = normalizeToken(trimmed);
    words.push({
      index: words.length,
      text: trimmed,
      normalized: normalized || trimmed.toLowerCase(),
      startSeconds: Number(Math.max(0, startSec).toFixed(4)),
      endSeconds: Number(Math.max(startSec, endSec).toFixed(4)),
      charStartIndex: charStart,
      charEndIndex: charEnd,
    });
    buf = "";
    charStart = -1;
  };

  for (let i = 0; i < len; i++) {
    const ch = alignment.characters[i];
    const s = alignment.character_start_times_seconds[i];
    const e = alignment.character_end_times_seconds[i];

    if (/\s/.test(ch)) {
      if (buf.length > 0) flush(i - 1);
      continue;
    }

    if (charStart === -1) {
      charStart = i;
      startSec = s;
    }
    buf += ch;
    endSec = Math.max(endSec, e);
  }

  if (buf.length > 0) {
    flush(len - 1);
  }

  return words;
}

/**
 * Step 4: Groups aligned words into sentence spans preserving natural silences.
 */
export function groupWordsIntoSentences(words: AlignedWord[]): AlignedSentence[] {
  if (words.length === 0) return [];
  const sentences: AlignedSentence[] = [];
  let startIdx = 0;

  for (let i = 0; i < words.length; i++) {
    const isTerminal = /[.!?।]$/.test(words[i].text) || i === words.length - 1;
    if (isTerminal) {
      const slice = words.slice(startIdx, i + 1);
      sentences.push({
        index: sentences.length,
        text: slice.map((w) => w.text).join(" "),
        wordStartIndex: startIdx,
        wordEndIndex: i,
        startSeconds: slice[0].startSeconds,
        endSeconds: slice[slice.length - 1].endSeconds,
      });
      startIdx = i + 1;
    }
  }
  return sentences;
}

function tokenizeText(text: string): string[] {
  return text
    .normalize("NFC")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
}

/**
 * Step 5: Monotonic token-anchored alignment of storyboard scenes onto aligned narration words.
 * Handles repeated phrases, slight punctuation differences, and normalization shifts reliably —
 * NEVER uses naive global substring indexOf().
 */
function alignScenesMonotonically(
  scenes: AlignmentSceneInput[],
  words: AlignedWord[]
): { scene: AlignmentSceneInput; wordStart: number; wordEnd: number }[] {
  if (scenes.length === 0 || words.length === 0) return [];

  const sceneTokens = scenes.map((s) => tokenizeText(s.narrationText));
  const totalExpectedTokens = Math.max(
    1,
    sceneTokens.reduce((sum, list) => sum + Math.max(1, list.length), 0)
  );

  const ranges: { scene: AlignmentSceneInput; wordStart: number; wordEnd: number }[] = [];
  let cursor = 0;

  for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
    const tokens = sceneTokens[sIdx];
    const remainingScenes = scenes.length - sIdx;
    const isLast = sIdx === scenes.length - 1;

    if (isLast) {
      const start = Math.min(cursor, words.length - 1);
      ranges.push({ scene: scenes[sIdx], wordStart: start, wordEnd: words.length - 1 });
      break;
    }

    const expectedLen = Math.max(
      1,
      Math.round((Math.max(1, tokens.length) / totalExpectedTokens) * words.length)
    );
    const maxAllowedEnd = Math.max(cursor, words.length - remainingScenes);
    const approxEnd = Math.min(maxAllowedEnd, cursor + expectedLen - 1);

    // Refine boundary around approxEnd by matching tail tokens of current scene AND head tokens of next scene
    const tailAnchor = tokens.slice(-2);
    const nextHeadAnchor = sceneTokens[sIdx + 1]?.slice(0, 2) ?? [];
    const searchRadius = Math.max(4, Math.ceil(expectedLen * 0.45));
    const searchLo = Math.max(cursor, approxEnd - searchRadius);
    const searchHi = Math.min(maxAllowedEnd, approxEnd + searchRadius);

    let bestEnd = approxEnd;
    let bestScore = -1e9;

    for (let cand = searchLo; cand <= searchHi; cand++) {
      let score = -Math.abs(cand - approxEnd) * 0.25;

      // Tail match score
      if (tailAnchor.length > 0 && words[cand]?.normalized === tailAnchor[tailAnchor.length - 1]) {
        score += 4;
        if (
          tailAnchor.length > 1 &&
          cand > cursor &&
          words[cand - 1]?.normalized === tailAnchor[tailAnchor.length - 2]
        ) {
          score += 3;
        }
      }
      // Next scene head match score
      if (
        nextHeadAnchor.length > 0 &&
        cand + 1 < words.length &&
        words[cand + 1]?.normalized === nextHeadAnchor[0]
      ) {
        score += 4;
        if (
          nextHeadAnchor.length > 1 &&
          cand + 2 < words.length &&
          words[cand + 2]?.normalized === nextHeadAnchor[1]
        ) {
          score += 3;
        }
      }
      // Bonus for ending right on sentence punctuation
      if (/[.!?।]$/.test(words[cand]?.text ?? "")) {
        score += 1.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestEnd = cand;
      }
    }

    ranges.push({ scene: scenes[sIdx], wordStart: cursor, wordEnd: bestEnd });
    cursor = Math.min(words.length - 1, bestEnd + 1);
  }

  return ranges;
}

const PACING_MAX_VISUAL_HOLD_SECONDS: Record<"calm" | "balanced" | "dynamic", number> = {
  calm: 14,
  balanced: 9.5,
  dynamic: 6,
};

/**
 * Full Beevo Audio Alignment Engine:
 * Converts character timestamps -> words -> sentences -> dynamic scene intervals,
 * respects silences without cutting off speech, and splits visually overlong scenes
 * into additional visual beats according to Calm / Balanced / Dynamic pacing.
 */
export function alignNarrationToScenes(params: {
  alignment: ElevenLabsCharacterAlignment;
  scenes: AlignmentSceneInput[];
  actualAudioDurationSeconds: number;
  visualPacing: "calm" | "balanced" | "dynamic";
  defaultTransition?: string;
}): AlignmentEngineOutput {
  const words = buildWordTimingsFromCharacters(params.alignment);
  const sentences = groupWordsIntoSentences(words);
  const totalAudioDurationSeconds = Number(
    Math.max(
      params.actualAudioDurationSeconds,
      words.length > 0 ? words[words.length - 1].endSeconds : 0
    ).toFixed(3)
  );

  const rawRanges = alignScenesMonotonically(params.scenes, words);
  const maxHold = PACING_MAX_VISUAL_HOLD_SECONDS[params.visualPacing];
  const sceneTimings: AlignedSceneTiming[] = [];
  let recommendedExtraBeats = 0;

  for (let i = 0; i < rawRanges.length; i++) {
    const current = rawRanges[i];
    const next = rawRanges[i + 1];

    // Preserve natural pauses: extend scene end halfway into inter-scene silence
    // and let the very first scene start at 0s and final scene hold until audio finishes.
    const startSec =
      i === 0
        ? 0
        : sceneTimings.length > 0
          ? sceneTimings[sceneTimings.length - 1].endSeconds
          : words[current.wordStart].startSeconds;

    let endSec: number;
    if (!next) {
      endSec = totalAudioDurationSeconds;
    } else {
      const currentSpeechEnd = words[current.wordEnd].endSeconds;
      const nextSpeechStart = words[next.wordStart].startSeconds;
      const gap = Math.max(0, nextSpeechStart - currentSpeechEnd);
      endSec = Number((currentSpeechEnd + gap * 0.5).toFixed(3));
    }

    const totalSceneDuration = Math.max(0.5, Number((endSec - startSec).toFixed(3)));
    const transitionName = current.scene.transition || params.defaultTransition || "crossfade";
    const cameraName = current.scene.cameraInstruction || "zoom_in";

    // Dynamic beat splitting when a single narration segment runs longer than visual pacing threshold
    const beatCount =
      totalSceneDuration > maxHold * 1.15
        ? Math.max(2, Math.ceil(totalSceneDuration / maxHold))
        : 1;

    if (beatCount === 1) {
      const transitionWindow =
        transitionName === "cut" ? 0 : Math.min(0.45, Number((totalSceneDuration * 0.15).toFixed(3)));
      sceneTimings.push({
        sceneId: current.scene.sceneId,
        sceneNumber: current.scene.sceneNumber,
        beatIndex: 1,
        totalBeatsForScene: 1,
        narrationText: current.scene.narrationText,
        startSeconds: Number(startSec.toFixed(3)),
        endSeconds: Number(endSec.toFixed(3)),
        durationSeconds: totalSceneDuration,
        wordStartIndex: current.wordStart,
        wordEndIndex: current.wordEnd,
        transitionWindowSeconds: transitionWindow,
        transition: transitionName,
        cameraInstruction: cameraName,
        needsAdditionalImage: false,
      });
    } else {
      recommendedExtraBeats += beatCount - 1;
      const wordSpan = Math.max(1, current.wordEnd - current.wordStart + 1);
      let beatStart = startSec;

      for (let b = 0; b < beatCount; b++) {
        const wStart = current.wordStart + Math.floor((b * wordSpan) / beatCount);
        const wEnd =
          b === beatCount - 1
            ? current.wordEnd
            : Math.max(wStart, current.wordStart + Math.floor(((b + 1) * wordSpan) / beatCount) - 1);

        const beatEnd =
          b === beatCount - 1
            ? endSec
            : Number(
                Math.min(
                  endSec - 0.4,
                  Math.max(beatStart + 0.5, words[wEnd]?.endSeconds ?? beatStart + totalSceneDuration / beatCount)
                ).toFixed(3)
              );
        const beatDuration = Math.max(0.5, Number((beatEnd - beatStart).toFixed(3)));
        const transitionWindow =
          transitionName === "cut" ? 0 : Math.min(0.4, Number((beatDuration * 0.15).toFixed(3)));

        sceneTimings.push({
          sceneId: current.scene.sceneId,
          sceneNumber: current.scene.sceneNumber,
          beatIndex: b + 1,
          totalBeatsForScene: beatCount,
          narrationText: words.slice(wStart, wEnd + 1).map((w) => w.text).join(" "),
          startSeconds: Number(beatStart.toFixed(3)),
          endSeconds: Number(beatEnd.toFixed(3)),
          durationSeconds: beatDuration,
          wordStartIndex: wStart,
          wordEndIndex: wEnd,
          transitionWindowSeconds: transitionWindow,
          transition: transitionName,
          cameraInstruction: cameraName,
          needsAdditionalImage: b > 0,
        });
        beatStart = beatEnd;
      }
    }
  }

  // Timeline integrity validation
  const errors: string[] = [];
  if (words.length === 0) errors.push("No aligned narration words extracted.");
  if (sceneTimings.length === 0) errors.push("No aligned scene timings produced.");
  for (let i = 0; i < sceneTimings.length; i++) {
    const seg = sceneTimings[i];
    if (seg.endSeconds <= seg.startSeconds) {
      errors.push(`Scene timing #${i + 1} has non-positive duration.`);
    }
    if (i > 0 && Math.abs(seg.startSeconds - sceneTimings[i - 1].endSeconds) > 0.05) {
      errors.push(`Gap or overlap detected between segment #${i} and #${i + 1}.`);
    }
  }
  if (
    sceneTimings.length > 0 &&
    Math.abs(sceneTimings[sceneTimings.length - 1].endSeconds - totalAudioDurationSeconds) > 0.15
  ) {
    errors.push("Final visual timeline end does not match audio duration.");
  }

  return {
    words,
    sentences,
    sceneTimings,
    totalAudioDurationSeconds,
    recommendedExtraBeats,
    validation: {
      valid: errors.length === 0,
      errors,
    },
  };
}
