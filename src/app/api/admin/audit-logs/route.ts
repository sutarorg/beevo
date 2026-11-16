import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.audit_logs.list");
    const { data, error } = await actor.adminSupabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return jsonOk({
      logs: (data ?? []).map((l) => ({
        id: l.id,
        actorEmail: l.actor_email,
        actorRole: l.actor_role,
        action: l.action,
        target: `${l.target_type}:${l.target_id}`,
        result: l.result,
        timestamp: l.created_at,
        metadata: l.metadata ?? {},
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
