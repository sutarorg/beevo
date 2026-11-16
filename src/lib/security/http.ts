import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ServiceUnavailableError } from "@/lib/env";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk<T>(data: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(
    { ok: true, data },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...headers,
      },
    }
  );
}

/**
 * Masks unexpected internal exceptions so raw stack traces, SQL errors, or provider
 * secrets never leak to browser clients.
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ServiceUnavailableError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: err.code,
          service: err.service,
          message: err.message,
        },
      },
      { status: err.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      { status: err.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "One or more request parameters failed validation.",
          issues: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rawMsg = err instanceof Error ? err.message : "";
  if (rawMsg.includes("INSUFFICIENT_CREDITS")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INSUFFICIENT_CREDITS",
          message: "Not enough available credits to complete this operation.",
        },
      },
      { status: 402, headers: { "Cache-Control": "no-store" } }
    );
  }

  console.error("[Beevo API Error]", err);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred. Please retry or contact support.",
      },
    },
    { status: 500, headers: { "Cache-Control": "no-store" } }
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: { parse: (input: unknown) => T }
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  return schema.parse(raw);
}
