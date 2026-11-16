import { requireAdmin, writeAuditLog } from "@/lib/security/auth";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { adminMusicTrackSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.music.list");
    const { data, error } = await actor.adminSupabase
      .from("music_library")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return jsonOk({ tracks: data ?? [] });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin("admin.music.create");
    const parsed = await parseJsonBody(request, adminMusicTrackSchema);

    const { data, error } = await actor.adminSupabase
      .from("music_library")
      .insert({
        name: parsed.name,
        kind: parsed.kind,
        mood: parsed.mood,
        duration_seconds: parsed.durationSeconds,
        storage_key: parsed.storageKey,
        mime_type: parsed.mimeType,
        usage_rights: parsed.usageRights,
        license_reference: parsed.licenseReference,
        active: parsed.active,
        uploaded_by: actor.userId,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    await writeAuditLog(actor.adminSupabase, {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "music_library.create",
      targetType: "music_library",
      targetId: data.id,
      result: "success",
      metadata: { name: data.name, kind: data.kind },
    });

    return jsonOk({ track: data }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
