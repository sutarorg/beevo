import {
  calculateRequiredCreditsServer,
  reserveGenerationCreditsRpc,
} from "@/features/credits/service";
import { emitGenerationEvent } from "@/features/pipeline/orchestrator";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { startGenerationSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    enforceRateLimit(`gen:${auth.userId}`, RATE_LIMITS.videoGen);
    const { id: projectId } = await context.params;
    const rawBody = await request.json().catch(() => ({}));
    const parsed = startGenerationSchema.parse(rawBody);

    const admin = auth.adminSupabase;
    const { data: project } = await admin
      .from("projects")
      .select("*, project_settings(*)")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    if (project.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const durationSeconds = Number(project.requested_duration_seconds);
    const creditsRequired = calculateRequiredCreditsServer(durationSeconds);

    const { data: storyboard } = await admin
      .from("storyboards")
      .select("id")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const storyboardId = parsed.storyboardId ?? storyboard?.id;
    if (!storyboardId) {
      throw new ApiError(
        400,
        "STORYBOARD_REQUIRED",
        "Generate a dynamic storyboard before starting full video generation."
      );
    }

    const { count: sceneCount } = await admin
      .from("scenes")
      .select("id", { count: "exact", head: true })
      .eq("storyboard_id", storyboardId);

    if (!sceneCount || sceneCount === 0) {
      throw new ApiError(400, "STORYBOARD_EMPTY", "Storyboard contains zero scenes.");
    }

    const settings = Array.isArray(project.project_settings)
      ? project.project_settings[0]
      : project.project_settings;
    if (!settings?.voice_id) {
      throw new ApiError(
        400,
        "VOICE_REQUIRED",
        "Select a live ElevenLabs narration voice before generating your video."
      );
    }

    const { data: generation, error: genErr } = await admin
      .from("generations")
      .insert({
        user_id: auth.userId,
        project_id: projectId,
        storyboard_id: storyboardId,
        current_stage: "character_generation",
        generation_status: "queued",
        progress_percent: 5,
        dynamic_image_count: sceneCount,
        completed_image_count: 0,
        reserved_credits: creditsRequired,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (genErr || !generation) {
      throw new Error(genErr?.message ?? "Failed creating generation record.");
    }

    try {
      await reserveGenerationCreditsRpc(admin, {
        userId: auth.userId,
        generationId: generation.id,
        durationSeconds,
        idempotencyKey: parsed.idempotencyKey ?? `reserve:${generation.id}`,
      });
    } catch (reserveErr) {
      await admin.from("generations").delete().eq("id", generation.id);
      throw reserveErr;
    }

    await Promise.all([
      admin
        .from("storyboards")
        .update({ approval_state: "approved", approved_at: new Date().toISOString() })
        .eq("id", storyboardId),
      admin
        .from("projects")
        .update({ project_status: "generating", updated_at: new Date().toISOString() })
        .eq("id", projectId),
      admin.from("generation_jobs").insert({
        generation_id: generation.id,
        project_id: projectId,
        user_id: auth.userId,
        status: "queued",
        priority: 100,
        payload: { storyboardId },
      }),
    ]);

    await emitGenerationEvent(admin, {
      generationId: generation.id,
      userId: auth.userId,
      stage: "character_generation",
      eventType: "queued",
      message: `Reserved ${creditsRequired} credits. Queued for ${sceneCount} dynamic scene illustrations.`,
      progressPercent: 5,
    });

    return jsonOk(
      {
        generationId: generation.id,
        status: "queued",
        creditsReserved: creditsRequired,
        expectedImageCount: sceneCount,
      },
      202
    );
  } catch (err) {
    return handleApiError(err);
  }
}
