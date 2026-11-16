import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireUser();
    const [{ data: wallet, error }, { data: purchased }] = await Promise.all([
      auth.adminSupabase
        .from("credit_wallets")
        .select("available_credits, reserved_credits, updated_at")
        .eq("user_id", auth.userId)
        .maybeSingle(),
      auth.adminSupabase
        .from("credit_ledger")
        .select("credits")
        .eq("user_id", auth.userId)
        .eq("transaction_type", "purchase"),
    ]);

    if (error) throw new Error(error.message);

    const lifetimePurchased = (purchased ?? []).reduce((s, r) => s + Number(r.credits ?? 0), 0);

    return jsonOk({
      availableCredits: Number(wallet?.available_credits ?? 0),
      reservedCredits: Number(wallet?.reserved_credits ?? 0),
      lifetimePurchasedCredits: lifetimePurchased,
      updatedAt: wallet?.updated_at ?? new Date().toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
