import { z } from "zod";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { createOrder } from "@/lib/server/razorpay";
import { priceFor } from "@/lib/pricing";
import { env } from "@/lib/server/env";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({ cycle: z.enum(["monthly", "annual"]).default("monthly") });

/**
 * Creates a Razorpay order for ₹799 + 18% GST = ₹942.82 (94282 paise).
 * When Razorpay keys aren't configured the client falls back to
 * /api/billing/demo-activate (only if ALLOW_DEMO_BILLING=true).
 */
export const POST = handler(async (req: Request) => {
  const { workspace, member, user } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't manage billing");
  const { cycle } = await parseBody(req, schema);
  const price = priceFor(cycle);

  if (!env.billing.configured()) {
    return ok({
      configured: false,
      demoAllowed: env.allowDemoBilling(),
      breakdown: {
        basePaise: price.basePaise,
        gstPaise: price.gstPaise,
        totalPaise: price.totalPaise,
      },
    });
  }

  const receipt = `beevo_${workspace.id.slice(0, 8)}_${randomToken(6)}`;
  const order = await createOrder({
    amountPaise: price.totalPaise,
    receipt,
    notes: { workspaceId: workspace.id, plan: "pro", cycle, email: user.email },
  });

  await db.insert(payments).values({
    workspaceId: workspace.id,
    plan: "pro",
    cycle,
    amountInr: Math.round(price.totalPaise / 100),
    basePaise: price.basePaise,
    gstPaise: price.gstPaise,
    totalPaise: price.totalPaise,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "created",
  });

  return ok({
    configured: true,
    orderId: order.id,
    amount: price.totalPaise,
    currency: "INR",
    keyId: env.billing.keyId(),
    label: price.label,
    breakdown: { basePaise: price.basePaise, gstPaise: price.gstPaise, totalPaise: price.totalPaise },
  });
});
