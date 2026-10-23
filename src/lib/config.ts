/**
 * Central application configuration.
 *
 * Every environment variable used anywhere in the product is declared here
 * (or documented in DECISIONS.md). Never read `process.env` ad-hoc in pages.
 */

export const APP_NAME = "CourseKit";
export const APP_TAGLINE = "Sell courses to the audience you already have.";

/** Public marketing URL used in metadata and email copy. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://coursekit.app";

export const SUPPORT_EMAIL = "support@coursekit.app";

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
type ServiceMode = "mock" | "live";
const REPO_SERVICE_MODE: ServiceMode = "live";

export const USE_MOCK_SERVICES =
  process.env.NEXT_PUBLIC_USE_MOCKS !== undefined
    ? process.env.NEXT_PUBLIC_USE_MOCKS === "true"
    : (REPO_SERVICE_MODE as ServiceMode) === "mock";

/**
 * Post-auth destination. The creator dashboard ships in a later phase;
 * until then the mock auth success panel explains this instead of faking a
 * dashboard route.
 */
export const POST_AUTH_PATH = "/creator/dashboard";
