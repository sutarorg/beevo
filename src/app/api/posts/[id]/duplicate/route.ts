import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { duplicatePost } from "@/lib/post-store";

export const dynamic = "force-dynamic";

export const POST = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { user, workspace } = await requireUser();
  const { id } = await ctx.params;
  const post = await duplicatePost(workspace.id, user.id, id);
  if (!post) throw new ApiError(404, "Post not found");
  return ok({ post }, 201);
});
