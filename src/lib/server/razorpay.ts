import { env } from "./env";
import { hmacSha256, timingSafeEqual } from "./crypto";

/**
 * Razorpay over plain HTTPS (Orders flow) — no SDK needed.
 * Amounts are paise. Docs: https://razorpay.com/docs/api/orders
 */

export const PLAN_AMOUNTS = {
  pro_monthly: { base: 79900, label: "Beevo Pro — Monthly", months: 1 },
  pro_annual: { base: 799000, label: "Beevo Pro — Annual", months: 12 },
} as const;

export function gstOf(paiseBase: number): number {
  return Math.round(paiseBase * 0.18);
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${env.billing.keyId()}:${env.billing.keySecret()}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: "INR",
      receipt: opts.receipt,
      notes: opts.notes ?? {},
    }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as RazorpayOrder;
}

/** Verify Checkout handler signature: HMAC(orderId|paymentId, keySecret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = hmacSha256(`${orderId}|${paymentId}`, env.billing.keySecret());
  return timingSafeEqual(expected, signature);
}

/** Verify webhook signature: HMAC(rawBody, webhookSecret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = env.billing.webhookSecret();
  if (!secret) return false;
  const expected = hmacSha256(rawBody, secret);
  return timingSafeEqual(expected, signature);
}
