import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.media.list");
    const { data, error } = await actor.adminSupabase
      .from("assets")
      .select(
        "id, asset_type, size_bytes, storage_key, access_policy, created_at, user_id, project_id, profiles(full_name, email), projects(title)"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return jsonOk({
      assets: (data ?? []).map((a) => {
        const prof = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
        const proj = Array.isArray(a.projects) ? a.projects[0] : a.projects;
        return {
          id: a.id,
          assetType: a.asset_type,
          fileSizeBytes: Number(a.size_bytes ?? 0),
          ownerName: prof?.full_name || prof?.email || a.user_id,
          ownerId: a.user_id,
          projectTitle: proj?.title ?? null,
          projectId: a.project_id,
          createdAt: a.created_at,
          storageKey: a.storage_key,
          accessPolicy: a.access_policy,
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
