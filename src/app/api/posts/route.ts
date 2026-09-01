import { z } from "zod";
import { count, eq, and, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { createPost, listPosts } from "@/lib/post-store";
import { PLATFORMS } from "@/lib/constants";
import type { PlatformId, PostStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_PLATFORMS = PLATFORMS.map((p) => p.id) as PlatformId[];

export const GET = handler(async (req: Request) => {
  const { workspace } = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as PostStatus | null;
  const platform = url.searchParams.get("platform") as PlatformId | null;
  const result = await listPosts(workspace.id, { status, platform });
  return ok({ posts: result, total: result.length });
});

const createSchema = z.object({
  caption: z.string().trim().min(1, "Caption is required").max(63_206),
  platforms: z.array(z.enum(["instagram", "facebook", "twitter", "linkedin", "pinterest", "youtube"])).min(1, "Select at least one platform"),
  status: z.enum(["draft", "scheduled"]).default("draft"),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  media: z.array(z.string().max(2048)).max(10).default([]),
  aiAssisted: z.boolean().optional(),
});

export const POST = handler(async (req: Request) => {
  const { user, workspace } = await requireUser();
  const body = await parseBody(req, createSchema);

  // Per-platform character validation.
  for (const p of body.platforms) {
    const meta = PLATFORMS.find((pl) => pl.id === p)!;
    if (body.caption.length > meta.charLimit) {
      throw new ApiError(422, `Caption exceeds the ${meta.name} limit of ${meta.charLimit} characters`);
    }
  }

  if (body.status === "scheduled") {
    if (!body.scheduledAt || Number.isNaN(Date.parse(body.scheduledAt))) {
      throw new ApiError(422, "A valid schedule date & time is required");
    }
    // Free plan: 10 scheduled posts per calendar month.
    if (workspace.plan === "free") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const [{ value }] = await db
        .select({ value: count() })
        .from(posts)
        .where(
          and(
            eq(posts.workspaceId, workspace.id),
            gte(posts.createdAt, monthStart),
            lt(posts.createdAt, monthEnd)
          )
        );
      if (value >= 10) {
        throw new ApiError(403, "Free plan includes 10 posts per month — upgrade to Pro for unlimited scheduling", "PLAN_LIMIT");
      }
    }
  }

  const post = await createPost(workspace.id, user.id, {
    caption: body.caption,
    platforms: body.platforms,
    status: body.status,
    scheduledAt: body.status === "scheduled" ? body.scheduledAt! : null,
    media: body.media,
    aiAssisted: body.aiAssisted,
  });
  return ok({ post }, 201);
});
