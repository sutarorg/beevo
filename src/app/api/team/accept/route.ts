import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, workspaceInvites, workspaceMembers, workspaces } from "@/db/schema";
import { sha256 } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/**
 * Invite acceptance link (sent by email). Requires a logged-in session;
 * bounces to /login with the token preserved when anonymous.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const base = env.appUrl();
  if (!token) return NextResponse.redirect(`${base}/login?invite=missing`);

  const ctx = await requireUser().catch(() => null);
  if (!ctx) return NextResponse.redirect(`${base}/login?invite=${encodeURIComponent(token)}`);

  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.tokenHash, sha256(token)), eq(workspaceInvites.status, "pending")))
    .limit(1);
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.redirect(`${base}/settings?invite=invalid`);
  }
  if (invite.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
    return NextResponse.redirect(`${base}/settings?invite=wrong_email`);
  }

  const [existing] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.userId, ctx.user.id)))
    .limit(1);
  if (!existing) {
    await db.insert(workspaceMembers).values({
      workspaceId: invite.workspaceId,
      userId: ctx.user.id,
      role: invite.role,
    });
  }
  await db.update(workspaceInvites).set({ status: "accepted" }).where(eq(workspaceInvites.id, invite.id));

  // Switch the user's active workspace to the one they just joined.
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, invite.workspaceId)).limit(1);
  if (ws) {
    await db.update(sessions).set({ currentWorkspaceId: ws.id }).where(eq(sessions.id, ctx.session.id));
  }
  return NextResponse.redirect(`${base}/dashboard?team=joined`);
}
