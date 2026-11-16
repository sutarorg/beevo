import crypto from "node:crypto";
import Razorpay from "razorpay";
import { requireEnv } from "@/lib/env";

let cachedRazorpay: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY_VIOLATION: Razorpay server SDK cannot run in browser.");
  }
  const key_id = requireEnv("RAZORPAY_KEY_ID", "Razorpay");
  const key_secret = requireEnv("RAZORPAY_KEY_SECRET", "Razorpay");

  if (!cachedRazorpay) {
    cachedRazorpay = new Razorpay({ key_id, key_secret });
  }
  return cachedRazorpay;
}

/**
 * Constant-time HMAC-SHA256 verification for Razorpay Checkout payment callback.
 * SECURITY: Always pass the server-stored razorpay_order_id — NEVER trust a client-supplied order ID.
 */
export function verifyRazorpayCheckoutSignature(params: {
  storedOrderId: string;
  paymentId: string;
  signature: string;
  keySecret?: string;
}): boolean {
  const secret = params.keySecret ?? requireEnv("RAZORPAY_KEY_SECRET", "Razorpay");
  if (!params.storedOrderId || !params.paymentId || !params.signature) return false;

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(`${params.storedOrderId}|${params.paymentId}`)
    .digest("hex");

  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(params.signature.trim(), "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Constant-time HMAC-SHA256 verification over the EXACT raw request body bytes
 * using RAZORPAY_WEBHOOK_SECRET (distinct from RAZORPAY_KEY_SECRET).
 */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  webhookSecret?: string;
}): boolean {
  const secret = params.webhookSecret ?? requireEnv("RAZORPAY_WEBHOOK_SECRET", "Razorpay Webhook");
  if (!params.signatureHeader || !params.rawBody) return false;

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(params.rawBody)
    .digest("hex");

  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(params.signatureHeader.trim(), "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string; status: string }> {
  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    status: order.status,
  };
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  fee: number | null;
  tax: number | null;
}> {
  const client = getRazorpayClient();
  const payment = await client.payments.fetch(paymentId);
  return {
    id: payment.id,
    order_id: String(payment.order_id ?? ""),
    amount: Number(payment.amount),
    currency: String(payment.currency ?? "INR"),
    status: String(payment.status),
    method: payment.method ? String(payment.method) : null,
    fee: typeof payment.fee === "number" ? payment.fee : null,
    tax: typeof payment.tax === "number" ? payment.tax : null,
  };
}

export async function initiateRazorpayRefund(params: {
  paymentId: string;
  amountPaise?: number;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; status: string }> {
  const client = getRazorpayClient();
  const refund = await client.payments.refund(params.paymentId, {
    ...(params.amountPaise ? { amount: params.amountPaise } : {}),
    speed: "normal",
    notes: params.notes,
  });
  return {
    id: refund.id,
    amount: Number(refund.amount),
    status: String(refund.status ?? "processed"),
  };
}
