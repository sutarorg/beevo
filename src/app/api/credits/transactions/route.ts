import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    const { data, error, count } = await auth.adminSupabase
      .from("credit_ledger")
      .select("*", { count: "exact" })
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return jsonOk({
      total: count ?? 0,
      transactions: (data ?? []).map((row) => ({
        id: row.id,
        type: row.transaction_type,
        creditsDelta: row.direction === "credit" ? Number(row.credits) : -Number(row.credits),
        balanceAfter: null,
        amountInr: row.metadata?.amount_paise ? Number(row.metadata.amount_paise) / 100 : null,
        referenceLabel: row.description,
        projectId: row.reference_type === "generation" ? row.reference_id : null,
        createdAt: row.created_at,
        status: "completed" as const,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
