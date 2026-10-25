import { cleanEnv, normalizeDatabaseUrl } from "@/db/url";

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

export const DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);

function normalizeOrigin(raw: string, fallback: string): string {
  const cleaned = cleanEnv(raw);
  if (!cleaned) return fallback;
  const withScheme = /^https?:\/\//i.test(cleaned)
    ? cleaned
    : /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(cleaned)
      ? `http://${cleaned}`
      : `https://${cleaned}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

const explicitAppUrl =
  cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || cleanEnv(process.env.APP_URL);
const vercelUrl =
  cleanEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL) || cleanEnv(process.env.VERCEL_URL);

export const APP_BASE_URL = normalizeOrigin(
  explicitAppUrl || vercelUrl,
  "http://localhost:3000",
);

/**
 * Resolves the canonical origin for email links and auth redirects.
 * Prefers NEXT_PUBLIC_APP_URL / APP_URL when explicitly set; otherwise derives
 * the origin from forwarded proxy headers or the incoming request URL so
 * production verification links never redirect to localhost.
 */
export function resolveRequestBaseUrl(req: Request): string {
  if (explicitAppUrl) return APP_BASE_URL;
  const fwdHost = cleanEnv(req.headers.get("x-forwarded-host")?.split(",")[0]);
  const fwdProto = cleanEnv(req.headers.get("x-forwarded-proto")?.split(",")[0]) || "https";
  if (fwdHost) {
    return normalizeOrigin(`${fwdProto}://${fwdHost}`, APP_BASE_URL);
  }
  try {
    return new URL(req.url).origin;
  } catch {
    return APP_BASE_URL;
  }
}

export const SESSION_COOKIE = "ck_session";
/**
 * Stay-signed-in window. The cookie is persistent (survives tab and browser
 * restarts) and the session is renewed on use, so an active user is not
 * signed out just for leaving a tab open or coming back days later.
 */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const AUTH_SECRET =
  cleanEnv(process.env.AUTH_SECRET) || "dev-only-secret-change-me-in-production";

// --- Razorpay (server-only secrets; never logged) ---
export const RAZORPAY_KEY_ID =
  cleanEnv(process.env.RAZORPAY_KEY_ID) || cleanEnv(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
export const RAZORPAY_KEY_SECRET = cleanEnv(process.env.RAZORPAY_KEY_SECRET);
export const RAZORPAY_WEBHOOK_SECRET = cleanEnv(process.env.RAZORPAY_WEBHOOK_SECRET);
export const PAYMENTS_LIVE_ENABLED = cleanEnv(process.env.PAYMENTS_LIVE_ENABLED) === "true";

export const razorpaySecretMatchesKeyId =
  Boolean(RAZORPAY_KEY_ID) && RAZORPAY_KEY_ID === RAZORPAY_KEY_SECRET;
export const razorpayConfigured =
  Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) && !razorpaySecretMatchesKeyId;
export const razorpayIsTestKeys = RAZORPAY_KEY_ID.startsWith("rzp_test_");
/** Collections allowed? Sandbox always; live keys only with explicit approval flag. */
export const collectionsAllowed =
  razorpayConfigured && (razorpayIsTestKeys || PAYMENTS_LIVE_ENABLED);
/** Manual-transfer recording allowed outside development? */
export const payoutRecordingAllowed = !IS_PROD || PAYMENTS_LIVE_ENABLED;

// --- Cloudflare R2 (S3-compatible; credentials server-only) ---
function normalizeR2AccountId(raw: string | undefined): string {
  const cleaned = cleanEnv(raw);
  const match = cleaned.match(/^https?:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/i);
  return match ? match[1] : cleaned;
}

const r2AccountId = normalizeR2AccountId(process.env.R2_ACCOUNT_ID);
const r2AccessKeyId = cleanEnv(process.env.R2_ACCESS_KEY_ID);
const r2SecretAccessKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
const r2Bucket = cleanEnv(process.env.R2_BUCKET_NAME);
const r2PublicBaseUrl = cleanEnv(process.env.R2_PUBLIC_BASE_URL).replace(/\/+$/, "");

export const R2 = {
  accountId: r2AccountId,
  accessKeyId: r2AccessKeyId,
  secretAccessKey: r2SecretAccessKey,
  bucket: r2Bucket,
  publicBaseUrl: r2PublicBaseUrl,
  configured: Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2Bucket),
};

// --- Resend ---
function sanitizeFromEmail(raw: string | undefined): string {
  const decoded = cleanEnv(raw)
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
  return cleanEnv(decoded) || "Beevo <hello@example.com>";
}

export const RESEND_API_KEY = cleanEnv(process.env.RESEND_API_KEY);
export const RESEND_FROM_EMAIL = sanitizeFromEmail(process.env.RESEND_FROM_EMAIL);
export const resendConfigured = Boolean(RESEND_API_KEY);

export const PLATFORM_COMMISSION_BPS = 800; // 8% — recorded on every ledger entry
