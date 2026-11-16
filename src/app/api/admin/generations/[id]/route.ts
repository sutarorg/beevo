import { requireAdmin } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin("admin.generations.detail");
    const { id } = await context.params;
    const admin = actor.adminSupabase;

    const { data: gen } = await admin
      .from("generations")
      .select("*, projects(*), profiles(email, full_name)")
      .eq("id", id)
      .maybeSingle();

    if (!gen) throw new ApiError(404, "GENERATION_NOT_FOUND", "Generation not found.");

    const [{ data: jobs }, { data: renderJobs }, { data: usage }, { data: scenes }, { data: events }] =
      await Promise.all([
        admin.from("generation_jobs").select("*").eq("generation_id", id),
        admin.from("render_jobs").select("*").eq("generation_id", id).order("created_at"),
        admin.from("provider_usage").select("*").eq("generation_id", id).order("created_at"),
        admin.from("scenes").select("*").eq("project_id", gen.project_id).order("scene_number"),
        admin.from("generation_events").select("*").eq("generation_id", id).order("id"),
      ]);

    return jsonOk({
      generation: gen,
      jobs: jobs ?? [],
      renderJobs: renderJobs ?? [],
      providerUsage: usage ?? [],
      scenes: scenes ?? [],
      events: events ?? [],
    });
  } catch (err) {
    return handleApiError(err);
  }
}
