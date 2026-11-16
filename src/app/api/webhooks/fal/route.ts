import { requireEnv } from "@/lib/env";
import { verifyFalWebhookSignature } from "@/lib/fal/client";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-fal-webhook-signature");
    const secret = requireEnv("FAL_WEBHOOK_SECRET", "fal.ai Webhook");

    if (!verifyFalWebhookSignature(rawBody, signature, secret)) {
      throw new ApiError(401, "INVALID_WEBHOOK_SIGNATURE", "Invalid fal.ai webhook signature.");
    }

    const payload = JSON.parse(rawBody) as { request_id?: string; status?: string };
    const eventId = `${payload.request_id ?? "unknown"}:${payload.status ?? "event"}`;
    const admin = createSupabaseAdminClient();

    const { error } = await admin.from("webhook_events").insert({
      provider: "fal",
      event_id: eventId,
      event_type: payload.status ?? "fal.webhook",
      signature_verified: true,
      status: "processed",
      processed_at: new Date().toISOString(),
      payload,
    });

    if (error?.code === "23505") {
      return jsonOk({ received: true, deduplicated: true });
    }

    return jsonOk({ received: true });
  } catch (err) {
    return handleApiError(err);
  }
}
