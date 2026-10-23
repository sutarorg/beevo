/**
 * Typed domain models shared by the whole product.
 *
 * These interfaces are the stable contract between the frontend (Prompt 1)
 * and the backend that Prompt 5 will implement. API responses, database
 * rows, and UI props all derive from these shapes. See FRONTEND_CONTRACTS.md
 * and API_CONTRACTS.md for the narrative version.
 *
 * Money is always stored and transported as integer paise (INR minor units)
 * to avoid floating point errors. Formatting happens only at the UI edge.
 */

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export const INR = "INR" as const;

/** Format integer paise as an Indian-rupee string, e.g. 99900 -> "₹999". */
export function formatINR(
  amountInPaise: number,
  options: { decimals?: boolean } = {},
): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: INR,
    minimumFractionDigits: options.decimals ? 2 : 0,
    maximumFractionDigits: options.decimals ? 2 : 0,
  }).format(rupees);
}

// ---------------------------------------------------------------------------
// Pricing — the fixed business rules (single plan, 8% commission, no Pro)
// ---------------------------------------------------------------------------

export const PLATFORM_COMMISSION_RATE = 0.08 as const;
export const PLATFORM_COMMISSION_LABEL = "8%";
export const CREATOR_SHARE_LABEL = "92%";

export interface PricingPlan {
  id: "free";
  name: string;
  /** Monthly subscription price in paise. Always 0 — there is no paid plan. */
  monthlyPriceInPaise: number;
  tagline: string;
  features: string[];
  commissionRate: number;
  ctaLabel: string;
}

/** The one and only plan. Do not add tiers. */
export const FREE_PLAN: PricingPlan = {
  id: "free",
  name: "Free",
  monthlyPriceInPaise: 0,
  tagline: "Everything you need to sell your first course. Pay nothing monthly — we earn 8% only when you make an eligible sale.",
  features: [
    "Personal creator profile",
    "Course storefront & sales page",
    "Create & sell unlimited courses",
    "Video lessons & file uploads",
    "Learner dashboard for your buyers",
    "Secure payments (UPI, cards, net‑banking)",
    "Transactional email receipts",
  ],
  commissionRate: PLATFORM_COMMISSION_RATE,
  ctaLabel: "Start free",
};

export interface CommissionBreakdown {
  grossInPaise: number;
  platformFeeInPaise: number;
  creatorShareInPaise: number;
}

/**
 * Split a successful eligible sale between platform and creator.
 * Illustrative only — payment gateway charges and applicable taxes are
 * settled separately, and this is not a guarantee of earnings or payouts.
 */
export function commissionBreakdown(grossInPaise: number): CommissionBreakdown {
  const platformFeeInPaise = Math.round(grossInPaise * PLATFORM_COMMISSION_RATE);
  return {
    grossInPaise,
    platformFeeInPaise,
    creatorShareInPaise: grossInPaise - platformFeeInPaise,
  };
}

// ---------------------------------------------------------------------------
// Creators & courses (public shapes — what a buyer can see)
// ---------------------------------------------------------------------------

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  coverUrl: string;
  priceInPaise: number;
  lessonCount: number;
  durationLabel: string;
  level: "Beginner" | "Intermediate" | "All levels";
}

export interface CreatorLink {
  label: string;
  url: string;
}

export interface CreatorPublicProfile {
  id: string;
  /** URL-safe handle, e.g. "meera-shoots" -> coursekit.app/@meera-shoots */
  handle: string;
  displayName: string;
  tagline: string;
  avatarUrl: string;
  niche: string;
  stats: {
    courseCount: number;
    learnerCount: number;
  };
  links: CreatorLink[];
  courses: CourseSummary[];
}

// ---------------------------------------------------------------------------
// API envelopes & async state — shared with the Prompt 5 backend
// ---------------------------------------------------------------------------

export interface ApiError {
  /** Machine-readable code, e.g. "invalid_credentials". */
  code: string;
  /** Human-readable, UI-safe message. */
  message: string;
  /** Optional per-field messages for form rendering. */
  fieldErrors?: Record<string, string[]>;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export type AsyncState<T, E = ApiError> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: E };
