import { isR2Configured, isSupabaseAdminConfigured } from "@/lib/env";
import { createSignedDownloadUrl } from "@/lib/r2/client";
import { handleApiError, jsonOk } from "@/lib/security/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isSupabaseAdminConfigured()) {
      return jsonOk({ configured: false, tracks: [] });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("music_library")
      .select("id, name, kind, mood, duration_seconds, storage_key, usage_rights, license_reference, active")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    const canSign = isR2Configured();
    const tracks = await Promise.all(
      (data ?? []).map(async (row) => {
        const signed =
          canSign && row.storage_key
            ? await createSignedDownloadUrl({ storageKey: row.storage_key, expiresInSeconds: 900 })
            : null;
        return {
          id: row.id,
          title: row.name,
          kind: row.kind,
          mood: row.mood,
          durationSeconds: Number(row.duration_seconds),
          licenseSource: row.license_reference,
          usageRights: row.usage_rights,
          previewUrl: signed?.url ?? null,
        };
      })
    );

    return jsonOk({ configured: true, tracks });
  } catch (err) {
    return handleApiError(err);
  }
}
