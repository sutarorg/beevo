import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.generations.list");
    const { data, error } = await actor.adminSupabase
      .from("generations")
      .select("*, projects(title, requested_duration_seconds), profiles(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    return jsonOk({ generations: data ?? [] });
  } catch (err) {
    return handleApiError(err);
  }
}
