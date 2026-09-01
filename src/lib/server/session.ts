import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { sessions, users, workspaceMembers, workspaces } from "@/db/schema";
import { randomToken, sha256 } from "./crypto";
import { ApiError } from "./http";

export const SESSION_COOKIE = "beevo_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export type AuthContext = {
  user: typeof users.$inferSelect;
  session: typeof sessions.$inferSelect;
  workspace: typeof workspaces.$inferSelect;
  member: typeof workspaceMembers.$inferSelect;
};

export async function createSession(
  userId: string,
  workspaceId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    currentWorkspaceId: workspaceId,
    userAgent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export async function destroySession(tokenHashValue: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHashValue));
}

/** Resolve the caller from the session cookie; throws 401 when absent/expired. */
export async function requireUser(): Promise<AuthContext> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) throw new ApiError(401, "Authentication required");

  const tokenHash = sha256(token);
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const session = rows[0];
  if (!session) throw new ApiError(401, "Session expired — please log in again");

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) throw new ApiError(401, "Account not found");

  let workspaceId = session.currentWorkspaceId;
  if (!workspaceId) {
    const [firstMembership] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1);
    if (!firstMembership) throw new ApiError(403, "No workspace found for this account");
    workspaceId = firstMembership.workspaceId;
    await db.update(sessions).set({ currentWorkspaceId: workspaceId }).where(eq(sessions.id, session.id));
    session.currentWorkspaceId = workspaceId;
  }

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!workspace) throw new ApiError(403, "Workspace not found");

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);
  if (!member) throw new ApiError(403, "You are not a member of this workspace");

  // Rolling touch (cheap write, keeps active sessions alive).
  void db
    .update(sessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(sessions.id, session.id))
    .execute()
    .catch(() => undefined);

  return { user, session, workspace, member };
}

export async function getSessionTokenHash(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? sha256(token) : null;
}
