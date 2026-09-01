export type PlanId = "free" | "pro";

export type PlatformId =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "pinterest"
  | "youtube";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}

export interface Post {
  id: string;
  caption: string;
  platforms: PlatformId[];
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  media: string[];
  metrics: PostMetrics;
  aiAssisted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  id: string;
  platform: PlatformId;
  handle: string;
  name: string;
  connected: boolean;
  followers: number;
  following?: number;
  avatarHue: number;
  lastSync: string | null;
  health: "good" | "expiring" | "disconnected";
  postsThisWeek: number;
}

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  color: string;
  softBg: string;
  charLimit: number;
  tagline: string;
}

export type NotificationKind = "published" | "failed" | "account" | "plan" | "tip";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amountInr: number;
  status: "paid" | "refunded";
}

export interface MediaAsset {
  id: string;
  src: string;
  label: string;
  kind: "image" | "video";
  tags: string[];
  usedIn: number;
}

export interface AnalyticsSeries {
  label: string;
  impressions: number;
  engagement: number;
  followers: number;
}

export interface PlatformSplit {
  platform: PlatformId;
  value: number;
}

export interface BestTimeCell {
  day: number; // 0 = Mon
  slot: number; // 0..6 time buckets
  score: number; // 0..100
}

export interface AnalyticsPayload {
  kpis: {
    followers: number;
    followersDelta: number;
    impressions: number;
    impressionsDelta: number;
    engagementRate: number;
    engagementDelta: number;
    linkClicks: number;
    clicksDelta: number;
  };
  series: AnalyticsSeries[];
  split: PlatformSplit[];
  bestTimes: BestTimeCell[];
  topPosts: { id: string; caption: string; platform: PlatformId; impressions: number; engagement: number }[];
}

export interface BillingPayload {
  plan: PlanId;
  renewsOn: string | null;
  invoices: Invoice[];
  usage: { postsThisMonth: number; postsLimit: number | null; accountsUsed: number; accountsLimit: number | null };
}

export interface AppStatePayload {
  user: { name: string; email: string; workspace: string; plan: PlanId; timezone: string; digest: boolean };
  plan: PlanId;
  accounts: SocialAccount[];
  notifications: NotificationItem[];
  analytics: AnalyticsPayload;
  billing: BillingPayload;
  media: MediaAsset[];
}
