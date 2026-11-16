import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isResendConfigured, requireEnv } from "@/lib/env";

let cachedResend: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = requireEnv("RESEND_API_KEY", "Resend");
  if (!cachedResend) {
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

/**
 * Enqueues a transactional email into PostgreSQL email_outbox (idempotent) and
 * attempts immediate delivery if Resend is configured.
 * Delivery failure NEVER throws or reverses a completed payment/render transaction.
 */
export async function enqueueAndSendEmail(
  adminSupabase: SupabaseClient,
  params: {
    userId: string | null;
    toEmail: string;
    templateKey: string;
    subject: string;
    htmlBody: string;
    idempotencyKey: string;
  }
): Promise<{ queued: boolean; sent: boolean; messageId: string | null }> {
  const { data: inserted, error: insertError } = await adminSupabase
    .from("email_outbox")
    .insert({
      user_id: params.userId,
      to_email: params.toEmail,
      template_key: params.templateKey,
      subject: params.subject,
      html_body: params.htmlBody,
      idempotency_key: params.idempotencyKey,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    // Duplicate idempotency_key means already queued
    if (insertError.code === "23505") {
      return { queued: false, sent: false, messageId: null };
    }
    console.error("[Beevo EmailOutbox Enqueue Error]", insertError.message);
    return { queued: false, sent: false, messageId: null };
  }

  if (!isResendConfigured() || !inserted?.id) {
    return { queued: true, sent: false, messageId: null };
  }

  return attemptSendOutboxRow(adminSupabase, {
    id: inserted.id,
    toEmail: params.toEmail,
    subject: params.subject,
    htmlBody: params.htmlBody,
    attempts: 0,
  });
}

export async function attemptSendOutboxRow(
  adminSupabase: SupabaseClient,
  row: { id: string; toEmail: string; subject: string; htmlBody: string; attempts: number }
): Promise<{ queued: boolean; sent: boolean; messageId: string | null }> {
  try {
    const resend = getResendClient();
    const from = process.env.RESEND_FROM_EMAIL?.trim() || "Beevo <hello@beevo.app>";
    const { data, error } = await resend.emails.send({
      from,
      to: [row.toEmail],
      subject: row.subject,
      html: row.htmlBody,
    });

    if (error || !data?.id) {
      throw new Error(error?.message ?? "Resend returned no message ID.");
    }

    await adminSupabase
      .from("email_outbox")
      .update({
        status: "sent",
        attempts: row.attempts + 1,
        resend_message_id: data.id,
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", row.id);

    return { queued: true, sent: true, messageId: data.id };
  } catch (err) {
    const nextAttempts = row.attempts + 1;
    const backoffSeconds = Math.min(3600, Math.pow(2, nextAttempts) * 30);
    await adminSupabase
      .from("email_outbox")
      .update({
        status: nextAttempts >= 5 ? "failed" : "pending",
        attempts: nextAttempts,
        next_retry_at: new Date(Date.now() + backoffSeconds * 1000).toISOString(),
        last_error: (err as Error).message.slice(0, 500),
      })
      .eq("id", row.id);

    return { queued: true, sent: false, messageId: null };
  }
}

export async function flushPendingEmailOutbox(adminSupabase: SupabaseClient): Promise<number> {
  if (!isResendConfigured()) return 0;
  const { data: rows } = await adminSupabase
    .from("email_outbox")
    .select("id, to_email, subject, html_body, attempts")
    .eq("status", "pending")
    .lte("next_retry_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(10);

  let sentCount = 0;
  for (const row of rows ?? []) {
    const res = await attemptSendOutboxRow(adminSupabase, {
      id: row.id,
      toEmail: row.to_email,
      subject: row.subject,
      htmlBody: row.html_body,
      attempts: Number(row.attempts ?? 0),
    });
    if (res.sent) sentCount += 1;
  }
  return sentCount;
}
