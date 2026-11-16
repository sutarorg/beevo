import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { verifyFalWebhookSignature } from "@/lib/fal/client";
import {
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay/client";

describe("Domain 2: Razorpay & fal.ai Signature Security", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("verifies Razorpay checkout HMAC strictly against server-stored order_id", () => {
    process.env.RAZORPAY_KEY_SECRET = "test_rzp_secret_123";
    const storedOrderId = "order_ServerStored999";
    const paymentId = "pay_LiveCaptured123";
    const validSig = crypto
      .createHmac("sha256", "test_rzp_secret_123")
      .update(`${storedOrderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyRazorpayCheckoutSignature({
        storedOrderId,
        paymentId,
        signature: validSig,
      })
    ).toBe(true);

    expect(
      verifyRazorpayCheckoutSignature({
        storedOrderId: "order_SpoofedFromClient",
        paymentId,
        signature: validSig,
      })
    ).toBe(false);
    expect(
      verifyRazorpayCheckoutSignature({
        storedOrderId,
        paymentId: "pay_Different",
        signature: validSig,
      })
    ).toBe(false);
  });

  it("verifies Razorpay webhook HMAC strictly over exact raw bytes", () => {
    const secret = "whsec_beevo_test_secret";
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: 59900 } } },
    });
    const validSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    expect(
      verifyRazorpayWebhookSignature({ rawBody, signatureHeader: validSig, webhookSecret: secret })
    ).toBe(true);
    expect(
      verifyRazorpayWebhookSignature({
        rawBody: `${rawBody} `,
        signatureHeader: validSig,
        webhookSecret: secret,
      })
    ).toBe(false);
    expect(
      verifyRazorpayWebhookSignature({
        rawBody,
        signatureHeader: "deadbeef",
        webhookSecret: secret,
      })
    ).toBe(false);
    expect(
      verifyRazorpayWebhookSignature({ rawBody, signatureHeader: null, webhookSecret: secret })
    ).toBe(false);
  });

  it("verifies fal.ai webhook HMAC signature cleanly", () => {
    const secret = "fal_whsec_test_999";
    const raw = JSON.stringify({ request_id: "req_123", status: "COMPLETED" });
    const sig = crypto.createHmac("sha256", secret).update(raw).digest("hex");

    expect(verifyFalWebhookSignature(raw, sig, secret)).toBe(true);
    expect(verifyFalWebhookSignature(raw, "0".repeat(64), secret)).toBe(false);
    expect(verifyFalWebhookSignature(raw, null, secret)).toBe(false);
  });
});
