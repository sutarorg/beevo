import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import type {
  AccountStatus,
  AdminEvent,
  AdminOrderRecord,
  AdminProfile,
  AuditLogEntry,
  CourseAdminRow,
  CreatorDetail,
  CreatorEarningsRow,
  CreatorRow,
  DisputeRecord,
  DisputeStatus,
  LedgerEntry,
  LearnerDetail,
  LearnerRow,
  PaymentEvent,
  PaymentFeatureFlags,
  PayoutRecordAdmin,
  PayoutStatus,
  PlatformKpis,
} from "@/lib/admin-types";
import type { CourseStatus } from "@/lib/creator-types";
import {
  buildSeedOrders,
  buildSeedPaymentEvents,
  seedAuditEvents,
  seedCourseAdminRows,
  seedCreatorRows,
  seedDisputes,
  seedLearnerRows,
  seedPayouts,
} from "@/lib/mocks/admin";
import { consumeForcedFailure, mockId, mockLatency } from "@/lib/services/mock-utils";

/**
 * Admin service contract — platform management reads and audited mutations.
 * Prompt 5 implements this with RLS-guarded queries, real financial ledgers,
 * and mandatory audit logging. ALL financial figures are derived here in one
 * place from base records; pages never compute or hardcode amounts.
 */

export interface AdminService {
  getSession(): { signedIn: boolean; profile: AdminProfile | null };
  signIn(email: string): Promise<ApiResult<AdminProfile>>;
  signOut(): void;
  getDashboard(): Promise<ApiResult<{ kpis: PlatformKpis; recentEvents: AdminEvent[] }>>;
  listCreators(): Promise<ApiResult<CreatorRow[]>>;
  getCreator(creatorId: string): Promise<ApiResult<CreatorDetail>>;
  setCreatorStatus(creatorId: string, status: AccountStatus, reason: string): Promise<ApiResult<CreatorRow>>;
  listLearners(): Promise<ApiResult<LearnerRow[]>>;
  getLearner(learnerId: string): Promise<ApiResult<LearnerDetail>>;
  listCourses(): Promise<ApiResult<CourseAdminRow[]>>;
  moderateCourse(courseId: string, action: "publish" | "unpublish" | "flag" | "unflag", note: string): Promise<ApiResult<CourseAdminRow>>;
  listOrders(): Promise<ApiResult<AdminOrderRecord[]>>;
  reviewOrder(orderId: string, note: string): Promise<ApiResult<AdminOrderRecord>>;
  listPaymentEvents(): Promise<ApiResult<PaymentEvent[]>>;
  getCommissionLedger(): Promise<ApiResult<LedgerEntry[]>>;
  getCreatorEarnings(): Promise<ApiResult<CreatorEarningsRow[]>>;
  getCreatorEarningsDetail(creatorId: string): Promise<ApiResult<{ summary: CreatorEarningsRow; ledger: LedgerEntry[]; payouts: PayoutRecordAdmin[] }>>;
  listPayouts(): Promise<ApiResult<PayoutRecordAdmin[]>>;
  createPayout(creatorId: string, amountInPaise: number): Promise<ApiResult<PayoutRecordAdmin>>;
  recordPayout(payoutId: string, transferRef: string, transferDate: string): Promise<ApiResult<PayoutRecordAdmin>>;
  setPayoutStatus(payoutId: string, status: "failed" | "cancelled", note: string): Promise<ApiResult<PayoutRecordAdmin>>;
  listDisputes(): Promise<ApiResult<DisputeRecord[]>>;
  setDisputeStatus(disputeId: string, status: DisputeStatus): Promise<ApiResult<DisputeRecord>>;
  addDisputeNote(disputeId: string, note: string): Promise<ApiResult<DisputeRecord>>;
  getSettings(): Promise<ApiResult<PaymentFeatureFlags>>;
  updateSettings(patch: Partial<PaymentFeatureFlags>): Promise<ApiResult<PaymentFeatureFlags>>;
  listAuditLogs(): Promise<ApiResult<AuditLogEntry[]>>;
}

const STORAGE_KEY = "coursekit_mock_admin_v2";
const SESSION_KEY = "coursekit_mock_admin_session_v2";
const ADMIN_NAME = "Platform Admin (demo)";

interface AdminDb {
  creators: CreatorRow[];
  learners: LearnerRow[];
  courses: CourseAdminRow[];
  orders: AdminOrderRecord[];
  paymentEvents: PaymentEvent[];
  payouts: PayoutRecordAdmin[];
  disputes: DisputeRecord[];
  audit: AdminEvent[];
  flags: PaymentFeatureFlags;
}

function seedDb(): AdminDb {
  const orders = buildSeedOrders();
  return {
    creators: structuredClone(seedCreatorRows),
    learners: structuredClone(seedLearnerRows),
    courses: structuredClone(seedCourseAdminRows),
    orders,
    paymentEvents: buildSeedPaymentEvents(orders),
    payouts: structuredClone(seedPayouts),
    disputes: structuredClone(seedDisputes),
    audit: [...seedAuditEvents].sort((a, b) => b.at.localeCompare(a.at)),
    flags: {
      razorpayConnection: "pending_provider_approval",
      manualPayoutRecording: true,
      maintenanceMode: false,
      learnerSignups: true,
    },
  };
}

function loadDb(): AdminDb {
  if (typeof window === "undefined") return seedDb();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDb();
    return JSON.parse(raw) as AdminDb;
  } catch {
    return seedDb();
  }
}

function persist(db: AdminDb): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // memory-only session
  }
}

export function resetAdminMockData(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

function formatMoney(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

class MockAdminService implements AdminService {
  private db: AdminDb;
  private session: AdminProfile | null = null;

  constructor() {
    this.db = loadDb();
    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        this.session = raw ? (JSON.parse(raw) as AdminProfile) : null;
      } catch {
        this.session = null;
      }
    }
  }

  private save() {
    persist(this.db);
  }

  private persistSession() {
    if (typeof window === "undefined") return;
    if (this.session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  }

  private audit(area: AdminEvent["area"], action: string, detail: string, kind: AdminEvent["kind"] = "action") {
    const entry: AdminEvent = {
      id: mockId("aud"),
      at: new Date().toISOString(),
      actor: this.session?.name ?? ADMIN_NAME,
      area,
      action,
      detail,
      kind,
    };
    this.db.audit = [entry, ...this.db.audit];
    return entry;
  }

  getSession() {
    return { signedIn: this.session !== null, profile: this.session };
  }

  async signIn(email: string): Promise<ApiResult<AdminProfile>> {
    await mockLatency(400, 300);
    const forced = consumeForcedFailure<AdminProfile>();
    if (forced) return forced;
    this.session = { name: ADMIN_NAME, email: email.trim(), role: "platform_admin" };
    this.persistSession();
    this.audit("system", "admin_signin", `Admin demo session started for ${email.trim()}.`);
    this.save();
    return ok({ ...this.session });
  }

  signOut(): void {
    this.session = null;
    this.persistSession();
  }

  // ---- derived financials (single computation point) ---------------------

  private ledger(): LedgerEntry[] {
    return this.db.orders
      .filter((order) => order.status === "paid" || order.status === "refunded")
      .map((order) => ({
        id: `led_${order.id}`,
        orderId: order.id,
        courseTitle: order.courseTitle,
        creatorId: order.creatorId,
        creatorName: order.creatorName,
        grossInPaise: order.grossInPaise,
        platformFeeInPaise: order.platformFeeInPaise,
        gatewayCostInPaise: Math.round(order.grossInPaise * 0.02),
        creatorShareInPaise: order.creatorShareInPaise,
        commissionStatus: order.commissionStatus,
        recordedAt: order.placedAt,
      }))
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  }

  private earningsFor(creatorId: string): CreatorEarningsRow {
    const ledger = this.ledger().filter((entry) => entry.creatorId === creatorId);
    const accrued = ledger.filter((entry) => entry.commissionStatus === "accrued");
    const gross = accrued.reduce((sum, entry) => sum + entry.grossInPaise, 0);
    const commission = accrued.reduce((sum, entry) => sum + entry.platformFeeInPaise, 0);
    const gateway = accrued.reduce((sum, entry) => sum + entry.gatewayCostInPaise, 0);
    const payable = accrued.reduce((sum, entry) => sum + entry.creatorShareInPaise, 0);
    const paidOut = this.db.payouts
      .filter((payout) => payout.creatorId === creatorId && payout.status === "recorded")
      .reduce((sum, payout) => sum + payout.amountInPaise, 0);
    const creator = this.db.creators.find((row) => row.id === creatorId);
    return {
      creatorId,
      creatorName: creator?.displayName ?? "Unknown creator",
      handle: creator?.handle ?? "unknown",
      grossInPaise: gross,
      commissionInPaise: commission,
      gatewayCostsInPaise: gateway,
      payableInPaise: payable,
      paidOutInPaise: paidOut,
      outstandingInPaise: Math.max(0, payable - paidOut),
    };
  }

  private requireFlags(areaEnabled: boolean): ApiResult<never> | null {
    if (!areaEnabled) {
      return err("feature_disabled", "This capability is disabled in admin settings (demo flag).");
    }
    return null;
  }

  // ---- dashboard & lists ---------------------------------------------------

  async getDashboard(): Promise<ApiResult<{ kpis: PlatformKpis; recentEvents: AdminEvent[] }>> {
    await mockLatency(300, 220);
    const forced = consumeForcedFailure<{ kpis: PlatformKpis; recentEvents: AdminEvent[] }>();
    if (forced) return forced;
    const paid = this.db.orders.filter((order) => order.status === "paid");
    const pendingRecon = this.db.orders.filter((order) => order.reconciliation !== "settled" && order.status === "paid");
    const outstandingIds = this.db.creators.map((creator) => this.earningsFor(creator.id).outstandingInPaise);
    const kpis: PlatformKpis = {
      creators: this.db.creators.length,
      learners: this.db.learners.length,
      publishedCourses: this.db.courses.filter((course) => course.status === "published").length,
      confirmedSales: paid.length,
      grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      commissionInPaise: paid.reduce((sum, order) => sum + order.platformFeeInPaise, 0),
      pendingReconciliationInPaise: pendingRecon.reduce((sum, order) => sum + order.grossInPaise, 0),
      outstandingEarningsInPaise: outstandingIds.reduce((sum, amount) => sum + amount, 0),
      pendingPayouts: this.db.payouts.filter((payout) => payout.status === "pending").length,
      pendingPayoutsInPaise: this.db.payouts.filter((payout) => payout.status === "pending").reduce((sum, payout) => sum + payout.amountInPaise, 0),
      failedPaymentEvents: this.db.paymentEvents.filter((event) => event.status === "failed").length,
    };
    return ok({ kpis, recentEvents: this.db.audit.slice(0, 8) });
  }

  async listCreators(): Promise<ApiResult<CreatorRow[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<CreatorRow[]>();
    if (forced) return forced;
    const earnings = new Map(this.db.creators.map((creator) => [creator.id, this.earningsFor(creator.id).grossInPaise]));
    const coursesByCreator = new Map<string, { total: number; published: number }>();
    for (const course of this.db.courses) {
      const stat = coursesByCreator.get(course.creatorHandle) ?? { total: 0, published: 0 };
      stat.total += 1;
      if (course.status === "published") stat.published += 1;
      coursesByCreator.set(course.creatorHandle, stat);
    }
    return ok(
      this.db.creators.map((creator) => ({
        ...creator,
        grossInPaise: earnings.get(creator.id) ?? 0,
        courseCount: coursesByCreator.get(creator.handle)?.total ?? 0,
        publishedCount: coursesByCreator.get(creator.handle)?.published ?? 0,
      })),
    );
  }

  async getCreator(creatorId: string): Promise<ApiResult<CreatorDetail>> {
    await mockLatency(220, 160);
    const forced = consumeForcedFailure<CreatorDetail>();
    if (forced) return forced;
    const list = await this.listCreators();
    if (!list.ok) return list as ApiResult<CreatorDetail>;
    const row = list.data.find((creator) => creator.id === creatorId);
    if (!row) return err("not_found", "Creator not found.");
    const courses = this.db.courses
      .filter((course) => course.creatorHandle === row.handle)
      .map((course) => ({
        id: course.id,
        title: course.title,
        status: course.status as CourseStatus,
        priceInPaise: course.priceInPaise,
        enrollments: course.enrollmentCount,
      }));
    const history = this.db.audit.filter((entry) => entry.detail.includes(row.displayName) || entry.detail.includes(`@${row.handle}`)).slice(0, 10);
    return ok({ ...row, courses, history });
  }

  async setCreatorStatus(creatorId: string, status: AccountStatus, reason: string): Promise<ApiResult<CreatorRow>> {
    await mockLatency(320, 200);
    const forced = consumeForcedFailure<CreatorRow>();
    if (forced) return forced;
    const creator = this.db.creators.find((row) => row.id === creatorId);
    if (!creator) return err("not_found", "Creator not found.");
    if (status === "suspended" && !reason.trim()) {
      return err("validation_failed", "A suspension reason is required — it’s written to the audit log.");
    }
    creator.status = status;
    this.audit(
      "creators",
      status === "suspended" ? "creator_suspended" : "creator_reactivated",
      status === "suspended"
        ? `${creator.displayName} (@${creator.handle}) suspended: ${reason.trim()}`
        : `${creator.displayName} (@${creator.handle}) reactivated.`,
    );
    this.save();
    return ok({ ...creator });
  }

  async listLearners(): Promise<ApiResult<LearnerRow[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<LearnerRow[]>();
    if (forced) return forced;
    return ok(
      this.db.learners.map((learner) => ({
        ...learner,
        totalSpendInPaise: this.db.orders
          .filter((order) => order.learnerId === learner.id && order.status === "paid")
          .reduce((sum, order) => sum + order.grossInPaise, 0),
        enrolledCourses: new Set(
          this.db.orders.filter((order) => order.learnerId === learner.id && order.status === "paid").map((order) => order.courseId),
        ).size,
      })),
    );
  }

  async getLearner(learnerId: string): Promise<ApiResult<LearnerDetail>> {
    await mockLatency(220, 160);
    const forced = consumeForcedFailure<LearnerDetail>();
    if (forced) return forced;
    const list = await this.listLearners();
    if (!list.ok) return list as ApiResult<LearnerDetail>;
    const row = list.data.find((learner) => learner.id === learnerId);
    if (!row) return err("not_found", "Learner not found.");
    const orders = this.db.orders
      .filter((order) => order.learnerId === learnerId)
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    const paidByCourse = new Map<string, AdminOrderRecord>();
    for (const order of orders) {
      if (order.status === "paid" && !paidByCourse.has(order.courseId)) paidByCourse.set(order.courseId, order);
    }
    return ok({
      ...row,
      enrollments: [...paidByCourse.values()].map((order, index) => ({
        courseId: order.courseId,
        courseTitle: order.courseTitle,
        creatorName: order.creatorName,
        enrolledAt: order.placedAt,
        progressPct: [64, 30, 10, 85][index % 4],
      })),
      supportTickets:
        learnerId === "ln_6"
          ? [{ id: "tkt_ln6", subject: "Download link expired", status: "resolved" as const, createdAt: orders[0]?.placedAt ?? new Date().toISOString() }]
          : [],
      recentOrders: orders.slice(0, 6).map((order) => ({
        id: order.id,
        courseTitle: order.courseTitle,
        amountInPaise: order.grossInPaise,
        status: order.status,
        placedAt: order.placedAt,
      })),
    });
  }

  async listCourses(): Promise<ApiResult<CourseAdminRow[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<CourseAdminRow[]>();
    if (forced) return forced;
    return ok(
      this.db.courses
        .map((course) => ({
          ...course,
          grossInPaise: this.db.orders
            .filter((order) => order.courseId === course.id && order.status === "paid")
            .reduce((sum, order) => sum + order.grossInPaise, 0),
          enrollmentCount: this.db.orders.filter((order) => order.courseId === course.id && order.status === "paid").length,
        }))
        .sort((a, b) => b.grossInPaise - a.grossInPaise),
    );
  }

  async moderateCourse(courseId: string, action: "publish" | "unpublish" | "flag" | "unflag", note: string): Promise<ApiResult<CourseAdminRow>> {
    await mockLatency(320, 200);
    const forced = consumeForcedFailure<CourseAdminRow>();
    if (forced) return forced;
    const course = this.db.courses.find((row) => row.id === courseId);
    if (!course) return err("not_found", "Course not found.");
    if (action === "publish" && course.status !== "unpublished") {
      return err("invalid_state", "Only an unpublished course can be published by moderation.");
    }
    if (action === "unpublish" && course.status !== "published") {
      return err("invalid_state", "Only a published course can be unpublished.");
    }
    if (action === "publish") {
      course.status = "published";
      course.flaggedForReview = false;
    }
    if (action === "unpublish") course.status = "unpublished";
    if (action === "flag") course.flaggedForReview = true;
    if (action === "unflag") course.flaggedForReview = false;
    course.updatedAt = new Date().toISOString();
    const verbs: Record<string, string> = {
      publish: "course_published_by_admin",
      unpublish: "course_unpublished_by_admin",
      flag: "course_flagged",
      unflag: "course_unflagged",
    };
    this.audit(
      "courses",
      verbs[action],
      `${course.title} (${course.creatorHandle}) — ${note.trim() || "no note"}. Learner access and financial records untouched.`,
    );
    this.save();
    return ok({ ...course });
  }

  async listOrders(): Promise<ApiResult<AdminOrderRecord[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<AdminOrderRecord[]>();
    if (forced) return forced;
    return ok([...this.db.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)));
  }

  async reviewOrder(orderId: string, note: string): Promise<ApiResult<AdminOrderRecord>> {
    await mockLatency(300, 180);
    const forced = consumeForcedFailure<AdminOrderRecord>();
    if (forced) return forced;
    const order = this.db.orders.find((row) => row.id === orderId);
    if (!order) return err("not_found", "Order not found.");
    order.reviewed = true;
    this.audit("orders", "order_reviewed", `${order.id} reviewed (${note.trim() || "no note"}). Reconciliation state unchanged.`);
    this.save();
    return ok({ ...order });
  }

  async listPaymentEvents(): Promise<ApiResult<PaymentEvent[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<PaymentEvent[]>();
    if (forced) return forced;
    return ok([...this.db.paymentEvents]);
  }

  async getCommissionLedger(): Promise<ApiResult<LedgerEntry[]>> {
    await mockLatency(260, 180);
    const forced = consumeForcedFailure<LedgerEntry[]>();
    if (forced) return forced;
    return ok(this.ledger());
  }

  async getCreatorEarnings(): Promise<ApiResult<CreatorEarningsRow[]>> {
    await mockLatency(260, 180);
    const forced = consumeForcedFailure<CreatorEarningsRow[]>();
    if (forced) return forced;
    return ok(
      this.db.creators
        .map((creator) => this.earningsFor(creator.id))
        .sort((a, b) => b.outstandingInPaise - a.outstandingInPaise),
    );
  }

  async getCreatorEarningsDetail(creatorId: string): Promise<ApiResult<{ summary: CreatorEarningsRow; ledger: LedgerEntry[]; payouts: PayoutRecordAdmin[] }>> {
    await mockLatency(260, 180);
    const forced = consumeForcedFailure<{ summary: CreatorEarningsRow; ledger: LedgerEntry[]; payouts: PayoutRecordAdmin[] }>();
    if (forced) return forced;
    const summary = this.earningsFor(creatorId);
    return ok({
      summary,
      ledger: this.ledger().filter((entry) => entry.creatorId === creatorId),
      payouts: this.db.payouts.filter((payout) => payout.creatorId === creatorId),
    });
  }

  async listPayouts(): Promise<ApiResult<PayoutRecordAdmin[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<PayoutRecordAdmin[]>();
    if (forced) return forced;
    return ok([...this.db.payouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async createPayout(creatorId: string, amountInPaise: number): Promise<ApiResult<PayoutRecordAdmin>> {
    await mockLatency(320, 200);
    const forced = consumeForcedFailure<PayoutRecordAdmin>();
    if (forced) return forced;
    const flags = this.requireFlags(this.db.flags.manualPayoutRecording);
    if (flags) return flags as ApiResult<PayoutRecordAdmin>;
    const creator = this.db.creators.find((row) => row.id === creatorId);
    if (!creator) return err("not_found", "Creator not found.");
    if (creator.status === "suspended") {
      return err("creator_suspended", "Payouts can't be created for a suspended creator.");
    }
    const outstanding = this.earningsFor(creatorId).outstandingInPaise;
    if (amountInPaise <= 0 || amountInPaise > outstanding) {
      return err("invalid_amount", `Enter an amount between ₹1 and the outstanding balance (${formatMoney(outstanding)}).`);
    }
    const masked =
      creator.handle === "meera-shoots" ? "HDFC Bank ••••4821"
      : creator.handle === "trainwithayaan" ? "ICICI Bank ••••7720"
      : creator.handle === "fkbeats" ? "SBI ••••2290"
      : "Bank ••••0000 (on file)";
    const payout: PayoutRecordAdmin = {
      id: mockId("pay_demo"),
      creatorId,
      creatorName: creator.displayName,
      handle: creator.handle,
      amountInPaise,
      status: "pending",
      beneficiaryMasked: masked,
      transferRef: null,
      transferDate: null,
      recordedBy: null,
      createdAt: new Date().toISOString(),
      recordedAt: null,
      note: "Awaiting transfer + reference entry.",
      history: [],
    };
    payout.history = [
      this.audit("payouts", "payout_created", `Payout record ${payout.id} created for ${creator.displayName} (${formatMoney(amountInPaise)}).`),
    ];
    this.db.payouts = [payout, ...this.db.payouts];
    this.save();
    return ok({ ...payout });
  }

  async recordPayout(payoutId: string, transferRef: string, transferDate: string): Promise<ApiResult<PayoutRecordAdmin>> {
    await mockLatency(380, 220);
    const forced = consumeForcedFailure<PayoutRecordAdmin>();
    if (forced) return forced;
    const flags = this.requireFlags(this.db.flags.manualPayoutRecording);
    if (flags) return flags as ApiResult<PayoutRecordAdmin>;
    const payout = this.db.payouts.find((row) => row.id === payoutId);
    if (!payout) return err("not_found", "Payout record not found.");
    if (payout.status !== "pending") {
      return err("invalid_state", `A ${payout.status} payout can't be recorded — only pending records accept a transfer reference.`);
    }
    const ref = transferRef.trim();
    if (ref.length < 6) {
      return err("validation_failed", "Enter the actual bank transfer reference (at least 6 characters).");
    }
    if (!transferDate || Number.isNaN(Date.parse(transferDate)) || Date.parse(transferDate) > Date.now() + 86_400_000) {
      return err("validation_failed", "Enter a valid transfer date (not in the future).");
    }
    payout.status = "recorded";
    payout.transferRef = ref;
    payout.transferDate = transferDate;
    payout.recordedBy = this.session?.name ?? ADMIN_NAME;
    payout.recordedAt = new Date().toISOString();
    payout.note = "Recorded under the manual payment arrangement.";
    const recordEvent = this.audit("payouts", "payout_recorded", `Payout ${payout.id} recorded for ${payout.creatorName} (${formatMoney(payout.amountInPaise)}) with ref ${ref} dated ${transferDate}.`);
    payout.history = [...payout.history, recordEvent];
    this.save();
    return ok({ ...payout });
  }

  async setPayoutStatus(payoutId: string, status: "failed" | "cancelled", note: string): Promise<ApiResult<PayoutRecordAdmin>> {
    await mockLatency(320, 200);
    const forced = consumeForcedFailure<PayoutRecordAdmin>();
    if (forced) return forced;
    const payout = this.db.payouts.find((row) => row.id === payoutId);
    if (!payout) return err("not_found", "Payout record not found.");
    if (status === "cancelled" && payout.status !== "pending") {
      return err("invalid_state", "Only a pending payout can be cancelled.");
    }
    if (status === "failed" && payout.status === "cancelled") {
      return err("invalid_state", "A cancelled payout can't be marked failed.");
    }
    if (!note.trim()) {
      return err("validation_failed", "Add a short note for the audit log (e.g. bank returned the transfer).");
    }
    payout.status = status;
    const event = this.audit("payouts", status === "failed" ? "payout_failed" : "payout_cancelled", `Payout ${payout.id} (${payout.creatorName}) marked ${status}: ${note.trim()}`);
    payout.history = [...payout.history, event];
    this.save();
    return ok({ ...payout });
  }

  async listDisputes(): Promise<ApiResult<DisputeRecord[]>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<DisputeRecord[]>();
    if (forced) return forced;
    return ok([...this.db.disputes].sort((a, b) => b.openedAt.localeCompare(a.openedAt)));
  }

  async setDisputeStatus(disputeId: string, status: DisputeStatus): Promise<ApiResult<DisputeRecord>> {
    await mockLatency(300, 180);
    const forced = consumeForcedFailure<DisputeRecord>();
    if (forced) return forced;
    const dispute = this.db.disputes.find((row) => row.id === disputeId);
    if (!dispute) return err("not_found", "Dispute not found.");
    dispute.status = status;
    dispute.notes = [
      ...dispute.notes,
      {
        id: mockId("dn"),
        at: new Date().toISOString(),
        actor: this.session?.name ?? ADMIN_NAME,
        note: `Status changed to ${status.replace("_", " ")}.`,
      },
    ];
    this.audit("disputes", "dispute_status", `${dispute.id} (${dispute.type}) moved to ${status}.`);
    this.save();
    return ok({ ...dispute });
  }

  async addDisputeNote(disputeId: string, note: string): Promise<ApiResult<DisputeRecord>> {
    await mockLatency(260, 160);
    const forced = consumeForcedFailure<DisputeRecord>();
    if (forced) return forced;
    const dispute = this.db.disputes.find((row) => row.id === disputeId);
    if (!dispute) return err("not_found", "Dispute not found.");
    if (!note.trim()) return err("validation_failed", "Write the note first.");
    dispute.notes = [
      ...dispute.notes,
      { id: mockId("dn"), at: new Date().toISOString(), actor: this.session?.name ?? ADMIN_NAME, note: note.trim() },
    ];
    this.audit("disputes", "dispute_note", `Note added to ${dispute.id} (${dispute.type}).`);
    this.save();
    return ok({ ...dispute });
  }

  async getSettings(): Promise<ApiResult<PaymentFeatureFlags>> {
    await mockLatency(200, 120);
    const forced = consumeForcedFailure<PaymentFeatureFlags>();
    if (forced) return forced;
    return ok({ ...this.db.flags });
  }

  async updateSettings(patch: Partial<PaymentFeatureFlags>): Promise<ApiResult<PaymentFeatureFlags>> {
    await mockLatency(320, 180);
    const forced = consumeForcedFailure<PaymentFeatureFlags>();
    if (forced) return forced;
    this.db.flags = { ...this.db.flags, ...patch };
    this.audit("settings", "flags_updated", `Flags updated: ${Object.keys(patch).join(", ")}.`, "action");
    this.save();
    return ok({ ...this.db.flags });
  }

  async listAuditLogs(): Promise<ApiResult<AuditLogEntry[]>> {
    await mockLatency(220, 160);
    const forced = consumeForcedFailure<AuditLogEntry[]>();
    if (forced) return forced;
    return ok([...this.db.audit]);
  }
}

let instance: MockAdminService | null = null;

function getMock(): MockAdminService {
  instance ??= new MockAdminService();
  return instance;
}

// ---------------------------------------------------------------------------
// Live adapter — server-authorized admin operations via /api/v1/admin/*
// ---------------------------------------------------------------------------

import { fetchSession } from "@/lib/services/auth";
import { get as apiGet, post as apiPost, patch as apiPatch } from "@/lib/services/api";

class ApiAdminService implements AdminService {
  private session: AdminProfile | null = null;

  getSession(): { signedIn: boolean; profile: AdminProfile | null } {
    return { signedIn: this.session !== null, profile: this.session };
  }

  /** Live shells call this once; admins are verified server-side anyway. */
  async refreshSession(): Promise<boolean> {
    const session = await fetchSession();
    this.session =
      session.user && session.isAdmin
        ? { name: session.user.fullName, email: session.user.email, role: "platform_admin" }
        : null;
    return this.session !== null;
  }

  async signIn(): Promise<ApiResult<AdminProfile>> {
    const allowed = await this.refreshSession();
    if (!allowed) {
      return { ok: false, error: { code: "admin_required", message: "This account doesn't have administrator access." } };
    }
    return { ok: true, data: this.session! };
  }

  signOut(): void {
    this.session = null;
    void fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
  }

  getDashboard() {
    return apiGet<{ kpis: PlatformKpis; recentEvents: AdminEvent[] }>("admin/dashboard");
  }
  listCreators() {
    return apiGet<CreatorRow[]>("admin/creators");
  }
  getCreator(creatorId: string) {
    return apiGet<CreatorDetail>(`admin/creators/${creatorId}`);
  }
  async setCreatorStatus(creatorId: string, status: AccountStatus, reason: string) {
    const result = await apiPost<CreatorRow>(`admin/creators/${creatorId}/status`, { status, reason });
    return result;
  }
  listLearners() {
    return apiGet<LearnerRow[]>("admin/learners");
  }
  getLearner(learnerId: string) {
    return apiGet<LearnerDetail>(`admin/learners/${learnerId}`);
  }
  listCourses() {
    return apiGet<CourseAdminRow[]>("admin/courses");
  }
  async moderateCourse(courseId: string, action: "publish" | "unpublish" | "flag" | "unflag", note: string) {
    const result = await apiPost<{ id: string }>(`admin/courses/${courseId}/moderate`, { action, note });
    if (!result.ok) return { ok: false as const, error: result.error };
    const list = await this.listCourses();
    const row = list.ok ? list.data.find((course) => course.id === courseId) : null;
    return row
      ? { ok: true as const, data: row }
      : { ok: false as const, error: { code: "not_found", message: "Course updated — refresh the list." } };
  }
  listOrders() {
    return apiGet<AdminOrderRecord[]>("admin/orders");
  }
  reviewOrder(orderId: string, note: string) {
    return apiPost<AdminOrderRecord>(`admin/orders/${orderId}/review`, { note });
  }
  listPaymentEvents() {
    return apiGet<PaymentEvent[]>("admin/payments");
  }
  getCommissionLedger() {
    return apiGet<LedgerEntry[]>("admin/commission-ledger");
  }
  getCreatorEarnings() {
    return apiGet<CreatorEarningsRow[]>("admin/earnings");
  }
  getCreatorEarningsDetail(creatorId: string) {
    return apiGet<{ summary: CreatorEarningsRow; ledger: LedgerEntry[]; payouts: PayoutRecordAdmin[] }>(`admin/earnings/${creatorId}`);
  }
  listPayouts() {
    return apiGet<PayoutRecordAdmin[]>("admin/payouts");
  }
  createPayout(creatorId: string, amountInPaise: number) {
    return apiPost<PayoutRecordAdmin>("admin/payouts", { creatorId, amountInPaise });
  }
  recordPayout(payoutId: string, transferRef: string, transferDate: string) {
    return apiPost<PayoutRecordAdmin>(`admin/payouts/${payoutId}/record`, { transferRef, transferDate });
  }
  setPayoutStatus(payoutId: string, status: "failed" | "cancelled", note: string) {
    return apiPost<PayoutRecordAdmin>(`admin/payouts/${payoutId}/status`, { status, note });
  }
  listDisputes() {
    return apiGet<DisputeRecord[]>("admin/disputes");
  }
  async setDisputeStatus(disputeId: string, status: DisputeStatus) {
    const result = await apiPost<{ id: string }>(`admin/disputes/${disputeId}/status`, { status });
    if (!result.ok) return { ok: false as const, error: result.error };
    const list = await this.listDisputes();
    const row = list.ok ? list.data.find((dispute) => dispute.id === disputeId) : null;
    return row
      ? { ok: true as const, data: row }
      : { ok: false as const, error: { code: "not_found", message: "Status updated — refresh the list." } };
  }
  async addDisputeNote(disputeId: string, note: string) {
    const result = await apiPost<{ id: string }>(`admin/disputes/${disputeId}/notes`, { note });
    if (!result.ok) return { ok: false as const, error: result.error };
    const list = await this.listDisputes();
    const row = list.ok ? list.data.find((dispute) => dispute.id === disputeId) : null;
    return row
      ? { ok: true as const, data: row }
      : { ok: false as const, error: { code: "not_found", message: "Note added — refresh the list." } };
  }
  getSettings() {
    return apiGet<PaymentFeatureFlags>("admin/settings");
  }
  updateSettings(patch: Partial<PaymentFeatureFlags>) {
    return apiPatch<PaymentFeatureFlags>("admin/settings", patch);
  }
  listAuditLogs() {
    return apiGet<AuditLogEntry[]>("admin/audit-logs");
  }
}

const apiAdminService = new ApiAdminService();

export function getAdminService(): AdminService | null {
  if (USE_MOCK_SERVICES) return getMock();
  return apiAdminService;
}
