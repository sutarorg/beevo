import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Creator handles — the public storefront address (`/@handle`).
 *
 * A creator without a handle has no live storefront link, which is exactly the
 * "storefront URL opens the 404 page" failure: signup used to leave `handle`
 * NULL forever. These helpers guarantee every account gets a usable, unique,
 * non-reserved handle.
 */

/** Names that collide with app routes or brand terms. */
export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "beevo",
  "creator",
  "faq",
  "features",
  "forgot-password",
  "help",
  "how-it-works",
  "images",
  "learn",
  "login",
  "pricing",
  "privacy",
  "refund-policy",
  "signup",
  "support",
  "terms",
  "www",
]);

export const HANDLE_PATTERN = /^[a-z0-9-]{3,30}$/;

const HANDLE_MAX = 30;

function slugBase(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, HANDLE_MAX);
}

/**
 * Deterministic, human-readable base handle from the creator's name, falling
 * back to the email local-part (e.g. "Meera Kapoor" -> "meera-kapoor").
 */
export function handleBase(name: string, email: string): string {
  const fromName = slugBase(name);
  if (fromName.length >= 3) return fromName;
  const fromEmail = slugBase((email.split("@")[0] ?? "").replace(/[._]+/g, "-"));
  if (fromEmail.length >= 3) return fromEmail;
  return "creator";
}

async function isHandleFree(handle: string): Promise<boolean> {
  if (RESERVED_HANDLES.has(handle) || !HANDLE_PATTERN.test(handle)) return false;
  const taken = await db.query.users.findFirst({ where: eq(users.handle, handle) });
  return !taken;
}

/** First free handle for this person: base, base-2, base-3, … */
export async function suggestHandle(name: string, email: string): Promise<string> {
  const base = handleBase(name, email);
  for (let attempt = 0; attempt < 60; attempt++) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const trimmedBase = base.slice(0, HANDLE_MAX - suffix.length).replace(/-+$/, "") || "creator";
    const candidate = `${trimmedBase}${suffix}`;
    if (await isHandleFree(candidate)) return candidate;
  }
  // Extremely unlikely: fall back to a random, still-valid handle.
  return `creator-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Gives legacy accounts (created before handles existed) a storefront address.
 * Returns the handle that should be stored, or null when nothing is needed.
 */
export async function ensureHandleFor(user: {
  id: string;
  name: string;
  email: string;
  handle: string | null;
}): Promise<string | null> {
  if (user.handle) return null;
  const handle = await suggestHandle(user.name, user.email);
  await db.update(users).set({ handle, updatedAt: new Date() }).where(eq(users.id, user.id));
  return handle;
}
