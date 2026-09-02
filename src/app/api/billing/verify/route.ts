import { z } from "zod";
import { addMonths } from "date-fns";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, notifications, payments, workspaces } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { verifyPaymentSignature, fetchPayment, describePayment } from "@/lib/server/razorpay";
import { priceFor, formatPaiseExact, type BillingCycle } from "@/lib/pricing";
import { emails, sendMail } from "@/lib/server/email";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(6),
  paymentId: z.string().min(6),
  signature: z.string().min(10),
});

export async function activatePro(
  workspaceId: string,
  opts: {
    cycle: BillingCycle;
    razorpayPaymentId?: string | null;
    demo?: boolean;
  }
) {
  const price = priceFor(opts.cycle);
  const renewsAt = addMonths(new Date(), price.months);
  await db.update(workspaces).set({ plan: "pro", planRenewsAt: renewsAt }).where(eq(workspaces.id, workspaceId));

  const invoiceNo = `INV-${new Date().getFullYear()}-${randomToken(3).toUpperCase()}`;
  await db.insert(invoices).values({
    workspaceId,
    number: invoiceNo,
    description: `${price.label}${opts.demo ? " (demo)" : ""}`,
    amountInr: Math.round(price.totalPaise / 100),
    gstInr: Math.round(price.gstPaise / 100),
    basePaise: price.basePaise,
    gstPaise: price.gstPaise,
    totalPaise: price.totalPaise,
    status: "paid",
    razorpayPaymentId: opts.razorpayPaymentId ?? null,
  });
  await db.insert(notifications).values({
    workspaceId,
    kind: "plan",
    title: "Welcome to Beevo Pro",
    body: `Payment of ${price.total} received (incl. ${price.gst} GST). Unlimited posts and Hive Writer are active.`,
  });
  return { renewsAt, invoiceNo, price };
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
  if (payment.status === "paid") {
    return ok({ plan: "pro", alreadyProcessed: true });
  }

  // Record the real instrument the customer paid with.
  const rzp = await fetchPayment(body.paymentId);
  const { method, detail } = describePayment(rzp);

  await db
    .update(payments)
    .set({
      status: "paid",
      razorpayPaymentId: body.paymentId,
      razorpaySignature: body.signature,
      method,
      methodDetail: detail,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  const cycle = (payment.cycle === "annual" ? "annual" : "monthly") as BillingCycle;
  const { renewsAt, invoiceNo, price } = await activatePro(workspace.id, {
    cycle,
    razorpayPaymentId: body.paymentId,
  });

  void sendMail({
    to: user.email,
    subject: `Beevo Pro invoice ${invoiceNo}`,
    html: emails.invoice(formatPaiseExact(price.totalPaise), invoiceNo),
  });

  return ok({ plan: "pro", renewsOn: renewsAt.toISOString(), invoice: invoiceNo, total: price.total });
});
