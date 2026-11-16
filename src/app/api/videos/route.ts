import { isR2Configured } from "@/lib/env";
import { createSignedDownloadUrl } from "@/lib/r2/client";
import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireUser();
    const { data, error } = await auth.adminSupabase
      .from("generations")
      .select(
        "id, project_id, generation_status, completed_at, output_asset_id, projects(title, original_idea, requested_duration_seconds, aspect_ratio, resolution, visual_style), video:assets!generations_output_asset_id_fkey(id, storage_key, size_bytes, metadata)"
      )
      .eq("user_id", auth.userId)
      .not("output_asset_id", "is", null)
      .order("completed_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    const canSign = isR2Configured();
    const videos = await Promise.all(
      (data ?? []).map(async (row) => {
        const proj = Array.isArray(row.projects) ? row.projects[0] : row.projects;
        const vid = Array.isArray(row.video) ? row.video[0] : row.video;
        const signed =
          canSign && vid?.storage_key
            ? await createSignedDownloadUrl({ storageKey: vid.storage_key, expiresInSeconds: 900 })
            : null;
        return {
          id: vid?.id ?? row.output_asset_id,
          generationId: row.id,
          projectId: row.project_id,
          title: proj?.title ?? "Untitled Video",
          originalIdea: proj?.original_idea ?? "",
          durationSeconds: Number(
            vid?.metadata?.duration_seconds ?? proj?.requested_duration_seconds ?? 0
          ),
          aspectRatio: proj?.aspect_ratio ?? "16:9",
          resolution: proj?.resolution ?? "1080p",
          styleName: proj?.visual_style ?? "Cartoon",
          createdAt: row.completed_at ?? new Date().toISOString(),
          status: row.generation_status === "completed" ? ("completed" as const) : ("processing" as const),
          thumbnailUrl: null,
          mp4Url: signed?.url ?? null,
        };
      })
    );

    return jsonOk({ videos });
  } catch (err) {
    return handleApiError(err);
  }
}
