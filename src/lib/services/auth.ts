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
  isCreator?: boolean;
  isLearner?: boolean;
  hasBothAccounts?: boolean;
  handle?: string | null;
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
    invalidateSessionCache();
    const result = await api<SessionResponse>("auth/login", { method: "POST", body: params });
    if (!result.ok || !result.data.user) {
      return result.ok
        ? err<AuthSession>("invalid_credentials", "Incorrect email or password.")
        : { ok: false as const, error: { code: result.error.code as AuthErrorCode, message: result.error.message } };
    }
    rememberSession(toSnapshot(result.data));
    return ok<AuthSession>({
      user: result.data.user,
      accessToken: result.data.accessToken ?? "session-cookie",
      expiresAt: result.data.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  async requestPasswordReset(email: string) {
    return api<{ email: string }>("auth/forgot", { method: "POST", body: { email } });
  }

  async completePasswordReset(params: { token: string; password: string }) {
    return api<{ success: true }>("auth/reset", { method: "POST", body: params });
  }

  async signOut() {
    invalidateSessionCache();
    forgetSession();
    return api<{ success: true }>("auth/logout", { method: "POST" });
  }
}

const apiAuthService = new ApiAuthService();

export interface SessionSnapshot {
  user: { id: string; email: string; fullName: string } | null;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
  /** This email holds a creator account (creator terms accepted). */
  isCreator: boolean;
  /** This email holds a learner account (checkout access / enrolment). */
  isLearner: boolean;
  /** Both accounts on one email — the only case the Learner/Creator toggle shows. */
  hasBothAccounts: boolean;
  handle: string | null;
}

export const ANONYMOUS_SESSION: SessionSnapshot = {
  user: null,
  isAdmin: false,
  emailVerifiedAt: null,
  isCreator: false,
  isLearner: false,
  hasBothAccounts: false,
  handle: null,
};

function toSnapshot(data: SessionResponse): SessionSnapshot {
  if (!data.user) return ANONYMOUS_SESSION;
  const isCreator = Boolean(data.isCreator);
  const isLearner = Boolean(data.isLearner);
  return {
    user: data.user,
    isAdmin: Boolean(data.isAdmin),
    emailVerifiedAt: data.emailVerifiedAt ?? null,
    isCreator,
    isLearner,
    hasBothAccounts: data.hasBothAccounts ?? (isCreator && isLearner),
    handle: data.handle ?? null,
  };
}

/**
 * Session reads are shared across shells and the player, and every tab switch
 * used to re-hit the server. A short TTL keeps navigation instant while still
 * reflecting sign-in/out almost immediately; mutations invalidate it.
 */
const SESSION_TTL_MS = 15_000;
let sessionCache: { at: number; promise: Promise<SessionSnapshot> } | null = null;
let lastResolvedSession: SessionSnapshot | null = null;

export function invalidateSessionCache(): void {
  sessionCache = null;
}

/** Local sign-out bookkeeping (cache + hint) for non-auth-service callers. */
export function clearLocalSession(): void {
  invalidateSessionCache();
  forgetSession();
}

// ---------------------------------------------------------------------------
// "Stay signed in" hint (non-sensitive chrome state only)
//
// The real credential is the httpOnly, 30-day sliding session cookie set by
// the server. This hint (name/email/account kinds — no token, no secret)
// only lets headers and shells paint the signed-in chrome instantly when a
// tab is reopened or revisited, instead of flashing "Log in" while the
// session check runs. It is verified against the server on every mount and
// cleared the moment the server says there is no session. It never grants
// access to data: every API call is authorized server-side.
// ---------------------------------------------------------------------------

const HINT_KEY = "beevo:session-hint:v1";
const ACCOUNT_MODE_KEY = "beevo:account-mode:v1";

// Tiny external store over the cached snapshot, so React components can
// read it with useSyncExternalStore (referentially stable between changes).
const sessionListeners = new Set<() => void>();

export function subscribeSessionCache(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function notifySessionCache(): void {
  for (const listener of sessionListeners) listener();
}

let hintRaw: string | null | undefined;
let hintParsed: SessionSnapshot | null = null;

function readHint(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(HINT_KEY);
    if (raw === hintRaw) return hintParsed;
    hintRaw = raw;
    if (!raw) {
      hintParsed = null;
      return null;
    }
    const parsed = JSON.parse(raw) as SessionSnapshot;
    hintParsed =
      parsed && typeof parsed === "object" && parsed.user?.id
        ? { ...ANONYMOUS_SESSION, ...parsed }
        : null;
    return hintParsed;
  } catch {
    return null;
  }
}

function rememberSession(snapshot: SessionSnapshot): void {
  lastResolvedSession = snapshot;
  try {
    if (snapshot.user) {
      localStorage.setItem(HINT_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(HINT_KEY);
    }
  } catch {
    // Private browsing / storage unavailable: the in-memory cache still works.
  }
  hintRaw = undefined;
  notifySessionCache();
}

function forgetSession(): void {
  lastResolvedSession = null;
  try {
    localStorage.removeItem(HINT_KEY);
  } catch {
    // Nothing to clear.
  }
  hintRaw = undefined;
  notifySessionCache();
}

/**
 * Synchronous best-known session (last verified value, else the persisted
 * hint, else null = unknown). Used to render shells/headers instantly;
 * callers must still confirm with fetchSession().
 */
export function getCachedSession(): SessionSnapshot | null {
  return lastResolvedSession ?? readHint();
}

/** The account mode the user last used ("learner" | "creator"), if any. */
export function getAccountModePref(): "learner" | "creator" | null {
  try {
    const value = localStorage.getItem(ACCOUNT_MODE_KEY);
    return value === "learner" || value === "creator" ? value : null;
  } catch {
    return null;
  }
}

export function setAccountModePref(mode: "learner" | "creator"): void {
  try {
    localStorage.setItem(ACCOUNT_MODE_KEY, mode);
  } catch {
    // Preference only — navigation still works without storage.
  }
  notifySessionCache();
}

export const LEARNER_DASHBOARD_PATH = "/learn/courses";
export const CREATOR_DASHBOARD_PATH = "/creator/dashboard";

/**
 * Where "Dashboard" (and post-login) should land for this session:
 * the last-used mode when the email holds both accounts, otherwise the one
 * dashboard the account actually has.
 */
export function dashboardPathFor(snapshot: SessionSnapshot | null): string {
  if (!snapshot?.user) return "/login";
  if (snapshot.hasBothAccounts) {
    return getAccountModePref() === "learner" ? LEARNER_DASHBOARD_PATH : CREATOR_DASHBOARD_PATH;
  }
  if (snapshot.isLearner && !snapshot.isCreator) return LEARNER_DASHBOARD_PATH;
  if (snapshot.isCreator) return CREATOR_DASHBOARD_PATH;
  if (snapshot.isAdmin) return "/admin/dashboard";
  return CREATOR_DASHBOARD_PATH;
}

/** Fetch the current live session (used by app shells). */
export function fetchSession(options?: { force?: boolean }): Promise<SessionSnapshot> {
  if (!options?.force && sessionCache && Date.now() - sessionCache.at < SESSION_TTL_MS) {
    return sessionCache.promise;
  }
  const promise = api<SessionResponse>("auth/session").then((result) => {
    const snapshot = result.ok ? toSnapshot(result.data) : ANONYMOUS_SESSION;
    rememberSession(snapshot);
    return snapshot;
  });
  sessionCache = { at: Date.now(), promise };
  return promise;
}

/**
 * "Start teaching" — accepts the creator terms and enables the creator
 * account on the same email (the learner account is untouched, so the email
 * ends up holding both and the Learner/Creator toggle appears).
 */
export async function startTeaching(): Promise<ApiResult<SessionSnapshot>> {
  invalidateSessionCache();
  const result = await api<SessionResponse>("auth/start-teaching", {
    method: "POST",
    body: { agreed: true },
  });
  if (!result.ok) return result;
  const snapshot = toSnapshot(result.data);
  rememberSession(snapshot);
  setAccountModePref("creator");
  return { ok: true, data: snapshot };
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
