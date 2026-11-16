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

    const { data: asset } = await admin
      .from("assets")
      .select("id, user_id, project_id, asset_type, storage_key, size_bytes, projects(title)")
      .eq("id", id)
      .eq("asset_type", "finished_mp4")
      .maybeSingle();

    if (!asset) {
      throw new ApiError(404, "VIDEO_NOT_FOUND", "Final MP4 video asset not found.");
    }
    if (asset.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to download this video.");
    }

    const proj = Array.isArray(asset.projects) ? asset.projects[0] : asset.projects;
    const safeTitle = (proj?.title ?? "beevo-video")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    const signed = await createSignedDownloadUrl({
      storageKey: asset.storage_key,
      expiresInSeconds: 900,
      downloadFileName: `${safeTitle || "beevo-video"}.mp4`,
    });

    return jsonOk({
      videoId: asset.id,
      downloadUrl: signed.url,
      expiresInSeconds: signed.expiresInSeconds,
      sizeBytes: Number(asset.size_bytes),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
