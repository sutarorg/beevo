import { verifyAndSettleCheckoutPayment } from "@/features/payments/service";
import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { verifyRazorpayPaymentSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    enforceRateLimit(`verify:${auth.userId}`, RATE_LIMITS.payments);
    const parsed = await parseJsonBody(request, verifyRazorpayPaymentSchema);

    const result = await verifyAndSettleCheckoutPayment({
      adminSupabase: auth.adminSupabase,
      userId: auth.userId,
      paymentRecordId: parsed.paymentRecordId,
      razorpayPaymentId: parsed.razorpay_payment_id,
      razorpaySignature: parsed.razorpay_signature,
    });

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
