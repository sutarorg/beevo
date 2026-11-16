import { getNumericEnv } from "@/lib/env";

/**
 * Centralized, configurable AI & infrastructure model/pricing registry.
 * Verified November 2026 baseline rates (documented in docs/research/04-provider-pricing.md).
 * NEVER hardcode provider prices inside route handlers or worker stages—always resolve here.
 */

export interface OpenAiModelPrice {
  modelId: string;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
}

export interface FalModelPrice {
  modelId: string;
  usdPer1kImage: number;
  usdPer2kImage: number;
  supportsMultiReference: boolean;
  maxReferences: number;
}

export interface ElevenLabsModelPrice {
  modelId: string;
  usdPer1kChars: number;
  maxCharsPerRequest: number;
  supportedLanguagesCount: number;
}

export const OPENAI_MODEL_PRICING: Record<string, OpenAiModelPrice> = {
  "gpt-4o-mini": { modelId: "gpt-4o-mini", inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  "gpt-4o": { modelId: "gpt-4o", inputUsdPer1M: 2.5, outputUsdPer1M: 10.0 },
  "gpt-5": { modelId: "gpt-5", inputUsdPer1M: 2.5, outputUsdPer1M: 10.0 },
  "gpt-5-mini": { modelId: "gpt-5-mini", inputUsdPer1M: 0.25, outputUsdPer1M: 2.0 },
};

export const FAL_IMAGE_MODEL_PRICING: Record<string, FalModelPrice> = {
  "blackforestlabs/flux-3/klein/text-to-image": {
    modelId: "blackforestlabs/flux-3/klein/text-to-image",
    usdPer1kImage: 0.009,
    usdPer2kImage: 0.014,
    supportsMultiReference: false,
    maxReferences: 0,
  },
  "blackforestlabs/flux-3/klein/edit-image": {
    modelId: "blackforestlabs/flux-3/klein/edit-image",
    usdPer1kImage: 0.009,
    usdPer2kImage: 0.014,
    supportsMultiReference: true,
    maxReferences: 10,
  },
  "blackforestlabs/flux-3/text-to-image": {
    modelId: "blackforestlabs/flux-3/text-to-image",
    usdPer1kImage: 0.048,
    usdPer2kImage: 0.048,
    supportsMultiReference: false,
    maxReferences: 0,
  },
  "blackforestlabs/flux-3/edit-image": {
    modelId: "blackforestlabs/flux-3/edit-image",
    usdPer1kImage: 0.048,
    usdPer2kImage: 0.048,
    supportsMultiReference: true,
    maxReferences: 10,
  },
  "fal-ai/flux-2-pro": {
    modelId: "fal-ai/flux-2-pro",
    usdPer1kImage: 0.03,
    usdPer2kImage: 0.045,
    supportsMultiReference: false,
    maxReferences: 0,
  },
  "fal-ai/flux-pro/kontext": {
    modelId: "fal-ai/flux-pro/kontext",
    usdPer1kImage: 0.04,
    usdPer2kImage: 0.04,
    supportsMultiReference: true,
    maxReferences: 1,
  },
};

export const ELEVENLABS_MODEL_PRICING: Record<string, ElevenLabsModelPrice> = {
  eleven_multilingual_v2: {
    modelId: "eleven_multilingual_v2",
    usdPer1kChars: 0.08,
    maxCharsPerRequest: 10_000,
    supportedLanguagesCount: 29,
  },
  eleven_v4: {
    modelId: "eleven_v4",
    usdPer1kChars: 0.08,
    maxCharsPerRequest: 10_000,
    supportedLanguagesCount: 90,
  },
  eleven_v4_turbo: {
    modelId: "eleven_v4_turbo",
    usdPer1kChars: 0.04,
    maxCharsPerRequest: 10_000,
    supportedLanguagesCount: 90,
  },
  eleven_flash_v2_5: {
    modelId: "eleven_flash_v2_5",
    usdPer1kChars: 0.04,
    maxCharsPerRequest: 40_000,
    supportedLanguagesCount: 32,
  },
  eleven_v3: {
    modelId: "eleven_v3",
    usdPer1kChars: 0.08,
    maxCharsPerRequest: 5_000,
    supportedLanguagesCount: 70,
  },
};

export const INFRASTRUCTURE_PRICING = {
  r2StorageUsdPerGbMonth: 0.015,
  r2ClassAUsdPerMillion: 4.5,
  r2ClassBUsdPerMillion: 0.36,
  railwayVcpuUsdPerMin: 0.000463,
  railwayRamGbUsdPerMin: 0.000231,
  razorpayEstimatedFeePct: 2.36, // 2% + 18% GST on fee fallback when webhook fee absent
} as const;

export function getUsdToInrRate(): number {
  return getNumericEnv("BEEVO_USD_TO_INR_RATE", 84.5);
}

export function estimateOpenAiCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): { costUsd: number; costInr: number; costSource: "actual" | "estimated" } {
  const rate = OPENAI_MODEL_PRICING[modelId] ?? OPENAI_MODEL_PRICING["gpt-4o"];
  const costUsd =
    (inputTokens / 1_000_000) * rate.inputUsdPer1M +
    (outputTokens / 1_000_000) * rate.outputUsdPer1M;
  return {
    costUsd: Number(costUsd.toFixed(6)),
    costInr: Number((costUsd * getUsdToInrRate()).toFixed(4)),
    costSource: OPENAI_MODEL_PRICING[modelId] ? "actual" : "estimated",
  };
}

export function estimateFalImageCost(
  modelId: string,
  width: number,
  height: number
): { costUsd: number; costInr: number; costSource: "actual" | "estimated" } {
  const rate =
    FAL_IMAGE_MODEL_PRICING[modelId] ??
    FAL_IMAGE_MODEL_PRICING["blackforestlabs/flux-3/klein/text-to-image"];
  const megapixels = (width * height) / 1_000_000;
  const costUsd = megapixels > 1.6 ? rate.usdPer2kImage : rate.usdPer1kImage;
  return {
    costUsd: Number(costUsd.toFixed(6)),
    costInr: Number((costUsd * getUsdToInrRate()).toFixed(4)),
    costSource: FAL_IMAGE_MODEL_PRICING[modelId] ? "actual" : "estimated",
  };
}

export function estimateElevenLabsCost(
  modelId: string,
  billableCharacters: number
): { costUsd: number; costInr: number; costSource: "actual" | "estimated" } {
  const rate =
    ELEVENLABS_MODEL_PRICING[modelId] ?? ELEVENLABS_MODEL_PRICING.eleven_multilingual_v2;
  const costUsd = (billableCharacters / 1000) * rate.usdPer1kChars;
  return {
    costUsd: Number(costUsd.toFixed(6)),
    costInr: Number((costUsd * getUsdToInrRate()).toFixed(4)),
    costSource: ELEVENLABS_MODEL_PRICING[modelId] ? "actual" : "estimated",
  };
}

export function estimateFfmpegRenderCost(
  runtimeSeconds: number,
  vcpus = 2,
  ramGb = 2
): { costUsd: number; costInr: number; costSource: "estimated" } {
  const minutes = Math.max(0, runtimeSeconds) / 60;
  const costUsd =
    minutes * (vcpus * INFRASTRUCTURE_PRICING.railwayVcpuUsdPerMin +
      ramGb * INFRASTRUCTURE_PRICING.railwayRamGbUsdPerMin);
  return {
    costUsd: Number(costUsd.toFixed(6)),
    costInr: Number((costUsd * getUsdToInrRate()).toFixed(4)),
    costSource: "estimated",
  };
}

export function estimateR2MonthlyStorageCost(
  totalBytes: number,
  classAOps = 0,
  classBOps = 0
): { costUsd: number; costInr: number; costSource: "estimated" } {
  const gb = totalBytes / (1024 * 1024 * 1024);
  const billableGb = Math.max(0, gb - 10);
  const billableA = Math.max(0, classAOps - 1_000_000);
  const billableB = Math.max(0, classBOps - 10_000_000);
  const costUsd =
    billableGb * INFRASTRUCTURE_PRICING.r2StorageUsdPerGbMonth +
    (billableA / 1_000_000) * INFRASTRUCTURE_PRICING.r2ClassAUsdPerMillion +
    (billableB / 1_000_000) * INFRASTRUCTURE_PRICING.r2ClassBUsdPerMillion;
  return {
    costUsd: Number(costUsd.toFixed(6)),
    costInr: Number((costUsd * getUsdToInrRate()).toFixed(4)),
    costSource: "estimated",
  };
}
