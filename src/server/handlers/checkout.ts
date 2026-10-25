import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  checkoutVerifications,
  commissionLedger,
  courses,
  enrollments,
  orders,
  payments,
  users,
  webhookEvents,
} from "@/db/schema";
import { route } from "@/server/router";
import { clientIp, fail, ok, parseBody, rateLimit } from "@/server/http";
import { createSession, hashPassword, newId, setSessionCookie } from "@/server/auth";
import { audit } from "@/server/audit";
import { emailShell, notifyInApp, queueEmail } from "@/server/email";
import {
  APP_BASE_URL,
  IS_PROD,
  collectionsAllowed,
  PAYMENTS_LIVE_ENABLED,
  PLATFORM_COMMISSION_BPS,
  payoutRecordingAllowed,
  RAZORPAY_KEY_ID,
  RESEND_API_KEY,
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
import { emailSchema } from "@/lib/validation";
import type { CheckoutAccountInfo } from "@/lib/learner-types";

/**
 * Checkout + webhook.
 *
 * The buyer never has to create an account before paying. Checkout proves the
 * delivery inbox with a one-time code, provisions (or reuses) the learner
 * account, takes payment through Razorpay, and only grants access after the
 * server verifies the payment signature (or webhook). Commission base: the
 * captured eligible sale amount (gross_in_paise); 8% is recorded once per
 * order/payment in the same transaction as the enrolment.
 */

const COMMISSION_RATE = PLATFORM_COMMISSION_BPS / 10_000;
const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TOKEN_TTL_MS = 30 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
/** Email delivery is unconfigured only in development, where the code is shown in-app. */
const PREVIEW_EMAIL_MODE = !RESEND_API_KEY && !IS_PROD;

function feeOf(grossInPaise: number): number {
  return Math.round(grossInPaise * COMMISSION_RATE);
}

const hmac = (value: string) =>
  createHmac("sha256", process.env.AUTH_SECRET || "dev-only-secret-change-me-in-production")
    .update(value)
    .digest("hex");

const otpHash = (email: string, code: string) => hmac(`checkout-otp:${email}:${code}`);
const tokenHashOf = (token: string) => hmac(`checkout-token:${token}`);

function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/** Nine-digit numeric dashboard password (never starts with 0). */
function generateDashboardPassword(): string {
  return String(randomInt(100_000_000, 1_000_000_000));
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Learner";
  return local
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 80);
}

/** Account provisioning shared by free and paid checkout. */
async function ensureBuyerAccount(email: string): Promise<{
  user: typeof users.$inferSelect;
  created: boolean;
}> {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { user: existing, created: false };
  const inserted = await db
    .insert(users)
    .values({
      id: newId("usr"),
      email,
      name: nameFromEmail(email),
      // Placeholder until the dashboard password is generated after a
      // successful payment (or immediately for a free course).
      passwordHash: hashPassword(randomBytes(32).toString("hex")),
      emailVerifiedAt: new Date(),
      provisionedViaCheckout: true,
      // Checkout creates the LEARNER account for this email. Creator is a
      // separate, explicit opt-in ("Start teaching") — never implied here.
      learnerEnabledAt: new Date(),
    })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (inserted[0]) return { user: inserted[0], created: true };
  // Two tabs verified the same email at once — reuse the winning row.
  const raced = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!raced) throw new Error("checkout_account_provision_failed");
  return { user: raced, created: false };
}

async function signInBuyer(userId: string): Promise<void> {
  const token = await createSession(userId);
  await setSessionCookie(token);
}

async function sendCheckoutCode(email: string, code: string): Promise<{ status: string }> {
  return queueEmail({
    to: email,
    subject: `Your Beevo checkout code: ${code}`,
    template: "checkout_verification",
    // Every issued code gets its own row; a resend is a new code, not a duplicate.
    dedupeKey: `checkout_otp:${email}:${createHash("sha256").update(code + Date.now()).digest("hex").slice(0, 24)}`,
    html: emailShell(
      "Confirm your email to continue",
      `<p>Your one-time checkout code is:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:16px 0">${code}</p><p>Enter it in the checkout window to continue. It expires in 10 minutes and can be used once.</p><p style="font-size:12px;color:#5c543f">If you didn't start a purchase on Beevo, you can ignore this email — no order exists until you confirm.</p>`,
    ),
    text: `Your Beevo checkout code is ${code}. It expires in 10 minutes.`,
  });
}

// ---------------------------------------------------------------------------
// 1. Email verification (OTP)
// ---------------------------------------------------------------------------

route("POST", "checkout/verification/start", async (req) => {
  if (!rateLimit(`checkout-otp-ip:${clientIp(req)}`, 12, 60_000)) {
    return fail("rate_limited", "Slow down — too many codes requested. Try again in a minute.", 429);
  }
  const parsed = parseBody(
    z.object({ email: emailSchema }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const email = parsed.values.email.trim().toLowerCase();
  if (!rateLimit(`checkout-otp-email:${email}`, 5, 60_000)) {
    return fail("rate_limited", "A code was just sent. Wait a minute before asking for another.", 429);
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(checkoutVerifications).values({
    id: newId("cov"),
    email,
    codeHash: otpHash(email, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  const delivered = await sendCheckoutCode(email, code);
  if (delivered.status !== "sent" && !PREVIEW_EMAIL_MODE) {
    return fail(
      "email_failed",
      "We couldn't send the verification email right now. Nothing was charged — try again in a moment.",
      502,
    );
  }
  await audit({
    actorId: null,
    actorLabel: email,
    area: "payments",
    action: "checkout_code_sent",
    detail: "Checkout email verification code issued.",
    kind: "event",
  });

  return ok({
    sent: true as const,
    email,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    delivery: PREVIEW_EMAIL_MODE ? ("preview" as const) : ("email" as const),
    // In development without a mail provider the app shows the code so the
    // flow can be completed. Never returned in production.
    previewCode: PREVIEW_EMAIL_MODE ? code : undefined,
  });
});

route("POST", "checkout/verification/confirm", async (req) => {
  if (!rateLimit(`checkout-otp-confirm:${clientIp(req)}`, 20, 60_000)) {
    return fail("rate_limited", "Too many attempts — wait a minute and try again.", 429);
  }
  const parsed = parseBody(
    z.object({
      email: emailSchema,
      code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const email = parsed.values.email.trim().toLowerCase();

  const row = await db.query.checkoutVerifications.findFirst({
    where: and(
      eq(checkoutVerifications.email, email),
      isNull(checkoutVerifications.verifiedAt),
      gt(checkoutVerifications.expiresAt, new Date()),
    ),
    orderBy: [desc(checkoutVerifications.createdAt)],
  });
  if (!row) {
    return fail(
      "code_expired",
      "That code has expired. Request a new one and try again.",
      410,
    );
  }
  if (row.attempts >= MAX_OTP_ATTEMPTS) {
    return fail(
      "code_attempts_exceeded",
      "Too many incorrect attempts for this code. Request a new one.",
      429,
    );
  }
  if (!safeEqual(row.codeHash, otpHash(email, parsed.values.code))) {
    await db
      .update(checkoutVerifications)
      .set({ attempts: row.attempts + 1 })
      .where(eq(checkoutVerifications.id, row.id));
    const left = MAX_OTP_ATTEMPTS - (row.attempts + 1);
    return fail(
      "code_incorrect",
      left > 0
        ? `That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`
        : "That code isn't right, and no attempts are left. Request a new one.",
      400,
    );
  }

  const token = randomBytes(24).toString("base64url");
  await db
    .update(checkoutVerifications)
    .set({
      verifiedAt: new Date(),
      tokenHash: tokenHashOf(token),
      expiresAt: new Date(Date.now() + VERIFIED_TOKEN_TTL_MS),
    })
    .where(eq(checkoutVerifications.id, row.id));

  return ok({
    verified: true as const,
    email,
    verificationToken: token,
    expiresAt: new Date(Date.now() + VERIFIED_TOKEN_TTL_MS).toISOString(),
  });
});

async function requireVerifiedEmail(email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  const row = await db.query.checkoutVerifications.findFirst({
    where: and(
      eq(checkoutVerifications.email, email),
      eq(checkoutVerifications.tokenHash, tokenHashOf(token)),
      gt(checkoutVerifications.expiresAt, new Date()),
    ),
  });
  return Boolean(row?.verifiedAt);
}

// ---------------------------------------------------------------------------
// 2. Order creation (free or paid) — no pre-existing account required
// ---------------------------------------------------------------------------

route("POST", "checkout", async (req) => {
  if (!rateLimit(`checkout:${clientIp(req)}`, 15, 60_000)) {
    return fail("rate_limited", "Slow down — too many checkout attempts.", 429);
  }
  const parsed = parseBody(
    z.object({
      courseId: z.string().min(1),
      email: emailSchema,
      verificationToken: z.string().min(10),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const email = parsed.values.email.trim().toLowerCase();

  const verified = await requireVerifiedEmail(email, parsed.values.verificationToken);
  if (!verified) {
    return fail(
      "email_not_verified",
      "Verify this email before paying — your purchase and login are tied to it.",
      401,
    );
  }

  // Authoritative price: ALWAYS the current database value.
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, parsed.values.courseId),
  });
  if (!course || course.status !== "published" || course.priceInPaise === null || course.priceInPaise < 0) {
    return fail("not_purchasable", "This course isn't available for purchase right now.", 404);
  }
  const creator = await db.query.users.findFirst({ where: eq(users.id, course.creatorId) });
  if (!creator || creator.suspendedAt) {
    return fail("not_purchasable", "This course isn't available for purchase right now.", 404);
  }

  const gross = course.priceInPaise;

  // Fail before provisioning an account when the gateway can't take money.
  if (gross > 0) {
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
        "Payments aren't configured yet (Razorpay keys missing). This course can't be purchased until they're added.",
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
  }

  const buyer = await ensureBuyerAccount(email);
  if (buyer.user.suspendedAt) {
    return fail("account_suspended", "This account is suspended. Contact support.", 403);
  }
  if (buyer.user.id === course.creatorId) {
    return fail("self_purchase", "That's your own course — open it in your studio instead.", 400);
  }

  const existingEnrolment = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, buyer.user.id), eq(enrollments.courseId, course.id)),
  });
  if (existingEnrolment) {
    // Proven email ownership is enough to re-enter the account they already own.
    await signInBuyer(buyer.user.id);
    return fail("already_enrolled", "This course is already in your library — no second payment is needed.", 409);
  }

  // OTP proved the inbox: sign the buyer in for this browsing session.
  await signInBuyer(buyer.user.id);

  // --- Free course: no gateway, access granted immediately. ---
  if (gross === 0) {
    const orderId = newId("ord");
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        userId: buyer.user.id,
        courseId: course.id,
        courseTitle: course.title,
        grossInPaise: 0,
        platformFeeInPaise: 0,
        creatorShareInPaise: 0,
        status: "paid",
        paidAt: new Date(),
        providerRef: null,
      });
      await tx
        .insert(enrollments)
        .values({ id: newId("enr"), userId: buyer.user.id, courseId: course.id })
        .onConflictDoNothing();
      // First enrolment also opens the learner account for this email
      // (e.g. a creator buying someone else's course becomes dual-account).
      await tx
        .update(users)
        .set({ learnerEnabledAt: new Date() })
        .where(and(eq(users.id, buyer.user.id), isNull(users.learnerEnabledAt)));
    });
    const account = await afterFulfilment(orderId);
    return ok(
      {
        orderId,
        courseId: course.id,
        courseTitle: course.title,
        amountInPaise: 0,
        platformFeeInPaise: 0,
        currency: "INR" as const,
        gateway: "razorpay" as const,
        keyId: RAZORPAY_KEY_ID,
        free: true as const,
        enrolled: true as const,
        buyer: { name: buyer.user.name, email: buyer.user.email },
        account,
      },
      { status: 201 },
    );
  }

  const fee = feeOf(gross);
  let rzpOrder;
  try {
    rzpOrder = await createRazorpayOrder({
      amountInPaise: gross,
      receipt: `ck_${Date.now().toString(36)}`,
      notes: { courseId: course.id, buyerUserId: buyer.user.id },
    });
  } catch {
    await audit({
      actorId: buyer.user.id,
      actorLabel: buyer.user.name,
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
      userId: buyer.user.id,
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
      buyer: { name: buyer.user.name, email: buyer.user.email },
      account: {
        email: buyer.user.email,
        created: buyer.created,
        emailed: false,
      } satisfies CheckoutAccountInfo,
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
        "Paid checkout isn't configured on this deployment yet. Add NEXT_PUBLIC_RAZORPAY_KEY_ID (or RAZORPAY_KEY_ID) and RAZORPAY_KEY_SECRET to the environment, then redeploy. Free courses still enrol instantly.",
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
        ? "Razorpay is in test mode — use test payment details; no real money moves."
        : "Payments are active and processed securely by Razorpay.",
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
    await tx
      .update(users)
      .set({ learnerEnabledAt: new Date() })
      .where(and(eq(users.id, order.userId), isNull(users.learnerEnabledAt)));

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

/**
 * Receipt + dashboard credentials. Idempotent per order (dedupe keys), and
 * generated once per buyer account so a webhook retry can never overwrite a
 * password the learner may already have saved.
 */
async function afterFulfilment(orderId: string): Promise<CheckoutAccountInfo | undefined> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return undefined;
  const buyer = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
  const course = await db.query.courses.findFirst({ where: eq(courses.id, order.courseId) });
  const creator = course
    ? await db.query.users.findFirst({ where: eq(users.id, course.creatorId) })
    : null;
  if (!buyer) return undefined;

  const learnUrl = `${APP_BASE_URL}/learn/courses`;
  const account: CheckoutAccountInfo = {
    email: buyer.email,
    created: buyer.provisionedViaCheckout,
    emailed: false,
  };

  if (buyer.provisionedViaCheckout && !buyer.suspendedAt) {
    const password = generateDashboardPassword();
    // Claim provisioning atomically: verify + webhook can run concurrently and
    // only one of them may set (and email) the dashboard password.
    const claimed = await db
      .update(users)
      .set({
        passwordHash: hashPassword(password),
        provisionedViaCheckout: false,
        emailVerifiedAt: buyer.emailVerifiedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, buyer.id), eq(users.provisionedViaCheckout, true)))
      .returning({ id: users.id });
    if (claimed.length === 0) {
      // Another fulfilment path already provisioned this account.
      account.created = false;
      account.emailed = false;
      return account;
    }

    const sent = await queueEmail({
      userId: buyer.id,
      to: buyer.email,
      subject: `Your Beevo login — ${order.courseTitle} is ready`,
      template: "purchase_credentials",
      dedupeKey: `purchase_credentials:${order.id}`,
      html: emailShell(
        "Your course is ready",
        `<p>Payment confirmed for <strong>${order.courseTitle}</strong>${order.grossInPaise > 0 ? ` (order ${order.id})` : " — free enrolment"}.</p>
         <p>Your learner dashboard is where the course lives. Sign in with:</p>
         <table style="border-collapse:collapse;margin:12px 0"><tr><td style="padding:4px 12px 4px 0;color:#5c543f">Email</td><td style="font-weight:700">${buyer.email}</td></tr><tr><td style="padding:4px 12px 4px 0;color:#5c543f">Password</td><td style="font-family:ui-monospace,monospace;font-weight:700;letter-spacing:2px">${password}</td></tr></table>
         <p style="margin:20px 0"><a href="${learnUrl}" style="background:#e8490f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Open my dashboard</a></p>
         <p style="font-size:12px;color:#5c543f">Keep this email safe. You can change the password after signing in. Course purchases are non-refundable except where required by applicable law.</p>`,
      ),
      text: `Your course ${order.courseTitle} is ready. Sign in at ${learnUrl} with email ${buyer.email} and password ${password}.`,
    });
    account.emailed = sent.status === "sent";
    account.created = true;
    // If the credentials email couldn't be delivered, show the password on the
    // success screen the buyer is already looking at rather than locking them out.
    if (PREVIEW_EMAIL_MODE || !account.emailed) account.password = password;
  } else {
    const sent = await queueEmail({
      userId: buyer.id,
      to: buyer.email,
      subject: `You're enrolled: ${order.courseTitle}`,
      template: "purchase_confirmation",
      dedupeKey: `purchase_email:${order.id}`,
      html: emailShell(
        "You're enrolled",
        `<p>${order.grossInPaise > 0 ? `Payment verified (order ${order.id}). ` : ""}“${order.courseTitle}” is now in your library.</p><p style="margin:20px 0"><a href="${learnUrl}" style="background:#e8490f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Start learning</a></p><p style="font-size:12px;color:#5c543f">Sign in with your existing Beevo password. Course purchases are non-refundable except where required by applicable law.</p>`,
      ),
      text: `Enrolled in ${order.courseTitle}. Start learning: ${learnUrl}`,
    });
    account.emailed = sent.status === "sent";
    account.created = false;
  }

  if (creator) {
    await notifyInApp({
      userId: creator.id,
      template: "sale_made",
      title: "New enrolment",
      body: `${buyer.name} enrolled in “${order.courseTitle}” (₹${(order.grossInPaise / 100).toLocaleString("en-IN")} gross).`,
      dedupeKey: `sale_notice:${order.id}`,
    });
  }
  return account;
}

route("POST", "checkout/verify", async (req, ctx) => {
  // The session was created when this buyer verified their email, so the
  // order can only be completed by the account it belongs to.
  const me = ctx.user;
  if (!me) return fail("auth_required", "Your checkout session expired. Verify your email again.", 401);
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
      note: "Payment already verified — this course is in your library.",
      enrolled: true,
      account: {
        email: me.email,
        created: false,
        emailed: false,
      } satisfies CheckoutAccountInfo,
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
  const account = await afterFulfilment(order.id);
  return ok({
    paymentId: parsed.values.razorpayPaymentId,
    orderId: order.id,
    amountInPaise: order.grossInPaise,
    note: "Payment verified by the server — you're enrolled.",
    enrolled: true,
    account,
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
