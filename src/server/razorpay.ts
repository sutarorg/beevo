import { createHmac, timingSafeEqual } from "node:crypto";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, razorpayConfigured } from "@/server/env";

/**
 * Razorpay server-side integration (official APIs, test-mode ready).
 * Secrets are used only here and never logged.
 */

const API = "https://api.razorpay.com/v1";

export async function createRazorpayOrder(input: {
  amountInPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
    currency?: string;
    error?: { description?: string };
  };
  if (!res.ok || !body.id) {
    throw new Error(`razorpay_order_failed:${body.error?.description ?? `http_${res.status}`}`);
  }
  return { id: body.id, amount: body.amount ?? 0, currency: body.currency ?? "INR" };
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!razorpayConfigured || !input.signature) return false;
  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(input.signature, "utf8"));
  } catch {
    return false;
  }
}

/** Webhook signature is computed over the RAW request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

export type RazorpayWebhookPayload = {
  event?: string;
  id?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; method?: string; error_description?: string } };
    order?: { entity?: { id?: string } };
  };
};
