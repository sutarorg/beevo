import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { route } from "@/server/router";
import { clientIp, fail, ok, parseBody, rateLimit } from "@/server/http";
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

function sessionPayload(user: typeof users.$inferSelect) {
  return {
    user: { id: user.id, email: user.email, fullName: user.name },
    accessToken: "session-cookie",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    isCreatorWithHandle: Boolean(user.handle),
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
  // Legacy accounts created before handles existed get one on next sign-in.
  if (!user.handle) {
    try {
      const handle = await ensureHandleFor(user);
      if (handle) user.handle = handle;
    } catch (error) {
      console.error("[auth] handle backfill failed:", error);
    }
  }
  const token = await createSession(user.id);
  await setSessionCookie(token);
  return ok(sessionPayload(user));
});

route("POST", "auth/logout", async () => {
  await destroyCurrentSession();
  return ok({ success: true as const });
});

route("GET", "auth/session", async (_req, ctx) => {
  if (!ctx.user) return ok({ user: null, isAdmin: false });
  return ok({ ...sessionPayload(ctx.user), isAdmin: ctx.isAdmin });
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
