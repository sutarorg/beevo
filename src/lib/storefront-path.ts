/**
 * Storefront URL parsing shared by the page routes.
 *
 * Public creator URLs are `/@handle` and `/@handle/course-slug`. Handles are
 * stored lowercase but get typed and re-shared in every case, so parsing
 * normalises case instead of 404-ing. Malformed percent-encoding and
 * characters outside the handle alphabet are rejected (the caller shows a
 * real 404).
 */

const HANDLE_PATTERN = /^[a-z0-9-]{1,40}$/;
// `slugify` produces lowercase words joined by "-"; collision suffixes append
// the last 6 characters of a base64url id, which may include "_".
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,199}$/;

export function parseHandleSegment(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("@")) return null;
  const username = decoded.slice(1).trim().toLowerCase();
  return HANDLE_PATTERN.test(username) ? username : null;
}

export function parseSlugSegment(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const slug = decoded.trim().toLowerCase();
  return SLUG_PATTERN.test(slug) ? slug : null;
}
