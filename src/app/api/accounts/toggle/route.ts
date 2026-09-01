import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().uuid() });

/**
 * Disconnect a social account (tokens are wiped immediately).
 * Connecting happens exclusively through the OAuth flow:
 *   GET /api/oauth/{platform}/authorize
 */
export const POST = handler(async (req: Request) => {
  const { workspace } = await requireUser();
  const { id } = await parseBody(req, schema);

  const [account] = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.id, id), eq(socialAccounts.workspaceId, workspace.id)))
    .limit(1);
  if (!account) throw new ApiError(404, "Account not found");

  if (account.status === "disconnected") {
    throw new ApiError(400, "Use the OAuth flow to connect accounts", "OAUTH_REQUIRED");
  }

  const [updated] = await db
    .update(socialAccounts)
    .set({
      status: "disconnected",
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      lastSyncAt: null,
    })
    .where(eq(socialAccounts.id, account.id))
    .returning();

  return ok({
    account: {
      id: updated.id,
      platform: updated.platform,
      handle: updated.handle,
      name: updated.displayName,
      connected: false,
      followers: updated.followers,
      avatarHue: updated.avatarHue,
      lastSync: null,
      health: "disconnected" as const,
      postsThisWeek: 0,
    },
    message: `${updated.platform} disconnected`,
  });
});
