import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { patchSceneSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, patchSceneSchema);
    const admin = auth.adminSupabase;

    const { data: scene } = await admin
      .from("scenes")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!scene) throw new ApiError(404, "SCENE_NOT_FOUND", "Scene not found.");
    if (scene.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.narrationText !== undefined) updates.narration_text = parsed.narrationText;
    if (parsed.visualDescription !== undefined) updates.visual_description = parsed.visualDescription;
    if (parsed.detailedImagePrompt !== undefined) {
      updates.detailed_image_prompt = parsed.detailedImagePrompt;
    }
    if (parsed.cameraAngle !== undefined) updates.camera_angle = parsed.cameraAngle;
    if (parsed.transition !== undefined) updates.transition = parsed.transition;
    if (parsed.emotion !== undefined) updates.emotion = parsed.emotion;

    const { data, error } = await admin
      .from("scenes")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return jsonOk({ scene: data });
  } catch (err) {
    return handleApiError(err);
  }
}
