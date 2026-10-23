/**
 * Server-only environment & provider configuration.
 *
 * PAYMENT APPROVAL NOTE (the unresolved provider gate): the intended business
 * arrangement (platform collects learner payments centrally, creator earnings
 * are then transferred manually under that arrangement) requires explicit
 * Razorpay approval. A standard Payment Gateway account does NOT authorize it.
 * Until that approval exists:
 *  - PAYMENTS_LIVE_ENABLED stays false (this flag is NEVER inferred from the
 *    mere presence of API keys),
 *  - orders may be created with SANDBOX keys only (rzp_test_*),
 *  - payout recording is limited to development/test environments.
 */

export const IS_PROD = process.env.NODE_ENV === "production";

export const DATABASE_URL = process.env.DATABASE_URL ?? "";

export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SESSION_COOKIE = "ck_session";
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "dev-only-secret-change-me-in-production";

// --- Razorpay (server-only secrets; never logged) ---
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
export const PAYMENTS_LIVE_ENABLED = process.env.PAYMENTS_LIVE_ENABLED === "true";

export const razorpayConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
export const razorpayIsTestKeys = RAZORPAY_KEY_ID.startsWith("rzp_test_");
/** Collections allowed? Sandbox always; live keys only with explicit approval flag. */
export const collectionsAllowed =
  razorpayConfigured && (razorpayIsTestKeys || PAYMENTS_LIVE_ENABLED);
/** Manual-transfer recording allowed outside development? */
export const payoutRecordingAllowed = !IS_PROD || PAYMENTS_LIVE_ENABLED;

// --- Cloudflare R2 (S3-compatible; credentials server-only) ---
export const R2 = {
  accountId: process.env.R2_ACCOUNT_ID ?? "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  bucket: process.env.R2_BUCKET_NAME ?? "",
  configured: Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  ),
};

// --- Resend ---
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "CourseKit <hello@example.com>";
export const resendConfigured = Boolean(RESEND_API_KEY);

export const PLATFORM_COMMISSION_BPS = 800; // 8% — recorded on every ledger entry
