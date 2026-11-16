import type { SupabaseClient } from "@supabase/supabase-js";
import { allocatePurchaseCreditsRpc } from "@/features/credits/service";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpayCheckoutSignature,
} from "@/lib/razorpay/client";
import { enqueueAndSendEmail } from "@/lib/resend/client";
import { buildPurchaseReceiptEmail, buildRefundEmail } from "@/lib/resend/templates";
import { ApiError } from "@/lib/security/http";

export async function createServerRazorpayOrder(params: {
  adminSupabase: SupabaseClient;
  userId: string;
  packageId: "starter" | "creator" | "studio";
}) {
  const { data: pkg, error: pkgError } = await params.adminSupabase
    .from("credit_packages")
    .select("*")
    .eq("id", params.packageId)
    .eq("active", true)
    .maybeSingle();

  if (pkgError || !pkg) {
    throw new ApiError(404, "PACKAGE_NOT_FOUND", "Selected credit package is not active.");
  }

  const receipt = `beevo_${params.packageId}_${Date.now()}`;
  const rzpOrder = await createRazorpayOrder({
    amountPaise: Number(pkg.price_paise),
    receipt,
    notes: {
      user_id: params.userId,
      package_id: pkg.id,
      credits: String(pkg.credits),
    },
  });

  const { data: paymentRow, error: insertErr } = await params.adminSupabase
    .from("payments")
    .insert({
      user_id: params.userId,
      package_id: pkg.id,
      razorpay_order_id: rzpOrder.id,
      amount_paise: Number(pkg.price_paise),
      currency: "INR",
      status: "created",
      metadata: { receipt },
    })
    .select("id, razorpay_order_id, amount_paise, currency")
    .single();

  if (insertErr || !paymentRow) {
    throw new Error(`Failed recording Razorpay order: ${insertErr?.message}`);
  }

  return {
    paymentRecordId: paymentRow.id,
    razorpayOrderId: paymentRow.razorpay_order_id,
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID ?? "",
    amountPaise: paymentRow.amount_paise,
    currency: paymentRow.currency,
    packageName: pkg.name,
    credits: Number(pkg.credits),
  };
}

/**
 * Verifies Razorpay Checkout signature using the SERVER-STORED razorpay_order_id
 * and confirms live captured payment status directly from Razorpay's API before crediting.
 * Idempotent: racing Checkout callback and Webhook settle credits strictly once.
 */
export async function verifyAndSettleCheckoutPayment(params: {
  adminSupabase: SupabaseClient;
  userId: string;
  paymentRecordId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { data: paymentRow, error } = await params.adminSupabase
    .from("payments")
    .select("*, credit_packages(name, credits)")
    .eq("id", params.paymentRecordId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (error || !paymentRow) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment order record not found.");
  }

  const validSig = verifyRazorpayCheckoutSignature({
    storedOrderId: paymentRow.razorpay_order_id,
    paymentId: params.razorpayPaymentId,
    signature: params.razorpaySignature,
  });

  if (!validSig) {
    throw new ApiError(400, "INVALID_SIGNATURE", "Razorpay payment signature verification failed.");
  }

  // Confirm genuine captured status directly with Razorpay server API (never trust browser alone)
  const livePayment = await fetchRazorpayPayment(params.razorpayPaymentId);
  if (
    livePayment.order_id !== paymentRow.razorpay_order_id ||
    livePayment.amount !== Number(paymentRow.amount_paise)
  ) {
    throw new ApiError(
      400,
      "PAYMENT_MISMATCH",
      "Verified Razorpay payment order ID or amount does not match server order."
    );
  }

  if (livePayment.status !== "captured") {
    await params.adminSupabase
      .from("payments")
      .update({
        razorpay_payment_id: livePayment.id,
        razorpay_signature: params.razorpaySignature,
        method: livePayment.method,
        status: livePayment.status === "authorized" ? "authorized" : "created",
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);

    return {
      settled: false,
      status: livePayment.status,
      message: "Signature verified. Awaiting final Razorpay capture webhook to credit wallet.",
    };
  }

  return settleCapturedRazorpayPayment({
    adminSupabase: params.adminSupabase,
    razorpayOrderId: livePayment.order_id,
    razorpayPaymentId: livePayment.id,
    method: livePayment.method,
    feePaise: livePayment.fee,
    taxPaise: livePayment.tax,
    signature: params.razorpaySignature,
  });
}

export async function settleCapturedRazorpayPayment(params: {
  adminSupabase: SupabaseClient;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  method: string | null;
  feePaise: number | null;
  taxPaise: number | null;
  signature?: string;
}) {
  const { data: paymentRow, error } = await params.adminSupabase
    .from("payments")
    .select("*, credit_packages(name, credits)")
    .eq("razorpay_order_id", params.razorpayOrderId)
    .maybeSingle();

  if (error || !paymentRow) {
    return { settled: false, status: "orphaned_order", message: "Order not registered in Beevo." };
  }

  const pkgData = Array.isArray(paymentRow.credit_packages)
    ? paymentRow.credit_packages[0]
    : paymentRow.credit_packages;
  const creditsToGrant = Number(pkgData?.credits ?? 0);
  const packageName = String(pkgData?.name ?? paymentRow.package_id);

  // Strictly idempotent credit allocation keyed on razorpay_capture:{payment_id}
  const allocation = await allocatePurchaseCreditsRpc(params.adminSupabase, {
    userId: paymentRow.user_id,
    credits: creditsToGrant,
    paymentId: params.razorpayPaymentId,
    idempotencyKey: `razorpay_capture:${params.razorpayPaymentId}`,
    description: `${packageName} credit pack (${creditsToGrant} credits)`,
    metadata: {
      razorpay_order_id: params.razorpayOrderId,
      razorpay_payment_id: params.razorpayPaymentId,
      amount_paise: paymentRow.amount_paise,
    },
  });

  await params.adminSupabase
    .from("payments")
    .update({
      razorpay_payment_id: params.razorpayPaymentId,
      ...(params.signature ? { razorpay_signature: params.signature } : {}),
      method: params.method,
      status: "captured",
      razorpay_fee_paise: params.feePaise,
      razorpay_tax_paise: params.taxPaise,
      credits_granted: creditsToGrant,
      captured_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentRow.id);

  if (allocation.allocated) {
    // Log actual gateway fee to provider_usage when present
    if (params.feePaise !== null) {
      await params.adminSupabase.from("provider_usage").insert({
        user_id: paymentRow.user_id,
        provider: "razorpay",
        operation: "payment_capture_fee",
        model_id: params.method ?? "razorpay",
        input_units: paymentRow.amount_paise / 100,
        output_units: 1,
        unit_type: "inr_paise",
        cost_inr: (params.feePaise + (params.taxPaise ?? 0)) / 100,
        cost_source: "actual",
        provider_request_id: params.razorpayPaymentId,
      });
    }

    // In-app notification + Resend receipt
    await params.adminSupabase.from("notifications").insert({
      user_id: paymentRow.user_id,
      category: "billing",
      title: `${creditsToGrant} Credits Added`,
      body: `Payment ${params.razorpayPaymentId} for ${packageName} pack succeeded.`,
      href: "/app/transactions",
    });

    const { data: profile } = await params.adminSupabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", paymentRow.user_id)
      .maybeSingle();

    if (profile?.email) {
      const mail = buildPurchaseReceiptEmail({
        fullName: profile.full_name ?? "",
        packageName,
        amountInr: Number(paymentRow.amount_paise) / 100,
        credits: creditsToGrant,
        paymentId: params.razorpayPaymentId,
      });
      await enqueueAndSendEmail(params.adminSupabase, {
        userId: paymentRow.user_id,
        toEmail: profile.email,
        templateKey: "purchase_receipt",
        subject: mail.subject,
        htmlBody: mail.html,
        idempotencyKey: `email:purchase:${params.razorpayPaymentId}`,
      });
    }
  }

  return {
    settled: true,
    alreadyProcessed: !allocation.allocated,
    status: "captured",
    creditsGranted: creditsToGrant,
    availableCredits: allocation.availableCredits,
  };
}

export async function recordRefundSettled(params: {
  adminSupabase: SupabaseClient;
  razorpayPaymentId: string;
  refundId: string;
  refundAmountPaise: number;
  reason?: string;
}) {
  const { data: paymentRow } = await params.adminSupabase
    .from("payments")
    .select("*")
    .eq("razorpay_payment_id", params.razorpayPaymentId)
    .maybeSingle();

  if (!paymentRow) return;

  const totalRefunded = Math.min(
    Number(paymentRow.amount_paise),
    Number(paymentRow.refunded_paise ?? 0) + params.refundAmountPaise
  );
  const isFull = totalRefunded >= Number(paymentRow.amount_paise);

  await params.adminSupabase
    .from("payments")
    .update({
      refunded_paise: totalRefunded,
      refund_status: isFull ? "full" : "partial",
      status: isFull ? "refunded" : paymentRow.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentRow.id);

  const { data: profile } = await params.adminSupabase
    .from("profiles")
    .select("email")
    .eq("user_id", paymentRow.user_id)
    .maybeSingle();

  if (profile?.email) {
    const mail = buildRefundEmail({
      paymentId: params.razorpayPaymentId,
      amountInr: params.refundAmountPaise / 100,
      reason: params.reason ?? "Processed via Razorpay refund.",
    });
    await enqueueAndSendEmail(params.adminSupabase, {
      userId: paymentRow.user_id,
      toEmail: profile.email,
      templateKey: "refund_confirmation",
      subject: mail.subject,
      htmlBody: mail.html,
      idempotencyKey: `email:refund:${params.refundId}`,
    });
  }
}
