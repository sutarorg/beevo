import { env } from "./env";
import { hmacSha256, timingSafeEqual } from "./crypto";
import { PRICING, cycleKey, gstPaise, priceFor, type BillingCycle } from "@/lib/pricing";

/**
 * Razorpay over plain HTTPS (Orders flow) — no SDK needed.
 * Amounts are paise. Docs: https://razorpay.com/docs/api/orders
 */

export { PRICING, cycleKey, gstPaise, priceFor };
export type { BillingCycle };

/** Legacy alias kept for existing imports. */
export const PLAN_AMOUNTS = {
  pro_monthly: { base: PRICING.pro_monthly.basePaise, label: PRICING.pro_monthly.label, months: 1 },
  pro_annual: { base: PRICING.pro_annual.basePaise, label: PRICING.pro_annual.label, months: 12 },
} as const;

export function gstOf(paiseBase: number): number {
  return gstPaise(paiseBase);
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

export interface RazorpayPayment {
  id: string;
  method?: string;
  card?: { last4?: string; network?: string };
  vpa?: string;
  bank?: string;
  wallet?: string;
  email?: string;
  contact?: string;
}

/** Fetch the captured payment so we can store the real instrument used. */
export async function fetchPayment(paymentId: string): Promise<RazorpayPayment | null> {
  try {
    const auth = Buffer.from(`${env.billing.keyId()}:${env.billing.keySecret()}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as RazorpayPayment;
  } catch {
    return null;
  }
}

/** Human label for a stored payment method, e.g. "Visa •••• 4242" / "user@okhdfc". */
export function describePayment(p: RazorpayPayment | null): { method: string | null; detail: string | null } {
  if (!p) return { method: null, detail: null };
  switch (p.method) {
    case "card":
      return {
        method: "card",
        detail: `${p.card?.network ?? "Card"} •••• ${p.card?.last4 ?? "____"}`,
      };
    case "upi":
      return { method: "upi", detail: p.vpa ?? "UPI" };
    case "netbanking":
      return { method: "netbanking", detail: p.bank ?? "Net banking" };
    case "wallet":
      return { method: "wallet", detail: p.wallet ?? "Wallet" };
    default:
      return { method: p.method ?? null, detail: p.method ?? null };
  }
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
