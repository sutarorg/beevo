import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { ensureSchema, schemaReport } from "@/lib/server/migrate";
import { timingSafeEqual } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-click manual migration. Authorize with either:
 *   - a logged-in owner/admin session, or
 *   - Authorization: Bearer <CRON_SECRET>, or
 *   - ?key=<CRON_SECRET>  (so you can run it from a browser URL)
 *
 *   https://beevo.in/api/admin/migrate?key=$CRON_SECRET
 */
async function authorize(req: Request): Promise<void> {
  const secret = env.cronSecret();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (secret && ((bearer && timingSafeEqual(bearer, secret)) || (key && timingSafeEqual(key, secret)))) return;
  const ctx = await requireUser().catch(() => null);
  if (ctx && (ctx.member.role === "owner" || ctx.member.role === "admin")) return;
  throw new ApiError(401, "Provide a valid CRON_SECRET (?key= or Authorization: Bearer) or an owner session");
}

async function run(req: Request) {
  await authorize(req);
  const before = await schemaReport();
  const result = await ensureSchema(true);
  const after = await schemaReport();
  return ok({
    migrated: result.migrated,
    reason: result.reason ?? null,
    before: { missingTables: before.missingTables, missingColumns: before.missingColumns },
    after: { missingTables: after.missingTables, missingColumns: after.missingColumns },
    healthy: after.ok,
  });
}

export const GET = handler(run);
export const POST = handler(run);
