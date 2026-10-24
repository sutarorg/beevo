import type { LessonType, OrderStatus } from "@/lib/creator-types";

/**
 * Contracts for the public storefront, checkout, and learner experience.
 * Media references here are PUBLIC metadata only — no storage keys, signed
 * URLs, or payment secrets are ever passed to components (API_CONTRACTS §4).
 */

// ---------------------------------------------------------------------------
// Public storefront
// ---------------------------------------------------------------------------

export interface PublicLessonMeta {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  durationLabel?: string;
  /** Number of downloadable files (video lessons: 0). Content never exposed. */
  resourceCount: number;
  isPreview: boolean;
}

export interface PublicSectionMeta {
  id: string;
  title: string;
  lessons: PublicLessonMeta[];
}

export interface PublicCreatorInfo {
  handle: string;
  displayName: string;
  /** Null until the creator uploads a photo — the UI shows the user icon. */
  avatarUrl: string | null;
  tagline: string;
  niche: string;
  links: { label: string; url: string }[];
}

export interface PublicCourseCard {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceInPaise: number;
  coverPreviewUrl: string | null;
  lessonCount: number;
}

export interface PublicCreatorPage extends PublicCreatorInfo {
  courses: PublicCourseCard[];
}

/**
 * Short-lived, same-origin playback session for a creator-designated free
 * preview lesson. The URL is re-authorized by the server on every byte, and
 * only lessons explicitly marked `isPreview` on a published course resolve.
 */
export interface PublicPreviewPlayback {
  lessonId: string;
  lessonTitle: string;
  durationLabel?: string;
  durationSeconds: number;
  /** Same-origin delivery URL — never a storage key or bucket path. */
  url: string;
  expiresAt: string;
  note: string;
}

export interface PublicCoursePage {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceInPaise: number;
  coverPreviewUrl: string | null;
  outcomes: string[];
  sections: PublicSectionMeta[];
  lessonCount: number;
  videoCount: number;
  resourceCount: number;
  durationLabel: string;
  creator: PublicCreatorInfo;
}

// ---------------------------------------------------------------------------
// Checkout (mock payment service — real Razorpay flow ships in Prompt 5)
// ---------------------------------------------------------------------------

/** The full payment state machine the checkout UI drives through. */
export type CheckoutStage =
  | "ready"
  | "creating_order"
  | "checkout_open"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "pending";

/**
 * The learner account a purchase belongs to. Created on first purchase when
 * the buyer verifies their email; the dashboard password is generated after a
 * successful payment and emailed to this address.
 */
export interface CheckoutAccountInfo {
  email: string;
  /** True when this purchase created the Beevo account. */
  created: boolean;
  /** True when the provider accepted the receipt/credentials email. */
  emailed: boolean;
  /**
   * Only returned in non-production environments when no email provider is
   * configured — lets the buyer read the password they would otherwise receive
   * by email.
   */
  password?: string;
}

export interface CheckoutOrder {
  orderId: string;
  courseId: string;
  courseTitle: string;
  amountInPaise: number;
  platformFeeInPaise: number;
  currency: "INR";
  gateway: "razorpay";
  keyId: string;
  /** Present for real Razorpay checkout (server-created order id). */
  razorpayOrderId?: string;
  buyer?: { name: string; email: string };
  /** True when the course is free and access was granted without a gateway. */
  free?: boolean;
  enrolled?: boolean;
  account?: CheckoutAccountInfo;
}

export interface PaymentReceipt {
  paymentId: string;
  orderId: string;
  amountInPaise: number;
  /** Human-readable result shown in the success state. */
  note: string;
  enrolled?: boolean;
  account?: CheckoutAccountInfo;
}

/** Email notification preferences for a learner account. */
export interface LearnerSettings {
  name: string;
  email: string;
  notifyLessonEmails: boolean;
  notifyReceiptEmails: boolean;
}

// ---------------------------------------------------------------------------
// Enrolment, library, progress
// ---------------------------------------------------------------------------

export interface PurchaseRecord {
  id: string;
  orderId: string;
  courseId: string;
  courseTitle: string;
  amountInPaise: number;
  status: OrderStatus;
  placedAt: string;
  demo: boolean;
}

export interface LearnerProfile {
  name: string;
  email: string;
}

export interface LearnerCourseCard {
  courseId: string;
  slug: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  coverPreviewUrl: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  lastAccessedLessonId: string | null;
  lastAccessedAt: string | null;
  completedAll: boolean;
}

export interface LearnerLessonMeta {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  durationLabel?: string;
  completed: boolean;
  positionSeconds: number;
  /** Public delivery metadata only (file name/size) — no storage keys. */
  resources: { id: string; fileName: string; sizeBytes: number }[];
}

export interface LearnerSectionView {
  id: string;
  title: string;
  lessons: LearnerLessonMeta[];
}

export interface LearnerCourseView {
  courseId: string;
  slug: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  coverPreviewUrl: string | null;
  sections: LearnerSectionView[];
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  completedAll: boolean;
  lastAccessedLessonId: string | null;
}

export interface LearnerLessonView {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  lesson: LearnerLessonMeta;
  sectionTitle: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  /**
   * Playback session: `direct` — a same-origin, server-authorized streaming
   * URL with range support (never a storage key) — or `unavailable` when the
   * creator hasn't uploaded the lesson video yet.
   */
  playback:
    | {
        mode: "unavailable";
        durationSeconds: number;
        resumeAtSeconds: number;
        note: string;
      }
    | {
        mode: "direct";
        deliveryUrl: string;
        url: string;
        expiresAt: string;
        durationSeconds: number;
        resumeAtSeconds: number;
        note: string;
      };
}

export interface ProgressPatch {
  completed?: boolean;
  positionSeconds?: number;
}
