import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  workspaceName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(160).optional(),
  timezone: z.string().trim().max(64).optional(),
  digest: z.boolean().optional(),
});

export const PATCH = handler(async (req: Request) => {
  const { user, workspace, member } = await requireUser();
  const body = await parseBody(req, schema);

  if (body.email && body.email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()))
      .limit(1);
    if (existing[0]) throw new ApiError(409, "That email is already in use");
  }

  const prefs = {
    timezone: body.timezone ?? user.prefs?.timezone ?? "Asia/Kolkata (GMT+5:30)",
    digest: body.digest ?? user.prefs?.digest ?? true,
  };

  const [updated] = await db
    .update(users)
    .set({
      ...(body.name ? { name: body.name } : {}),
      ...(body.email ? { email: body.email.toLowerCase() } : {}),
      prefs,
    })
    .where(eq(users.id, user.id))
    .returning();

  if (body.workspaceName && body.workspaceName !== workspace.name) {
    if (member.role !== "owner" && member.role !== "admin") {
      throw new ApiError(403, "Only owners and admins can rename the workspace");
    }
    await db.update(workspaces).set({ name: body.workspaceName }).where(eq(workspaces.id, workspace.id));
  }

  return ok({
    user: {
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      timezone: prefs.timezone,
      digest: prefs.digest,
    },
  });
});
