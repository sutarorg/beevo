import crypto from "node:crypto";
import sharp from "sharp";
import { requireEnv } from "@/lib/env";
import { estimateFalImageCost } from "@/lib/pricing/provider-registry";

/**
 * fal.ai Image-Generation-Only Integration (NO video API).
 * Verified Nov 2026 endpoints:
 *  - Text-to-image: blackforestlabs/flux-3/klein/text-to-image
 *  - Multi-reference character editing: blackforestlabs/flux-3/klein/edit-image (up to 10 refs)
 */

const FAL_QUEUE_BASE = "https://queue.fal.run";

const ALLOWED_FAL_IMAGE_MODELS = new Set([
  "blackforestlabs/flux-3/klein/text-to-image",
  "blackforestlabs/flux-3/klein/edit-image",
  "blackforestlabs/flux-3/text-to-image",
  "blackforestlabs/flux-3/edit-image",
  "fal-ai/flux-2-pro",
  "fal-ai/flux-pro/kontext",
]);

export function assertFalImageOnlyModel(modelId: string): string {
  const lowered = modelId.toLowerCase();
  if (lowered.includes("video") || lowered.includes("kling-video") || lowered.includes("veo")) {
    throw new Error(`POLICY_VIOLATION: fal.ai video model "${modelId}" is prohibited in Beevo.`);
  }
  if (!ALLOWED_FAL_IMAGE_MODELS.has(modelId)) {
    throw new Error(`Unsupported or unapproved fal.ai image model: "${modelId}".`);
  }
  return modelId;
}

export function getImageSizeForAspectRatio(
  aspectRatio: "16:9" | "9:16" | "1:1"
): { width: number; height: number; imageSizeEnum: string } {
  if (aspectRatio === "9:16") {
    return { width: 864, height: 1152, imageSizeEnum: "portrait_16_9" };
  }
  if (aspectRatio === "1:1") {
    return { width: 1024, height: 1024, imageSizeEnum: "square_hd" };
  }
  return { width: 1280, height: 720, imageSizeEnum: "landscape_16_9" };
}

export interface FalSubmitResult {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
  modelId: string;
}

export interface FalImageResult {
  requestId: string;
  modelId: string;
  imageUrl: string;
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  costUsd: number;
  costInr: number;
  costSource: "actual" | "estimated";
}

export async function submitFalImageJob(params: {
  modelId?: string;
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  referenceImageUrls?: string[];
  webhookUrl?: string;
  seed?: number;
}): Promise<FalSubmitResult> {
  const falKey = requireEnv("FAL_KEY", "fal.ai");
  const hasRefs = Boolean(params.referenceImageUrls && params.referenceImageUrls.length > 0);
  const chosenModel = assertFalImageOnlyModel(
    params.modelId ??
      (hasRefs
        ? process.env.FAL_EDIT_MODEL?.trim() || "blackforestlabs/flux-3/klein/edit-image"
        : process.env.FAL_IMAGE_MODEL?.trim() || "blackforestlabs/flux-3/klein/text-to-image")
  );

  const dims = getImageSizeForAspectRatio(params.aspectRatio);
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    image_size: { width: dims.width, height: dims.height },
    num_images: 1,
    output_format: "png",
    enable_safety_checker: true,
    ...(typeof params.seed === "number" ? { seed: params.seed } : {}),
  };

  if (hasRefs && params.referenceImageUrls) {
    body.image_urls = params.referenceImageUrls.slice(0, 10);
  }

  const endpointUrl = new URL(`${FAL_QUEUE_BASE}/${chosenModel}`);
  if (params.webhookUrl) {
    endpointUrl.searchParams.set("fal_webhook", params.webhookUrl);
  }

  const res = await fetch(endpointUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal.ai queue submit failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    request_id?: string;
    status_url?: string;
    response_url?: string;
  };
  if (!json.request_id || !json.status_url || !json.response_url) {
    throw new Error("fal.ai queue response missing request_id / status_url / response_url.");
  }

  return {
    requestId: json.request_id,
    statusUrl: json.status_url,
    responseUrl: json.response_url,
    modelId: chosenModel,
  };
}

/**
 * Validates downloaded image bytes using Sharp: verifies non-empty payload,
 * valid raster image format (png/jpeg/webp), minimum dimensions, and expected aspect ratio.
 */
export async function validateGeneratedImageBuffer(
  buffer: Buffer,
  expectedAspectRatio: "16:9" | "9:16" | "1:1"
): Promise<{ width: number; height: number; format: string; sizeBytes: number }> {
  if (!buffer || buffer.length < 1024) {
    throw new Error("Generated image buffer is empty or corrupted (< 1 KB).");
  }

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height || !meta.format) {
    throw new Error("Generated image metadata could not be decoded by Sharp.");
  }
  if (!["png", "jpeg", "webp"].includes(meta.format)) {
    throw new Error(`Unexpected image format "${meta.format}".`);
  }
  if (meta.width < 512 || meta.height < 512) {
    throw new Error(`Generated image resolution too low (${meta.width}x${meta.height}).`);
  }

  const actualRatio = meta.width / meta.height;
  const targetRatio =
    expectedAspectRatio === "16:9" ? 16 / 9 : expectedAspectRatio === "9:16" ? 9 / 16 : 1;
  const relativeDiff = Math.abs(actualRatio - targetRatio) / targetRatio;
  if (relativeDiff > 0.38) {
    throw new Error(
      `Generated image aspect ratio ${actualRatio.toFixed(2)} deviates significantly from expected ${expectedAspectRatio}.`
    );
  }

  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    sizeBytes: buffer.length,
  };
}

export async function pollAndFetchFalImage(params: {
  submitted: FalSubmitResult;
  expectedAspectRatio: "16:9" | "9:16" | "1:1";
  timeoutMs?: number;
  pollIntervalMs?: number;
}): Promise<FalImageResult> {
  const falKey = requireEnv("FAL_KEY", "fal.ai");
  const timeoutMs = params.timeoutMs ?? 120_000;
  const pollIntervalMs = params.pollIntervalMs ?? 1_500;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const statusRes = await fetch(params.submitted.statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    });
    if (!statusRes.ok) {
      throw new Error(`fal.ai status poll failed (${statusRes.status}).`);
    }
    const statusJson = (await statusRes.json()) as { status?: string; error?: string };

    if (statusJson.status === "COMPLETED") {
      const resultRes = await fetch(params.submitted.responseUrl, {
        headers: { Authorization: `Key ${falKey}` },
      });
      if (!resultRes.ok) {
        throw new Error(`fal.ai result fetch failed (${resultRes.status}).`);
      }
      const resultJson = (await resultRes.json()) as {
        images?: { url: string; width?: number; height?: number }[];
        image?: { url: string };
      };

      const imageUrl = resultJson.images?.[0]?.url ?? resultJson.image?.url;
      if (!imageUrl) {
        throw new Error("fal.ai completed response contained no image URL.");
      }

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        throw new Error(`Failed downloading generated image from fal.ai (${imgRes.status}).`);
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const validated = await validateGeneratedImageBuffer(buffer, params.expectedAspectRatio);
      const cost = estimateFalImageCost(params.submitted.modelId, validated.width, validated.height);

      return {
        requestId: params.submitted.requestId,
        modelId: params.submitted.modelId,
        imageUrl,
        buffer,
        width: validated.width,
        height: validated.height,
        format: validated.format,
        sizeBytes: validated.sizeBytes,
        costUsd: cost.costUsd,
        costInr: cost.costInr,
        costSource: cost.costSource,
      };
    }

    if (statusJson.status === "FAILED") {
      throw new Error(`fal.ai generation failed: ${statusJson.error ?? "unknown error"}`);
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`fal.ai generation timed out after ${timeoutMs}ms.`);
}

export function verifyFalWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const cleanHeader = signatureHeader.replace(/^sha256=/i, "").trim();
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(cleanHeader, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}
