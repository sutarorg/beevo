import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { hashPassword, requireUser, verifyPassword } from "@/lib/server/session";
import { sendMail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const base = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72)
    .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
      message: "Use at least one letter and one number",
    }),
  confirmPassword: z.string().max(72),
});

/**
 * Password rules honour the real authentication provider (server-driven):
 *  - Google-created accounts with NO user-set password → set one directly;
 *    no "current password" asked (they never had one).
 *  - Email/password accounts (or OAuth users who already set one) → the
 *    current password is mandatory.
 */
export const POST = handler(async (req: Request) => {
  const { user, session } = await requireUser();
  const body = await parseBody(req, base);

  if (body.newPassword !== body.confirmPassword) {
    throw new ApiError(422, "Passwords do not match", undefined);
  }

  const mustVerifyCurrent = !!user.passwordSetAt;
  if (mustVerifyCurrent) {
    if (!body.currentPassword) throw new ApiError(422, "Enter your current password");
    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) throw new ApiError(400, "Your current password is incorrect");
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(body.newPassword), passwordSetAt: new Date() })
    .where(eq(users.id, user.id));

  // Invalidate every OTHER session on this account.
  await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, session.id)));

  void sendMail({
    to: user.email,
    subject: mustVerifyCurrent ? "Your Beevo password was changed" : "A password was added to your Beevo account",
    html: `<p>Hi ${user.name},</p><p>${
      mustVerifyCurrent
        ? "Your Beevo password was just changed and all other signed-in devices were logged out."
        : "A sign-in password was just added to your Beevo account. You can now also log in with email + password."
    }</p><p>If this wasn't you, contact support immediately.</p>`,
  });

  return ok({
    ok: true,
    hasPassword: true,
    message: mustVerifyCurrent
      ? "Password updated — other devices were signed out"
      : "Password created — you can also log in with email + password now",
  });
});
