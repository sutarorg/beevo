import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/security/http";

export const BEEVO_CREDIT_RULES = {
  creditsPerMinute: 100,
  creditsPer15Seconds: 25,
  minDurationSeconds: 15,
  maxDurationSeconds: 600,
} as const;

export const CANONICAL_CREDIT_PACKS = {
  starter: { id: "starter", name: "Starter", pricePaise: 29900, priceInr: 299, credits: 300, videoMinutes: 3 },
  creator: { id: "creator", name: "Creator", pricePaise: 59900, priceInr: 599, credits: 800, videoMinutes: 8 },
  studio: { id: "studio", name: "Studio", pricePaise: 89900, priceInr: 899, credits: 1500, videoMinutes: 15 },
} as const;

/**
 * Authoritative backend credit calculation formula:
 * credits_required = ceil(duration_seconds / 15) * 25
 * Strictly validates 15 <= duration_seconds <= 600. Never trust browser values.
 */
export function calculateRequiredCreditsServer(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || !Number.isInteger(durationSeconds)) {
    throw new ApiError(400, "INVALID_DURATION", "Duration must be a whole number of seconds.");
  }
  if (
    durationSeconds < BEEVO_CREDIT_RULES.minDurationSeconds ||
    durationSeconds > BEEVO_CREDIT_RULES.maxDurationSeconds
  ) {
    throw new ApiError(
      400,
      "DURATION_OUT_OF_RANGE",
      `Video duration must be between ${BEEVO_CREDIT_RULES.minDurationSeconds}s and ${BEEVO_CREDIT_RULES.maxDurationSeconds}s (10 minutes max).`
    );
  }
  return Math.ceil(durationSeconds / 15) * BEEVO_CREDIT_RULES.creditsPer15Seconds;
}

export async function allocatePurchaseCreditsRpc(
  adminSupabase: SupabaseClient,
  params: {
    userId: string;
    credits: number;
    paymentId: string;
    idempotencyKey: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ allocated: boolean; availableCredits: number; reservedCredits: number }> {
  const { data, error } = await adminSupabase.rpc("allocate_purchase_credits", {
    p_user_id: params.userId,
    p_credits: params.credits,
    p_payment_id: params.paymentId,
    p_idempotency_key: params.idempotencyKey,
    p_description: params.description,
    p_metadata: params.metadata ?? {},
  });
  if (error) {
    throw new Error(`allocate_purchase_credits failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allocated: Boolean(row?.allocated),
    availableCredits: Number(row?.available_credits ?? 0),
    reservedCredits: Number(row?.reserved_credits ?? 0),
  };
}

export async function reserveGenerationCreditsRpc(
  adminSupabase: SupabaseClient,
  params: {
    userId: string;
    generationId: string;
    durationSeconds: number;
    idempotencyKey: string;
  }
): Promise<{ reservedAmount: number; availableCredits: number; reservedCredits: number }> {
  const { data, error } = await adminSupabase.rpc("reserve_generation_credits", {
    p_user_id: params.userId,
    p_generation_id: params.generationId,
    p_duration_seconds: params.durationSeconds,
    p_idempotency_key: params.idempotencyKey,
  });
  if (error) {
    if (error.message.includes("INSUFFICIENT_CREDITS")) {
      throw new ApiError(
        402,
        "INSUFFICIENT_CREDITS",
        "Insufficient available credits to start this generation. Purchase a credit pack to continue."
      );
    }
    throw new Error(`reserve_generation_credits failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    reservedAmount: Number(row?.reserved_amount ?? calculateRequiredCreditsServer(params.durationSeconds)),
    availableCredits: Number(row?.available_credits ?? 0),
    reservedCredits: Number(row?.reserved_credits ?? 0),
  };
}

export async function consumeGenerationCreditsRpc(
  adminSupabase: SupabaseClient,
  params: { userId: string; generationId: string; credits: number; idempotencyKey: string }
): Promise<boolean> {
  const { data, error } = await adminSupabase.rpc("consume_generation_credits", {
    p_user_id: params.userId,
    p_generation_id: params.generationId,
    p_credits: params.credits,
    p_idempotency_key: params.idempotencyKey,
  });
  if (error) {
    throw new Error(`consume_generation_credits failed: ${error.message}`);
  }
  return Boolean(data);
}

export async function releaseGenerationCreditsRpc(
  adminSupabase: SupabaseClient,
  params: {
    userId: string;
    generationId: string;
    credits: number;
    idempotencyKey: string;
    reason: string;
  }
): Promise<boolean> {
  const { data, error } = await adminSupabase.rpc("release_generation_credits", {
    p_user_id: params.userId,
    p_generation_id: params.generationId,
    p_credits: params.credits,
    p_idempotency_key: params.idempotencyKey,
    p_reason: params.reason,
  });
  if (error) {
    throw new Error(`release_generation_credits failed: ${error.message}`);
  }
  return Boolean(data);
}
