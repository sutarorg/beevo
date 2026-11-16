/**
 * Server-safe environment accessors.
 * Never returns fake defaults for missing secret keys; throws structured
 * ServiceUnavailableError when an integration is unconfigured.
 */

export class ServiceUnavailableError extends Error {
  readonly code = "SERVICE_UNAVAILABLE";
  readonly status = 503;
  readonly service: string;

  constructor(service: string, detail?: string) {
    super(
      detail ??
        `${service} is not configured in this environment. Set the required server environment variables to enable live ${service} integration.`
    );
    this.name = "ServiceUnavailableError";
    this.service = service;
  }
}

function readEnv(key: string): string | null {
  const val = process.env[key]?.trim();
  return val && val.length > 0 ? val : null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") && readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function isOpenAiConfigured(): boolean {
  return Boolean(readEnv("OPENAI_API_KEY"));
}

export function isFalConfigured(): boolean {
  return Boolean(readEnv("FAL_KEY"));
}

export function isElevenLabsConfigured(): boolean {
  return Boolean(readEnv("ELEVENLABS_API_KEY"));
}

export function isR2Configured(): boolean {
  return Boolean(
    readEnv("R2_ACCESS_KEY_ID") &&
      readEnv("R2_SECRET_ACCESS_KEY") &&
      readEnv("R2_BUCKET_NAME") &&
      (readEnv("R2_ENDPOINT") || readEnv("R2_ACCOUNT_ID"))
  );
}

export function isRazorpayConfigured(): boolean {
  return Boolean(readEnv("RAZORPAY_KEY_ID") && readEnv("RAZORPAY_KEY_SECRET"));
}

export function isResendConfigured(): boolean {
  return Boolean(readEnv("RESEND_API_KEY"));
}

export function requireEnv(key: string, service: string): string {
  const val = readEnv(key);
  if (!val) {
    throw new ServiceUnavailableError(
      service,
      `Missing required server environment variable ${key} for ${service}.`
    );
  }
  return val;
}

export function getAppUrl(): string {
  return readEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
}

export function getNumericEnv(key: string, fallback: number): number {
  const raw = readEnv(key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfiguredIntegrationsSummary(): Record<string, boolean> {
  return {
    supabase: isSupabaseConfigured(),
    supabaseAdmin: isSupabaseAdminConfigured(),
    openai: isOpenAiConfigured(),
    fal: isFalConfigured(),
    elevenlabs: isElevenLabsConfigured(),
    r2: isR2Configured(),
    razorpay: isRazorpayConfigured(),
    resend: isResendConfigured(),
  };
}
