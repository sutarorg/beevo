import { createServerRazorpayOrder } from "@/features/payments/service";
import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createRazorpayOrderSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    enforceRateLimit(`order:${auth.userId}`, RATE_LIMITS.payments);
    const parsed = await parseJsonBody(request, createRazorpayOrderSchema);

    const order = await createServerRazorpayOrder({
      adminSupabase: auth.adminSupabase,
      userId: auth.userId,
      packageId: parsed.packageId,
    });

    return jsonOk(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
