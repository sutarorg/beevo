import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, workspaces } from "@/db/schema";
import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const POST = handler(async () => {
  const { workspace, member } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't manage billing");
  await db
    .update(workspaces)
    .set({ plan: "free", planRenewsAt: null })
    .where(eq(workspaces.id, workspace.id));
  await db.insert(notifications).values({
    workspaceId: workspace.id,
    kind: "plan",
    title: "Switched to the Free plan",
    body: "Pro features are paused — your posts and history are safe.",
  });
  return ok({ plan: "free", message: "Switched to the Free plan." });
});
