import { z } from "zod";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaceInvites, workspaceMembers } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { randomToken, sha256 } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { emails, sendMail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const { workspace } = await requireUser();
  const [members, invites] = await Promise.all([
    db.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspace.id)),
    db.select().from(workspaceInvites).where(and(eq(workspaceInvites.workspaceId, workspace.id), eq(workspaceInvites.status, "pending"))),
  ]);
  const memberUsers = await Promise.all(
    members.map((m) => db.select().from(users).where(eq(users.id, m.userId)).limit(1))
  );
  return ok({
    members: members.map((m, i) => {
      const u = memberUsers[i]?.[0];
      return { id: m.id, userId: m.userId, role: m.role, name: u?.name ?? "Unknown", email: u?.email ?? "" };
    }),
    invites: invites.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt.toISOString() })),
    seats: workspace.plan === "pro" ? 3 : 1,
  });
});

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

export const POST = handler(async (req: Request) => {
  const { workspace, member, user } = await requireUser();
  if (member.role !== "owner" && member.role !== "admin") throw new ApiError(403, "Only owners and admins can invite teammates");
  const body = await parseBody(req, inviteSchema);
  const email = body.email.toLowerCase();

  const seats = workspace.plan === "pro" ? 3 : 1;
  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspace.id));
  if (memberCount >= seats) {
    throw new ApiError(403, `Your plan includes ${seats} seat${seats > 1 ? "s" : ""} — upgrade to Pro for team features`, "PLAN_LIMIT");
  }

  const token = randomToken(32);
  const [invite] = await db
    .insert(workspaceInvites)
    .values({
      workspaceId: workspace.id,
      email,
      role: body.role,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  const acceptUrl = `${env.appUrl()}/api/team/accept?token=${token}`;
  void sendMail({
    to: email,
    subject: `${user.name} invited you to ${workspace.name} on Beevo`,
    html: emails.teamInvite(user.name, workspace.name, acceptUrl),
  });

  return ok({ invite: { id: invite.id, email, role: body.role, acceptUrl: env.isProd ? undefined : acceptUrl } }, 201);
});

const removeSchema = z.object({ memberId: z.string().uuid() });

export const DELETE = handler(async (req: Request) => {
  const { workspace, member } = await requireUser();
  if (member.role !== "owner" && member.role !== "admin") throw new ApiError(403, "Insufficient permissions");
  const { memberId } = await parseBody(req, removeSchema);
  if (memberId === member.id) throw new ApiError(400, "You can't remove yourself");
  const [target] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, workspace.id)))
    .limit(1);
  if (!target) throw new ApiError(404, "Member not found");
  if (target.role === "owner") throw new ApiError(400, "The workspace owner can't be removed");
  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
  return ok({ ok: true });
});
