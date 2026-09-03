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
    /*
     * Retry-safe body buffer: if a request mutating the DB first parses its
     * JSON body and then hits a schema error, we heal + transparently retry.
     * But req.json() consumes the stream — so buffer a byte-level clone of
     * JSON payloads up-front and replay a fresh Request for the retry.
     */
    const req = args[0] as Request | undefined;
    let bodyClone: ArrayBuffer | null = null;
    if (
      req &&
      typeof req.method === "string" &&
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      (req.headers.get("content-type") ?? "").includes("application/json")
    ) {
      try {
        bodyClone = await req.clone().arrayBuffer();
      } catch {
        bodyClone = null;
      }
    }

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

      // Missing table/column: the DB was created empty or by an older build.
      // Heal SYNCHRONOUSLY and transparently retry the original request once —
      // the user should never see this fail unless the heal itself failed.
      if (isSchemaMissingError(err) || isUndefinedColumnError(err)) {
        const heal = await ensureSchema(true).catch(() => null);
        if (heal && heal.reason !== "disabled") {
          try {
            if (bodyClone !== null && req) {
              // Rebuild the request with an un-consumed copy of the body.
              args[0] = new Request(req.url, {
                method: req.method,
                headers: req.headers,
                body: bodyClone,
              }) as unknown as Args[0];
            }
            return await fn(...args); // transparent retry — first request just works
          } catch (retryErr) {
            console.error("[api] retry after schema heal failed:", retryErr);
            return fail(
              "Database schema was auto-updated — please retry once.",
              503,
              "SCHEMA_NOT_MIGRATED"
            );
          }
        }
        return fail(
          "Database schema is not migrated and AUTO_MIGRATE is disabled — run `npx drizzle-kit push` (README §5).",
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
