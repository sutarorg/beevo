import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { enrollments, sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { route } from "@/server/router";
import { clientIp, fail, ok, parseBody, rateLimit, requireUser } from "@/server/http";
import {
  consumeAuthToken,
  createSession,
  destroyCurrentSession,
  hashPassword,
  issueAuthToken,
  newId,
  setSessionCookie,
  verifyPassword,
} from "@/server/auth";
import { emailShell, queueEmail } from "@/server/email";
import { ensureHandleFor, suggestHandle } from "@/server/handles";
import { resolveRequestBaseUrl } from "@/server/env";
import { audit } from "@/server/audit";
import {
  emailSchema,
  forgotPasswordSchema,
  fullNameSchema,
  passwordSchema,
} from "@/lib/validation";

const signupSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Session payload, including which account kinds this one email holds.
 * `hasBothAccounts` is what turns the Learner/Creator toggle on in the UI —
 * with only one kind of account there is nothing to toggle between.
 */
async function sessionPayload(user: typeof users.$inferSelect) {
  const isCreator = Boolean(user.creatorTermsAcceptedAt);
  let isLearner = Boolean(user.learnerEnabledAt);
  if (!isLearner) {
    // Legacy rows: any enrolment means the email already learns here.
    const enrolment = await db.query.enrollments.findFirst({
      where: eq(enrollments.userId, user.id),
      columns: { id: true },
    });
    isLearner = Boolean(enrolment);
  }
  return {
    user: { id: user.id, email: user.email, fullName: user.name },
    accessToken: "session-cookie",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    isCreatorWithHandle: Boolean(user.handle),
    handle: user.handle,
    isCreator,
    isLearner,
    hasBothAccounts: isCreator && isLearner,
    creatorTermsAcceptedAt: user.creatorTermsAcceptedAt?.toISOString() ?? null,
  };
}

async function sendVerificationEmail(user: typeof users.$inferSelect, baseUrl: string) {
  const token = await issueAuthToken(user.id, "verify", 24 * 60 * 60 * 1000);
  const url = `${baseUrl}/api/v1/auth/verify?token=${token}`;
  await queueEmail({
    userId: user.id,
    to: user.email,
    subject: "Verify your Beevo email",
    template: "email_verification",
    dedupeKey: `verify:${user.id}:${token.slice(0, 8)}`,
    html: emailShell(
      "Verify your email",
      `<p>Hi ${user.name.split(" ")[0]},</p><p>Confirm this email to activate your creator profile.</p><p style="margin:20px 0"><a href="${url}" style="background:#e8490f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Verify email</a></p><p style="font-size:12px;color:#5c543f">Or paste: ${url}</p>`,
    ),
    text: `Verify your Beevo email: ${url}`,
  });
}

route("POST", "auth/signup", async (req) => {
  if (!rateLimit(`signup:${clientIp(req)}`, 10, 60_000)) {
    return fail("rate_limited", "Too many attempts — wait a minute.", 429);
  }
  const parsed = parseBody(signupSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const { fullName, email, password } = parsed.values;
  const emailNorm = email.trim().toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, emailNorm) });
  if (existing) {
    return fail(
      "email_already_in_use",
      "An account already exists for this email. Try logging in instead.",
      409,
      { email: ["An account already exists for this email."] },
    );
  }

  let user: typeof users.$inferSelect;
  try {
    const [created] = await db
      .insert(users)
      .values({
        id: newId("usr"),
        email: emailNorm,
        name: fullName.trim(),
        passwordHash: hashPassword(password),
        // Website signup is creator signup: the auth screens state that
        // continuing means agreeing to the Terms (which include the creator
        // terms), so the creator account is enabled from day one.
        creatorTermsAcceptedAt: new Date(),
      })
      .returning();
    user = created;
  } catch (error) {
    const code =
      (error as { cause?: { code?: string }; code?: string })?.cause?.code ??
      (error as { code?: string })?.code;
    if (code === "23505") {
      return fail(
        "email_already_in_use",
        "An account already exists for this email. Try logging in instead.",
        409,
        { email: ["An account already exists for this email."] },
      );
    }
    throw error;
  }

  // Every account gets a storefront address immediately, so /@handle is live
  // from the first login instead of 404-ing on a NULL handle.
  try {
    const handle = await suggestHandle(user.name, user.email);
    const [withHandle] = await db
      .update(users)
      .set({ handle, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    if (withHandle) user = withHandle;
  } catch (error) {
    // A handle is helpful, not essential to account creation — never fail signup.
    console.error("[auth] handle assignment failed:", error);
  }

  await audit({
    actorId: user.id,
    actorLabel: user.name,
    area: "system",
    action: "user_registered",
    detail: `New account registered (${emailNorm}).`,
    kind: "event",
  });
  await sendVerificationEmail(user, resolveRequestBaseUrl(req));
  return ok({ email: user.email, verificationRequired: true as const }, { status: 201 });
});

route("POST", "auth/resend-verification", async (req) => {
  const parsed = parseBody(z.object({ email: emailSchema }), await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  // Anti-enumeration: same response either way.
  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.values.email.trim().toLowerCase()),
  });
  if (user && !user.emailVerifiedAt) {
    await sendVerificationEmail(user, resolveRequestBaseUrl(req));
  }
  return ok({ email: parsed.values.email });
});

route("POST", "auth/login", async (req) => {
  if (!rateLimit(`login:${clientIp(req)}`, 8, 60_000)) {
    return fail("rate_limited", "Too many attempts — wait a minute.", 429);
  }
  const parsed = parseBody(loginSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.values.email.trim().toLowerCase()),
  });
  const passwordOk = user ? verifyPassword(parsed.values.password, user.passwordHash) : false;
  if (!user || !passwordOk) {
    return fail(
      "invalid_credentials",
      "Incorrect email or password. Check your details and try again.",
      401,
    );
  }
  if (user.suspendedAt) {
    return fail("account_suspended", "This account is suspended. Contact support.", 403);
  }
  // Legacy CREATOR accounts created before handles existed get one on next
  // sign-in. Learner-only accounts stay handle-less until they explicitly
  // start teaching — an address must never appear without that agreement.
  if (!user.handle && user.creatorTermsAcceptedAt) {
    try {
      const handle = await ensureHandleFor(user);
      if (handle) user.handle = handle;
    } catch (error) {
      console.error("[auth] handle backfill failed:", error);
    }
  }
  const token = await createSession(user.id);
  await setSessionCookie(token);
  return ok(await sessionPayload(user));
});

route("POST", "auth/logout", async () => {
  await destroyCurrentSession();
  return ok({ success: true as const });
});

route("GET", "auth/session", async (_req, ctx) => {
  if (!ctx.user) {
    return ok(
      { user: null, isAdmin: false, isCreator: false, isLearner: false, hasBothAccounts: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return ok(
    { ...(await sessionPayload(ctx.user)), isAdmin: ctx.isAdmin },
    { headers: { "Cache-Control": "no-store" } },
  );
});

/**
 * "Start teaching": turns the signed-in learner account into a dual
 * learner + creator account for the same email. Requires an explicit
 * `agreed: true` (the popup's creator terms + "I agree"); records when the
 * terms were accepted, assigns the storefront handle, and audits it.
 * Idempotent — agreeing twice keeps the original acceptance time.
 */
route("POST", "auth/start-teaching", async (req, ctx) => {
  const user = requireUser(ctx);
  if (user instanceof NextResponse) return user;
  const parsed = parseBody(
    z.object({
      agreed: z.literal(true, {
        message: "Please read the creator terms and tick “I agree” to continue.",
      }),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;

  let me = user;
  if (!me.creatorTermsAcceptedAt || !me.handle) {
    const handle = me.handle ?? (await suggestHandle(me.name, me.email));
    const [updated] = await db
      .update(users)
      .set({
        handle,
        creatorTermsAcceptedAt: me.creatorTermsAcceptedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, me.id))
      .returning();
    if (updated) me = updated;
    await audit({
      actorId: me.id,
      actorLabel: me.name,
      area: "system",
      action: "creator_account_enabled",
      detail: `Learner account enabled Creator via Start teaching (@${handle}).`,
      kind: "event",
    });
  }
  return ok({ ...(await sessionPayload(me)), isAdmin: ctx.isAdmin });
});

route("POST", "auth/forgot", async (req) => {
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 60_000)) {
    return fail("rate_limited", "Too many attempts — wait a minute.", 429);
  }
  const parsed = parseBody(forgotPasswordSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const emailNorm = parsed.values.email.trim().toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, emailNorm) });
  if (user) {
    const token = await issueAuthToken(user.id, "reset", 60 * 60 * 1000);
    const baseUrl = resolveRequestBaseUrl(req);
    const url = `${baseUrl}/forgot-password/reset?token=${token}`;
    await queueEmail({
      userId: user.id,
      to: user.email,
      subject: "Reset your Beevo password",
      template: "password_reset",
      dedupeKey: `reset:${user.id}:${token.slice(0, 8)}`,
      html: emailShell(
        "Reset your password",
        `<p>We received a request to reset your password.</p><p style="margin:20px 0"><a href="${url}" style="background:#17130b;color:#f6f0e2;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Choose a new password</a></p><p style="font-size:12px;color:#5c543f">This link expires in 60 minutes. If you didn't ask for it, ignore this email.</p>`,
      ),
      text: `Reset your Beevo password (valid 60 min): ${url}`,
    });
  }
  // Anti-enumeration: identical response regardless.
  return ok({ email: emailNorm });
});

route("POST", "auth/reset", async (req) => {
  const parsed = parseBody(
    z.object({ token: z.string().min(1), password: passwordSchema }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const userId = await consumeAuthToken(parsed.values.token, "reset");
  if (!userId) {
    return fail(
      "invalid_reset_token",
      "This reset link is invalid or has expired. Request a fresh one.",
      400,
    );
  }
  await db
    .update(users)
    .set({ passwordHash: hashPassword(parsed.values.password), updatedAt: new Date() })
    .where(eq(users.id, userId));
  // Invalidate all existing sessions after a password change.
  await db.delete(sessions).where(eq(sessions.userId, userId));
  return ok({ success: true as const });
});

/** Email verification landing: consumes the token, then redirects with UX state. */
route("GET", "auth/verify", async (req) => {
  const baseUrl = resolveRequestBaseUrl(req);
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = token ? await consumeAuthToken(token, "verify") : null;
  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/login?error=verification_failed`, 302);
  }
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
  await audit({
    actorId: userId,
    actorLabel: "user",
    area: "system",
    action: "email_verified",
    detail: "Email address verified by link.",
    kind: "event",
  });
  return NextResponse.redirect(`${baseUrl}/login?notice=verified`, 302);
});
