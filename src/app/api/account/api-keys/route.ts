import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { randomToken, sha256 } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const PREFIX = "beevo_pat";

function serialize(k: typeof apiKeys.$inferSelect) {
  return {
    id: k.id,
    name: k.name,
    masked: `${k.prefix}_${"•".repeat(20)}${k.lastFour}`,
    scopes: k.scopes.split(" ").filter(Boolean),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
    createdAt: k.createdAt.toISOString(),
  };
}

export const GET = handler(async () => {
  const { workspace } = await requireUser();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspace.id))
    .orderBy(desc(apiKeys.createdAt))
    .limit(50);
  return ok({ keys: rows.map(serialize) });
});

const createSchema = z.object({
  name: z.string().trim().min(2, "Give the key a name").max(60).default("Default token"),
  scopes: z.array(z.enum(["posts:read", "posts:write", "analytics:read", "accounts:read"])).min(1).optional(),
});

/**
 * Issues a personal access token. The plaintext is returned exactly once —
 * only a SHA-256 hash is persisted.
 */
export const POST = handler(async (req: Request) => {
  const { workspace, user, member } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't create API keys");
  const body = await parseBody(req, createSchema);

  const active = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.workspaceId, workspace.id), isNull(apiKeys.revokedAt)));
  if (active.length >= 10) throw new ApiError(422, "Maximum of 10 active API keys — revoke one first");

  const secret = randomToken(24);
  const token = `${PREFIX}_${secret}`;

  const [created] = await db
    .insert(apiKeys)
    .values({
      workspaceId: workspace.id,
      createdById: user.id,
      name: body.name,
      prefix: PREFIX,
      lastFour: secret.slice(-4),
      tokenHash: sha256(token),
      scopes: (body.scopes ?? ["posts:read", "posts:write", "analytics:read"]).join(" "),
    })
    .returning();

  return ok({ key: serialize(created), token }, 201);
});

const deleteSchema = z.object({ id: z.string().uuid() });

export const DELETE = handler(async (req: Request) => {
  const { workspace, member } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't revoke API keys");
  const { id } = await parseBody(req, deleteSchema);

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspace.id)))
    .limit(1);
  if (!key) throw new ApiError(404, "API key not found");

  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, key.id));
  return ok({ ok: true, message: `“${key.name}” revoked` });
});
