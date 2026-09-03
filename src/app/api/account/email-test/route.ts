import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { sendMail } from "@/lib/server/email";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

/**
 * Owner-only email diagnostics. Sends a test message to the caller and
 * returns the FULL provider result — including Resend's raw API error
 * (e.g. 422 "from address not verified", 401 bad key) instead of failing
 * silently. This is the exact tool for debugging deliverability.
 */
export const POST = handler(async () => {
  const { user, member } = await requireUser();
  if (member.role !== "owner" && member.role !== "admin") {
    throw new ApiError(403, "Only owners and admins can run email diagnostics");
  }

  const configured = env.email.configured();
  const provider = env.email.resendKey() ? "resend" : env.email.smtpUrl() ? "smtp" : null;
  const from = env.email.from();

  if (!configured) {
    return ok({
      ok: false,
      configured: false,
      hint: "No RESEND_API_KEY or SMTP_URL set on this deployment. Add one in Vercel → Settings → Environment Variables (README §4.5).",
    });
  }

  const result = await sendMail({
    to: user.email,
    subject: "Beevo email diagnostics",
    html: `<div style="font-family:system-ui;padding:24px"><h2 style="color:#f5a301">🐝 Beevo email check</h2><p>If you're reading this, email delivery works.</p><p style="color:#666;font-size:13px">Provider: <b>${provider}</b> · From: <code>${from}</code> · Sent to: <code>${user.email}</code> · ${new Date().toISOString()}</p></div>`,
  });

  if (!result.ok) {
    return ok({
      ok: false,
      configured: true,
      provider,
      from,
      to: user.email,
      resendError: result.error ?? null,
      hint:
        result.error?.toLowerCase().includes("from")
          ? "YOUR SENDER DOMAIN IS NOT VERIFIED in Resend. Resend rejects sends from unverified domains with HTTP 422 → dashboard.resend.com/domains → add your domain, create the DKIM/SPF DNS records it shows, wait until Verified, then set EMAIL_FROM=`Beevo <hello@yourdomain.in>`."
          : result.error?.toLowerCase().includes("401") || result.error?.toLowerCase().includes("api key")
            ? "The Resend API key is invalid or revoked — generate a new one at dashboard.resend.com/api-keys and update RESEND_API_KEY."
            : "Check the Resend dashboard → Logs for the exact bounce/quota reason.",
    });
  }

  return ok({
    ok: true,
    configured: true,
    provider,
    from,
    to: user.email,
    resendId: result.providerMessageId ?? null,
    hint:
      from.includes("resend.dev")
        ? "Delivery worked but you are sending from resend.dev's sandbox — production-grade delivery for arbitrary recipients needs a VERIFIED domain (Resend → Domains → add beevo.in, verify DKIM) and EMAIL_FROM=hello@beevo.in."
        : "Test email accepted. Not in your inbox after a minute? Check Spam, Promotions tab, and your Resend dashboard → Logs for delivery status.",
  });
});
