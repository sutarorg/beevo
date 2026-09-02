import crypto from "crypto";

/**
 * Central, typed access to environment configuration.
 * Server-only — never import from client components.
 */

const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined ? fallback : v === "true" || v === "1";

export const env = {
  isProd: process.env.NODE_ENV === "production",

  /** Public base URL of the app — used for OAuth redirect URIs and emails. */
  appUrl: () =>
    (process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    ).replace(/\/$/, ""),

  cronSecret: () => process.env.CRON_SECRET || "",

  encryptionKey: (): Buffer => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      if (process.env.NODE_ENV === "production") {
        // Production must provide a key; derive a deterministic one so the app
        // still boots but logs loudly.
        console.warn("[beevo] ENCRYPTION_KEY is not set — using derived fallback. Set it immediately.");
      }
      return crypto.createHash("sha256").update(`beevo-insecure-fallback:${process.env.DATABASE_URL ?? "local"}`).digest();
    }
    // Accept base64/hex or raw passphrase.
    if (/^[A-Fa-f0-9]{64}$/.test(key)) return Buffer.from(key, "hex");
    try {
      const b = Buffer.from(key, "base64");
      if (b.length === 32) return b;
    } catch {}
    return crypto.createHash("sha256").update(key).digest();
  },

  /** Demo conveniences — OFF by default; enable explicitly for sandboxes. */
  demoSeed: () => bool(process.env.DEMO_SEED, false),
  allowDemoBilling: () => bool(process.env.ALLOW_DEMO_BILLING, false),
  allowSimulatedConnections: () => bool(process.env.ALLOW_SIMULATED_CONNECTIONS, false),

  billing: {
    keyId: () => process.env.RAZORPAY_KEY_ID || "",
    keySecret: () => process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: () => process.env.RAZORPAY_WEBHOOK_SECRET || "",
    configured: () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  },

  email: {
    resendKey: () => process.env.RESEND_API_KEY || "",
    smtpUrl: () => process.env.SMTP_URL || "",
    from: () => process.env.EMAIL_FROM || "Beevo <hello@beevo.app>",
    configured: () => !!(process.env.RESEND_API_KEY || process.env.SMTP_URL),
  },

  openAiKey: () => process.env.OPENAI_API_KEY || "",
  blobToken: () => process.env.BLOB_READ_WRITE_TOKEN || "",
  allowLocalUploads: () => bool(process.env.ALLOW_LOCAL_UPLOADS, false) && !process.env.VERCEL,

  oauth: {
    google: () => ({ id: process.env.GOOGLE_CLIENT_ID || "", secret: process.env.GOOGLE_CLIENT_SECRET || "" }),
    meta: () => ({ id: process.env.META_APP_ID || "", secret: process.env.META_APP_SECRET || "" }),
    x: () => ({ id: process.env.X_CLIENT_ID || "", secret: process.env.X_CLIENT_SECRET || "" }),
    linkedin: () => ({ id: process.env.LINKEDIN_CLIENT_ID || "", secret: process.env.LINKEDIN_CLIENT_SECRET || "" }),
    pinterest: () => ({ id: process.env.PINTEREST_APP_ID || "", secret: process.env.PINTEREST_APP_SECRET || "" }),
  },
};
