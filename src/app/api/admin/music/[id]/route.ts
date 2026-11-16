import { requireAdmin, writeAuditLog } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { z } from "zod";

const patchTrackSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  mood: z
    .enum(["happy", "cinematic", "playful", "emotional", "relaxing", "educational", "sfx"])
    .optional(),
  active: z.boolean().optional(),
  usageRights: z.string().trim().min(2).max(300).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin("admin.music.update");
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, patchTrackSchema);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.mood !== undefined) updates.mood = parsed.mood;
    if (parsed.active !== undefined) updates.active = parsed.active;
    if (parsed.usageRights !== undefined) updates.usage_rights = parsed.usageRights;

    const { data, error } = await actor.adminSupabase
      .from("music_library")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new ApiError(404, "TRACK_NOT_FOUND", "Music track not found.");

    await writeAuditLog(actor.adminSupabase, {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "music_library.update",
      targetType: "music_library",
      targetId: id,
      result: "success",
      metadata: updates,
    });

    return jsonOk({ track: data });
  } catch (err) {
    return handleApiError(err);
  }
}
