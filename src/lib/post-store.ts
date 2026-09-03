import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { posts, postTargets, socialAccounts } from "@/db/schema";
import type { PlatformId, Post, PostStatus } from "./types";
import { platformById } from "./constants";

/** Platforms the workspace has actually connected (live or simulated). */
export async function connectedPlatforms(workspaceId: string): Promise<Set<PlatformId>> {
  const rows = await db
    .select({ platform: socialAccounts.platform })
    .from(socialAccounts)
    .where(and(eq(socialAccounts.workspaceId, workspaceId), inArray(socialAccounts.status, ["connected", "simulated"])));
  return new Set(rows.map((r) => r.platform as PlatformId));
}

export interface PlatformGateResult {
  ok: boolean;
  error?: string;
}

/**
 * Server-side publication gate (cannot be bypassed by the client):
 *  - every selected platform must have a LIVE connected account
 *  - YouTube targets reject image assets entirely (Shorts-only)
 */
export async function gateForPublish(
  workspaceId: string,
  platforms: PlatformId[],
  media: string[]
): Promise<PlatformGateResult> {
  const live = await connectedPlatforms(workspaceId);
  const missing = platforms.filter((p) => !live.has(p));
  if (missing.length) {
    return {
      ok: false,
      error: `No connected ${missing.map((m) => platformById(m).name).join(", ")} account — connect ${missing.length > 1 ? "them" : "it"} from Accounts first.`,
    };
  }
  if (platforms.includes("youtube")) {
    const images = media.filter((m) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(m));
    if (images.length) {
      return { ok: false, error: "YouTube posts cannot include images — attach a Short (vertical video ≤ 3 min)." };
    }
  }
  return { ok: true };
}

/**
 * Workspace-scoped post persistence (PostgreSQL via Drizzle).
 * Every query is constrained by workspaceId — no cross-tenant reads.
 */

function rowToPost(r: typeof posts.$inferSelect): Post {
  return {
    id: r.id,
    caption: r.caption,
    platforms: (r.platforms ?? []) as PlatformId[],
    status: r.status as PostStatus,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    media: r.media ?? [],
    metrics: r.metrics ?? { likes: 0, comments: 0, shares: 0, impressions: 0 },
    aiAssisted: !!r.aiAssisted,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export interface PostInput {
  caption?: string;
  platforms?: PlatformId[];
  status?: PostStatus;
  scheduledAt?: string | null;
  media?: string[];
  aiAssisted?: boolean;
}

export async function listPosts(
  workspaceId: string,
  filters: { status?: PostStatus | null; platform?: PlatformId | null } = {}
): Promise<Post[]> {
  const conds = [eq(posts.workspaceId, workspaceId)];
  if (filters.status) conds.push(eq(posts.status, filters.status));
  const rows = await db
    .select()
    .from(posts)
    .where(and(...conds))
    .orderBy(asc(posts.scheduledAt), desc(posts.createdAt));
  let out = rows.map(rowToPost);
  if (filters.platform) out = out.filter((p) => p.platforms.includes(filters.platform!));
  return out;
}

export async function getPost(workspaceId: string, id: string): Promise<Post | null> {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ? rowToPost(rows[0]) : null;
}

/** Rebuild pending publish targets for the selected platforms. */
async function syncTargets(postId: string, workspaceId: string, platforms: string[]) {
  await db.delete(postTargets).where(and(eq(postTargets.postId, postId), eq(postTargets.status, "pending")));
  if (!platforms.length) return;
  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.workspaceId, workspaceId), inArray(socialAccounts.status, ["connected", "simulated"])));
  for (const platform of platforms) {
    const account = accounts.find((a) => a.platform === platform);
    await db.insert(postTargets).values({
      postId,
      platform,
      socialAccountId: account?.id ?? null,
      status: "pending",
    });
  }
}

export async function createPost(
  workspaceId: string,
  createdById: string | null,
  input: PostInput
): Promise<Post> {
  const inserted = await db
    .insert(posts)
    .values({
      workspaceId,
      createdById,
      caption: input.caption ?? "",
      platforms: input.platforms ?? [],
      status: input.status ?? "draft",
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      media: input.media ?? [],
      aiAssisted: input.aiAssisted ? 1 : 0,
    })
    .returning();
  const row = inserted[0];
  if (row.status === "scheduled") await syncTargets(row.id, workspaceId, row.platforms ?? []);
  return rowToPost(row);
}

export async function updatePost(
  workspaceId: string,
  id: string,
  input: PostInput & { publishedAt?: string | null }
): Promise<Post | null> {
  const updated = await db
    .update(posts)
    .set({
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.platforms !== undefined ? { platforms: input.platforms } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.scheduledAt !== undefined
        ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null }
        : {}),
      ...(input.media !== undefined ? { media: input.media } : {}),
      ...(input.aiAssisted !== undefined ? { aiAssisted: input.aiAssisted ? 1 : 0 } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)))
    .returning();
  const row = updated[0];
  if (!row) return null;
  // Resync targets whenever platforms or scheduling intent changed.
  if (input.platforms !== undefined || input.status !== undefined || input.scheduledAt !== undefined) {
    if (row.status === "scheduled") await syncTargets(row.id, workspaceId, row.platforms ?? []);
    else if (row.status !== "published")
      await db.delete(postTargets).where(and(eq(postTargets.postId, row.id), eq(postTargets.status, "pending")));
  }
  return rowToPost(row);
}

export async function deletePost(workspaceId: string, id: string): Promise<boolean> {
  const del = await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)))
    .returning({ id: posts.id });
  return del.length > 0;
}

export async function duplicatePost(workspaceId: string, createdById: string | null, id: string): Promise<Post | null> {
  const src = await getPost(workspaceId, id);
  if (!src) return null;
  return createPost(workspaceId, createdById, {
    caption: src.caption,
    platforms: src.platforms,
    status: "draft",
    scheduledAt: null,
    media: src.media,
    aiAssisted: src.aiAssisted,
  });
}
