import { describe, expect, it } from "vitest";
import {
  validateDynamicStoryboard,
  type DynamicStoryboardPayload,
} from "@/features/story-engine/service";

function makeValidStoryboard(sceneCount: number): DynamicStoryboardPayload {
  const scenes = Array.from({ length: sceneCount }, (_, i) => ({
    sceneId: `scene_${i + 1}`,
    sceneOrder: i + 1,
    narrationText: `Beat number ${i + 1} explains how bees pollinate bright garden flowers every morning.`,
    narrativePurpose: `Illustrate beat ${i + 1}`,
    imagePrompt: `Warm hand-drawn 2D cartoon illustration of Milo the friendly honeybee flying near marigold flower #${i + 1}`,
    characterReferences: ["char_milo"],
    location: "Sunny Meadow",
    composition: "Medium wide shot",
    characterPose: "Hovering with tiny backpack",
    characterExpression: "Cheerful curiosity",
    lighting: "Golden morning sunlight",
    cameraInstruction: i % 2 === 0 ? "zoom_in" : "pan_right",
    captionKeywords: ["bees", "flowers"],
    transitionInstruction: "crossfade",
  }));

  return {
    visualStyleBible: {
      colorPalette: "Warm marigold yellow, meadow green, cream sky",
      artDirection: "Storybook 2D cartoon cel-shaded illustration",
      characterAppearanceRules: "Round expressive eyes, yellow-and-charcoal stripes",
      backgroundStyle: "Soft painterly watercolor meadows",
      lightingStyle: "Warm golden hour rim light",
      characterProportions: "Chibi friendly storybook 1:3 head-to-body ratio",
      cameraLanguage: "Smooth storybook pans and gentle push-ins",
      consistencyRules: "Keep Milo wearing the blue leaf satchel in all scenes",
    },
    characters: [
      {
        characterCode: "char_milo",
        characterName: "Milo the Bee",
        characterDescription: "Curious young honeybee guide",
        visualIdentity: "Chubby golden bee with round glasses and blue leaf satchel",
        appearanceInstructions: "Maintain blue leaf satchel strap across chest",
      },
    ],
    scenes,
  };
}

describe("Domain 3: Story Engine & Dynamic Storyboard Validation", () => {
  it("supports arbitrary dynamic scene counts without fixed scene limits", () => {
    const sb5 = makeValidStoryboard(5);
    const script5 = sb5.scenes.map((s) => s.narrationText).join(" ");
    const res5 = validateDynamicStoryboard({ approvedScript: script5, storyboard: sb5 });
    expect(res5.valid).toBe(true);
    expect(res5.sceneCount).toBe(5);
    expect(res5.coverageRatio).toBe(1);

    const sb23 = makeValidStoryboard(23);
    const script23 = sb23.scenes.map((s) => s.narrationText).join(" ");
    const res23 = validateDynamicStoryboard({ approvedScript: script23, storyboard: sb23 });
    expect(res23.valid).toBe(true);
    expect(res23.sceneCount).toBe(23);
  });

  it("rejects storyboards that drop significant narration coverage", () => {
    const sb = makeValidStoryboard(2);
    const muchLongerScript = `${sb.scenes.map((s) => s.narrationText).join(" ")} `.repeat(4);
    const res = validateDynamicStoryboard({ approvedScript: muchLongerScript, storyboard: sb });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("covers only"))).toBe(true);
  });

  it("rejects storyboards exceeding configured safety ceiling without silently dropping scenes", () => {
    const sb = makeValidStoryboard(15);
    const script = sb.scenes.map((s) => s.narrationText).join(" ");
    const res = validateDynamicStoryboard({
      approvedScript: script,
      storyboard: sb,
      maxScenes: 10,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("exceeding max limit"))).toBe(true);
  });
});
