import { createHash } from "node:crypto";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  commissionLedger,
  courses,
  enrollments,
  orders,
  payments,
  users,
  webhookEvents,
} from "@/db/schema";
import { route } from "@/server/router";
import { clientIp, fail, ok, parseBody, rateLimit, requireUser } from "@/server/http";
import { newId } from "@/server/auth";
import { audit } from "@/server/audit";
import { emailShell, notifyInApp, queueEmail } from "@/server/email";
import {
  APP_BASE_URL,
  collectionsAllowed,
  PAYMENTS_LIVE_ENABLED,
  PLATFORM_COMMISSION_BPS,
  payoutRecordingAllowed,
  RAZORPAY_KEY_ID,
  razorpayConfigured,
  razorpayIsTestKeys,
  razorpaySecretMatchesKeyId,
} from "@/server/env";
import {
  createRazorpayOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  type RazorpayWebhookPayload,
} from "@/server/razorpay";

/**
 * Checkout + webhook. Access is granted ONLY after a server-verified
 * successful payment (checkout signature or webhook signature) — never from
 * a browser redirect alone. Commission base: the captured eligible sale
 * amount (gross_in_paise on the paid order); rate 800 bps (8%) recorded per
 * ledger entry with round-half-up-to-paise; ledger rows are unique per
 * order/payment and written once in the same transaction as the enrolment.
 */

const COMMISSION_RATE = PLATFORM_COMMISSION_BPS / 10_000;

function feeOf(grossInPaise: number): number {
  return Math.round(grossInPaise * COMMISSION_RATE);
}

route("POST", "checkout", async (req, ctx) => {
  // Purchasing needs a signed-in *account*, not a verified inbox: verification
  // gates creator actions (uploads/publishing) and is a separate, email-
  // dependent step. Requiring it here silently blocked checkout for anyone who
  // hadn't clicked the verification link yet (and permanently for accounts
  // created before transactional email was configured).
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  if (!rateLimit(`checkout:${me.id}:${clientIp(req)}`, 10, 60_000)) {
    return fail("rate_limited", "Slow down — too many checkout attempts.", 429);
  }
  const parsed = parseBody(
    z.object({ courseId: z.string().min(1) }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;

  if (razorpaySecretMatchesKeyId) {
    return fail(
      "provider_misconfigured",
      "Payment credentials are misconfigured (RAZORPAY_KEY_SECRET must be your secret key, not the Key ID).",
      503,
    );
  }
  if (!razorpayConfigured) {
    return fail(
      "provider_not_configured",
      "Payments aren't configured yet (Razorpay keys missing). Sandbox testing resumes once test keys are added.",
      503,
    );
  }
  if (!collectionsAllowed) {
    return fail(
      "payments_live_disabled",
      "Live centralized collections are disabled pending Razorpay's approval of the platform arrangement. Sandbox keys are allowed; live keys are not active until approval is confirmed.",
      503,
    );
  }

  // Authoritative price: ALWAYS the current database value.
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, parsed.values.courseId),
  });
  if (
    !course ||
    course.status !== "published" ||
    course.priceInPaise === null ||
    course.priceInPaise <= 0
  ) {
    return fail("not_purchasable", "This course isn't available for purchase right now.", 404);
  }
  const creator = await db.query.users.findFirst({ where: eq(users.id, course.creatorId) });
  if (!creator || creator.suspendedAt) {
    return fail("not_purchasable", "This course isn't available for purchase right now.", 404);
  }
  if (course.creatorId === me.id) {
    return fail("self_purchase", "You can't buy your own course.", 400);
  }
  const existing = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, me.id), eq(enrollments.courseId, course.id)),
  });
  if (existing) {
    return fail("already_enrolled", "You already own this course — find it in My Learning.", 409);
  }

  const gross = course.priceInPaise;
  const fee = feeOf(gross);
  let rzpOrder;
  try {
    rzpOrder = await createRazorpayOrder({
      amountInPaise: gross,
      receipt: `ck_${Date.now().toString(36)}`,
      notes: { courseId: course.id, buyerUserId: me.id },
    });
  } catch {
    await audit({
      actorId: me.id,
      actorLabel: me.name,
      area: "payments",
      action: "provider_error",
      detail: "Razorpay order creation failed (provider error, no order persisted).",
      kind: "event",
    });
    return fail(
      "provider_error",
      "The payment provider rejected order creation. Nothing was charged — try again.",
      502,
    );
  }

  const [order] = await db
    .insert(orders)
    .values({
      id: newId("ord"),
      userId: me.id,
      courseId: course.id,
      courseTitle: course.title,
      grossInPaise: gross,
      platformFeeInPaise: fee,
      creatorShareInPaise: gross - fee,
      status: "created",
      providerRef: rzpOrder.id,
    })
    .returning();

  return ok(
    {
      orderId: order.id,
      courseId: course.id,
      courseTitle: course.title,
      amountInPaise: gross,
      platformFeeInPaise: fee,
      currency: "INR" as const,
      gateway: "razorpay" as const,
      keyId: RAZORPAY_KEY_ID,
      razorpayOrderId: rzpOrder.id,
      buyer: { name: me.name, email: me.email },
    },
    { status: 201 },
  );
});

/**
 * Payment readiness, public-safe (no secrets, no provider calls).
 *
 * The checkout sheet asks this before the buyer clicks, so a deployment whose
 * gateway is not configured shows one honest, actionable notice instead of a
 * generic "Couldn't start checkout" toast after a failed attempt.
 */
route("GET", "checkout/status", async () => {
  if (razorpaySecretMatchesKeyId) {
    return ok({
      ready: false,
      code: "provider_misconfigured",
      message:
        "Payments are misconfigured: RAZORPAY_KEY_SECRET must be the secret key that belongs to RAZORPAY_KEY_ID (it can never equal the Key ID).",
      mode: "unconfigured" as const,
    });
  }
  if (!razorpayConfigured) {
    return ok({
      ready: false,
      code: "provider_not_configured",
      message:
        "Payments aren't configured on this deployment yet. Add NEXT_PUBLIC_RAZORPAY_KEY_ID (or RAZORPAY_KEY_ID) and RAZORPAY_KEY_SECRET to the environment, then redeploy.",
      mode: "unconfigured" as const,
    });
  }
  if (!collectionsAllowed) {
    return ok({
      ready: false,
      code: "payments_live_disabled",
      message:
        "Live payments are disabled: this deployment holds live Razorpay keys but PAYMENTS_LIVE_ENABLED is not \"true\". Set PAYMENTS_LIVE_ENABLED=true once live collections are approved, then redeploy.",
      mode: "live" as const,
    });
  }
  return ok({
    ready: true,
    code: "ready",
    message:
      razorpayIsTestKeys
        ? "Test-mode payments are active — use Razorpay test cards/UPI, no real money moves."
        : "Payments are active.",
    mode: razorpayIsTestKeys ? ("test" as const) : ("live" as const),
  });
});

/**
 * Fulfilment, transactional + idempotent. Returns true when this call did
 * the fulfilling (false = already fulfilled — safe to treat as success).
 */
async function fulfilPaidOrder(
  orderId: string,
  providerPaymentId: string,
  method: string | null,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "created")))
      .returning();
    if (!order) return false; // already processed

    const paymentId = newId("pay");
    await tx
      .insert(payments)
      .values({
        id: paymentId,
        orderId: order.id,
        providerPaymentId,
        method: method?.slice(0, 40) ?? null,
        status: "captured",
      })
      .onConflictDoNothing({ target: payments.providerPaymentId });

    // Enrolment: unique (user, course) prevents duplicates.
    await tx
      .insert(enrollments)
      .values({ id: newId("enr"), userId: order.userId, courseId: order.courseId })
      .onConflictDoNothing();

    // Ledger row: created exactly once (unique on orderId AND paymentId).
    const course = await tx.query.courses.findFirst({ where: eq(courses.id, order.courseId) });
    await tx
      .insert(commissionLedger)
      .values({
        id: newId("led"),
        orderId: order.id,
        paymentId,
        creatorId: course!.creatorId,
        grossInPaise: order.grossInPaise,
        rateBps: PLATFORM_COMMISSION_BPS,
        commissionInPaise: order.platformFeeInPaise,
        creatorShareInPaise: order.creatorShareInPaise,
        gatewayCostInPaise: null, // recorded only when the provider reports real costs
        status: "accrued",
      })
      .onConflictDoNothing();
    return true;
  });
}

async function afterFulfilment(orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return;
  const buyer = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
  const course = await db.query.courses.findFirst({ where: eq(courses.id, order.courseId) });
  const creator = course
    ? await db.query.users.findFirst({ where: eq(users.id, course.creatorId) })
    : null;
  if (!buyer) return;
  const learnUrl = `${APP_BASE_URL}/learn/courses`;
  await queueEmail({
    userId: order.userId,
    to: buyer.email,
    subject: `You're enrolled: ${order.courseTitle}`,
    template: "purchase_confirmation",
    dedupeKey: `purchase_email:${order.id}`,
    html: emailShell(
      "You're enrolled",
      `<p>Payment verified (order ${order.id}). “${order.courseTitle}” is now in your library.</p><p style="margin:20px 0"><a href="${learnUrl}" style="background:#e8490f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Start learning</a></p><p style="font-size:12px;color:#5c543f">Course purchases are non-refundable except where required by applicable law.</p>`,
    ),
    text: `Enrolled in ${order.courseTitle}. Start learning: ${learnUrl}`,
  });
  if (creator) {
    await notifyInApp({
      userId: creator.id,
      template: "sale_made",
      title: "New enrolment",
      body: `${buyer.name} enrolled in “${order.courseTitle}” (₹${(order.grossInPaise / 100).toLocaleString("en-IN")} gross).`,
      dedupeKey: `sale_notice:${order.id}`,
    });
  }
}

route("POST", "checkout/verify", async (req, ctx) => {
  const me = requireUser(ctx);
  if (me instanceof Response) return me;
  const parsed = parseBody(
    z.object({
      orderId: z.string().min(1),
      razorpayOrderId: z.string().min(1),
      razorpayPaymentId: z.string().min(1),
      razorpaySignature: z.string().min(1),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;

  const order = await db.query.orders.findFirst({ where: eq(orders.id, parsed.values.orderId) });
  if (!order || order.userId !== me.id) {
    return fail("order_not_found", "This order doesn't exist.", 404);
  }
  if (order.providerRef !== parsed.values.razorpayOrderId) {
    return fail("order_mismatch", "Order reference mismatch.", 400);
  }
  if (order.status === "paid") {
    // Idempotent: previously fulfilled — safe to report success again.
    const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, order.id) });
    return ok({
      paymentId: payment?.providerPaymentId ?? parsed.values.razorpayPaymentId,
      orderId: order.id,
      amountInPaise: order.grossInPaise,
      note: "Already enrolled.",
      enrolled: true,
    });
  }

  const signatureOk = verifyCheckoutSignature({
    orderId: parsed.values.razorpayOrderId,
    paymentId: parsed.values.razorpayPaymentId,
    signature: parsed.values.razorpaySignature,
  });
  if (!signatureOk) {
    await db
      .insert(payments)
      .values({
        id: newId("pay"),
        orderId: order.id,
        providerPaymentId: parsed.values.razorpayPaymentId,
        status: "failed",
        failureReason: "signature_verification_failed",
      })
      .onConflictDoNothing({ target: payments.providerPaymentId });
    await audit({
      actorId: me.id,
      actorLabel: me.name,
      area: "payments",
      action: "signature_failed",
      detail: `Checkout signature verification failed for ${order.id}. Access NOT granted.`,
      kind: "event",
    });
    return fail(
      "signature_invalid",
      "We couldn't verify this payment's signature. No access was granted.",
      400,
    );
  }

  await fulfilPaidOrder(order.id, parsed.values.razorpayPaymentId, null);
  await afterFulfilment(order.id);
  return ok({
    paymentId: parsed.values.razorpayPaymentId,
    orderId: order.id,
    amountInPaise: order.grossInPaise,
    note: "Payment verified by the server — you're enrolled.",
    enrolled: true,
  });
});

/** Webhook: raw-body HMAC, idempotent event processing, transactional updates. */
route("POST", "webhooks/razorpay", async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return fail("webhook_signature_invalid", "Invalid webhook signature.", 400);
  }
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return fail("invalid_payload", "Webhook payload isn't valid JSON.", 400);
  }
  const headerEventId = req.headers.get("x-razorpay-event-id")?.trim();
  const bodyDigest = `rzp_${createHash("sha256").update(rawBody).digest("hex").slice(0, 40)}`;
  const eventId = headerEventId || payload.id || bodyDigest;
  const event = payload.event ?? "unknown";

  // Idempotency: insert-first; a conflict means we've already handled it.
  const inserted = await db
    .insert(webhookEvents)
    .values({ id: eventId, provider: "razorpay", type: event, processingStatus: "processed" })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (inserted.length === 0) {
    return ok({ received: true, duplicate: true });
  }

  try {
    if (event === "payment.captured") {
      const entity = payload.payload?.payment?.entity;
      const providerOrderId = entity?.order_id ?? payload.payload?.order?.entity?.id;
      const providerPaymentId = entity?.id;
      if (providerOrderId && providerPaymentId) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.providerRef, providerOrderId),
        });
        if (order) {
          const didFulfil = await fulfilPaidOrder(order.id, providerPaymentId, entity.method ?? null);
          if (didFulfil) await afterFulfilment(order.id);
        }
      }
    } else if (event === "payment.failed") {
      const entity = payload.payload?.payment?.entity;
      const providerOrderId = entity?.order_id;
      if (providerOrderId) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.providerRef, providerOrderId),
        });
        if (order && order.status === "created") {
          await db.transaction(async (tx) => {
            await tx
              .update(orders)
              .set({ status: "failed" })
              .where(and(eq(orders.id, order.id), eq(orders.status, "created")));
            await tx
              .insert(payments)
              .values({
                id: newId("pay"),
                orderId: order.id,
                providerPaymentId: entity?.id ?? null,
                status: "failed",
                failureReason: entity?.error_description?.slice(0, 200) ?? "payment_failed",
              })
              .onConflictDoNothing();
          });
        }
      }
    }
    // Other event types: recorded (idempotent) and ignored safely.
    return ok({ received: true, event });
  } catch (error) {
    // Safe recovery: mark failed so a sweep/retry can reprocess; Razorpay retries on 5xx.
    await db
      .update(webhookEvents)
      .set({ processingStatus: "failed", attempts: 2 })
      .where(eq(webhookEvents.id, eventId));
    console.error("[webhook] processing failed:", error);
    return fail("processing_failed", "Event received but processing failed — it will be retried.", 500);
  }
});

/** Admin-visible payout arrangement gate (documented in env.ts). */
route("GET", "payments/arrangement-status", async () => {
  return ok({
    collectionsAllowed,
    payoutsAllowedHere: payoutRecordingAllowed,
    paymentsLiveEnabled: PAYMENTS_LIVE_ENABLED,
    note: "Centralized collection + manual payouts require explicit Razorpay approval; live mode stays disabled until confirmed.",
  });
});

export { feeOf };
