import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import { api } from "@/lib/services/api";

/**
 * Authentication service contract.
 *
 * The UI talks ONLY to this interface. Prompt 1 ships a clearly-labelled
 * mock adapter; Prompt 5 adds a Supabase adapter and selects it here via
 * environment configuration — no page rewrites required.
 *
 * Contract for the real adapter (see FRONTEND_CONTRACTS.md):
 *  - Supabase email+password auth with email verification enabled.
 *  - signIn maps Supabase errors onto AuthErrorCode values below.
 *  - requestPasswordReset never reveals whether an email is registered.
 */

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_already_in_use"
  | "email_not_verified"
  | "invalid_reset_token"
  | "rate_limited"
  | "service_unavailable"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  /** UI-safe message; never leak provider internals. */
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  /** ISO 8601 timestamp. */
  expiresAt: string;
}

export interface SignUpParams {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthService {
  /** Creates the account and sends a verification email. */
  signUp(params: SignUpParams): Promise<ApiResult<{ email: string; verificationRequired: true }>>;
  /** Re-sends the verification email. */
  resendVerification(email: string): Promise<ApiResult<{ email: string }>>;
  /** Signs in a verified user and returns a session. */
  signIn(params: SignInParams): Promise<ApiResult<AuthSession>>;
  /** Sends a password-reset email. Always succeeds (anti-enumeration). */
  requestPasswordReset(email: string): Promise<ApiResult<{ email: string }>>;
  /** Completes a password reset using the emailed token. */
  completePasswordReset(params: {
    token: string;
    password: string;
  }): Promise<ApiResult<{ success: true }>>;
  signOut(): Promise<ApiResult<{ success: true }>>;
}

const AUTH_UNAVAILABLE_MESSAGE =
  "Authentication is not available in this environment yet. The backend service connects in the next build phase.";

// ---------------------------------------------------------------------------
// Mock adapter — explicit, opt-in, never silently enabled in production
// ---------------------------------------------------------------------------

const MOCK_LATENCY_MS = 700;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err<T>(code: AuthErrorCode, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

/**
 * Deterministic demo behaviour (documented in FRONTEND_CONTRACTS.md):
 *  - signUp fails with email_already_in_use for "taken@demo.test".
 *  - signIn fails with invalid_credentials for any email ending "@fail.demo".
 *  - everything else with well-formed input succeeds.
 */
class MockAuthService implements AuthService {
  async signUp(params: SignUpParams) {
    await wait(MOCK_LATENCY_MS);
    if (params.email.trim().toLowerCase() === "taken@demo.test") {
      return err<{ email: string; verificationRequired: true }>(
        "email_already_in_use",
        "An account already exists for this email. Try logging in instead.",
      );
    }
    return ok({ email: params.email, verificationRequired: true as const });
  }

  async resendVerification(email: string) {
    await wait(MOCK_LATENCY_MS / 2);
    return ok({ email });
  }

  async signIn(params: SignInParams) {
    await wait(MOCK_LATENCY_MS);
    if (params.email.trim().toLowerCase().endsWith("@fail.demo")) {
      return err<AuthSession>(
        "invalid_credentials",
        "Incorrect email or password. Check your details and try again.",
      );
    }
    return ok<AuthSession>({
      user: {
        id: "demo_user_001",
        email: params.email,
        fullName: params.email.split("@")[0].replace(/[._-]+/g, " "),
      },
      accessToken: "demo-token-not-a-real-credential",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }

  async requestPasswordReset(email: string) {
    await wait(MOCK_LATENCY_MS);
    // Anti-enumeration: identical response whether or not the email exists.
    return ok({ email });
  }

  async completePasswordReset(params: { token: string; password: string }) {
    await wait(MOCK_LATENCY_MS);
    if (!params.token || params.token.length < 6) {
      return err<{ success: true }>(
        "invalid_reset_token",
        "This reset link is invalid or has expired. Request a fresh one.",
      );
    }
    return ok({ success: true as const });
  }

  async signOut() {
    await wait(MOCK_LATENCY_MS / 2);
    return ok({ success: true as const });
  }
}

const mockAuthService = new MockAuthService();

// ---------------------------------------------------------------------------
// Live adapter — real session auth via /api/v1/auth/* (cookie sessions)
// ---------------------------------------------------------------------------

interface SessionResponse {
  user: { id: string; email: string; fullName: string } | null;
  accessToken?: string;
  expiresAt?: string;
  emailVerifiedAt?: string | null;
  isCreatorWithHandle?: boolean;
  isAdmin?: boolean;
}

class ApiAuthService implements AuthService {
  async signUp(params: SignUpParams) {
    return api<{ email: string; verificationRequired: true }>("auth/signup", {
      method: "POST",
      body: params,
    });
  }

  async resendVerification(email: string) {
    return api<{ email: string }>("auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  }

  async signIn(params: SignInParams) {
    const result = await api<SessionResponse>("auth/login", { method: "POST", body: params });
    if (!result.ok || !result.data.user) {
      return result.ok
        ? err<AuthSession>("invalid_credentials", "Incorrect email or password.")
        : { ok: false as const, error: { code: result.error.code as AuthErrorCode, message: result.error.message } };
    }
    return ok<AuthSession>({
      user: result.data.user,
      accessToken: result.data.accessToken ?? "session-cookie",
      expiresAt: result.data.expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  async requestPasswordReset(email: string) {
    return api<{ email: string }>("auth/forgot", { method: "POST", body: { email } });
  }

  async completePasswordReset(params: { token: string; password: string }) {
    return api<{ success: true }>("auth/reset", { method: "POST", body: params });
  }

  async signOut() {
    return api<{ success: true }>("auth/logout", { method: "POST" });
  }
}

const apiAuthService = new ApiAuthService();

/** Fetch the current live session (used by app shells). */
export async function fetchSession(): Promise<{
  user: { id: string; email: string; fullName: string } | null;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
}> {
  const result = await api<SessionResponse>("auth/session");
  if (!result.ok || !result.data.user) {
    return { user: null, isAdmin: false, emailVerifiedAt: null };
  }
  return {
    user: result.data.user,
    isAdmin: Boolean(result.data.isAdmin),
    emailVerifiedAt: result.data.emailVerifiedAt ?? null,
  };
}

/** True when auth forms should render instead of the unavailable state. */
export function isAuthAvailable(): boolean {
  return true;
}

/** True when the active adapter is the demo mock (for the visible badge). */
export function isMockAuth(): boolean {
  return USE_MOCK_SERVICES;
}

/**
 * Returns the configured auth service. Always available now: the mock
 * adapter only with the explicit mock flag, otherwise the live API adapter.
 */
export function getAuthService(): AuthService | null {
  if (USE_MOCK_SERVICES) return mockAuthService;
  return apiAuthService;
}

export { AUTH_UNAVAILABLE_MESSAGE };
