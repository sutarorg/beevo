import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "@/server/auth";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, resendConfigured } from "@/server/env";

/**
 * Resend-backed notification service.
 *  - Durable row per notification, dedupeKey guarantees duplicate webhook
 *    events / retries can never send the same email twice.
 *  - Status is never marked "sent" unless the provider returned 2xx.
 *  - Without a configured key, rows are recorded as skipped_not_configured
 *    (honest — we never claim delivery that didn't happen).
 */

export interface EmailJob {
  userId?: string | null;
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  dedupeKey: string;
  payload?: Record<string, unknown>;
}

export async function queueEmail(job: EmailJob): Promise<{ id: string; status: string }> {
  const id = newId("ntf");
  try {
    const inserted = await db
      .insert(notifications)
      .values({
        id,
        userId: job.userId ?? null,
        template: job.template,
        payload: { to: job.to, subject: job.subject, html: job.html, text: job.text, ...job.payload },
        dedupeKey: job.dedupeKey,
        status: "pending",
      })
      .onConflictDoNothing({ target: notifications.dedupeKey })
      .returning({ id: notifications.id });
    if (inserted.length === 0) return { id, status: "duplicate_suppressed" };
  } catch (error) {
    return { id, status: `insert_error:${(error as Error).message.slice(0, 120)}` };
  }
  return sendNow(id, job);
}

export async function sendNow(id: string, job: EmailJob): Promise<{ id: string; status: string }> {
  if (!resendConfigured) {
    await db
      .update(notifications)
      .set({ status: "skipped_not_configured", attempts: 1, lastError: "RESEND_API_KEY not set" })
      .where(eq(notifications.id, id));
    return { id, status: "skipped_not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [job.to],
        subject: job.subject,
        html: job.html,
        text: job.text,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (res.ok && body.id) {
      await db
        .update(notifications)
        .set({ status: "sent", attempts: 1, sentAt: new Date(), lastError: null })
        .where(eq(notifications.id, id));
      return { id, status: "sent" };
    }
    // Provider rejected — record failure truthfully.
    await db
      .update(notifications)
      .set({ status: "failed", attempts: 1, lastError: `resend_${res.status}:${body.message ?? "unknown"}`.slice(0, 300) })
      .where(eq(notifications.id, id));
    return { id, status: "failed" };
  } catch (error) {
    await db
      .update(notifications)
      .set({ status: "failed", attempts: 1, lastError: (error as Error).message.slice(0, 300) })
      .where(eq(notifications.id, id));
    return { id, status: "failed" };
  }
}

/** In-app only notification (bell list) — same durable table, channel=in_app. */
export async function notifyInApp(input: {
  userId: string;
  template: string;
  title: string;
  body: string;
  dedupeKey: string;
}): Promise<void> {
  await db
    .insert(notifications)
    .values({
      id: newId("ntf"),
      userId: input.userId,
      channel: "in_app",
      template: input.template,
      payload: { title: input.title, body: input.body },
      dedupeKey: input.dedupeKey,
      status: "sent",
      attempts: 1,
      sentAt: new Date(),
    })
    .onConflictDoNothing({ target: notifications.dedupeKey });
}

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function emailShell(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;background:#f6f0e2;padding:24px"><div style="max-width:520px;margin:0 auto;background:#fff;border:2px solid #17130b;border-radius:16px;padding:24px"><p style="font-weight:700">Course<span style="color:#e8490f">Kit</span></p><h1 style="font-size:20px;margin:12px 0">${esc(title)}</h1>${bodyHtml}<p style="font-size:12px;color:#5c543f;margin-top:24px">You’re receiving this because of activity on your CourseKit account.</p></div></div>`;
}
