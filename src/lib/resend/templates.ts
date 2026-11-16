import { getAppUrl } from "@/lib/env";

/**
 * Clean, responsive transactional HTML email templates using Beevo's authentic SVG brand mark.
 * Strictly zero fake video thumbnails or invented metrics.
 */

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapEmailLayout(params: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const appUrl = getAppUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFDF8;font-family:Manrope,Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#3F3A31;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFFDF8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#FFFFFF;border:1px solid #ECE6D8;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px;border-bottom:1px solid #ECE6D8;background-color:#FAF8F3;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;color:#171717;font-weight:800;font-size:18px;letter-spacing:-0.02em;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background-color:#FFC928;margin-right:8px;vertical-align:middle;"></span>beevo
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#171717;font-weight:800;">
                ${escapeHtml(params.title)}
              </h1>
              <div style="font-size:14.5px;line-height:1.65;color:#3F3A31;">
                ${params.bodyHtml}
              </div>
              ${
                params.ctaLabel && params.ctaHref
                  ? `<div style="margin-top:24px;">
                      <a href="${escapeHtml(params.ctaHref)}" style="display:inline-block;background-color:#FFC928;color:#171717;text-decoration:none;font-weight:800;font-size:14px;padding:12px 22px;border-radius:10px;">
                        ${escapeHtml(params.ctaLabel)}
                      </a>
                    </div>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid #ECE6D8;background-color:#FAF8F3;font-size:12px;color:#726B5E;">
              Beevo AI Cartoon Video Studio &middot; Automated transactional notice.<br />
              Need help? Visit <a href="${escapeHtml(appUrl)}/contact" style="color:#171717;">${escapeHtml(appUrl)}/contact</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWelcomeEmail(fullName: string): { subject: string; html: string } {
  const appUrl = getAppUrl();
  return {
    subject: "Welcome to Beevo — Your Cartoon Video Studio is Ready",
    html: wrapEmailLayout({
      preheader: "Create illustrated, voice-synced cartoon videos with Beevo.",
      title: `Welcome to Beevo${fullName ? `, ${fullName}` : ""}`,
      bodyHtml:
        "<p style='margin:0 0 12px;'>Your Beevo Studio workspace is active. Start by describing your video idea or pasting a narration script—Beevo handles storyboarding, character-consistent illustrations, narration, captions, and MP4 rendering.</p><p style='margin:0;'>Credits are purchased once with no monthly subscription and never expire.</p>",
      ctaLabel: "Open Beevo Studio",
      ctaHref: `${appUrl}/app/create`,
    }),
  };
}

export function buildPurchaseReceiptEmail(params: {
  fullName: string;
  packageName: string;
  amountInr: number;
  credits: number;
  paymentId: string;
}): { subject: string; html: string } {
  const appUrl = getAppUrl();
  return {
    subject: `Beevo Credit Receipt — ${params.credits.toLocaleString("en-IN")} Credits Added`,
    html: wrapEmailLayout({
      preheader: `Payment ${params.paymentId} confirmed. ${params.credits} credits added.`,
      title: "Credit Pack Purchase Confirmed",
      bodyHtml: `<p style="margin:0 0 12px;">Hi ${escapeHtml(params.fullName || "Creator")}, your Razorpay payment has been verified and credited to your Beevo wallet.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border:1px solid #ECE6D8;border-radius:8px;background-color:#FAF8F3;font-size:13.5px;">
          <tr><td style="color:#726B5E;">Package</td><td align="right" style="font-weight:700;color:#171717;">${escapeHtml(params.packageName)}</td></tr>
          <tr><td style="color:#726B5E;">Credits Added</td><td align="right" style="font-weight:700;color:#171717;">+${params.credits.toLocaleString("en-IN")} cr</td></tr>
          <tr><td style="color:#726B5E;">Amount Paid</td><td align="right" style="font-weight:700;color:#171717;">₹${params.amountInr.toLocaleString("en-IN")} INR</td></tr>
          <tr><td style="color:#726B5E;">Payment ID</td><td align="right" style="font-family:monospace;color:#171717;">${escapeHtml(params.paymentId)}</td></tr>
        </table>`,
      ctaLabel: "Start Creating a Video",
      ctaHref: `${appUrl}/app/create`,
    }),
  };
}

export function buildVideoCompletedEmail(params: {
  projectTitle: string;
  generationId: string;
  durationSeconds: number;
  consumedCredits: number;
}): { subject: string; html: string } {
  const appUrl = getAppUrl();
  return {
    subject: `Your Beevo Video is Ready — ${params.projectTitle}`,
    html: wrapEmailLayout({
      preheader: `${params.projectTitle} has finished rendering and is ready to download.`,
      title: "Your Cartoon Video is Ready",
      bodyHtml: `<p style="margin:0 0 12px;"><strong>${escapeHtml(params.projectTitle)}</strong> finished all 9 production stages and passed final MP4 verification.</p>
        <p style="margin:0;">Final duration: <strong>${Math.round(params.durationSeconds)}s</strong> &middot; Credits consumed: <strong>${params.consumedCredits} cr</strong>. Sign in to preview or download your private MP4 file.</p>`,
      ctaLabel: "Preview & Download MP4",
      ctaHref: `${appUrl}/app/videos/${encodeURIComponent(params.generationId)}`,
    }),
  };
}

export function buildVideoFailedEmail(params: {
  projectTitle: string;
  generationId: string;
  releasedCredits: number;
  reason: string;
}): { subject: string; html: string } {
  const appUrl = getAppUrl();
  return {
    subject: `Video Generation Update — ${params.projectTitle}`,
    html: wrapEmailLayout({
      preheader: `Generation failed; ${params.releasedCredits} reserved credits were automatically released.`,
      title: "Generation Stopped — Credits Released",
      bodyHtml: `<p style="margin:0 0 12px;"><strong>${escapeHtml(params.projectTitle)}</strong> could not complete rendering (${escapeHtml(params.reason)}).</p>
        <p style="margin:0;">All <strong>${params.releasedCredits} reserved credits</strong> have been automatically returned to your available wallet balance.</p>`,
      ctaLabel: "Review Project in Studio",
      ctaHref: `${appUrl}/app/generations/${encodeURIComponent(params.generationId)}`,
    }),
  };
}

export function buildRefundEmail(params: {
  paymentId: string;
  amountInr: number;
  reason: string;
}): { subject: string; html: string } {
  const appUrl = getAppUrl();
  return {
    subject: `Beevo Refund Processed — ₹${params.amountInr.toLocaleString("en-IN")}`,
    html: wrapEmailLayout({
      preheader: `Refund initiated for Razorpay payment ${params.paymentId}.`,
      title: "Refund Confirmation",
      bodyHtml: `<p style="margin:0 0 12px;">A refund of <strong>₹${params.amountInr.toLocaleString("en-IN")} INR</strong> for payment <span style="font-family:monospace;">${escapeHtml(params.paymentId)}</span> has been processed.</p>
        <p style="margin:0;">Reference note: ${escapeHtml(params.reason)}</p>`,
      ctaLabel: "View Transactions",
      ctaHref: `${appUrl}/app/transactions`,
    }),
  };
}
