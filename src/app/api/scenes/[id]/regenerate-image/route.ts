import crypto from "node:crypto";
import { pollAndFetchFalImage, submitFalImageJob } from "@/lib/fal/client";
import {
  buildProjectR2Key,
  createSignedDownloadUrl,
  uploadBufferToR2,
} from "@/lib/r2/client";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { z } from "zod";

const regenBodySchema = z.object({
  promptOverride: z.string().trim().min(10).max(4000).optional(),
  seed: z.number().int().min(0).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    enforceRateLimit(`regen:${auth.userId}`, RATE_LIMITS.storyGen);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = regenBodySchema.parse(body);

    const admin = auth.adminSupabase;
    const { data: scene } = await admin
      .from("scenes")
      .select("*, projects!inner(user_id, aspect_ratio)")
      .eq("id", id)
      .maybeSingle();

    if (!scene) throw new ApiError(404, "SCENE_NOT_FOUND", "Scene not found.");
    const proj = Array.isArray(scene.projects) ? scene.projects[0] : scene.projects;
    if (proj?.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const aspectRatio = (proj.aspect_ratio as "16:9" | "9:16" | "1:1") || "16:9";
    const promptToUse = parsed.promptOverride ?? scene.detailed_image_prompt;

    const submitted = await submitFalImageJob({
      prompt: promptToUse,
      aspectRatio,
      seed: parsed.seed,
    });
    const result = await pollAndFetchFalImage({
      submitted,
      expectedAspectRatio: aspectRatio,
    });

    const storageKey = buildProjectR2Key({
      userId: proj.user_id,
      projectId: scene.project_id,
      folder: "scenes",
      fileName: `scene-${String(scene.scene_number).padStart(4, "0")}-regen-${Date.now()}.png`,
    });
    const uploaded = await uploadBufferToR2({
      storageKey,
      body: result.buffer,
      contentType: `image/${result.format}`,
      assetType: "cartoon_image",
    });

    const sha256 = crypto.createHash("sha256").update(result.buffer).digest("hex");
    const { data: assetRow, error: assetErr } = await admin
      .from("assets")
      .insert({
        user_id: proj.user_id,
        project_id: scene.project_id,
        asset_type: "cartoon_image",
        storage_key: uploaded.storageKey,
        file_type: `image/${result.format}`,
        size_bytes: uploaded.sizeBytes,
        sha256,
        metadata: { width: result.width, height: result.height, model_id: result.modelId },
      })
      .select("id")
      .single();

    if (assetErr || !assetRow) throw new Error(assetErr?.message ?? "Failed storing asset");

    await admin.from("scene_assets").update({ is_active: false }).eq("scene_id", id);

    const { count: attempts } = await admin
      .from("scene_assets")
      .select("id", { count: "exact", head: true })
      .eq("scene_id", id);

    await admin.from("scene_assets").insert({
      user_id: proj.user_id,
      project_id: scene.project_id,
      scene_id: id,
      asset_id: assetRow.id,
      fal_request_id: result.requestId,
      model_id: result.modelId,
      width: result.width,
      height: result.height,
      is_active: true,
      validation_status: "validated",
      attempt_number: Number(attempts ?? 0) + 1,
      cost_inr: result.costInr,
    });

    await admin
      .from("scenes")
      .update({
        detailed_image_prompt: promptToUse,
        scene_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await admin.from("provider_usage").insert({
      user_id: proj.user_id,
      project_id: scene.project_id,
      provider: "fal_ai",
      operation: "scene_image_regeneration",
      model_id: result.modelId,
      input_units: 1,
      output_units: 1,
      unit_type: "image",
      cost_usd: result.costUsd,
      cost_inr: result.costInr,
      cost_source: result.costSource,
      provider_request_id: result.requestId,
    });

    const signed = await createSignedDownloadUrl({
      storageKey: uploaded.storageKey,
      expiresInSeconds: 900,
    });

    return jsonOk({
      sceneId: id,
      assetId: assetRow.id,
      imageUrl: signed.url,
      width: result.width,
      height: result.height,
      modelId: result.modelId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
