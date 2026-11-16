import {
  recordRefundSettled,
  settleCapturedRazorpayPayment,
} from "@/features/payments/service";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/client";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-razorpay-signature");
    const eventIdHeader = request.headers.get("x-razorpay-event-id");

    const verified = verifyRazorpayWebhookSignature({ rawBody, signatureHeader });
    if (!verified) {
      throw new ApiError(401, "INVALID_WEBHOOK_SIGNATURE", "Invalid Razorpay webhook signature.");
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: Record<string, unknown> };
        order?: { entity?: Record<string, unknown> };
        refund?: { entity?: Record<string, unknown> };
      };
    };

    const eventType = String(payload.event ?? "unknown");
    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;
    const eventId =
      eventIdHeader ??
      `${eventType}:${String(paymentEntity?.id ?? refundEntity?.id ?? Date.now())}`;

    const admin = createSupabaseAdminClient();

    const { data: insertedEvent, error: dedupeErr } = await admin
      .from("webhook_events")
      .insert({
        provider: "razorpay",
        event_id: eventId,
        event_type: eventType,
        signature_verified: true,
        status: "received",
        payload,
      })
      .select("id")
      .maybeSingle();

    if (dedupeErr?.code === "23505" || !insertedEvent) {
      return jsonOk({ received: true, deduplicated: true });
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const orderId = String(
        paymentEntity?.order_id ?? payload.payload?.order?.entity?.id ?? ""
      );
      const paymentId = String(paymentEntity?.id ?? "");
      if (orderId && paymentId) {
        await settleCapturedRazorpayPayment({
          adminSupabase: admin,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          method: typeof paymentEntity?.method === "string" ? paymentEntity.method : null,
          feePaise: typeof paymentEntity?.fee === "number" ? paymentEntity.fee : null,
          taxPaise: typeof paymentEntity?.tax === "number" ? paymentEntity.tax : null,
        });
      }
    } else if (eventType === "payment.failed") {
      const orderId = String(paymentEntity?.order_id ?? "");
      if (orderId) {
        await admin
          .from("payments")
          .update({
            razorpay_payment_id: typeof paymentEntity?.id === "string" ? paymentEntity.id : null,
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId)
          .neq("status", "captured");
      }
    } else if (eventType === "refund.processed" || eventType === "refund.created") {
      const paymentId = String(refundEntity?.payment_id ?? "");
      const refundId = String(refundEntity?.id ?? eventId);
      const amountPaise = Number(refundEntity?.amount ?? 0);
      if (paymentId && amountPaise > 0) {
        await recordRefundSettled({
          adminSupabase: admin,
          razorpayPaymentId: paymentId,
          refundId,
          refundAmountPaise: amountPaise,
        });
      }
    }

    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", insertedEvent.id);

    return jsonOk({ received: true, processed: true, eventType });
  } catch (err) {
    return handleApiError(err);
  }
}
