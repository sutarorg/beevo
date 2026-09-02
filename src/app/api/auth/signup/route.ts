import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces, workspaceMembers } from "@/db/schema";
import { handler, ok, parseBody, clientIp, ApiError } from "@/lib/server/http";
import { createSession, hashPassword, setSessionCookie } from "@/lib/server/session";
import { seedWorkspace } from "@/lib/server/seed";
import { env } from "@/lib/server/env";
import { emails, sendMail } from "@/lib/server/email";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  workspaceName: z.string().trim().min(2).max(80).optional(),
  plan: z.enum(["free", "pro"]).optional(), // pro activates only after payment
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "hive"
  );
}

export const POST = handler(async (req: Request) => {
  const ip = clientIp(req);
  void ip;
  const body = await parseBody(req, schema);
  const email = body.email.toLowerCase();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) throw new ApiError(409, "An account with this email already exists — log in instead", "EMAIL_TAKEN");

  const passwordHash = await hashPassword(body.password);
  const [user] = await db.insert(users).values({ name: body.name, email, passwordHash }).returning();

  const wsName = body.workspaceName || `${body.name.split(" ")[0]}'s hive`;
  const [workspace] = await db
    .insert(workspaces)
    .values({ name: wsName, slug: `${slugify(wsName)}-${randomToken(3)}`, plan: "free" })
    .returning();
  await db.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: user.id, role: "owner" });

  await seedWorkspace(workspace.id, user.id, { demo: env.demoSeed() });

  const { token, expiresAt } = await createSession(user.id, workspace.id, {
    userAgent: req.headers.get("user-agent"),
    ip,
  });
  await setSessionCookie(token, expiresAt);

  void sendMail({ to: email, subject: "Welcome to Beevo", html: emails.welcome(user.name) });

  return ok(
    {
      user: { id: user.id, name: user.name, email: user.email },
      workspace: { id: workspace.id, name: workspace.name, plan: workspace.plan },
    },
    201
  );
});
