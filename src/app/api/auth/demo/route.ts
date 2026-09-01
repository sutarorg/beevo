import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces, workspaceMembers } from "@/db/schema";
import { handler, ok, clientIp, ApiError } from "@/lib/server/http";
import { createSession, hashPassword, setSessionCookie } from "@/lib/server/session";
import { rateLimit } from "@/lib/server/rate-limit";
import { seedWorkspace } from "@/lib/server/seed";
import { env } from "@/lib/server/env";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const DEMO_EMAIL = "demo@beevo.app";

/**
 * One-click demo login: creates (or reuses) a fully seeded demo workspace.
 * Disabled automatically when DEMO_SEED=false.
 */
export const POST = handler(async (req: Request) => {
  if (!env.demoSeed()) throw new ApiError(404, "Not found");
  const ip = clientIp(req);
  const rl = rateLimit(`demo:${ip}`, 6, 10 * 60 * 1000);
  if (!rl.ok) throw new ApiError(429, `Too many attempts — retry in ${rl.retryAfterSec}s`);

  let [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  let workspaceId: string | null = null;

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ name: "Aarushi Mehta", email: DEMO_EMAIL, passwordHash: await hashPassword(randomToken(24)) })
      .returning();
    const [ws] = await db
      .insert(workspaces)
      .values({ name: "Beevo Studio", slug: `beevo-studio-${randomToken(3)}`, plan: "free" })
      .returning();
    await db.insert(workspaceMembers).values({ workspaceId: ws.id, userId: user.id, role: "owner" });
    await seedWorkspace(ws.id, user.id, { demo: true });
    workspaceId = ws.id;
  } else {
    const [membership] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1);
    workspaceId = membership?.workspaceId ?? null;
  }
  if (!workspaceId) throw new ApiError(500, "Demo workspace could not be created");

  const { token, expiresAt } = await createSession(user.id, workspaceId, {
    userAgent: req.headers.get("user-agent"),
    ip,
  });
  await setSessionCookie(token, expiresAt);

  return ok({ user: { id: user.id, name: user.name, email: user.email } });
});
