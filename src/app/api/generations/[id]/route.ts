import { isR2Configured } from "@/lib/env";
import { createSignedDownloadUrl } from "@/lib/r2/client";
import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const admin = auth.adminSupabase;

    const { data: gen } = await admin
      .from("generations")
      .select(
        "*, projects(title, requested_duration_seconds, aspect_ratio, resolution), output_asset:assets!generations_output_asset_id_fkey(id, storage_key, metadata)"
      )
      .eq("id", id)
      .maybeSingle();

    if (!gen) throw new ApiError(404, "GENERATION_NOT_FOUND", "Generation not found.");
    if (gen.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const [{ data: scenes }, { data: timeline }, { data: events }] = await Promise.all([
      admin
        .from("scenes")
        .select("id, scene_number, scene_status, scene_assets(is_active, assets(storage_key))")
        .eq("project_id", gen.project_id)
        .order("scene_number", { ascending: true }),
      gen.timeline_id
        ? admin.from("timelines").select("*").eq("id", gen.timeline_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("generation_events")
        .select("*")
        .eq("generation_id", id)
        .order("id", { ascending: true })
        .limit(100),
    ]);

    const canSign = isR2Configured();
    const generatedImages = await Promise.all(
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
          sceneIndex: s.scene_number,
          sceneId: s.id,
          status: s.scene_status,
          imageUrl: signed?.url ?? null,
        };
      })
    );

    const proj = Array.isArray(gen.projects) ? gen.projects[0] : gen.projects;
    const outputAsset = Array.isArray(gen.output_asset) ? gen.output_asset[0] : gen.output_asset;
    const signedMp4 =
      canSign && gen.generation_status === "completed" && outputAsset?.storage_key
        ? await createSignedDownloadUrl({ storageKey: outputAsset.storage_key, expiresInSeconds: 900 })
        : null;

    return jsonOk({
      id: gen.id,
      projectId: gen.project_id,
      projectTitle: proj?.title ?? "Untitled",
      status: gen.generation_status,
      currentStage: gen.current_stage,
      progressPercent: Number(gen.progress_percent),
      requestedDurationSeconds: Number(proj?.requested_duration_seconds ?? 60),
      expectedImageCount: gen.dynamic_image_count,
      generatedImageCount: Number(gen.completed_image_count),
      generatedImages,
      voiceStatus: gen.voice_status,
      alignmentStatus: gen.alignment_status,
      renderingStatus: gen.rendering_status,
      exportStatus: gen.export_status,
      timeline: timeline
        ? {
            totalDurationSeconds: Number(timeline.total_duration_seconds),
            segments: timeline.scene_timings ?? [],
          }
        : null,
      events: events ?? [],
      credits: {
        reservedCredits: Number(gen.reserved_credits),
        consumedCredits: gen.consumed_credits,
      },
      errorDetails: gen.error_details,
      completedVideo:
        gen.generation_status === "completed" && outputAsset
          ? {
              videoId: outputAsset.id,
              mp4Url: signedMp4?.url ?? null,
              finalDurationSeconds: Number(
                outputAsset.metadata?.duration_seconds ?? proj?.requested_duration_seconds ?? 0
              ),
              r2Verified: true,
            }
          : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
