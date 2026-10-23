import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge gate for the storefront URL scheme.
 *
 * Public creator pages live at `/@username[/course-slug]` via the `[handle]`
 * dynamic segment. Anything else at the top level that isn't a known app
 * segment is a genuine 404 — rewritten with an explicit 404 status so
 * invalid URLs never soft-200.
 */

const KNOWN_SEGMENTS = new Set([
  "features",
  "how-it-works",
  "pricing",
  "faq",
  "terms",
  "privacy",
  "refund-policy",
  "login",
  "signup",
  "forgot-password",
  "creator",
  "learn",
  "admin",
  "api",
  "images",
  "favicon.ico",
]);

const HANDLE_PATTERN = /^@[a-z0-9-]{1,40}$/;

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return NextResponse.next();

  const first = decodeURIComponent(segments[0]);
  if (KNOWN_SEGMENTS.has(first) || first.startsWith("_next")) {
    return NextResponse.next();
  }

  if (HANDLE_PATTERN.test(first)) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/_not-found", request.url), {
    status: 404,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico).*)"],
};
