import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceMembers } from "@/db/schema";
import { handler, ok, parseBody, clientIp, ApiError } from "@/lib/server/http";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/server/session";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required").max(72),
});

export const POST = handler(async (req: Request) => {
  const ip = clientIp(req);
  const body = await parseBody(req, schema);
  const email = body.email.toLowerCase();

  const rl = rateLimit(`login:${ip}:${email}`, 8, 10 * 60 * 1000);
  if (!rl.ok) throw new ApiError(429, `Too many login attempts — retry in ${rl.retryAfterSec}s`);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Constant-shape response regardless of which check failed.
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);
  if (!membership) throw new ApiError(403, "This account has no workspace — contact support");

  const { token, expiresAt } = await createSession(user.id, membership.workspaceId, {
    userAgent: req.headers.get("user-agent"),
    ip,
  });
  await setSessionCookie(token, expiresAt);

  return ok({ user: { id: user.id, name: user.name, email: user.email } });
});
