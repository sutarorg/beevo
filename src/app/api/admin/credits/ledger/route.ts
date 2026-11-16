import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.credits.ledger");
    const { data, error } = await actor.adminSupabase
      .from("credit_ledger")
      .select("*, profiles!inner(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return jsonOk({
      ledger: (data ?? []).map((row) => {
        const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const amt = Number(row.credits);
        return {
          transactionId: row.id,
          userId: row.user_id,
          customerName: prof?.full_name || prof?.email || row.user_id,
          customerEmail: prof?.email || "",
          type: row.transaction_type,
          addedCredits:
            row.transaction_type === "purchase" ||
            (row.transaction_type === "admin_adjustment" && row.direction === "credit")
              ? amt
              : null,
          deductedCredits:
            row.transaction_type === "consumption" ||
            (row.transaction_type === "admin_adjustment" && row.direction === "debit")
              ? amt
              : null,
          reservedCredits: row.transaction_type === "reservation" ? amt : null,
          releasedCredits: row.transaction_type === "release" ? amt : null,
          refundCredits: row.transaction_type === "refund" ? amt : null,
          reference: row.description,
          createdAt: row.created_at,
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
