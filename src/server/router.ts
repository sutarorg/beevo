import { NextResponse } from "next/server";
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
    try {
      const ctx = await buildCtx();
      const response = await candidate.handler(req, ctx, params);
      return response ?? fail("internal_error", "Handler produced no response.", 500);
    } catch (error) {
      console.error(`[api] ${method} /api/v1/${segments.join("/")} failed:`, error);
      return fail("internal_error", "Something went wrong on our side.", 500);
    }
  }
  if (shapeOnlyMatch) return fail("method_not_allowed", "Method not allowed for this resource.", 405);
  return fail("not_found", "This endpoint doesn't exist.", 404);
}
