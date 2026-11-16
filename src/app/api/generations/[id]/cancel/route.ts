import { releaseGenerationCreditsRpc } from "@/features/credits/service";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const admin = auth.adminSupabase;

    const { data: gen } = await admin
      .from("generations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!gen) throw new ApiError(404, "GENERATION_NOT_FOUND", "Generation not found.");
    if (gen.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }
    if (gen.generation_status === "completed") {
      throw new ApiError(409, "ALREADY_COMPLETED", "Completed generations cannot be cancelled.");
    }

    const nowIso = new Date().toISOString();
    await Promise.all([
      admin
        .from("generation_jobs")
        .update({ cancel_requested: true, status: "cancelled", updated_at: nowIso })
        .eq("generation_id", id)
        .in("status", ["queued", "running"]),
      admin
        .from("render_jobs")
        .update({ render_status: "cancelled", updated_at: nowIso })
        .eq("generation_id", id)
        .in("render_status", ["queued", "running"]),
    ]);

    const releasable = Math.max(
      0,
      Number(gen.reserved_credits ?? 0) - Number(gen.consumed_credits ?? 0)
    );
    if (releasable > 0) {
      await releaseGenerationCreditsRpc(admin, {
        userId: gen.user_id,
        generationId: id,
        credits: releasable,
        idempotencyKey: `release:cancel:${id}`,
        reason: "Generation cancelled by user",
      });
    }

    await Promise.all([
      admin
        .from("generations")
        .update({
          generation_status: "cancelled",
          cancel_requested: true,
          completed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", id),
      admin
        .from("projects")
        .update({ project_status: "cancelled", updated_at: nowIso })
        .eq("id", gen.project_id),
    ]);

    return jsonOk({ cancelled: true, generationId: id, creditsReleased: releasable });
  } catch (err) {
    return handleApiError(err);
  }
}
