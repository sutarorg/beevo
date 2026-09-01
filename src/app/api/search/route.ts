import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { posts, socialAccounts } from "@/db/schema";
import { handler, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const { workspace } = await requireUser();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return ok({ posts: [], accounts: [] });

  const pattern = `%${q}%`;
  const [postHits, accountHits] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(and(eq(posts.workspaceId, workspace.id), ilike(posts.caption, pattern)))
      .limit(6),
    db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.workspaceId, workspace.id),
          or(ilike(socialAccounts.handle, pattern), ilike(socialAccounts.displayName, pattern), ilike(socialAccounts.platform, pattern))
        )
      )
      .limit(5),
  ]);

  return ok({
    posts: postHits.map((p) => ({
      id: p.id,
      caption: p.caption,
      status: p.status,
      platforms: p.platforms,
      scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
    })),
    accounts: accountHits.map((a) => ({
      id: a.id,
      platform: a.platform,
      handle: a.handle,
      connected: a.status !== "disconnected",
    })),
  });
});
