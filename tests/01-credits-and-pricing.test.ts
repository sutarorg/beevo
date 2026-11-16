import { describe, expect, it } from "vitest";
import {
  BEEVO_CREDIT_RULES,
  CANONICAL_CREDIT_PACKS,
  calculateRequiredCreditsServer,
} from "@/features/credits/service";
import {
  estimateElevenLabsCost,
  estimateFalImageCost,
  estimateFfmpegRenderCost,
  estimateOpenAiCost,
} from "@/lib/pricing/provider-registry";

describe("Domain 1: Server Credit Calculation & Provider Pricing Registry", () => {
  it("calculates ceil(duration_seconds / 15) * 25 accurately across valid durations", () => {
    expect(calculateRequiredCreditsServer(15)).toBe(25);
    expect(calculateRequiredCreditsServer(16)).toBe(50);
    expect(calculateRequiredCreditsServer(30)).toBe(50);
    expect(calculateRequiredCreditsServer(45)).toBe(75);
    expect(calculateRequiredCreditsServer(60)).toBe(100);
    expect(calculateRequiredCreditsServer(90)).toBe(150);
    expect(calculateRequiredCreditsServer(180)).toBe(300);
    expect(calculateRequiredCreditsServer(600)).toBe(1000);
  });

  it("rejects out-of-range and non-integer durations server-side", () => {
    expect(() => calculateRequiredCreditsServer(0)).toThrow();
    expect(() => calculateRequiredCreditsServer(14)).toThrow();
    expect(() => calculateRequiredCreditsServer(601)).toThrow();
    expect(() => calculateRequiredCreditsServer(-30)).toThrow();
    expect(() => calculateRequiredCreditsServer(30.5)).toThrow();
    expect(() => calculateRequiredCreditsServer(Number.NaN)).toThrow();
  });

  it("enforces exact canonical credit pack specifications", () => {
    expect(BEEVO_CREDIT_RULES.creditsPerMinute).toBe(100);
    expect(BEEVO_CREDIT_RULES.creditsPer15Seconds).toBe(25);
    expect(BEEVO_CREDIT_RULES.maxDurationSeconds).toBe(600);

    expect(CANONICAL_CREDIT_PACKS.starter).toMatchObject({
      priceInr: 299,
      pricePaise: 29900,
      credits: 300,
      videoMinutes: 3,
    });
    expect(CANONICAL_CREDIT_PACKS.creator).toMatchObject({
      priceInr: 599,
      pricePaise: 59900,
      credits: 800,
      videoMinutes: 8,
    });
    expect(CANONICAL_CREDIT_PACKS.studio).toMatchObject({
      priceInr: 899,
      pricePaise: 89900,
      credits: 1500,
      videoMinutes: 15,
    });
  });

  it("computes positive USD/INR cost estimates across all providers", () => {
    const openai = estimateOpenAiCost("gpt-4o", 4000, 3000);
    expect(openai.costUsd).toBeGreaterThan(0);
    expect(openai.costInr).toBeGreaterThan(openai.costUsd);

    const fal = estimateFalImageCost("blackforestlabs/flux-3/klein/text-to-image", 1280, 720);
    expect(fal.costUsd).toBeCloseTo(0.009, 4);
    expect(fal.costInr).toBeGreaterThan(0.5);

    const eleven = estimateElevenLabsCost("eleven_multilingual_v2", 1000);
    expect(eleven.costUsd).toBeCloseTo(0.08, 4);

    const worker = estimateFfmpegRenderCost(120);
    expect(worker.costUsd).toBeGreaterThan(0);
    expect(worker.costInr).toBeGreaterThan(0);
  });
});
