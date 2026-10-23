import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { authTokens, sessions, users } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import { AUTH_SECRET, SESSION_COOKIE, SESSION_TTL_MS } from "@/server/env";

/**
 * Real credential + session auth (server-only).
 * Passwords: scrypt(salt 16B, 64B). Sessions: opaque 256-bit tokens, only the
 * sha256 hash is stored; sliding renewal on use. This implements the same
 * contract the frontend's AuthService defines (verification, reset, sessions).
 */

const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, SCRYPT);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = scryptSync(password, Buffer.from(saltHex, "hex"), 64, SCRYPT);
  return timingSafeEqual(key, Buffer.from(keyHex, "hex"));
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hmacHash = (token: string) => sha256(`${token}:${AUTH_SECRET}`);

export type SessionUser = typeof users.$inferSelect;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    tokenHash: hmacHash(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function destroySession(tokenHash: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Validates server-side session on every call; renews near half-life. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 256) return null;
  const tokenHash = hmacHash(token);
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // Sliding renewal: extend when past half-life.
  const halfLife = SESSION_TTL_MS / 2;
  if (row.session.expiresAt.getTime() - Date.now() < halfLife) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(sessions.tokenHash, tokenHash));
  }
  return row.user;
}

export async function issueAuthToken(userId: string, purpose: "verify" | "reset", ttlMs: number): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(authTokens).values({
    tokenHash: hmacHash(raw),
    userId,
    purpose,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}

export async function consumeAuthToken(raw: string, purpose: "verify" | "reset"): Promise<string | null> {
  const tokenHash = hmacHash(raw);
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.purpose, purpose),
        gt(authTokens.expiresAt, new Date()),
        isNull(authTokens.usedAt),
      ),
    )
    .limit(1);
  const token = rows[0];
  if (!token) return null;
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.tokenHash, tokenHash));
  return token.userId;
}

export const newId = (prefix: string) => `${prefix}_${randomBytes(12).toString("base64url")}`;
