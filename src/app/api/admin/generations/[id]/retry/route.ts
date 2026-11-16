import { requireAdmin, writeAuditLog } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { z } from "zod";

const retrySchema = z.object({
  reason: z.string().trim().min(6).max(500),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin("admin.generations.retry");
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, retrySchema);
    const admin = actor.adminSupabase;

    const { data: gen } = await admin
      .from("generations")
      .select("id, project_id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!gen) throw new ApiError(404, "GENERATION_NOT_FOUND", "Generation not found.");

    const nowIso = new Date().toISOString();
    await admin.from("generation_jobs").upsert(
      {
        generation_id: gen.id,
        project_id: gen.project_id,
        user_id: gen.user_id,
        status: "queued",
        priority: 50,
        attempt_count: 0,
        cancel_requested: false,
        next_run_at: nowIso,
        worker_id: null,
        lease_expires_at: null,
        last_error: null,
        updated_at: nowIso,
      },
      { onConflict: "generation_id" }
    );

    await admin
      .from("generations")
      .update({
        generation_status: "queued",
        cancel_requested: false,
        error_code: null,
        error_details: null,
        updated_at: nowIso,
      })
      .eq("id", gen.id);

    await writeAuditLog(admin, {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "generation.admin_retry",
      targetType: "generation",
      targetId: gen.id,
      result: "success",
      reason: parsed.reason,
    });

    return jsonOk({ retried: true, generationId: gen.id });
  } catch (err) {
    return handleApiError(err);
  }
}
