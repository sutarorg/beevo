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

export interface CheckoutOrder {
  orderId: string;
  courseId: string;
  courseTitle: string;
  amountInPaise: number;
  platformFeeInPaise: number;
  currency: "INR";
  /** "razorpay-simulated" (mock) or "razorpay" (real checkout). */
  gateway: "razorpay-simulated" | "razorpay";
  keyId: string;
  /** Present for real Razorpay checkout (server-created order id). */
  razorpayOrderId?: string;
  buyer?: { name: string; email: string };
}

export interface PaymentReceipt {
  paymentId: string;
  orderId: string;
  amountInPaise: number;
  /** Honesty marker — always present on mock receipts. */
  note: string;
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
   * Playback session: `simulated` (mock/player-less) or `direct` — a
   * server-authorized, short-lived presigned R2 URL with range support.
   * Never a storage key; the URL embeds its own expiry.
   */
  playback:
    | {
        mode: "simulated";
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
