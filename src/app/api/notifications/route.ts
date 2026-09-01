import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handler, ok, parseBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

export const GET = handler(async () => {
  const { workspace } = await requireUser();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.workspaceId, workspace.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return ok({
    notifications: rows.map((n) => ({ ...n, time: n.createdAt.toISOString() })),
  });
});

export const PATCH = handler(async (req: Request) => {
  const { workspace } = await requireUser();
  const body = await parseBody(req, patchSchema);
  if (body.all) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.workspaceId, workspace.id));
  } else if (body.id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, body.id), eq(notifications.workspaceId, workspace.id)));
  }
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.workspaceId, workspace.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return ok({
    notifications: rows.map((n) => ({ ...n, time: n.createdAt.toISOString() })),
  });
});
