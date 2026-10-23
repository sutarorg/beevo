import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { newId } from "@/server/auth";

/**
 * Append-only audit trail. Actor identity always comes from the verified
 * server session — never from client-supplied fields.
 */
export async function audit(input: {
  actorId: string | null;
  actorLabel: string;
  area: string;
  action: string;
  detail: string;
  kind?: "action" | "system" | "event";
  tx?: typeof db;
}): Promise<void> {
  const executor = input.tx ?? db;
  await executor.insert(auditLogs).values({
    id: newId("aud"),
    actorId: input.actorId,
    actorLabel: input.actorLabel,
    area: input.area,
    action: input.action,
    detail: input.detail,
    kind: input.kind ?? "action",
  });
}
