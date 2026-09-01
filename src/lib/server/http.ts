import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

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

/** Wrap a handler and turn ApiErrors / unexpected throws into clean JSON. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, err.status, err.code);
      console.error("[api]", err);
      return fail("Internal server error", 500);
    }
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
