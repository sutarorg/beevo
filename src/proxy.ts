import { NextResponse, type NextRequest } from "next/server";
import { APP_URL } from "@/lib/config";

/**
 * Edge gate for the storefront URL scheme.
 *
 * Public creator pages live at `/@username[/course-slug]` via the `[handle]`
 * dynamic segment. Anything else at the top level that isn't a known app
 * segment is a genuine 404 — rewritten with an explicit 404 status so
 * invalid URLs never soft-200.
 *
 * It also enforces one canonical host: when `NEXT_PUBLIC_APP_URL` points at
 * the apex domain, `www.<apex>` is permanently redirected there so the same
 * page never gets indexed under two hostnames.
 */

const KNOWN_SEGMENTS = new Set([
  "features",
  "how-it-works",
  "pricing",
  "faq",
  "blog",
  "blog.html",
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
  "robots.txt",
  "sitemap.xml",
]);

/** `@username` — matched case-insensitively (the page normalises to lowercase). */
const HANDLE_PATTERN = /^@[A-Za-z0-9-]{1,40}$/;

const CANONICAL = new URL(APP_URL);
const CANONICAL_HOST = CANONICAL.host.toLowerCase();
/** Only redirect www → apex when the configured canonical origin is the apex. */
const CANONICAL_IS_APEX = !CANONICAL_HOST.startsWith("www.");

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (
    CANONICAL_IS_APEX &&
    host === `www.${CANONICAL_HOST}` &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    // Build a fresh URL on the canonical origin (cloning nextUrl keeps the
    // incoming dev/preview port, which must never leak into a production
    // redirect).
    const target = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `${CANONICAL.origin}/`,
    );
    return NextResponse.redirect(target, 308);
  }

  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return NextResponse.next();

  let first: string;
  try {
    first = decodeURIComponent(segments[0]).toLowerCase();
  } catch {
    // Malformed percent-encoding cannot be a real page. Answering 400 here
    // avoids Next's route matcher throwing an internal 500 while trying to
    // decode the same segment.
    return new NextResponse("Bad Request — malformed URL encoding.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }
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
