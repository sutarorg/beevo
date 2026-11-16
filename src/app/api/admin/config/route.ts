import { requireAdmin, writeAuditLog } from "@/lib/security/auth";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { adminConfigurationPatchSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.config.read");
    const { data, error } = await actor.adminSupabase
      .from("system_configuration")
      .select("key, value, updated_at");
    if (error) throw new Error(error.message);
    return jsonOk({ config: data ?? [] });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin("admin.config.update");
    const parsed = await parseJsonBody(request, adminConfigurationPatchSchema);
    const admin = actor.adminSupabase;
    const nowIso = new Date().toISOString();

    const updatedKeys: string[] = [];
    if (parsed.pricing) {
      await admin.from("system_configuration").upsert({
        key: "pricing",
        value: parsed.pricing,
        updated_by: actor.userId,
        updated_at: nowIso,
      });
      updatedKeys.push("pricing");
    }
    if (parsed.creditRules) {
      await admin.from("system_configuration").upsert({
        key: "credit_rules",
        value: parsed.creditRules,
        updated_by: actor.userId,
        updated_at: nowIso,
      });
      updatedKeys.push("credit_rules");
    }
    if (parsed.generation) {
      await admin.from("system_configuration").upsert({
        key: "generation",
        value: parsed.generation,
        updated_by: actor.userId,
        updated_at: nowIso,
      });
      updatedKeys.push("generation");
    }

    await writeAuditLog(admin, {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "system_configuration.update",
      targetType: "system_configuration",
      targetId: updatedKeys.join(",") || "none",
      result: "success",
      reason: parsed.reason,
      metadata: { updatedKeys },
    });

    return jsonOk({ updatedKeys });
  } catch (err) {
    return handleApiError(err);
  }
}
