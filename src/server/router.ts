import { NextResponse } from "next/server";
import { DATABASE_URL } from "@/server/env";
import { buildCtx, fail, type Ctx } from "@/server/http";

/**
 * Consolidated /api/v1 router. One dispatch table, one error format, one
 * auth model. Handlers live in src/server/handlers/* (business logic) and
 * register routes here; this file only routes.
 */

export type Handler = (
  req: Request,
  ctx: Ctx,
  params: Record<string, string>,
) => Promise<NextResponse | undefined>;

type RouteEntry = { method: string; pattern: string[]; handler: Handler };

const ROUTES: RouteEntry[] = [];

export function route(method: string, pattern: string, handler: Handler) {
  ROUTES.push({ method, pattern: pattern.split("/").filter(Boolean), handler });
}

function matchShape(pattern: string[], segments: string[]): Record<string, string> | null {
  if (pattern.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const part = pattern[i];
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(segments[i]);
    else if (part !== segments[i]) return null;
  }
  return params;
}

function extractDbErrorInfo(error: unknown): { code: string; message: string } {
  const err = error as { code?: string; message?: string; cause?: unknown } | null;
  const cause = (err?.cause ?? null) as { code?: string; message?: string } | null;
  return {
    code: String(cause?.code ?? err?.code ?? ""),
    message: String(cause?.message ?? err?.message ?? ""),
  };
}

const DB_CONNECT_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "28P01",
  "28000",
  "3D000",
  "08001",
  "08006",
  "53300",
  "XX000",
]);

export async function dispatch(req: Request, segments: string[]): Promise<NextResponse> {
  const method = req.method.toUpperCase();
  let shapeOnlyMatch = false;
  for (const candidate of ROUTES) {
    const params = matchShape(candidate.pattern, segments);
    if (!params) continue;
    if (candidate.method !== method) {
      shapeOnlyMatch = true;
      continue;
    }
    const hasInjectedDb = Boolean((globalThis as { __ckTestDb?: boolean }).__ckTestDb);
    if (!DATABASE_URL && !hasInjectedDb) {
      console.error(`[api] ${method} /api/v1/${segments.join("/")}: DATABASE_URL is not set.`);
      return fail(
        "service_unavailable",
        "Database connection isn't configured yet (DATABASE_URL is missing).",
        503,
      );
    }
    try {
      const ctx = await buildCtx();
      const response = await candidate.handler(req, ctx, params);
      return response ?? fail("internal_error", "Handler produced no response.", 500);
    } catch (error) {
      const info = extractDbErrorInfo(error);
      console.error(`[api] ${method} /api/v1/${segments.join("/")} failed [${info.code || "ERR"}]:`, error);

      if (info.code === "42P01" || info.code === "42703") {
        return fail(
          "service_unavailable",
          "Database tables aren't initialized yet. Run the database schema setup (npm run db:push or src/db/supabase-init.sql) and try again.",
          503,
        );
      }

      if (
        DB_CONNECT_ERROR_CODES.has(info.code) ||
        /self-signed certificate|tenant or user not found|password authentication failed|connection terminated|timeout expired/i.test(
          info.message,
        )
      ) {
        return fail(
          "service_unavailable",
          "Couldn't connect to the database. Verify DATABASE_URL and database availability, then try again.",
          503,
        );
      }

      return fail("internal_error", "Something went wrong on our side.", 500);
    }
  }
  if (shapeOnlyMatch) return fail("method_not_allowed", "Method not allowed for this resource.", 405);
  return fail("not_found", "This endpoint doesn't exist.", 404);
}
