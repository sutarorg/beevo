import { generateBeevoScript } from "@/features/story-engine/service";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { generateScriptSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    enforceRateLimit(`script:${auth.userId}`, RATE_LIMITS.storyGen);
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, generateScriptSchema);

    const admin = auth.adminSupabase;
    const { data: project } = await admin
      .from("projects")
      .select("*, project_settings(*)")
      .eq("id", id)
      .maybeSingle();

    if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    if (project.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const settings = Array.isArray(project.project_settings)
      ? project.project_settings[0]
      : project.project_settings;

    const result = await generateBeevoScript({
      idea: parsed.idea || project.original_idea,
      durationSeconds: parsed.durationSeconds ?? Number(project.requested_duration_seconds),
      language: parsed.language ?? project.language,
      audience: parsed.audience ?? "general",
      cartoonStyle: project.visual_style,
      narrationTone: parsed.narrationTone ?? settings?.voice_tone ?? "friendly_storyteller",
      customInstructions:
        parsed.customInstructions ?? settings?.advanced_prompt_instructions ?? undefined,
    });

    await admin
      .from("projects")
      .update({
        title: result.data.title || project.title,
        script: result.data.fullScript,
        project_status: "script_ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await admin.from("provider_usage").insert({
      user_id: auth.userId,
      project_id: id,
      provider: "openai",
      operation: "script_generation",
      model_id: result.model,
      input_units: result.inputTokens,
      output_units: result.outputTokens,
      unit_type: "tokens",
      cost_usd: result.costUsd,
      cost_inr: result.costInr,
      cost_source: result.costSource,
      provider_request_id: result.responseId,
    });

    return jsonOk({
      script: result.data,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      model: result.model,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
