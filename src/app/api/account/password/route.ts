import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { hashPassword, requireUser, verifyPassword } from "@/lib/server/session";
import { emails, sendMail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(72),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(72)
      .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
        message: "Use at least one letter and one number",
      }),
    confirmPassword: z.string().max(72),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });

/**
 * Change password. Verifies the current password, re-hashes with bcrypt,
 * then revokes every *other* session (keeps the caller signed in).
 */
export const POST = handler(async (req: Request) => {
  const { user, session } = await requireUser();
  const body = await parseBody(req, schema);

  const valid = await verifyPassword(body.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(400, "Your current password is incorrect");

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(body.newPassword) })
    .where(eq(users.id, user.id));

  // Invalidate all other sessions on this account.
  await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, session.id)));

  void sendMail({
    to: user.email,
    subject: "Your Beevo password was changed",
    html: `<p>Hi ${user.name},</p><p>Your Beevo password was just changed and all other signed-in devices were logged out.</p><p>If this wasn't you, reset your password immediately and contact support.</p>`,
  });
  void emails;

  return ok({ ok: true, message: "Password updated — other devices were signed out" });
});
