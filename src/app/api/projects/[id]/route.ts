import { calculateRequiredCreditsServer } from "@/features/credits/service";
import { isR2Configured } from "@/lib/env";
import { createSignedDownloadUrl, deleteR2Object } from "@/lib/r2/client";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { updateProjectSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const admin = auth.adminSupabase;

    const { data: project, error } = await admin
      .from("projects")
      .select("*, project_settings(*)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    }
    if (project.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "You do not have access to this project.");
    }

    const [{ data: storyboard }, { data: characters }, { data: scenes }] = await Promise.all([
      admin
        .from("storyboards")
        .select("*")
        .eq("project_id", id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("characters")
        .select("*, assets!characters_reference_asset_id_fkey(storage_key)")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
      admin
        .from("scenes")
        .select("*, scene_assets(is_active, assets(storage_key))")
        .eq("project_id", id)
        .order("scene_number", { ascending: true }),
    ]);

    const canSign = isR2Configured();

    const signedCharacters = await Promise.all(
      (characters ?? []).map(async (c) => {
        const asset = Array.isArray(c.assets) ? c.assets[0] : c.assets;
        const signed =
          canSign && asset?.storage_key
            ? await createSignedDownloadUrl({ storageKey: asset.storage_key, expiresInSeconds: 900 })
            : null;
        return {
          id: c.id,
          code: c.character_code,
          name: c.character_name,
          description: c.character_description,
          visualIdentity: c.visual_identity,
          status: asset?.storage_key ? ("generated" as const) : ("planned" as const),
          imageUrl: signed?.url ?? null,
        };
      })
    );

    const signedScenes = await Promise.all(
      (scenes ?? []).map(async (s) => {
        const saList = Array.isArray(s.scene_assets) ? s.scene_assets : [];
        const activeSa = saList.find((x: { is_active?: boolean }) => x.is_active) ?? saList[0];
        const assetObj = activeSa
          ? Array.isArray(activeSa.assets)
            ? activeSa.assets[0]
            : activeSa.assets
          : null;
        const signed =
          canSign && assetObj?.storage_key
            ? await createSignedDownloadUrl({ storageKey: assetObj.storage_key, expiresInSeconds: 900 })
            : null;
        return {
          id: s.id,
          orderIndex: s.scene_number,
          narrationText: s.narration_text,
          visualDescription: s.visual_description,
          imagePrompt: s.detailed_image_prompt,
          characterRefs: s.character_reference_ids ?? [],
          composition: s.composition ?? "",
          cameraInstruction: s.camera_angle,
          emotion: s.emotion ?? "",
          transition: s.transition,
          imageStatus: s.scene_status === "completed" ? ("generated" as const) : ("planned" as const),
          imageUrl: signed?.url ?? null,
        };
      })
    );

    return jsonOk({
      project: {
        ...project,
        creditsRequired: calculateRequiredCreditsServer(Number(project.requested_duration_seconds)),
      },
      storyboard,
      characters: signedCharacters,
      scenes: signedScenes,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, updateProjectSchema);
    const admin = auth.adminSupabase;

    const { data: existing } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    if (existing.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.title !== undefined) updates.title = parsed.title;
    if (parsed.originalIdea !== undefined) updates.original_idea = parsed.originalIdea;
    if (parsed.script !== undefined) updates.script = parsed.script;
    if (parsed.durationSeconds !== undefined) {
      calculateRequiredCreditsServer(parsed.durationSeconds);
      updates.requested_duration_seconds = parsed.durationSeconds;
    }
    if (parsed.aspectRatio !== undefined) updates.aspect_ratio = parsed.aspectRatio;
    if (parsed.resolution !== undefined) updates.resolution = parsed.resolution;
    if (parsed.visualStyle !== undefined) updates.visual_style = parsed.visualStyle;
    if (parsed.language !== undefined) updates.language = parsed.language;

    const { data, error } = await admin
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const settingUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.voiceId !== undefined) settingUpdates.voice_id = parsed.voiceId;
    if (parsed.visualPacing !== undefined) settingUpdates.visual_pacing = parsed.visualPacing;
    if (parsed.captions !== undefined) settingUpdates.captions = parsed.captions;
    if (parsed.durationSeconds !== undefined) settingUpdates.duration_seconds = parsed.durationSeconds;

    if (Object.keys(settingUpdates).length > 1) {
      await admin.from("project_settings").update(settingUpdates).eq("project_id", id);
    }

    return jsonOk({ project: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const admin = auth.adminSupabase;

    const { data: existing } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    if (existing.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const { data: assets } = await admin
      .from("assets")
      .select("storage_key")
      .eq("project_id", id);

    const { error } = await admin.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);

    if (isR2Configured() && assets && assets.length > 0) {
      await Promise.all(assets.map((a) => deleteR2Object(a.storage_key).catch(() => undefined)));
    }

    return jsonOk({ deleted: true, id });
  } catch (err) {
    return handleApiError(err);
  }
}
