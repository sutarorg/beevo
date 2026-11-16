import { describe, expect, it } from "vitest";
import {
  assertFalImageOnlyModel,
  getImageSizeForAspectRatio,
} from "@/lib/fal/client";
import { FAL_IMAGE_MODEL_PRICING } from "@/lib/pricing/provider-registry";

describe("Domain 4: fal.ai Image-Only Policy Guardrails", () => {
  it("allows confirmed fal.ai image-generation models", () => {
    for (const model of Object.keys(FAL_IMAGE_MODEL_PRICING)) {
      expect(() => assertFalImageOnlyModel(model)).not.toThrow();
    }
  });

  it("hard-blocks all fal.ai video generation models", () => {
    const forbiddenVideoModels = [
      "fal-ai/kling-video/v2/master/image-to-video",
      "fal-ai/minimax-video/image-to-video",
      "fal-ai/luma-dream-machine/image-to-video",
      "fal-ai/runway/gen3/text-to-video",
      "fal-ai/veo2",
      "fal-ai/sora-video",
      "fal-ai/wan-i2v",
      "fal-ai/hunyuan-t2v",
    ];
    for (const videoModel of forbiddenVideoModels) {
      expect(() => assertFalImageOnlyModel(videoModel)).toThrow(/POLICY_VIOLATION|Unsupported/i);
    }
  });

  it("resolves aspect ratios to valid image dimensions", () => {
    expect(getImageSizeForAspectRatio("16:9")).toMatchObject({ width: 1280, height: 720 });
    expect(getImageSizeForAspectRatio("9:16")).toMatchObject({ width: 864, height: 1152 });
    expect(getImageSizeForAspectRatio("1:1")).toMatchObject({ width: 1024, height: 1024 });
  });
});
