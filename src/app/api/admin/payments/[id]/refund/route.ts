import { recordRefundSettled } from "@/features/payments/service";
import { initiateRazorpayRefund } from "@/lib/razorpay/client";
import { requireAdmin, writeAuditLog } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { adminRefundSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin("admin.payments.refund");
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, adminRefundSchema);
    const admin = actor.adminSupabase;

    const { data: payment } = await admin
      .from("payments")
      .select("*")
      .or(`id.eq.${id},razorpay_payment_id.eq.${id}`)
      .maybeSingle();

    if (!payment || !payment.razorpay_payment_id) {
      throw new ApiError(404, "PAYMENT_NOT_FOUND", "Captured Razorpay payment not found.");
    }

    const remainingPaise = Number(payment.amount_paise) - Number(payment.refunded_paise ?? 0);
    const refundPaise = parsed.amountPaise ?? remainingPaise;
    if (refundPaise <= 0 || refundPaise > remainingPaise) {
      throw new ApiError(400, "INVALID_REFUND_AMOUNT", "Refund exceeds remaining captured amount.");
    }

    const rzpRefund = await initiateRazorpayRefund({
      paymentId: payment.razorpay_payment_id,
      amountPaise: refundPaise,
      notes: { reason: parsed.reason, admin_id: actor.userId },
    });

    await recordRefundSettled({
      adminSupabase: admin,
      razorpayPaymentId: payment.razorpay_payment_id,
      refundId: rzpRefund.id,
      refundAmountPaise: refundPaise,
      reason: parsed.reason,
    });

    await writeAuditLog(admin, {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "payment.admin_refund",
      targetType: "payment",
      targetId: payment.razorpay_payment_id,
      result: "success",
      reason: parsed.reason,
      metadata: { refundId: rzpRefund.id, refundPaise },
    });

    return jsonOk({ refunded: true, refundId: rzpRefund.id, amountPaise: refundPaise });
  } catch (err) {
    return handleApiError(err);
  }
}
