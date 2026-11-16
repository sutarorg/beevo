import { requireAdmin, writeAuditLog } from "@/lib/security/auth";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { adminUserStatusSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin("admin.users.detail");
    const { id } = await context.params;
    const admin = actor.adminSupabase;

    const [
      { data: profile },
      { data: wallet },
      { data: projects },
      { data: payments },
      { data: ledger },
      { data: gens },
      { data: usage },
    ] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", id).maybeSingle(),
      admin.from("credit_wallets").select("*").eq("user_id", id).maybeSingle(),
      admin.from("projects").select("*").eq("user_id", id).order("updated_at", { ascending: false }),
      admin.from("payments").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      admin.from("credit_ledger").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      admin.from("generations").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      admin.from("provider_usage").select("cost_inr, cost_source").eq("user_id", id),
    ]);

    if (!profile) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");

    const totalCost =
      usage && usage.length > 0
        ? Number(usage.reduce((s, u) => s + Number(u.cost_inr ?? 0), 0).toFixed(2))
        : null;
    const lifetimePurchased = (ledger ?? [])
      .filter((l) => l.transaction_type === "purchase")
      .reduce((s, l) => s + Number(l.credits ?? 0), 0);

    return jsonOk({
      user: {
        id: profile.user_id,
        fullName: profile.full_name || profile.email,
        email: profile.email,
        registeredAt: profile.created_at,
        status: profile.account_status,
        creditBalance: Number(wallet?.available_credits ?? 0),
        reservedCredits: Number(wallet?.reserved_credits ?? 0),
        lifetimePurchasedCredits: lifetimePurchased,
        totalGenerationCostInr: totalCost,
        costSource: totalCost === null ? "unavailable" : "estimated",
        totalProjects: (projects ?? []).length,
        completedVideos: (gens ?? []).filter((g) => g.generation_status === "completed").length,
        projects: projects ?? [],
        payments: payments ?? [],
        ledger: ledger ?? [],
        generations: gens ?? [],
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin("admin.users.status");
    const { id } = await context.params;
    const parsed = await parseJsonBody(request, adminUserStatusSchema);
    const admin = actor.adminSupabase;

    const { data, error } = await admin
      .from("profiles")
      .update({ account_status: parsed.status, updated_at: new Date().toISOString() })
      .eq("user_id", id)
      .select("user_id, email, account_status")
      .single();

    if (error) throw new Error(error.message);

    await writeAuditLog(admin, {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: parsed.status === "suspended" ? "user.suspend" : "user.reactivate",
      targetType: "user",
      targetId: id,
      result: "success",
      reason: parsed.reason,
      metadata: { targetEmail: data.email },
    });

    return jsonOk({ user: data });
  } catch (err) {
    return handleApiError(err);
  }
}
