import { db } from "@/db";
import { payments } from "@/db/schema";
import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { env } from "@/lib/server/env";
import { activatePro } from "@/app/api/billing/verify/route";
import { priceFor } from "@/lib/pricing";
import { emails, sendMail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

/**
 * Demo-mode plan activation used only when Razorpay is NOT configured.
 * Disable with ALLOW_DEMO_BILLING=false (forced off whenever real keys exist).
 */
export const POST = handler(async () => {
  const { workspace, user } = await requireUser();
  if (env.billing.configured()) {
    throw new ApiError(400, "Razorpay is configured — use the real checkout flow");
  }
  if (!env.allowDemoBilling()) {
    throw new ApiError(403, "Demo billing is disabled on this deployment");
  }

  const price = priceFor("monthly");
  await db.insert(payments).values({
    workspaceId: workspace.id,
    plan: "pro",
    cycle: "monthly",
    amountInr: Math.round(price.totalPaise / 100),
    basePaise: price.basePaise,
    gstPaise: price.gstPaise,
    totalPaise: price.totalPaise,
    method: "demo",
    methodDetail: "Demo activation (no charge)",
    status: "demo",
  });
  const { renewsAt, invoiceNo } = await activatePro(workspace.id, { cycle: "monthly", demo: true });

  void sendMail({
    to: user.email,
    subject: `Beevo Pro invoice ${invoiceNo}`,
    html: emails.invoice(`${price.total} (demo)`, invoiceNo),
  });

  return ok({ plan: "pro", renewsOn: renewsAt.toISOString(), demo: true, message: "Welcome to Beevo Pro — the whole hive is yours." });
});
