import { generateBeevoDynamicStoryboard } from "@/features/story-engine/service";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { generateStoryboardSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    enforceRateLimit(`storyboard:${auth.userId}`, RATE_LIMITS.storyGen);
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, generateStoryboardSchema);

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

    const scriptToUse = parsed.script?.trim() || project.script?.trim();
    if (!scriptToUse) {
      throw new ApiError(400, "SCRIPT_REQUIRED", "Generate or provide a narration script first.");
    }

    const { data: genCfg } = await admin
      .from("system_configuration")
      .select("value")
      .eq("key", "generation")
      .maybeSingle();
    const maxScenes = Number(genCfg?.value?.maxScenesPerProject ?? 160);

    const settings = Array.isArray(project.project_settings)
      ? project.project_settings[0]
      : project.project_settings;

    const result = await generateBeevoDynamicStoryboard({
      script: scriptToUse,
      durationSeconds: Number(project.requested_duration_seconds),
      aspectRatio: project.aspect_ratio,
      cartoonStyle: project.visual_style,
      language: project.language,
      audience: parsed.audience ?? "general",
      visualPacing: parsed.visualPacing ?? settings?.visual_pacing ?? "balanced",
      characterPreferences: parsed.characterPreferences ?? settings?.character_instructions,
      customInstructions: parsed.customInstructions ?? settings?.advanced_prompt_instructions,
      maxScenes,
    });

    const { data: latestSb } = await admin
      .from("storyboards")
      .select("version")
      .eq("project_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = Number(latestSb?.version ?? 0) + 1;

    const { data: storyboardRow, error: sbErr } = await admin
      .from("storyboards")
      .insert({
        user_id: auth.userId,
        project_id: id,
        version: nextVersion,
        script: scriptToUse,
        visual_style_bible: result.data.visualStyleBible,
        storyboard_json: result.data,
        approval_state: "draft",
      })
      .select("id")
      .single();

    if (sbErr || !storyboardRow) throw new Error(sbErr?.message ?? "Failed storing storyboard");

    await admin.from("characters").delete().eq("project_id", id);
    if (result.data.characters.length > 0) {
      await admin.from("characters").insert(
        result.data.characters.map((c) => ({
          user_id: auth.userId,
          project_id: id,
          character_code: c.characterCode,
          character_name: c.characterName,
          character_description: c.characterDescription,
          visual_identity: c.visualIdentity,
          appearance_instructions: c.appearanceInstructions,
        }))
      );
    }

    const { data: insertedScenes } = await admin
      .from("scenes")
      .insert(
        result.data.scenes.map((s, idx) => ({
          user_id: auth.userId,
          project_id: id,
          storyboard_id: storyboardRow.id,
          scene_number: idx + 1,
          narration_text: s.narrationText,
          narrative_purpose: s.narrativePurpose,
          visual_description: s.narrativePurpose,
          detailed_image_prompt: s.imagePrompt,
          character_reference_ids: s.characterReferences,
          environment: s.location,
          composition: s.composition,
          action: s.characterPose,
          emotion: s.characterExpression,
          camera_angle: s.cameraInstruction,
          transition: s.transitionInstruction || "crossfade",
          caption_keywords: s.captionKeywords,
          scene_status: "pending",
        }))
      )
      .select("*");

    await admin
      .from("projects")
      .update({
        script: scriptToUse,
        project_status: "storyboard_ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await admin.from("provider_usage").insert({
      user_id: auth.userId,
      project_id: id,
      provider: "openai",
      operation: "dynamic_storyboard_generation",
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
      storyboardId: storyboardRow.id,
      version: nextVersion,
      dynamicSceneCount: insertedScenes?.length ?? result.data.scenes.length,
      visualStyleBible: result.data.visualStyleBible,
      characters: result.data.characters,
      scenes: insertedScenes ?? [],
      validation: result.validation,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
