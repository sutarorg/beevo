import nodemailer from "nodemailer";
import { env } from "./env";

/**
 * Email delivery: Resend (HTTPS API) when RESEND_API_KEY is set,
 * SMTP via nodemailer when SMTP_URL is set, otherwise logs and no-ops
 * so the app never crashes because email isn't configured.
 */

interface Mail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailResult {
  ok: boolean;
  provider: "resend" | "smtp" | null;
  providerMessageId?: string;
  error?: string;
}

async function sendViaResend(mail: Mail): Promise<{ id?: string }> {
  const from = env.email.from();
  if (from.includes("hello@beevo.app")) {
    console.warn(
      "[email] EMAIL_FROM uses the fallback hello@beevo.app — Resend only delivers from VERIFIED domains (or onboarding@resend.dev). Sending anyway to surface the provider error."
    );
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.email.resendKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    console.error(`[email] Resend rejected (${res.status}):`, bodyText);
    throw new Error(`Resend ${res.status}: ${bodyText.slice(0, 300)}`);
  }
  try {
    return JSON.parse(bodyText) as { id?: string };
  } catch {
    return {};
  }
}

async function sendViaSmtp(mail: Mail): Promise<{ id?: string }> {
  const transport = nodemailer.createTransport(env.email.smtpUrl());
  const info = await transport.sendMail({ from: env.email.from(), ...mail });
  return { id: info.messageId };
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  try {
    if (env.email.resendKey()) {
      const { id } = await sendViaResend(mail);
      return { ok: true, provider: "resend", providerMessageId: id };
    }
    if (env.email.smtpUrl()) {
      const { id } = await sendViaSmtp(mail);
      return { ok: true, provider: "smtp", providerMessageId: id };
    }
    console.log(`[email:unconfigured] to=${mail.to} subject="${mail.subject}"`);
    return { ok: false, provider: null, error: "No email provider configured" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[email] delivery failed:", message);
    return { ok: false, provider: env.email.resendKey() ? "resend" : env.email.smtpUrl() ? "smtp" : null, error: message };
  }
}

/* ------------------------------ Templates ------------------------------ */
function frame(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fbf5e9;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="font-size:22px;font-weight:700;color:#171008;">beevo<span style="color:#f5a301">.</span></div>
    <div style="margin-top:20px;background:#ffffff;border:1px solid #ead9b8;border-radius:16px;padding:24px;">
      <h1 style="margin:0 0 12px;font-size:17px;color:#171008;">${title}</h1>
      <div style="font-size:14px;line-height:1.65;color:#4a3823;">${body}</div>
    </div>
    <p style="font-size:11px;color:#8a7356;margin-top:16px;">Beevo · Social Media Planner · You received this because of activity in your hive.</p>
  </div></body></html>`;
}

export const emails = {
  welcome(name: string): Mail["html"] {
    return frame(
      `Welcome to the hive, ${name}`,
      `Your workspace is ready. Connect your first social account, compose a post and drop it on the calendar — Beevo handles the rest.<br/><br/>
       <b>Quick wins:</b><br/>· Connect Instagram & LinkedIn from Accounts<br/>· Schedule your first post with the best-time engine<br/>· Invite your team from Settings`
    );
  },
  publishSuccess(caption: string, platforms: string[], appUrl: string): string {
    return frame(
      "Your post is live",
      `“${caption.slice(0, 140)}${caption.length > 140 ? "…" : ""}”<br/><br/>Published to: <b>${platforms.join(", ")}</b>.<br/><br/>
       <a href="${appUrl}/posts" style="color:#b45309;font-weight:600;">View performance →</a>`
    );
  },
  publishFailed(caption: string, error: string, appUrl: string): string {
    return frame(
      "A post needs attention",
      `We couldn't publish “${caption.slice(0, 120)}${caption.length > 120 ? "…" : ""}”.<br/><br/><b>Reason:</b> ${error}<br/><br/>
       Reconnect the account or retry from the app.<br/><a href="${appUrl}/dashboard" style="color:#b45309;font-weight:600;">Open dashboard →</a>`
    );
  },
  invoice(amountInr: string, invoiceNo: string): string {
    return frame(
      `Payment received — ${amountInr}`,
      `Thanks for upgrading to <b>Beevo Pro</b>.<br/><br/>Invoice <b>${invoiceNo}</b> for <b>${amountInr}</b> (incl. 18% GST) is available under Billing → Invoices.<br/><br/>The whole hive is yours: unlimited posts, Hive Writer and the best-time engine.`
    );
  },
  teamInvite(inviter: string, workspace: string, url: string): string {
    return frame(
      `${inviter} invited you to ${workspace}`,
      `You've been invited to collaborate on <b>${workspace}</b> in Beevo.<br/><br/><a href="${url}" style="color:#b45309;font-weight:600;">Accept invitation →</a><br/><br/>This link expires in 7 days.`
    );
  },
};
