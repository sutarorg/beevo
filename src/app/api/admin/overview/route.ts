import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin("admin.overview");
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const admin = actor.adminSupabase;

    const [usersRes, projectsRes, gensRes, walletsRes, ledgerRes, paymentsRes, usageRes, auditRes] =
      await Promise.all([
        admin.from("profiles").select("user_id, created_at, account_status"),
        admin.from("projects").select("id, created_at, requested_duration_seconds"),
        admin
          .from("generations")
          .select("id, user_id, generation_status, completed_image_count, consumed_credits, created_at, projects(requested_duration_seconds)"),
        admin.from("credit_wallets").select("available_credits, reserved_credits"),
        admin.from("credit_ledger").select("transaction_type, credits, created_at"),
        admin
          .from("payments")
          .select("amount_paise, refunded_paise, razorpay_fee_paise, razorpay_tax_paise, status, created_at")
          .eq("status", "captured"),
        admin.from("provider_usage").select("provider, cost_inr, cost_source, created_at"),
        admin
          .from("audit_logs")
          .select("id, actor_email, action, target_type, target_id, result, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const inRange = (iso: string) => {
      const d = iso.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const users = usersRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const gens = (gensRes.data ?? []).filter((g) => inRange(g.created_at));
    const wallets = walletsRes.data ?? [];
    const ledger = ledgerRes.data ?? [];
    const payments = (paymentsRes.data ?? []).filter((p) => inRange(p.created_at));
    const usage = (usageRes.data ?? []).filter((u) => inRange(u.created_at));

    const completedGens = gens.filter((g) => g.generation_status === "completed");
    const failedGens = gens.filter((g) => g.generation_status === "failed");

    const grossPaise = payments.reduce((sum, p) => sum + Number(p.amount_paise ?? 0), 0);
    const grossInr = payments.length > 0 ? grossPaise / 100 : null;
    const netExTaxInr = grossInr !== null ? Number((grossInr / 1.18).toFixed(2)) : null;

    const providerExp = usage
      .filter((u) => ["openai", "fal_ai", "elevenlabs"].includes(u.provider))
      .reduce((sum, u) => sum + Number(u.cost_inr ?? 0), 0);
    const renderingExp = usage
      .filter((u) => ["ffmpeg", "cloudflare_r2"].includes(u.provider))
      .reduce((sum, u) => sum + Number(u.cost_inr ?? 0), 0);

    const totalCostInr = providerExp + renderingExp;
    const marginPct =
      netExTaxInr !== null && netExTaxInr > 0
        ? Number((((netExTaxInr - totalCostInr) / netExTaxInr) * 100).toFixed(1))
        : null;

    const completedSeconds = completedGens.reduce((sum, g) => {
      const p = Array.isArray(g.projects) ? g.projects[0] : g.projects;
      return sum + Number(p?.requested_duration_seconds ?? 0);
    }, 0);

    return jsonOk({
      metrics: {
        totalUsers: users.length,
        newUsers: users.filter((u) => inRange(u.created_at)).length,
        activeUsers: new Set(gens.map((g) => g.user_id)).size,
        totalProjects: projects.length,
        completedVideos: completedGens.length,
        failedGenerations: failedGens.length,
        totalGeneratedMinutes: Number((completedSeconds / 60).toFixed(2)),
        totalImageRequests: gens.reduce((s, g) => s + Number(g.completed_image_count ?? 0), 0),
        creditsIssued: ledger
          .filter((l) => l.transaction_type === "purchase")
          .reduce((s, l) => s + Number(l.credits ?? 0), 0),
        creditsConsumed: ledger
          .filter((l) => l.transaction_type === "consumption")
          .reduce((s, l) => s + Number(l.credits ?? 0), 0),
        reservedCredits: wallets.reduce((s, w) => s + Number(w.reserved_credits ?? 0), 0),
        grossPaymentReceiptsInr: grossInr,
        netRevenueExTaxInr: netExTaxInr,
        providerExpenditureInr: usage.length > 0 ? Number(providerExp.toFixed(2)) : null,
        renderingExpenditureInr: usage.length > 0 ? Number(renderingExp.toFixed(2)) : null,
        contributionMarginPct: marginPct,
      },
      charts: {
        revenueOverTime: [],
        generatedVideoMinutes: [],
        newUsers: [],
        imageGenerationCosts: [],
        voiceGenerationCosts: [],
        renderingExpenses: [],
        creditConsumption: [],
        generationOutcomes: [],
      },
      recentActivity: (auditRes.data ?? []).map((a) => ({
        id: a.id,
        category: "credit_adjustment",
        summary: `${a.action} (${a.target_type})`,
        actorOrUser: a.actor_email,
        referenceId: a.target_id,
        timestamp: a.created_at,
        href: "/admin/audit-logs",
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
