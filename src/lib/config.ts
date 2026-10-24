/**
 * Central application configuration.
 *
 * Every environment variable used anywhere in the product is declared here
 * (or documented in DECISIONS.md). Never read `process.env` ad-hoc in pages.
 */

export const APP_NAME = "Beevo";
export const APP_TAGLINE = "Sell courses to the audience you already have.";

function resolvePublicAppUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) return "https://beevo.in";
  const withScheme = /^https?:\/\//i.test(raw)
    ? raw
    : /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(raw)
      ? `http://${raw}`
      : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return "https://beevo.in";
  }
}

/** Public marketing URL used in metadata and email copy. */
export const APP_URL = resolvePublicAppUrl();

/**
 * Origin to use for links the creator will actually share (storefront, sales
 * page).
 *
 * On the client this is the origin the creator is browsing right now — so a
 * storefront link copied from the studio opens the same live site, never a
 * hardcoded domain or `localhost`. On the server (SSR/first paint) it falls
 * back to NEXT_PUBLIC_APP_URL.
 */
export function shareableOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return APP_URL;
}

export const SUPPORT_EMAIL = "support@beevo.in";

/**
 * Service mode for the pre-backend phases (Prompts 1–4).
 *
 * Resolution order:
 *  1. `NEXT_PUBLIC_USE_MOCKS` env var ("true" / "false") — explicit override.
 *  2. `REPO_SERVICE_MODE` below — an explicit, in-source declaration matching
 *     the current build phase. Survives demo sandboxes resetting `.env`.
 *
 * Mock mode is never silent: every auth/creator screen shows a "Demo mode ·
 * mock services" badge, demo data is labelled, and simulated actions say so.
 * Prompt 5 flips REPO_SERVICE_MODE to "live" (and real deployments should set
 * NEXT_PUBLIC_USE_MOCKS=false); without mocks the UI renders explicit
 * "unavailable" states instead of faking success.
 */
/**
 * Mock adapters are retired: every screen now reads and writes the real
 * backend (checkout, courses, learner progress, media, admin). Keeping this
 * permanently false means no deployment can accidentally serve simulated
 * payments, uploads, or learner data — even if an old environment variable is
 * still set.
 */
export const USE_MOCK_SERVICES = false as const;

/**
 * Post-auth destination. The creator dashboard ships in a later phase;
 * until then the mock auth success panel explains this instead of faking a
 * dashboard route.
 */
export const POST_AUTH_PATH = "/creator/dashboard";
