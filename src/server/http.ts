import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { adminRoles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, type SessionUser } from "@/server/auth";

/**
 * One consistent API shape: ApiResult<T> — { ok: true, data } |
 * { ok: false, error: { code, message, fieldErrors? } } — identical to the
 * frontend contracts from Prompts 1-4, so no UI rework is needed.
 */

export function ok<T>(data: T, init?: { status?: number }): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: init?.status ?? 200 });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message, fieldErrors } }, { status });
}

export interface Ctx {
  user: SessionUser | null;
  isAdmin: boolean;
}

export async function buildCtx(): Promise<Ctx> {
  const user = await getSessionUser();
  if (!user) return { user: null, isAdmin: false };
  const admin = await db.query.adminRoles.findFirst({
    where: eq(adminRoles.userId, user.id),
  });
  return { user, isAdmin: Boolean(admin) && !user.suspendedAt };
}

export function requireUser(ctx: Ctx): SessionUser | NextResponse {
  if (!ctx.user) return fail("auth_required", "Sign in to continue.", 401);
  if (ctx.user.suspendedAt) {
    return fail("account_suspended", "This account is suspended. Contact support.", 403);
  }
  return ctx.user;
}

export function requireVerifiedUser(ctx: Ctx): SessionUser | NextResponse {
  const user = requireUser(ctx);
  if (user instanceof NextResponse) return user;
  if (!user.emailVerifiedAt) {
    return fail("email_not_verified", "Verify your email before continuing.", 403);
  }
  return user;
}

export function requireAdmin(ctx: Ctx): SessionUser | NextResponse {
  const user = requireUser(ctx);
  if (user instanceof NextResponse) return user;
  if (!ctx.isAdmin) return fail("admin_required", "Administrator access required.", 403);
  return user;
}

/** Parse a JSON body with a zod schema; maps issues to fieldErrors. */
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
): { values: T } | { response: NextResponse } {
  const result = schema.safeParse(body);
  if (result.success) return { values: result.data };
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { response: fail("validation_failed", "Some fields need attention.", 422, fieldErrors) };
}

/** Naive in-memory rate limiter (per process) for auth + checkout endpoints. */
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}

export { users };
