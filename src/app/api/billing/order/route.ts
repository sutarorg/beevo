import { z } from "zod";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { PLAN_AMOUNTS, createOrder, gstOf } from "@/lib/server/razorpay";
import { env } from "@/lib/server/env";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const schema = z.object({ cycle: z.enum(["monthly", "annual"]).default("monthly") });

/**
 * Creates a Razorpay order (amount in paise, INR).
 * When Razorpay keys aren't configured the client falls back to
 * /api/billing/demo-activate (demo billing is flagged in the README).
 */
export const POST = handler(async (req: Request) => {
  const { workspace, member, user } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't manage billing");
  const { cycle } = await parseBody(req, schema);

  if (!env.billing.configured()) {
    return ok({ configured: false, demoAllowed: env.allowDemoBilling() });
  }

  const planDef = PLAN_AMOUNTS[`pro_${cycle}`];
  const totalPaise = planDef.base + gstOf(planDef.base);
  const receipt = `beevo_${workspace.id.slice(0, 8)}_${randomToken(6)}`;

  const order = await createOrder({
    amountPaise: totalPaise,
    receipt,
    notes: { workspaceId: workspace.id, plan: "pro", cycle, email: user.email },
  });

  await db.insert(payments).values({
    workspaceId: workspace.id,
    plan: "pro",
    cycle,
    amountInr: Math.round(totalPaise / 100),
    currency: "INR",
    razorpayOrderId: order.id,
    status: "created",
  });

  return ok({
    configured: true,
    orderId: order.id,
    amount: totalPaise,
    currency: "INR",
    keyId: env.billing.keyId(),
    label: planDef.label,
  });
});
