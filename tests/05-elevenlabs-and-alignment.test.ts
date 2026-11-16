import { describe, expect, it } from "vitest";
import {
  alignNarrationToScenes,
  buildWordTimingsFromCharacters,
} from "@/features/alignment/engine";
import {
  mergeRebasedAlignments,
  splitScriptIntoSpeechChunks,
  type ElevenLabsCharacterAlignment,
} from "@/lib/elevenlabs/client";

function buildSyntheticAlignment(
  text: string,
  secondsPerChar = 0.06,
  pauseAfterSentence = 0.3
): ElevenLabsCharacterAlignment {
  const characters: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let t = 0.1;

  for (const ch of text) {
    characters.push(ch);
    starts.push(Number(t.toFixed(4)));
    t += ch === " " ? secondsPerChar * 0.5 : secondsPerChar;
    ends.push(Number(t.toFixed(4)));
    if (/[.!?।]/.test(ch)) {
      t += pauseAfterSentence;
    }
  }

  return {
    characters,
    character_start_times_seconds: starts,
    character_end_times_seconds: ends,
  };
}

describe("Domain 5: ElevenLabs Chunking, Timestamp Rebasing & Custom Alignment Engine", () => {
  it("splits long scripts strictly on sentence boundaries without dropping words", () => {
    const sentences = Array.from(
      { length: 25 },
      (_, i) => `Sentence number ${i + 1} teaches kids a cool science fact about sunshine.`
    );
    const full = sentences.join(" ");
    const chunks = splitScriptIntoSpeechChunks(full, "eleven_multilingual_v2", 250);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.length <= 250)).toBe(true);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(full.replace(/\s+/g, " "));
  });

  it("splits Hindi Devanagari sentences cleanly on purna viram (।)", () => {
    const hindi =
      "नमस्ते दोस्तों। आज हम एक अद्भुत कहानी सुनेंगे। एक छोटा सा मधुमक्खी बगीचे में उड़ता था। वह हर फूल से पराग इकट्ठा करता था।";
    const chunks = splitScriptIntoSpeechChunks(hindi, "eleven_multilingual_v2", 65);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.join(" ")).toContain("नमस्ते दोस्तों।");
    expect(chunks.join(" ")).toContain("इकट्ठा करता था।");
  });

  it("rebases multi-chunk ElevenLabs timestamps monotonically", () => {
    const c1 = buildSyntheticAlignment("Hello world.");
    const c2 = buildSyntheticAlignment("Next sentence.");
    const d1 = c1.character_end_times_seconds.at(-1)! + 0.1;
    const d2 = c2.character_end_times_seconds.at(-1)! + 0.1;

    const merged = mergeRebasedAlignments([
      { alignment: c1, durationSeconds: d1 },
      { alignment: c2, durationSeconds: d2 },
    ]);

    expect(merged.characters.length).toBe(c1.characters.length + 1 + c2.characters.length);
    const secondChunkFirstCharIdx = c1.characters.length + 1;
    expect(merged.character_start_times_seconds[secondChunkFirstCharIdx]).toBeGreaterThanOrEqual(d1);
  });

  it("aligns repeated-phrase English scenes monotonically without naive substring mismatch", () => {
    const s1 = "Milo looked up. Look at that flower!";
    const s2 = "Milo looked up again. Look at that flower glowing in sunlight!";
    const s3 = "Finally Milo flew home happily.";
    const full = `${s1} ${s2} ${s3}`;
    const alignment = buildSyntheticAlignment(full, 0.055, 0.25);
    const totalDur = alignment.character_end_times_seconds.at(-1)! + 0.2;

    const out = alignNarrationToScenes({
      alignment,
      scenes: [
        { sceneId: "sc1", sceneNumber: 1, narrationText: s1 },
        { sceneId: "sc2", sceneNumber: 2, narrationText: s2 },
        { sceneId: "sc3", sceneNumber: 3, narrationText: s3 },
      ],
      actualAudioDurationSeconds: totalDur,
      visualPacing: "balanced",
    });

    expect(out.validation.valid).toBe(true);
    expect(out.sceneTimings.length).toBeGreaterThanOrEqual(3);
    expect(out.sceneTimings[0].startSeconds).toBe(0);
    expect(out.sceneTimings.at(-1)!.endSeconds).toBeCloseTo(totalDur, 1);
    for (let i = 1; i < out.sceneTimings.length; i++) {
      expect(out.sceneTimings[i].startSeconds).toBeCloseTo(
        out.sceneTimings[i - 1].endSeconds,
        2
      );
    }
  });

  it("aligns Hindi Devanagari narration accurately and splits overlong dynamic-pacing beats", () => {
    const longHindi =
      "एक सुंदर सुबह थी जब नन्हा कछुआ नदी के किनारे टहल रहा था और उसने रंग बिरंगी मछलियों को पानी में तैरते हुए देखा। वह बहुत खुश हुआ और उसने सभी दोस्तों को बुलाया।";
    const alignment = buildSyntheticAlignment(longHindi, 0.11, 0.3);
    const totalDur = alignment.character_end_times_seconds.at(-1)! + 0.3;

    const words = buildWordTimingsFromCharacters(alignment);
    expect(words[0].text).toBe("एक");
    expect(words.length).toBeGreaterThan(20);

    const dynamicOut = alignNarrationToScenes({
      alignment,
      scenes: [{ sceneId: "hi1", sceneNumber: 1, narrationText: longHindi }],
      actualAudioDurationSeconds: totalDur,
      visualPacing: "dynamic",
    });

    expect(dynamicOut.validation.valid).toBe(true);
    expect(dynamicOut.sceneTimings.length).toBeGreaterThan(1);
    expect(dynamicOut.recommendedExtraBeats).toBeGreaterThan(0);
  });
});
