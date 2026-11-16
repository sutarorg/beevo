import { requireAdmin } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { adminCreditAdjustSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin("admin.credits.adjust");
    enforceRateLimit(`admin-adj:${actor.userId}`, RATE_LIMITS.adminWrite);
    const parsed = await parseJsonBody(request, adminCreditAdjustSchema);

    const idempotencyKey =
      parsed.idempotencyKey ?? `admin_adj:${actor.userId}:${parsed.targetUserId}:${Date.now()}`;

    const { data, error } = await actor.adminSupabase.rpc("admin_adjust_credits", {
      p_admin_user_id: actor.userId,
      p_admin_email: actor.email,
      p_target_user_id: parsed.targetUserId,
      p_direction: parsed.direction,
      p_credits: parsed.credits,
      p_reason: parsed.reason,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      throw new ApiError(400, "ADJUSTMENT_FAILED", error.message);
    }

    const row = Array.isArray(data) ? data[0] : data;

    return jsonOk({
      adjusted: true,
      targetUserId: parsed.targetUserId,
      direction: parsed.direction,
      credits: parsed.credits,
      availableCredits: Number(row?.available_credits ?? 0),
      reservedCredits: Number(row?.reserved_credits ?? 0),
      ledgerId: row?.ledger_id ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
