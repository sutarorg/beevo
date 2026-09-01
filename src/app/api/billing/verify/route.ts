import { z } from "zod";
import { addMonths } from "date-fns";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, notifications, payments, workspaces } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { verifyPaymentSignature, PLAN_AMOUNTS } from "@/lib/server/razorpay";
import { emails, sendMail } from "@/lib/server/email";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(6),
  paymentId: z.string().min(6),
  signature: z.string().min(10),
});

export async function activatePro(workspaceId: string, opts: {
  months: number;
  description: string;
  razorpayPaymentId?: string | null;
  status?: string;
}) {
  const renewsAt = addMonths(new Date(), opts.months);
  await db
    .update(workspaces)
    .set({ plan: "pro", planRenewsAt: renewsAt })
    .where(eq(workspaces.id, workspaceId));
  const invoiceNo = `INV-${new Date().getFullYear()}-${randomToken(3).toUpperCase()}`;
  const base = Math.round((797 / 1.18) * opts.months);
  await db.insert(invoices).values({
    workspaceId,
    number: invoiceNo,
    description: opts.description,
    amountInr: Math.round(base * 1.18),
    gstInr: Math.round(base * 0.18),
    status: "paid",
    razorpayPaymentId: opts.razorpayPaymentId ?? null,
  });
  await db.insert(notifications).values({
    workspaceId,
    kind: "plan",
    title: "Welcome to Beevo Pro",
    body: "Unlimited posts, Hive Writer and the best-time engine are now active.",
  });
  return { renewsAt, invoiceNo };
}

export const POST = handler(async (req: Request) => {
  const { workspace, user } = await requireUser();
  const body = await parseBody(req, schema);

  if (!verifyPaymentSignature(body.orderId, body.paymentId, body.signature)) {
    await db
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(and(eq(payments.razorpayOrderId, body.orderId), eq(payments.workspaceId, workspace.id)));
    throw new ApiError(400, "Payment signature verification failed", "BAD_SIGNATURE");
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.razorpayOrderId, body.orderId), eq(payments.workspaceId, workspace.id)))
    .limit(1);
  if (!payment) throw new ApiError(404, "Order not found for this workspace");

  await db
    .update(payments)
    .set({
      status: "paid",
      razorpayPaymentId: body.paymentId,
      razorpaySignature: body.signature,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  const months = payment.cycle === "annual" ? 12 : 1;
  const { renewsAt, invoiceNo } = await activatePro(workspace.id, {
    months,
    description: PLAN_AMOUNTS[payment.cycle === "annual" ? "pro_annual" : "pro_monthly"].label,
    razorpayPaymentId: body.paymentId,
    status: "paid",
  });

  void sendMail({
    to: user.email,
    subject: `Beevo Pro invoice ${invoiceNo}`,
    html: emails.invoice(`₹${payment.amountInr.toLocaleString("en-IN")}`, invoiceNo),
  });

  return ok({ plan: "pro", renewsOn: renewsAt.toISOString(), invoice: invoiceNo });
});
