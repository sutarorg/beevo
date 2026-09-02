import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ensureSchema, isConnectionError, isSchemaMissingError, isUndefinedColumnError } from "./migrate";
import { dbConfigured } from "@/db";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function fail(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

/** Parse + validate a JSON body against a zod schema; throws ApiError(422). */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      throw new ApiError(422, `${first?.path.join(".") || "body"}: ${first?.message ?? "invalid input"}`);
    }
    throw err;
  }
}

/** Wrap a handler and turn ApiErrors / infra failures into actionable JSON. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      // Fast, explicit signal when the database was never configured.
      if (!dbConfigured) {
        return fail(
          "DATABASE_URL is not configured on this deployment — add it in Vercel → Settings → Environment Variables (README §4.1), then redeploy.",
          503,
          "DB_NOT_CONFIGURED"
        );
      }
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, err.status, err.code);

      // Missing table/column (fresh deploy or schema created by an older
      // build) → kick self-heal synchronously, then tell the client to retry.
      if (isSchemaMissingError(err) || isUndefinedColumnError(err)) {
        const result = await ensureSchema(true).catch(() => ({ migrated: false }));
        return fail(
          result.migrated || (result as { reason?: string }).reason === undefined
            ? "Database schema was just auto-updated — please retry."
            : "Database schema update in progress — please retry in a few seconds.",
          503,
          "SCHEMA_NOT_MIGRATED"
        );
      }
      if (isConnectionError(err)) {
        return fail(
          "Cannot reach the database — verify DATABASE_URL points to a hosted Postgres (e.g. Neon pooled URL). 127.0.0.1/localhost cannot be reached from Vercel.",
          503,
          "DB_UNREACHABLE"
        );
      }

      console.error("[api]", err);
      return fail("Internal server error", 500, "INTERNAL");
    }
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
