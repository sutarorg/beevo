import type { PlatformId, PlatformMeta, PlanId } from "./types";

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    softBg: "rgba(225,48,108,0.1)",
    charLimit: 2200,
    tagline: "Reels, carousels & stories",
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    softBg: "rgba(24,119,242,0.1)",
    charLimit: 63206,
    tagline: "Pages & community posts",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    color: "#0F0F0F",
    softBg: "rgba(15,15,15,0.08)",
    charLimit: 280,
    tagline: "Threads & hot takes",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    softBg: "rgba(10,102,194,0.1)",
    charLimit: 3000,
    tagline: "Thought leadership",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    color: "#E60023",
    softBg: "rgba(230,0,35,0.09)",
    charLimit: 500,
    tagline: "Pins that keep selling",
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    softBg: "rgba(255,0,0,0.08)",
    charLimit: 5000,
    tagline: "Shorts & premieres",
  },
];

export const platformById = (id: PlatformId): PlatformMeta =>
  PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];

export interface PlanMeta {
  id: PlanId;
  name: string;
  priceInr: number;
  cadence: string;
  blurb: string;
  postsPerMonth: number | null; // null = unlimited
  socialAccounts: number | null;
  features: { label: string; included: boolean }[];
  cta: string;
}

export const PLANS: PlanMeta[] = [
  {
    id: "free",
    name: "Free",
    priceInr: 0,
    cadence: "forever",
    blurb: "Dip a toe in the hive. For creators just getting started.",
    postsPerMonth: 10,
    socialAccounts: 2,
    features: [
      { label: "10 scheduled posts / month", included: true },
      { label: "Connect 2 social accounts", included: true },
      { label: "Visual content calendar", included: true },
      { label: "Basic analytics (7 days)", included: true },
      { label: "AI caption assistant", included: false },
      { label: "Best-time-to-post engine", included: false },
      { label: "Bulk scheduling & CSV import", included: false },
      { label: "Team seats & approvals", included: false },
    ],
    cta: "Start for free",
  },
  {
    id: "pro",
    name: "Pro",
    priceInr: 499,
    cadence: "per month",
    blurb: "The full hive. For brands & teams posting every day.",
    postsPerMonth: null,
    socialAccounts: 12,
    features: [
      { label: "Unlimited scheduled posts", included: true },
      { label: "Connect up to 12 social accounts", included: true },
      { label: "Visual calendar + queue view", included: true },
      { label: "Advanced analytics (12 months)", included: true },
      { label: "AI caption assistant", included: true },
      { label: "Best-time-to-post engine", included: true },
      { label: "Bulk scheduling & CSV import", included: true },
      { label: "3 team seats & approvals", included: true },
    ],
    cta: "Upgrade to Pro",
  },
];

export const planById = (id: PlanId): PlanMeta => PLANS.find((p) => p.id === id) ?? PLANS[0];

export const GST_RATE = 0.18;

export const TIME_SLOTS = ["6a", "8a", "10a", "12p", "3p", "6p", "9p"];
export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const API = {
  appState: "/api/app-state",
  posts: "/api/posts",
  post: (id: string) => `/api/posts/${id}`,
  duplicate: (id: string) => `/api/posts/${id}/duplicate`,
  accountsToggle: "/api/accounts/toggle",
  billingPlan: "/api/billing/plan",
  notifications: "/api/notifications",
  aiAssist: "/api/ai/assist",
  search: "/api/search",
};
