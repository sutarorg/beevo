import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { publishDuePosts, countDue } from "@/lib/server/jobs/publisher";
import { timingSafeEqual } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduler engine entry point. Called by Vercel Cron (configured in
 * vercel.json) — Vercel sends `Authorization: Bearer $CRON_SECRET`.
 * Workspace owners may also trigger it manually from the session.
 */
async function authorize(req: Request): Promise<void> {
  const secret = env.cronSecret();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (secret && bearer && timingSafeEqual(bearer, secret)) return;
  // Manual trigger: allow authenticated owners/admins.
  const ctx = await requireUser().catch(() => null);
  if (ctx && (ctx.member.role === "owner" || ctx.member.role === "admin")) return;
  throw new ApiError(401, "Invalid cron credentials");
}

async function run(req: Request) {
  await authorize(req);
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "25") || 25, 100);
  const summary = await publishDuePosts(limit);
  return ok({ ...summary, ranAt: new Date().toISOString() });
}

export const GET = handler(run);
export const POST = handler(run);

export const HEAD = handler(async (req: Request) => {
  void req;
  const due = await countDue();
  return ok({ due });
});
