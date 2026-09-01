import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { activatePro } from "@/app/api/billing/verify/route";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — raw body HMAC verification, idempotent activation.
 * Configure: https://dashboard.razorpay.com/app/webhooks
 * events: payment.captured, payment.failed
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    if (entity?.order_id) {
      const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, entity.order_id)).limit(1);
      if (payment && payment.status !== "paid") {
        await db
          .update(payments)
          .set({ status: "paid", razorpayPaymentId: entity.id ?? null, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
        await activatePro(payment.workspaceId, {
          months: payment.cycle === "annual" ? 12 : 1,
          description: payment.cycle === "annual" ? "Beevo Pro — Annual" : "Beevo Pro — Monthly",
          razorpayPaymentId: entity.id ?? null,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
