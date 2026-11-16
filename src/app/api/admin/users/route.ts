import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.users.list");
    const admin = actor.adminSupabase;

    const [{ data: profiles }, { data: wallets }, { data: projects }, { data: gens }] =
      await Promise.all([
        admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
        admin.from("credit_wallets").select("user_id, available_credits"),
        admin.from("projects").select("user_id"),
        admin
          .from("generations")
          .select("user_id, generation_status, projects(requested_duration_seconds)")
          .eq("generation_status", "completed"),
      ]);

    const walletMap = new Map(
      (wallets ?? []).map((w) => [w.user_id, Number(w.available_credits ?? 0)])
    );
    const projectCounts = new Map<string, number>();
    for (const p of projects ?? []) {
      projectCounts.set(p.user_id, (projectCounts.get(p.user_id) ?? 0) + 1);
    }
    const videoStats = new Map<string, { count: number; secs: number }>();
    for (const g of gens ?? []) {
      const cur = videoStats.get(g.user_id) ?? { count: 0, secs: 0 };
      const p = Array.isArray(g.projects) ? g.projects[0] : g.projects;
      cur.count += 1;
      cur.secs += Number(p?.requested_duration_seconds ?? 0);
      videoStats.set(g.user_id, cur);
    }

    return jsonOk({
      users: (profiles ?? []).map((p) => {
        const vs = videoStats.get(p.user_id) ?? { count: 0, secs: 0 };
        return {
          id: p.user_id,
          fullName: p.full_name || p.email,
          email: p.email,
          registeredAt: p.created_at,
          creditBalance: walletMap.get(p.user_id) ?? 0,
          totalProjects: projectCounts.get(p.user_id) ?? 0,
          completedVideos: vs.count,
          generatedDurationSeconds: vs.secs,
          status: p.account_status,
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
