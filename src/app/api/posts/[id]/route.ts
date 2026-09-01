import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { postTargets } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { deletePost, getPost, updatePost } from "@/lib/post-store";
import { publishDuePosts } from "@/lib/server/jobs/publisher";
import { PLATFORMS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { workspace } = await requireUser();
  const { id } = await ctx.params;
  const post = await getPost(workspace.id, id);
  if (!post) throw new ApiError(404, "Post not found");
  return ok({ post });
});

const patchSchema = z.object({
  action: z.enum(["publish_now", "retry", "unschedule"]).optional(),
  caption: z.string().trim().min(1).max(63_206).optional(),
  platforms: z.array(z.enum(["instagram", "facebook", "twitter", "linkedin", "pinterest", "youtube"])).min(1).optional(),
  status: z.enum(["draft", "scheduled"]).optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  media: z.array(z.string().max(2048)).max(10).optional(),
  aiAssisted: z.boolean().optional(),
});

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { workspace } = await requireUser();
  const { id } = await ctx.params;
  const existing = await getPost(workspace.id, id);
  if (!existing) throw new ApiError(404, "Post not found");

  const body = await parseBody(req, patchSchema);

  if (body.action === "publish_now") {
    // Immediately queue all pending targets and run the engine over this post.
    await updatePost(workspace.id, id, { status: "scheduled", scheduledAt: new Date().toISOString() });
    await db
      .update(postTargets)
      .set({ status: "pending", error: null })
      .where(eq(postTargets.postId, id));
    await publishDuePosts(5);
    const post = await getPost(workspace.id, id);
    return ok({ post });
  }

  if (body.action === "retry") {
    const when = body.scheduledAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await db.update(postTargets).set({ status: "pending", error: null, attempts: 0 }).where(eq(postTargets.postId, id));
    const post = await updatePost(workspace.id, id, { status: "scheduled", scheduledAt: when });
    return ok({ post });
  }

  if (body.action === "unschedule") {
    const post = await updatePost(workspace.id, id, { status: "draft", scheduledAt: null });
    return ok({ post });
  }

  if (body.platforms) {
    for (const p of body.platforms) {
      const meta = PLATFORMS.find((pl) => pl.id === p)!;
      const caption = body.caption ?? existing.caption;
      if (caption.length > meta.charLimit) {
        throw new ApiError(422, `Caption exceeds the ${meta.name} limit of ${meta.charLimit} characters`);
      }
    }
  }

  const post = await updatePost(workspace.id, id, {
    caption: body.caption,
    platforms: body.platforms,
    status: body.status,
    scheduledAt: body.scheduledAt === undefined ? undefined : body.scheduledAt,
    media: body.media,
    aiAssisted: body.aiAssisted,
  });
  return ok({ post });
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const { workspace } = await requireUser();
  const { id } = await ctx.params;
  const done = await deletePost(workspace.id, id);
  if (!done) throw new ApiError(404, "Post not found");
  return ok({ ok: true });
});
