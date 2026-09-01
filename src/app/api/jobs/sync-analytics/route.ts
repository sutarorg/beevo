import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { syncAnalytics } from "@/lib/server/jobs/sync-analytics";
import { timingSafeEqual } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorize(req: Request): Promise<void> {
  const secret = env.cronSecret();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (secret && bearer && timingSafeEqual(bearer, secret)) return;
  const ctx = await requireUser().catch(() => null);
  if (ctx && (ctx.member.role === "owner" || ctx.member.role === "admin")) return;
  throw new ApiError(401, "Invalid cron credentials");
}

export const GET = handler(async (req: Request) => {
  await authorize(req);
  const result = await syncAnalytics();
  return ok({ ...result, ranAt: new Date().toISOString() });
});

export const POST = handler(async (req: Request) => {
  await authorize(req);
  const result = await syncAnalytics();
  return ok({ ...result, ranAt: new Date().toISOString() });
});
