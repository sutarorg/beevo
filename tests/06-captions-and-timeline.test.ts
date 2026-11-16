import { describe, expect, it } from "vitest";
import type { AlignedSceneTiming, AlignedWord } from "@/features/alignment/engine";
import {
  generateAssSubtitles,
  generateSrtSubtitles,
  resolveUnicodeCaptionFont,
  type CaptionStyleConfig,
} from "@/features/captions/engine";
import {
  buildDynamicTimeline,
  TimelineResourceLimitError,
} from "@/features/timeline/generator";

const SAMPLE_WORDS_EN: AlignedWord[] = [
  { index: 0, text: "Welcome", normalized: "welcome", startSeconds: 0.1, endSeconds: 0.6, charStartIndex: 0, charEndIndex: 6 },
  { index: 1, text: "to", normalized: "to", startSeconds: 0.65, endSeconds: 0.85, charStartIndex: 8, charEndIndex: 9 },
  { index: 2, text: "Beevo!", normalized: "beevo", startSeconds: 0.9, endSeconds: 1.5, charStartIndex: 11, charEndIndex: 16 },
];

const SAMPLE_WORDS_HI: AlignedWord[] = [
  { index: 0, text: "नमस्ते", normalized: "नमस्ते", startSeconds: 0.1, endSeconds: 0.8, charStartIndex: 0, charEndIndex: 5 },
  { index: 1, text: "दोस्तों।", normalized: "दोस्तों", startSeconds: 0.85, endSeconds: 1.6, charStartIndex: 7, charEndIndex: 14 },
];

const BASE_STYLE: CaptionStyleConfig = {
  enabled: true,
  mode: "word_highlight",
  position: "bottom",
  size: "medium",
  font: "Noto Sans",
  color: "#FFFFFF",
  highlightColor: "#F59E0B",
  backgroundColor: "#171717CC",
};

describe("Domain 6: ASS/SRT Caption Engine & Dynamic Timeline Generator", () => {
  it("generates valid ASS karaoke captions and auto-switches to Noto Sans Devanagari for Hindi", () => {
    const enAss = generateAssSubtitles({
      words: SAMPLE_WORDS_EN,
      style: BASE_STYLE,
      videoWidth: 1920,
      videoHeight: 1080,
    });
    expect(enAss.assContent).toContain("[Script Info]");
    expect(enAss.assContent).toContain("PlayResX: 1920");
    expect(enAss.assContent).toContain("\\kf");
    expect(enAss.resolvedFont).toBe("Noto Sans");

    const hiAss = generateAssSubtitles({
      words: SAMPLE_WORDS_HI,
      style: BASE_STYLE,
      videoWidth: 1080,
      videoHeight: 1920,
    });
    expect(hiAss.resolvedFont).toBe("Noto Sans Devanagari");
    expect(hiAss.assContent).toContain("Noto Sans Devanagari");
    expect(resolveUnicodeCaptionFont("Inter", "नमस्ते")).toBe("Noto Sans Devanagari");
  });

  it("generates standard SRT cues cleanly", () => {
    const srt = generateSrtSubtitles(SAMPLE_WORDS_EN);
    expect(srt).toContain("00:00:00,100 --> 00:00:01,500");
    expect(srt).toContain("Welcome to Beevo!");
  });

  it("builds dynamic timelines and enforces resource caps explicitly instead of dropping scenes", () => {
    const alignedScenes: AlignedSceneTiming[] = Array.from({ length: 4 }, (_, i) => ({
      sceneId: `scene-${i + 1}`,
      sceneNumber: i + 1,
      beatIndex: 1,
      totalBeatsForScene: 1,
      narrationText: `Narration segment ${i + 1}`,
      startSeconds: i * 4,
      endSeconds: (i + 1) * 4,
      durationSeconds: 4,
      wordStartIndex: i * 3,
      wordEndIndex: i * 3 + 2,
      transitionWindowSeconds: 0.4,
      transition: "crossfade",
      cameraInstruction: "zoom_in",
      needsAdditionalImage: false,
    }));

    const keyMap = new Map(
      alignedScenes.map((s) => [s.sceneId, `users/u1/projects/p1/scenes/${s.sceneId}.png`])
    );

    const tl = buildDynamicTimeline({
      projectId: "p1",
      version: 1,
      aspectRatio: "16:9",
      resolution: "1080p",
      alignedScenes,
      sceneImageStorageKeys: keyMap,
      narrationStorageKey: "users/u1/projects/p1/audio/narr.mp3",
      totalAudioDurationSeconds: 16,
      cameraPreference: "automatic",
      transitionPreference: "automatic",
      musicStorageKey: "catalog/music/cheerful.mp3",
      musicVolume: 0.16,
      captionStyle: BASE_STYLE,
      captionCues: [],
      assStorageKey: "users/u1/projects/p1/captions/c.ass",
      srtStorageKey: "users/u1/projects/p1/captions/c.srt",
    });

    expect(tl.width).toBe(1920);
    expect(tl.height).toBe(1080);
    expect(tl.dynamicSceneCount).toBe(4);
    expect(tl.segments.length).toBe(4);
    expect(tl.audio.musicDuckingEnabled).toBe(true);

    // Exceeding configured ceiling must throw TimelineResourceLimitError
    expect(() =>
      buildDynamicTimeline({
        projectId: "p1",
        version: 1,
        aspectRatio: "16:9",
        resolution: "1080p",
        alignedScenes,
        sceneImageStorageKeys: keyMap,
        narrationStorageKey: "users/u1/projects/p1/audio/narr.mp3",
        totalAudioDurationSeconds: 16,
        cameraPreference: "automatic",
        transitionPreference: "automatic",
        musicStorageKey: null,
        musicVolume: 0,
        captionStyle: BASE_STYLE,
        captionCues: [],
        assStorageKey: null,
        srtStorageKey: null,
        maxScenesLimit: 3,
      })
    ).toThrow(TimelineResourceLimitError);
  });
});
