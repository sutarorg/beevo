import type { CourseStatus } from "@/lib/creator-types";

/**
 * Admin console contracts. All records are mock-seeded in this phase and
 * labelled demo; Prompt 5 implements the same shapes with RLS-guarded
 * queries, financial ledgers, and audit logging (API_CONTRACTS §7).
 */

export type AccountStatus = "active" | "suspended";
export type AdminOrderStatus = "paid" | "pending" | "failed" | "refunded";
export type ReconciliationState = "settled" | "pending" | "exception";
export type CommissionStatus = "accrued" | "waived" | "reversed";
export type PayoutStatus = "pending" | "recorded" | "failed" | "cancelled";
export type DisputeType = "chargeback" | "dispute" | "reversal" | "legal_exception";
export type DisputeStatus = "open" | "under_review" | "resolved";

export interface AdminProfile {
  name: string;
  email: string;
  role: "platform_admin";
}

export interface AdminEvent {
  id: string;
  at: string;
  actor: string;
  area:
    | "creators"
    | "learners"
    | "courses"
    | "orders"
    | "payments"
    | "payouts"
    | "disputes"
    | "settings"
    | "system";
  action: string;
  detail: string;
  kind: "action" | "system" | "event";
}

export type AuditLogEntry = AdminEvent;

export interface PlatformKpis {
  creators: number;
  learners: number;
  publishedCourses: number;
  confirmedSales: number;
  grossInPaise: number;
  commissionInPaise: number;
  pendingReconciliationInPaise: number;
  outstandingEarningsInPaise: number;
  pendingPayouts: number;
  pendingPayoutsInPaise: number;
  failedPaymentEvents: number;
}

export interface CreatorRow {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  niche: string;
  status: AccountStatus;
  courseCount: number;
  publishedCount: number;
  learnerCount: number;
  grossInPaise: number;
  joinedAt: string;
  lastActiveAt: string;
}

export interface CreatorDetail extends CreatorRow {
  courses: { id: string; title: string; status: CourseStatus; priceInPaise: number | null; enrollments: number }[];
  history: AdminEvent[];
}

export interface LearnerRow {
  id: string;
  fullName: string;
  email: string;
  status: AccountStatus;
  enrolledCourses: number;
  totalSpendInPaise: number;
  joinedAt: string;
}

export interface LearnerDetail extends LearnerRow {
  enrollments: { courseId: string; courseTitle: string; creatorName: string; enrolledAt: string; progressPct: number }[];
  supportTickets: { id: string; subject: string; status: "open" | "resolved"; createdAt: string }[];
  recentOrders: { id: string; courseTitle: string; amountInPaise: number; status: AdminOrderStatus; placedAt: string }[];
}

export interface CourseAdminRow {
  id: string;
  title: string;
  creatorHandle: string;
  creatorName: string;
  priceInPaise: number | null;
  status: CourseStatus;
  enrollmentCount: number;
  grossInPaise: number;
  flaggedForReview: boolean;
  updatedAt: string;
}

export interface AdminOrderRecord {
  id: string;
  providerRef: string;
  courseId: string;
  courseTitle: string;
  creatorId: string;
  creatorName: string;
  learnerId: string;
  learnerName: string;
  grossInPaise: number;
  platformFeeInPaise: number;
  creatorShareInPaise: number;
  status: AdminOrderStatus;
  commissionStatus: CommissionStatus;
  reconciliation: ReconciliationState;
  reviewed: boolean;
  placedAt: string;
  demo: boolean;
}

export interface LedgerEntry {
  id: string;
  orderId: string;
  courseTitle: string;
  creatorId: string;
  creatorName: string;
  grossInPaise: number;
  platformFeeInPaise: number;
  gatewayCostInPaise: number;
  creatorShareInPaise: number;
  commissionStatus: CommissionStatus;
  recordedAt: string;
}

export interface CreatorEarningsRow {
  creatorId: string;
  creatorName: string;
  handle: string;
  grossInPaise: number;
  commissionInPaise: number;
  gatewayCostsInPaise: number;
  payableInPaise: number;
  paidOutInPaise: number;
  outstandingInPaise: number;
}

export interface PayoutRecordAdmin {
  id: string;
  creatorId: string;
  creatorName: string;
  handle: string;
  amountInPaise: number;
  status: PayoutStatus;
  /** Masked only — never full account details anywhere in the frontend. */
  beneficiaryMasked: string;
  transferRef: string | null;
  transferDate: string | null;
  recordedBy: string | null;
  createdAt: string;
  recordedAt: string | null;
  note: string;
  history: AdminEvent[];
}

export interface DisputeRecord {
  id: string;
  type: DisputeType;
  status: DisputeStatus;
  orderId: string;
  courseTitle: string;
  learnerName: string;
  creatorName: string;
  amountInPaise: number;
  openedAt: string;
  summary: string;
  notes: { id: string; at: string; actor: string; note: string }[];
}

export interface PaymentEvent {
  id: string;
  orderId: string;
  learnerName: string;
  amountInPaise: number;
  method: "upi" | "card" | "netbanking";
  status: "initiated" | "succeeded" | "failed" | "pending";
  failureReason: string | null;
  providerRef: string;
  at: string;
}

export interface PaymentFeatureFlags {
  razorpayConnection: "pending_provider_approval" | "connected";
  manualPayoutRecording: boolean;
  maintenanceMode: boolean;
  learnerSignups: boolean;
}
