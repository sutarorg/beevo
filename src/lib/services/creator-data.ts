import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import type {
  AnalyticsOverview,
  CoursePerformanceRow,
  CreatorNotification,
  CreatorProfile,
  CreatorSettings,
  EarningsSummary,
  EnrollmentPoint,
  OrderRecord,
  PayoutDetails,
  PayoutRecord,
  SalesPoint,
  StudentRecord,
  SupportTicket,
} from "@/lib/creator-types";
import {
  MOCK_CURRENT_CREATOR,
  seedNotifications,
  seedOrders,
  seedPayouts,
  seedStudents,
} from "@/lib/mocks/creator-app";
import {
  consumeForcedFailure,
  containsFailTrigger,
  mockId,
  mockLatency,
} from "@/lib/services/mock-utils";

/**
 * Creator data service contract — students, orders, analytics, earnings,
 * profile, notifications, and support tickets. Prompt 5 implements this with
 * real PostgreSQL queries; the mock keeps everything deterministic and
 * clearly labelled as demo data (orders carry `demo: true`).
 */

export interface DashboardData {
  overview: AnalyticsOverview;
  earnings: EarningsSummary;
  recentOrders: OrderRecord[];
  performance: CoursePerformanceRow[];
  notifications: CreatorNotification[];
  profile: CreatorProfile;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  salesSeries: SalesPoint[];
  enrollmentSeries: EnrollmentPoint[];
  performance: CoursePerformanceRow[];
}

/** Profile patch; `avatarAssetId` swaps the photo via a verified media upload. */
export interface ProfilePatch
  extends Partial<Pick<CreatorProfile, "handle" | "displayName" | "tagline" | "niche" | "links">> {
  avatarAssetId?: string | null;
}

export interface CreatorDataService {
  getDashboard(): Promise<ApiResult<DashboardData>>;
  getAnalytics(): Promise<ApiResult<AnalyticsData>>;
  listStudents(): Promise<ApiResult<StudentRecord[]>>;
  listOrders(): Promise<ApiResult<OrderRecord[]>>;
  getEarnings(): Promise<ApiResult<{ summary: EarningsSummary; payouts: PayoutRecord[] }>>;
  getPayoutDetails(): Promise<ApiResult<PayoutDetails>>;
  updatePayoutDetails(input: { accountNumber: string; ifsc: string }): Promise<ApiResult<PayoutDetails>>;
  getSettings(): Promise<ApiResult<CreatorSettings>>;
  updateSettings(
    patch: Partial<Pick<CreatorSettings, "notifySaleEmails" | "notifyWeeklySummary" | "notifyProductTips">>,
  ): Promise<ApiResult<CreatorSettings>>;
  getProfile(): Promise<ApiResult<CreatorProfile>>;
  updateProfile(patch: ProfilePatch): Promise<ApiResult<CreatorProfile>>;
  listNotifications(): Promise<ApiResult<CreatorNotification[]>>;
  markAllNotificationsRead(): Promise<ApiResult<void>>;
  submitSupportTicket(input: { category: string; subject: string; body: string }): Promise<ApiResult<SupportTicket>>;
}

// ---- shared mock computations (single source for business views) ---------

function computeEarnings(orders: OrderRecord[], payouts: PayoutRecord[]): EarningsSummary {
  const paid = orders.filter((order) => order.status === "paid");
  const grossInPaise = paid.reduce((sum, order) => sum + order.grossInPaise, 0);
  const platformFeesInPaise = paid.reduce((sum, order) => sum + order.platformFeeInPaise, 0);
  const paidOutInPaise = payouts
    .filter((payout) => payout.status === "recorded")
    .reduce((sum, payout) => sum + payout.amountInPaise, 0);
  const creatorShareInPaise = grossInPaise - platformFeesInPaise;
  return {
    grossInPaise,
    platformFeesInPaise,
    creatorShareInPaise,
    availableInPaise: Math.max(0, creatorShareInPaise - paidOutInPaise),
    paidOutInPaise,
  };
}

function computePerformance(orders: OrderRecord[]): CoursePerformanceRow[] {
  const byCourse = new Map<string, CoursePerformanceRow>();
  for (const order of orders) {
    const row =
      byCourse.get(order.courseId) ??
      ({
        courseId: order.courseId,
        title: order.courseTitle,
        status: "published",
        sales: 0,
        enrollments: 0,
        grossInPaise: 0,
        shareInPaise: 0,
      } satisfies CoursePerformanceRow);
    if (order.status === "paid") {
      row.sales += 1;
      row.enrollments += 1;
      row.grossInPaise += order.grossInPaise;
      row.shareInPaise += order.creatorShareInPaise;
    }
    byCourse.set(order.courseId, row);
  }
  return [...byCourse.values()].sort((a, b) => b.grossInPaise - a.grossInPaise);
}

function computeSeries(orders: OrderRecord[]): { salesSeries: SalesPoint[]; enrollmentSeries: EnrollmentPoint[] } {
  const weeks: { label: string; start: number }[] = [];
  const now = Date.now();
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
    weeks.push({
      label: new Date(start + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      start,
    });
  }
  const salesSeries: SalesPoint[] = weeks.map((week, i) => {
    const end = i < weeks.length - 1 ? weeks[i + 1].start : now + 1;
    const paid = orders.filter(
      (order) =>
        order.status === "paid" &&
        new Date(order.placedAt).getTime() >= week.start &&
        new Date(order.placedAt).getTime() < end,
    );
    return {
      label: week.label,
      grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      orders: paid.length,
    };
  });
  const enrollmentSeries: EnrollmentPoint[] = salesSeries.map((point) => ({
    label: point.label,
    enrollments: point.orders,
  }));
  return { salesSeries, enrollmentSeries };
}

function computeOverview(orders: OrderRecord[]): AnalyticsOverview {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = orders.filter(
    (order) => order.status === "paid" && new Date(order.placedAt).getTime() >= cutoff,
  );
  return {
    grossLast30dInPaise: recent.reduce((sum, order) => sum + order.grossInPaise, 0),
    ordersLast30d: recent.length,
    enrollmentsLast30d: recent.length,
    publishedCourses: 1,
    draftCourses: 1,
  };
}

const RESERVED_HANDLES = ["admin", "support", "beevo", "help", "pricing"];

class MockCreatorDataService implements CreatorDataService {
  private orders = seedOrders();
  private students = seedStudents();
  private payouts = seedPayouts();
  private notifications = seedNotifications();
  private tickets: SupportTicket[] = [];
  private profile: CreatorProfile = { ...MOCK_CURRENT_CREATOR };
  private payoutDetails: PayoutDetails = { accountNumber: "", ifsc: "", updatedAt: null };
  private settings: CreatorSettings = {
    email: "creator@example.com",
    notifySaleEmails: true,
    notifyWeeklySummary: true,
    notifyProductTips: false,
  };

  async getDashboard(): Promise<ApiResult<DashboardData>> {
    await mockLatency(300, 250);
    const forced = consumeForcedFailure<DashboardData>();
    if (forced) return forced;
    const sorted = [...this.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    return {
      ok: true,
      data: {
        overview: computeOverview(this.orders),
        earnings: computeEarnings(this.orders, this.payouts),
        recentOrders: sorted.slice(0, 5),
        performance: computePerformance(this.orders),
        notifications: this.notifications,
        profile: { ...this.profile },
      },
    };
  }

  async getAnalytics(): Promise<ApiResult<AnalyticsData>> {
    await mockLatency(300, 250);
    const forced = consumeForcedFailure<AnalyticsData>();
    if (forced) return forced;
    const { salesSeries, enrollmentSeries } = computeSeries(this.orders);
    return {
      ok: true,
      data: {
        overview: computeOverview(this.orders),
        salesSeries,
        enrollmentSeries,
        performance: computePerformance(this.orders),
      },
    };
  }

  async listStudents(): Promise<ApiResult<StudentRecord[]>> {
    await mockLatency(250, 200);
    const forced = consumeForcedFailure<StudentRecord[]>();
    if (forced) return forced;
    return { ok: true, data: [...this.students].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)) };
  }

  async listOrders(): Promise<ApiResult<OrderRecord[]>> {
    await mockLatency(250, 200);
    const forced = consumeForcedFailure<OrderRecord[]>();
    if (forced) return forced;
    return { ok: true, data: [...this.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)) };
  }

  async getEarnings(): Promise<ApiResult<{ summary: EarningsSummary; payouts: PayoutRecord[] }>> {
    await mockLatency(250, 200);
    const forced = consumeForcedFailure<{ summary: EarningsSummary; payouts: PayoutRecord[] }>();
    if (forced) return forced;
    return {
      ok: true,
      data: {
        summary: computeEarnings(this.orders, this.payouts),
        payouts: [...this.payouts].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
      },
    };
  }

  async getPayoutDetails(): Promise<ApiResult<PayoutDetails>> {
    await mockLatency(150, 100);
    const forced = consumeForcedFailure<PayoutDetails>();
    if (forced) return forced;
    return { ok: true, data: { ...this.payoutDetails } };
  }

  async updatePayoutDetails(input: { accountNumber: string; ifsc: string }): Promise<ApiResult<PayoutDetails>> {
    await mockLatency(250, 150);
    const forced = consumeForcedFailure<PayoutDetails>();
    if (forced) return forced;
    const accountNumber = input.accountNumber.replace(/\s+/g, "");
    const ifsc = input.ifsc.trim().toUpperCase();
    if (!/^\d{9,18}$/.test(accountNumber)) {
      return {
        ok: false,
        error: {
          code: "validation_failed",
          message: "Enter a valid bank account number (9–18 digits).",
          fieldErrors: { accountNumber: ["9–18 digits."] },
        },
      };
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return {
        ok: false,
        error: {
          code: "validation_failed",
          message: "Enter a valid IFSC code, e.g. HDFC0001234.",
          fieldErrors: { ifsc: ["Format: 4 letters, 0, then 6 alphanumerics."] },
        },
      };
    }
    this.payoutDetails = { accountNumber, ifsc, updatedAt: new Date().toISOString() };
    return { ok: true, data: { ...this.payoutDetails } };
  }

  async getSettings(): Promise<ApiResult<CreatorSettings>> {
    await mockLatency(150, 100);
    const forced = consumeForcedFailure<CreatorSettings>();
    if (forced) return forced;
    return { ok: true, data: { ...this.settings } };
  }

  async updateSettings(
    patch: Partial<Pick<CreatorSettings, "notifySaleEmails" | "notifyWeeklySummary" | "notifyProductTips">>,
  ): Promise<ApiResult<CreatorSettings>> {
    await mockLatency(200, 150);
    const forced = consumeForcedFailure<CreatorSettings>();
    if (forced) return forced;
    this.settings = { ...this.settings, ...patch };
    return { ok: true, data: { ...this.settings } };
  }

  async getProfile(): Promise<ApiResult<CreatorProfile>> {
    await mockLatency(200, 150);
    const forced = consumeForcedFailure<CreatorProfile>();
    if (forced) return forced;
    return { ok: true, data: { ...this.profile } };
  }

  async updateProfile(patch: ProfilePatch): Promise<ApiResult<CreatorProfile>> {
    await mockLatency(300, 200);
    const forced = consumeForcedFailure<CreatorProfile>();
    if (forced) return forced;
    if (containsFailTrigger(patch.handle) || containsFailTrigger(patch.displayName)) {
      return {
        ok: false,
        error: {
          code: "save_failed",
          message: "Simulated save failure (the [fail] trigger was used). Retry to save.",
        },
      };
    }
    if (patch.handle) {
      const normalized = patch.handle.trim().toLowerCase();
      if (!/^[a-z0-9-]{3,30}$/.test(normalized)) {
        return {
          ok: false,
          error: {
            code: "invalid_handle",
            message: "Handles need 3–30 characters: letters, numbers, and hyphens.",
            fieldErrors: { handle: ["3–30 characters, lowercase letters, numbers, hyphens."] },
          },
        };
      }
      if (RESERVED_HANDLES.includes(normalized)) {
        return {
          ok: false,
          error: {
            code: "handle_taken",
            message: `“${normalized}” isn't available. Try another handle.`,
            fieldErrors: { handle: ["This handle is taken."] },
          },
        };
      }
      this.profile.handle = normalized;
      this.profile.publicUrl = `https://beevo.in/@${normalized}`;
    }
    if (patch.displayName) this.profile.displayName = patch.displayName.trim();
    if (patch.tagline !== undefined) this.profile.tagline = patch.tagline.trim();
    if (patch.niche !== undefined) this.profile.niche = patch.niche.trim();
    if (patch.links) this.profile.links = patch.links;
    if (patch.avatarAssetId !== undefined) this.profile.avatarUrl = patch.avatarAssetId;
    return { ok: true, data: { ...this.profile } };
  }

  async listNotifications(): Promise<ApiResult<CreatorNotification[]>> {
    await mockLatency(200, 150);
    const forced = consumeForcedFailure<CreatorNotification[]>();
    if (forced) return forced;
    return {
      ok: true,
      data: [...this.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  }

  async markAllNotificationsRead(): Promise<ApiResult<void>> {
    await mockLatency(150, 100);
    this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }));
    return { ok: true, data: undefined };
  }

  async submitSupportTicket(input: { category: string; subject: string; body: string }): Promise<ApiResult<SupportTicket>> {
    await mockLatency(350, 200);
    const forced = consumeForcedFailure<SupportTicket>();
    if (forced) return forced;
    if (!input.subject.trim() || !input.body.trim()) {
      return {
        ok: false,
        error: { code: "validation_failed", message: "Add a subject and a message so we can help." },
      };
    }
    const ticket: SupportTicket = {
      id: mockId("tkt"),
      category: input.category,
      subject: input.subject.trim(),
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
      status: "open",
    };
    this.tickets = [ticket, ...this.tickets];
    return { ok: true, data: ticket };
  }

  listTickets(): SupportTicket[] {
    return this.tickets;
  }
}

let instance: MockCreatorDataService | null = null;

function getMock(): MockCreatorDataService {
  instance ??= new MockCreatorDataService();
  return instance;
}

// ---------------------------------------------------------------------------
// Live adapter — real creator data via /api/v1/creator/*
// ---------------------------------------------------------------------------

import { get as apiGet, post as apiPost, patch as apiPatch, put as apiPut } from "@/lib/services/api";

class ApiCreatorDataService implements CreatorDataService {
  getDashboard() {
    return apiGet<DashboardData>("creator/dashboard");
  }
  getAnalytics() {
    return apiGet<AnalyticsData>("creator/analytics");
  }
  listStudents() {
    return apiGet<StudentRecord[]>("creator/students");
  }
  listOrders() {
    return apiGet<OrderRecord[]>("creator/orders");
  }
  getEarnings() {
    return apiGet<{ summary: EarningsSummary; payouts: PayoutRecord[] }>("creator/earnings");
  }
  getPayoutDetails() {
    return apiGet<PayoutDetails>("creator/payout-details");
  }
  updatePayoutDetails(input: { accountNumber: string; ifsc: string }) {
    return apiPut<PayoutDetails>("creator/payout-details", input);
  }
  getSettings() {
    return apiGet<CreatorSettings>("creator/settings");
  }
  updateSettings(
    patch: Partial<Pick<CreatorSettings, "notifySaleEmails" | "notifyWeeklySummary" | "notifyProductTips">>,
  ) {
    return apiPatch<CreatorSettings>("creator/settings", patch);
  }
  getProfile() {
    return apiGet<CreatorProfile>("creator/profile");
  }
  updateProfile(patch: ProfilePatch) {
    return apiPatch<CreatorProfile>("creator/profile", patch);
  }
  listNotifications() {
    return apiGet<CreatorNotification[]>("creator/notifications");
  }
  markAllNotificationsRead() {
    return apiPost<void>("creator/notifications/read-all", {});
  }
  submitSupportTicket(input: { category: string; subject: string; body: string }) {
    return apiPost<SupportTicket>("support/tickets", input);
  }
}

const apiCreatorDataService = new ApiCreatorDataService();

export function getCreatorDataService(): CreatorDataService | null {
  if (USE_MOCK_SERVICES) return getMock();
  return apiCreatorDataService;
}
