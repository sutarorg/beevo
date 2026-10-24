/**
 * Typed contracts for the creator-facing application.
 *
 * These shapes are the frontend<->backend contract for Prompt 5: the mock
 * adapters in src/lib/services implement them today; real API routes replace
 * them without page rewrites. Money is integer paise (INR), dates ISO 8601.
 */

export type CourseStatus = "draft" | "published" | "unpublished" | "archived";
export type LessonType = "video" | "resources";
export type UploadKind = "cover" | "video" | "resource" | "avatar";

/**
 * A media object reference returned by the media service. In mock mode
 * `simulated` is always true and nothing is persisted anywhere; in production
 * this becomes an R2 object key + delivery URL (see API_CONTRACTS.md §3).
 */
export interface MediaRef {
  id: string;
  kind: UploadKind;
  fileName: string;
  sizeBytes: number;
  /** Local/demo preview (data URL or bundled demo asset). */
  previewUrl?: string;
  durationLabel?: string;
  uploadedAt: string;
  simulated: boolean;
}

export interface Lesson {
  id: string;
  type: LessonType;
  title: string;
  description: string;
  media: MediaRef[];
  /**
   * Video lessons only: playable on the public storefront without buying.
   * Resource lessons are never previewable.
   */
  isPreview?: boolean;
}

export interface CourseSection {
  id: string;
  title: string;
  /** Array order is the display order. */
  lessons: Lesson[];
}

/** Full course shape used by the editor. */
export interface CourseEditor {
  id: string;
  /** Public handle of the signed-in creator (their storefront address). */
  creatorHandle: string;
  /** Display name of the signed-in creator — never demo data. */
  creatorName: string;
  status: CourseStatus;
  slug: string | null;
  title: string;
  shortDescription: string;
  outcomes: string[];
  cover: MediaRef | null;
  priceInPaise: number | null;
  /** Array order is the display order. */
  sections: CourseSection[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Compact shape for the courses list, with sales/enrollment figures. */
export interface CourseListItem {
  id: string;
  title: string;
  status: CourseStatus;
  coverPreviewUrl: string | null;
  priceInPaise: number | null;
  lessonCount: number;
  updatedAt: string;
  publishedAt: string | null;
  salesCount: number;
  enrollmentCount: number;
  grossInPaise: number;
}

export interface ReadinessItem {
  key: string;
  label: string;
  ok: boolean;
  /** Wizard stage that fixes this item. */
  stage: "details" | "curriculum" | "pricing";
  detail?: string;
}

// ---------------------------------------------------------------------------
// Students, orders, earnings
// ---------------------------------------------------------------------------

export interface StudentRecord {
  id: string;
  fullName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  status: "active";
}

export type OrderStatus = "paid" | "refunded";

export interface OrderRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  buyerName: string;
  buyerEmail: string;
  grossInPaise: number;
  platformFeeInPaise: number;
  creatorShareInPaise: number;
  status: OrderStatus;
  placedAt: string;
  /** Always true for mock data; never render demo orders as real payments. */
  demo: boolean;
}

export interface EarningsSummary {
  grossInPaise: number;
  platformFeesInPaise: number;
  creatorShareInPaise: number;
  availableInPaise: number;
  paidOutInPaise: number;
}

export interface PayoutRecord {
  id: string;
  amountInPaise: number;
  reference: string;
  /** Payouts are recorded manually by platform admins (provider-approved). */
  status: "recorded";
  recordedAt: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Analytics & notifications
// ---------------------------------------------------------------------------

export interface AnalyticsOverview {
  grossLast30dInPaise: number;
  ordersLast30d: number;
  enrollmentsLast30d: number;
  publishedCourses: number;
  draftCourses: number;
}

export interface SalesPoint {
  label: string;
  grossInPaise: number;
  orders: number;
}

export interface EnrollmentPoint {
  label: string;
  enrollments: number;
}

export interface CoursePerformanceRow {
  courseId: string;
  title: string;
  status: CourseStatus;
  sales: number;
  enrollments: number;
  grossInPaise: number;
  shareInPaise: number;
}

export type NotificationKind = "enrollment" | "payout" | "system" | "sale";

export interface CreatorNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// Profile & support
// ---------------------------------------------------------------------------

export interface CreatorProfile {
  handle: string;
  displayName: string;
  tagline: string;
  /** Null until the creator uploads a photo — the UI shows the user icon. */
  avatarUrl: string | null;
  niche: string;
  links: { label: string; url: string }[];
  publicUrl: string;
}

/** Payout destination a creator supplies so admins can transfer earnings. */
export interface PayoutDetails {
  accountNumber: string;
  ifsc: string;
  /** ISO 8601 timestamp of the last save, or null when never provided. */
  updatedAt: string | null;
}

/** Account + email-notification preferences (real, persisted per creator). */
export interface CreatorSettings {
  email: string;
  notifySaleEmails: boolean;
  notifyWeeklySummary: boolean;
  notifyProductTips: boolean;
}

export interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  body: string;
  createdAt: string;
  status: "open";
}

/** Signed upload session (R2 in production; simulated in mock mode). */
export interface UploadSession {
  id: string;
  kind: UploadKind;
  fileName: string;
  sizeBytes: number;
  expiresAt: string;
  /** Live sessions carry the server-generated presigned PUT URL (never the raw key). */
  signedUrl?: string;
  mimeType?: string;
  /** Client-only handle for the browser upload call; never persisted. */
  file?: File;
}

export const SIMULATED_UPLOAD_NOTE =
  "Demo uploads stay on this device — connect storage to send real files.";
