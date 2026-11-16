import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.payments.list");
    const { data, error } = await actor.adminSupabase
      .from("payments")
      .select("*, profiles(email, full_name), credit_packages(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return jsonOk({
      payments: (data ?? []).map((p) => {
        const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        const pkg = Array.isArray(p.credit_packages) ? p.credit_packages[0] : p.credit_packages;
        return {
          paymentId: p.razorpay_payment_id ?? p.id,
          orderId: p.razorpay_order_id,
          userId: p.user_id,
          customerName: prof?.full_name || prof?.email || p.user_id,
          customerEmail: prof?.email || "",
          packageName: pkg?.name ?? p.package_id,
          amountPaise: Number(p.amount_paise),
          currency: p.currency,
          method: p.method,
          status: p.status,
          refundStatus: p.refund_status,
          createdAt: p.created_at,
          razorpayFeePaise: p.razorpay_fee_paise,
          taxPaise: p.razorpay_tax_paise,
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
