import { z } from "zod";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminRoles,
  auditLogs,
  commissionLedger,
  courses,
  disputeNotes,
  disputes,
  enrollments,
  lessonProgress,
  lessons,
  orders,
  payoutEvents,
  payouts,
  payments,
  platformSettings,
  sections,
  supportTickets,
  users,
} from "@/db/schema";
import { route } from "@/server/router";
import { fail, ok, parseBody, requireAdmin, type Ctx } from "@/server/http";
import { newId } from "@/server/auth";
import { audit } from "@/server/audit";
import { notifyInApp, queueEmail, emailShell } from "@/server/email";
import { collectionsAllowed, payoutRecordingAllowed } from "@/server/env";
import type {
  AdminEvent,
  AdminOrderRecord,
  AuditLogEntry,
  CourseAdminRow,
  CreatorDetail,
  CreatorEarningsRow,
  CreatorRow,
  DisputeRecord,
  LedgerEntry,
  LearnerDetail,
  LearnerRow,
  PaymentEvent,
  PaymentFeatureFlags,
  PayoutRecordAdmin,
  PlatformKpis,
} from "@/lib/admin-types";

/** Admin surface — every route wrapped requireAdmin(server-verified role). */

function admin(ctx: Ctx) {
  const result = requireAdmin(ctx);
  return result instanceof Response ? null : result;
}

function toAudit(row: typeof auditLogs.$inferSelect): AuditLogEntry {
  return {
    id: row.id,
    at: row.createdAt.toISOString(),
    actor: row.actorLabel,
    area: row.area as AdminEvent["area"],
    action: row.action,
    detail: row.detail,
    kind: row.kind as AdminEvent["kind"],
  };
}

function toPayout(row: typeof payouts.$inferSelect, creatorName: string, history: AdminEvent[]): PayoutRecordAdmin {
  return {
    id: row.id,
    creatorId: row.creatorId,
    creatorName,
    handle: (row as { handle?: string }).handle ?? "",
    amountInPaise: row.amountInPaise,
    status: row.status as PayoutRecordAdmin["status"],
    beneficiaryMasked: row.beneficiaryMasked,
    transferRef: row.transferRef,
    transferDate: row.transferDate,
    recordedBy: row.recordedBy,
    createdAt: row.createdAt.toISOString(),
    recordedAt: row.recordedAt?.toISOString() ?? null,
    note: row.note,
    history,
  };
}

async function earningsFor(creatorId: string): Promise<Omit<CreatorEarningsRow, "creatorName" | "handle">> {
  const ledgerRows = await db.query.commissionLedger.findMany({
    where: and(eq(commissionLedger.creatorId, creatorId), eq(commissionLedger.status, "accrued")),
  });
  const gross = ledgerRows.reduce((sum, row) => sum + row.grossInPaise, 0);
  const commission = ledgerRows.reduce((sum, row) => sum + row.commissionInPaise, 0);
  const gateway = ledgerRows.reduce((sum, row) => sum + (row.gatewayCostInPaise ?? 0), 0);
  const payable = ledgerRows.reduce((sum, row) => sum + row.creatorShareInPaise, 0);
  const recorded = await db.query.payouts.findMany({
    where: and(eq(payouts.creatorId, creatorId), eq(payouts.status, "recorded")),
  });
  const paidOut = recorded.reduce((sum, row) => sum + row.amountInPaise, 0);
  return {
    creatorId,
    grossInPaise: gross,
    commissionInPaise: commission,
    gatewayCostsInPaise: gateway,
    payableInPaise: payable,
    paidOutInPaise: paidOut,
    outstandingInPaise: Math.max(0, payable - paidOut),
  };
}

route("GET", "admin/dashboard", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const [creators] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [published] = await db.select({ count: sql<number>`count(*)::int` }).from(courses).where(eq(courses.status, "published"));
  const paidOrders = await db.query.orders.findMany({ where: eq(orders.status, "paid") });
  const learnerIds = new Set(paidOrders.map((order) => order.userId));
  const creatorRows = await db.query.users.findMany();
  const allUsers = creatorRows;
  void allUsers;
  let outstanding = 0;
  for (const row of await db.query.users.findMany()) {
    outstanding += (await earningsFor(row.id)).outstandingInPaise;
  }
  const pendingPayouts = await db.query.payouts.findMany({ where: eq(payouts.status, "pending") });
  const failedEvents = await db.query.payments.findMany({ where: eq(payments.status, "failed") });
  const recent = await db.query.auditLogs.findMany({ orderBy: [desc(auditLogs.createdAt)], limit: 8 });
  const kpis: PlatformKpis = {
    creators: creators.count,
    learners: learnerIds.size,
    publishedCourses: published.count,
    confirmedSales: paidOrders.length,
    grossInPaise: paidOrders.reduce((sum, order) => sum + order.grossInPaise, 0),
    commissionInPaise: paidOrders.reduce((sum, order) => sum + order.platformFeeInPaise, 0),
    pendingReconciliationInPaise: 0,
    outstandingEarningsInPaise: outstanding,
    pendingPayouts: pendingPayouts.length,
    pendingPayoutsInPaise: pendingPayouts.reduce((sum, payout) => sum + payout.amountInPaise, 0),
    failedPaymentEvents: failedEvents.length,
  };
  return ok({ kpis, recentEvents: recent.map(toAudit) });
});

route("GET", "admin/creators", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.users.findMany();
  const out: CreatorRow[] = [];
  for (const row of rows) {
    const creatorCourses = await db.query.courses.findMany({ where: eq(courses.creatorId, row.id) });
    const courseIds = creatorCourses.map((course) => course.id);
    const paid = courseIds.length
      ? await db.query.orders.findMany({ where: and(inArray(orders.courseId, courseIds), eq(orders.status, "paid")) })
      : [];
    const learnerSet = new Set(paid.map((order) => order.userId));
    out.push({
      id: row.id,
      handle: row.handle ?? "",
      displayName: row.name,
      email: row.email,
      niche: row.niche,
      status: row.suspendedAt ? "suspended" : "active",
      courseCount: creatorCourses.length,
      publishedCount: creatorCourses.filter((course) => course.status === "published").length,
      learnerCount: learnerSet.size,
      grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      joinedAt: row.createdAt.toISOString(),
      lastActiveAt: row.updatedAt.toISOString(),
    });
  }
  return ok(out);
});

route("GET", "admin/creators/:id", async (_req, ctx, params) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const user = await db.query.users.findFirst({ where: eq(users.id, params.id) });
  if (!user) return fail("not_found", "Creator not found.", 404);
  const creatorCourses = await db.query.courses.findMany({ where: eq(courses.creatorId, user.id) });
  const courseIds = creatorCourses.map((course) => course.id);
  const paid = courseIds.length
    ? await db.query.orders.findMany({ where: and(inArray(orders.courseId, courseIds), eq(orders.status, "paid")) })
    : [];
  const history = await db.query.auditLogs.findMany({
    where: sql`${auditLogs.detail} ILIKE ${"%" + user.name + "%"}`,
    orderBy: [desc(auditLogs.createdAt)],
    limit: 10,
  });
  const detail: CreatorDetail = {
    id: user.id,
    handle: user.handle ?? "",
    displayName: user.name,
    email: user.email,
    niche: user.niche,
    status: user.suspendedAt ? "suspended" : "active",
    courseCount: creatorCourses.length,
    publishedCount: creatorCourses.filter((course) => course.status === "published").length,
    learnerCount: new Set(paid.map((order) => order.userId)).size,
    grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
    joinedAt: user.createdAt.toISOString(),
    lastActiveAt: user.updatedAt.toISOString(),
    courses: creatorCourses.map((course) => ({
      id: course.id,
      title: course.title,
      status: course.status as CourseAdminRow["status"],
      priceInPaise: course.priceInPaise,
      enrollments: paid.filter((order) => order.courseId === course.id).length,
    })),
    history: history.map(toAudit),
  };
  return ok(detail);
});

route("POST", "admin/creators/:id/status", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(
    z.object({ status: z.enum(["active", "suspended"]), reason: z.string().trim().max(500).default("") }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const target = await db.query.users.findFirst({ where: eq(users.id, params.id) });
  if (!target) return fail("not_found", "Creator not found.", 404);
  const isAdminTarget = await db.query.adminRoles.findFirst({ where: eq(adminRoles.userId, target.id) });
  if (isAdminTarget) return fail("forbidden", "Administrator accounts can't be suspended here.", 400);
  if (parsed.values.status === "suspended" && !parsed.values.reason) {
    return fail("validation_failed", "A suspension reason is required — it's written to the audit log.", 422);
  }
  await db
    .update(users)
    .set({
      suspendedAt: parsed.values.status === "suspended" ? new Date() : null,
      suspendedReason: parsed.values.status === "suspended" ? parsed.values.reason : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, target.id));
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "creators",
    action: parsed.values.status === "suspended" ? "creator_suspended" : "creator_reactivated",
    detail: parsed.values.status === "suspended"
      ? `${target.name} (@${target.handle ?? "—"}) suspended: ${parsed.values.reason}`
      : `${target.name} (@${target.handle ?? "—"}) reactivated.`,
  });
  const fresh = await db.query.users.findFirst({ where: eq(users.id, target.id) });
  return ok({
    id: fresh!.id,
    handle: fresh!.handle ?? "",
    displayName: fresh!.name,
    email: fresh!.email,
    niche: fresh!.niche,
    status: fresh!.suspendedAt ? "suspended" : "active",
    courseCount: 0,
    publishedCount: 0,
    learnerCount: 0,
    grossInPaise: 0,
    joinedAt: fresh!.createdAt.toISOString(),
    lastActiveAt: fresh!.updatedAt.toISOString(),
  } satisfies CreatorRow);
});

route("GET", "admin/learners", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.enrollments.findMany();
  const learnerIds = [...new Set(rows.map((row) => row.userId))];
  const out: LearnerRow[] = [];
  for (const learnerId of learnerIds) {
    const learner = await db.query.users.findFirst({ where: eq(users.id, learnerId) });
    if (!learner) continue;
    const enrolls = rows.filter((row) => row.userId === learnerId);
    const paid = await db.query.orders.findMany({
      where: and(eq(orders.userId, learnerId), eq(orders.status, "paid")),
    });
    out.push({
      id: learner.id,
      fullName: learner.name,
      email: learner.email,
      status: "active",
      enrolledCourses: enrolls.length,
      totalSpendInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      joinedAt: learner.createdAt.toISOString(),
    });
  }
  return ok(out);
});

route("GET", "admin/learners/:id", async (_req, ctx, params) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const learner = await db.query.users.findFirst({ where: eq(users.id, params.id) });
  if (!learner) return fail("not_found", "Learner not found.", 404);
  const enrolls = await db.query.enrollments.findMany({ where: eq(enrollments.userId, learner.id) });
  const orderRows = await db.query.orders.findMany({
    where: eq(orders.userId, learner.id),
    orderBy: [desc(orders.placedAt)],
  });
  const tickets = await db.query.supportTickets.findMany({
    where: eq(supportTickets.userId, learner.id),
    orderBy: [desc(supportTickets.createdAt)],
    limit: 10,
  });
  const enrollDetails: LearnerDetail["enrollments"] = [];
  for (const enroll of enrolls) {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, enroll.courseId) });
    const creator = course ? await db.query.users.findFirst({ where: eq(users.id, course.creatorId) }) : null;
    const lessonRows = course
      ? await db
          .select({ id: lessons.id })
          .from(lessons)
          .innerJoin(sections, eq(sections.id, lessons.sectionId))
          .where(eq(sections.courseId, course.id))
      : [];
    const completedRows = course
      ? await db.query.lessonProgress.findMany({
          where: and(
            eq(lessonProgress.userId, learner.id),
            eq(lessonProgress.courseId, course.id),
            eq(lessonProgress.completed, true),
          ),
        })
      : [];
    const progressPct =
      lessonRows.length > 0 ? Math.round((completedRows.length / lessonRows.length) * 100) : 0;
    enrollDetails.push({
      courseId: enroll.courseId,
      courseTitle: course?.title ?? "—",
      creatorName: creator?.name ?? "—",
      enrolledAt: enroll.createdAt.toISOString(),
      progressPct,
    });
  }
  const detail: LearnerDetail = {
    id: learner.id,
    fullName: learner.name,
    email: learner.email,
    status: "active",
    enrolledCourses: enrolls.length,
    totalSpendInPaise: orderRows.filter((order) => order.status === "paid").reduce((sum, order) => sum + order.grossInPaise, 0),
    joinedAt: learner.createdAt.toISOString(),
    enrollments: enrollDetails,
    supportTickets: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status === "open" ? "open" as const : "resolved" as const,
      createdAt: ticket.createdAt.toISOString(),
    })),
    recentOrders: orderRows.slice(0, 6).map((order) => ({
      id: order.id,
      courseTitle: order.courseTitle,
      amountInPaise: order.grossInPaise,
      status: order.status as AdminOrderRecord["status"],
      placedAt: order.placedAt.toISOString(),
    })),
  };
  return ok(detail);
});

route("GET", "admin/courses", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.courses.findMany();
  const out: CourseAdminRow[] = [];
  for (const row of rows) {
    const creator = await db.query.users.findFirst({ where: eq(users.id, row.creatorId) });
    const paid = await db.query.orders.findMany({
      where: and(eq(orders.courseId, row.id), eq(orders.status, "paid")),
    });
    out.push({
      id: row.id,
      title: row.title || "Untitled",
      creatorHandle: creator?.handle ?? "",
      creatorName: creator?.name ?? "—",
      priceInPaise: row.priceInPaise,
      status: row.status as CourseAdminRow["status"],
      enrollmentCount: paid.length,
      grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      flaggedForReview: false,
      updatedAt: row.updatedAt.toISOString(),
    });
  }
  return ok(out.sort((a, b) => b.grossInPaise - a.grossInPaise));
});

route("POST", "admin/courses/:id/moderate", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(
    z.object({ action: z.enum(["publish", "unpublish", "flag", "unflag"]), note: z.string().trim().max(500).default("") }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const course = await db.query.courses.findFirst({ where: eq(courses.id, params.id) });
  if (!course) return fail("not_found", "Course not found.", 404);
  if (parsed.values.action === "publish") {
    if (course.status !== "unpublished") return fail("invalid_state", "Only an unpublished course can be published by moderation.", 409);
    await db.update(courses).set({ status: "published", publishedAt: course.publishedAt ?? new Date(), updatedAt: new Date() }).where(eq(courses.id, course.id));
  } else if (parsed.values.action === "unpublish") {
    if (course.status !== "published") return fail("invalid_state", "Only a published course can be unpublished.", 409);
    await db.update(courses).set({ status: "unpublished", updatedAt: new Date() }).where(eq(courses.id, course.id));
  }
  // flag/unflag have no schema column by design (kept in audit trail only).
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "courses",
    action: `course_${parsed.values.action === "publish" ? "published_by_admin" : parsed.values.action === "unpublish" ? "unpublished_by_admin" : parsed.values.action === "flag" ? "flagged" : "unflagged"}`,
    detail: `${course.title} — ${parsed.values.note || "no note"}. Learner access and financial records untouched.`,
  });
  return ok({ id: course.id });
});

function toAdminOrder(order: typeof orders.$inferSelect, learnerName: string, creatorName: string, creatorId: string): AdminOrderRecord {
  return {
    id: order.id,
    providerRef: order.providerRef ?? "",
    courseId: order.courseId,
    courseTitle: order.courseTitle,
    creatorId,
    creatorName,
    learnerId: order.userId,
    learnerName,
    grossInPaise: order.grossInPaise,
    platformFeeInPaise: order.platformFeeInPaise,
    creatorShareInPaise: order.creatorShareInPaise,
    status: order.status === "paid_reversed" ? "refunded" : (order.status as AdminOrderRecord["status"]),
    commissionStatus: order.status === "paid" ? "accrued" : order.status === "paid_reversed" ? "reversed" : "waived",
    reconciliation: order.status === "paid" ? "settled" : "pending",
    reviewed: order.reviewedAt !== null,
    placedAt: order.placedAt.toISOString(),
    demo: false,
  };
}

route("GET", "admin/orders", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const orderRows = await db.query.orders.findMany({ orderBy: [desc(orders.placedAt)] });
  const out: AdminOrderRecord[] = [];
  for (const order of orderRows) {
    const learner = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
    const course = await db.query.courses.findFirst({ where: eq(courses.id, order.courseId) });
    const creator = course ? await db.query.users.findFirst({ where: eq(users.id, course.creatorId) }) : null;
    out.push(toAdminOrder(order, learner?.name ?? "—", creator?.name ?? "—", course?.creatorId ?? ""));
  }
  return ok(out);
});

route("POST", "admin/orders/:id/review", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(z.object({ note: z.string().trim().max(300).default("") }), await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const order = await db.query.orders.findFirst({ where: eq(orders.id, params.id) });
  if (!order) return fail("not_found", "Order not found.", 404);
  await db.update(orders).set({ reviewedAt: new Date() }).where(eq(orders.id, order.id));
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "orders",
    action: "order_reviewed",
    detail: `${order.id} reviewed (${parsed.values.note || "no note"}). Reconciliation state unchanged.`,
  });
  const learner = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
  const course = await db.query.courses.findFirst({ where: eq(courses.id, order.courseId) });
  const creator = course ? await db.query.users.findFirst({ where: eq(users.id, course.creatorId) }) : null;
  const fresh = await db.query.orders.findFirst({ where: eq(orders.id, order.id) });
  return ok(toAdminOrder(fresh!, learner?.name ?? "—", creator?.name ?? "—", course?.creatorId ?? ""));
});

route("GET", "admin/payments", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.payments.findMany({ orderBy: [desc(payments.createdAt)], limit: 100 });
  const out: PaymentEvent[] = [];
  for (const row of rows) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, row.orderId) });
    const learner = order ? await db.query.users.findFirst({ where: eq(users.id, order.userId) }) : null;
    out.push({
      id: row.id,
      orderId: row.orderId,
      learnerName: learner?.name ?? "—",
      amountInPaise: order?.grossInPaise ?? 0,
      method: (row.method as PaymentEvent["method"]) ?? "card",
      status: row.status === "captured" ? "succeeded" : row.status === "failed" ? "failed" : "pending",
      failureReason: row.failureReason,
      providerRef: row.providerPaymentId ?? "",
      at: row.createdAt.toISOString(),
    });
  }
  return ok(out);
});

route("GET", "admin/commission-ledger", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.commissionLedger.findMany({ orderBy: [desc(commissionLedger.recordedAt)] });
  const out: LedgerEntry[] = [];
  for (const row of rows) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, row.orderId) });
    const creator = await db.query.users.findFirst({ where: eq(users.id, row.creatorId) });
    out.push({
      id: row.id,
      orderId: row.orderId,
      courseTitle: order?.courseTitle ?? "—",
      creatorId: row.creatorId,
      creatorName: creator?.name ?? "—",
      grossInPaise: row.grossInPaise,
      platformFeeInPaise: row.commissionInPaise,
      gatewayCostInPaise: row.gatewayCostInPaise ?? 0,
      creatorShareInPaise: row.creatorShareInPaise,
      commissionStatus: row.status as LedgerEntry["commissionStatus"],
      recordedAt: row.recordedAt.toISOString(),
    });
  }
  return ok(out);
});

route("GET", "admin/earnings", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const creators = await db.query.users.findMany();
  const out: CreatorEarningsRow[] = [];
  for (const creator of creators) {
    const stats = await earningsFor(creator.id);
    if (stats.grossInPaise === 0 && stats.outstandingInPaise === 0) continue;
    out.push({ ...stats, creatorName: creator.name, handle: creator.handle ?? "" });
  }
  return ok(out.sort((a, b) => b.outstandingInPaise - a.outstandingInPaise));
});

route("GET", "admin/earnings/:id", async (_req, ctx, params) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const creator = await db.query.users.findFirst({ where: eq(users.id, params.id) });
  if (!creator) return fail("not_found", "Creator not found.", 404);
  const stats = await earningsFor(creator.id);
  const ledgerRows = await db.query.commissionLedger.findMany({ where: eq(commissionLedger.creatorId, creator.id) });
  const payoutRows = await db.query.payouts.findMany({ where: eq(payouts.creatorId, creator.id) });
  const ledger: LedgerEntry[] = [];
  for (const row of ledgerRows) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, row.orderId) });
    ledger.push({
      id: row.id,
      orderId: row.orderId,
      courseTitle: order?.courseTitle ?? "—",
      creatorId: row.creatorId,
      creatorName: creator.name,
      grossInPaise: row.grossInPaise,
      platformFeeInPaise: row.commissionInPaise,
      gatewayCostInPaise: row.gatewayCostInPaise ?? 0,
      creatorShareInPaise: row.creatorShareInPaise,
      commissionStatus: row.status as LedgerEntry["commissionStatus"],
      recordedAt: row.recordedAt.toISOString(),
    });
  }
  const summary: CreatorEarningsRow = { ...stats, creatorName: creator.name, handle: creator.handle ?? "" };
  return ok({ summary, ledger, payouts: payoutRows.map((row) => toPayout(row, creator.name, [])) });
});

route("GET", "admin/payouts", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.payouts.findMany({ orderBy: [desc(payouts.createdAt)] });
  const out: PayoutRecordAdmin[] = [];
  for (const row of rows) {
    const creator = await db.query.users.findFirst({ where: eq(users.id, row.creatorId) });
    const history = await db.query.payoutEvents.findMany({
      where: eq(payoutEvents.payoutId, row.id),
      orderBy: [desc(payoutEvents.at)],
    });
    out.push(
      toPayout(
        { ...row, handle: creator?.handle ?? "" } as typeof payouts.$inferSelect,
        creator?.name ?? "—",
        history.map((event) => ({
          id: event.id,
          at: event.at.toISOString(),
          actor: event.actor,
          area: "payouts" as const,
          action: event.action,
          detail: event.detail,
          kind: "action" as const,
        })),
      ),
    );
  }
  return ok(out);
});

async function readPlatformFlags(): Promise<PaymentFeatureFlags> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, "flags") });
  const value = (row?.value ?? {}) as Partial<PaymentFeatureFlags>;
  return {
    razorpayConnection: collectionsAllowed ? "connected" : "pending_provider_approval",
    manualPayoutRecording: value.manualPayoutRecording ?? true,
    maintenanceMode: value.maintenanceMode ?? false,
    learnerSignups: value.learnerSignups ?? true,
  };
}

route("POST", "admin/payouts", async (req, ctx) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const flags = await readPlatformFlags();
  if (!flags.manualPayoutRecording) {
    return fail("feature_disabled", "Manual payout recording is currently disabled in Platform Settings.", 403);
  }
  const parsed = parseBody(
    z.object({ creatorId: z.string().min(1), amountInPaise: z.number().int().positive() }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const creator = await db.query.users.findFirst({ where: eq(users.id, parsed.values.creatorId) });
  if (!creator) return fail("not_found", "Creator not found.", 404);
  if (creator.suspendedAt) return fail("creator_suspended", "Payouts can't be created for a suspended creator.", 400);
  const stats = await earningsFor(creator.id);
  if (parsed.values.amountInPaise > stats.outstandingInPaise) {
    return fail("invalid_amount", `Amount exceeds the outstanding balance (${(stats.outstandingInPaise / 100).toLocaleString("en-IN")} ₹).`, 422);
  }
  const payout = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(payouts)
      .values({
        id: newId("pay"),
        creatorId: creator.id,
        amountInPaise: parsed.values.amountInPaise,
        status: "pending",
        beneficiaryMasked: "on file (masked)",
        note: "Awaiting transfer + UTR entry.",
        createdBy: me.id,
      })
      .returning();
    await tx.insert(payoutEvents).values({
      id: newId("peh"),
      payoutId: created.id,
      action: "payout_created",
      actor: me.name,
      detail: `Payout record created for ${creator.name} (₹${(parsed.values.amountInPaise / 100).toLocaleString("en-IN")}).`,
    });
    return created;
  });
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "payouts",
    action: "payout_created",
    detail: `Payout record ${payout.id} created for ${creator.name} (₹${(parsed.values.amountInPaise / 100).toLocaleString("en-IN")}).`,
  });
  return ok(toPayout(payout, creator.name, []), { status: 201 });
});

route("POST", "admin/payouts/:id/record", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const flags = await readPlatformFlags();
  if (!flags.manualPayoutRecording) {
    return fail("feature_disabled", "Manual payout recording is currently disabled in Platform Settings.", 403);
  }
  if (!payoutRecordingAllowed) {
    return fail(
      "arrangement_not_approved",
      "Recording manual transfers is disabled until the payment-provider arrangement is approved (PAYMENTS_LIVE_ENABLED). Sandbox/development environments may test it.",
      503,
    );
  }
  const parsed = parseBody(
    z.object({
      transferRef: z.string().trim().min(6, "Enter the actual bank / UTR reference (at least 6 characters).").max(80),
      transferDate: z.string().min(8, "Enter a valid transfer date."),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const { transferRef, transferDate } = parsed.values;
  const parsedDate = Date.parse(transferDate);
  if (Number.isNaN(parsedDate) || parsedDate > Date.now() + 86_400_000) {
    return fail("validation_failed", "Enter a valid transfer date (not in the future).", 422, { transferDate: ["Not a valid date."] });
  }

  // Transactional double-pay prevention: re-check status + balance under lock.
  const result = await db.transaction(async (tx) => {
    const current = await tx.query.payouts.findFirst({ where: eq(payouts.id, params.id) });
    if (!current) return { error: fail("not_found", "Payout record not found.", 404) };
    if (current.status !== "pending" && current.status !== "approved") {
      return { error: fail("invalid_state", `A ${current.status} payout can't be recorded — only pending records accept a transfer reference.`, 409) };
    }
    const ledgerRows = await tx.query.commissionLedger.findMany({
      where: and(eq(commissionLedger.creatorId, current.creatorId), eq(commissionLedger.status, "accrued")),
    });
    const payable = ledgerRows.reduce((sum, row) => sum + row.creatorShareInPaise, 0);
    const recordedRows = await tx.query.payouts.findMany({
      where: and(eq(payouts.creatorId, current.creatorId), eq(payouts.status, "recorded")),
    });
    const alreadyPaid = recordedRows.reduce((sum, row) => sum + row.amountInPaise, 0);
    const outstanding = payable - alreadyPaid;
    if (current.amountInPaise > outstanding) {
      return { error: fail("insufficient_balance", `Outstanding balance (${outstanding}) no longer covers this payout. Refresh and reconsider.`, 409) };
    }
    const dup = await tx.query.payouts.findFirst({ where: eq(payouts.transferRef, transferRef) });
    if (dup) return { error: fail("duplicate_transfer_ref", "That transfer reference is already recorded against another payout.", 409) };
    // Optimistic-concurrency guarded update.
    const updated = await tx
      .update(payouts)
      .set({
        status: "recorded",
        transferRef,
        transferDate,
        recordedBy: me.id,
        recordedAt: new Date(),
        updatedAt: new Date(),
        version: current.version + 1,
        note: "Recorded under the manual payment arrangement.",
      })
      .where(and(eq(payouts.id, current.id), eq(payouts.version, current.version), inArray(payouts.status, ["pending", "approved"])))
      .returning();
    if (updated.length === 0) {
      return { error: fail("concurrent_modification", "Another administrator changed this payout just now. Reload and review.", 409) };
    }
    await tx.insert(payoutEvents).values({
      id: newId("peh"),
      payoutId: current.id,
      action: "payout_recorded",
      actor: me.name,
      detail: `Marked recorded with ${transferRef} dated ${transferDate}.`,
    });
    return { payout: updated[0] };
  });
  if ("error" in result) return result.error;

  const creator = await db.query.users.findFirst({ where: eq(users.id, result.payout.creatorId) });
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "payouts",
    action: "payout_recorded",
    detail: `Payout ${result.payout.id} recorded for ${creator?.name ?? "?"} (${(result.payout.amountInPaise / 100).toLocaleString("en-IN")} ₹) with ref ${transferRef}.`,
  });
  if (creator) {
    await notifyInApp({
      userId: creator.id,
      template: "payout_recorded",
      title: "Payout recorded",
      body: `A payout of ₹${(result.payout.amountInPaise / 100).toLocaleString("en-IN")} was recorded (${transferRef}).`,
      dedupeKey: `payout_notice:${result.payout.id}`,
    });
    await queueEmail({
      userId: creator.id,
      to: creator.email,
      subject: "Your CourseKit payout was recorded",
      template: "payout_status_email",
      dedupeKey: `payout_email:${result.payout.id}`,
      html: emailShell(
        "Payout recorded",
        `<p>A manual payout of <b>₹${(result.payout.amountInPaise / 100).toLocaleString("en-IN")}</b> was recorded with reference <b>${transferRef}</b> dated ${transferDate}.</p>`,
      ),
      text: `Payout recorded: ₹${(result.payout.amountInPaise / 100).toLocaleString("en-IN")} ref ${transferRef}.`,
    });
  }
  const history = await db.query.payoutEvents.findMany({ where: eq(payoutEvents.payoutId, result.payout.id) });
  return ok(
    toPayout(
      result.payout,
      creator?.name ?? "—",
      history.map((event) => ({
        id: event.id,
        at: event.at.toISOString(),
        actor: event.actor,
        area: "payouts" as const,
        action: event.action,
        detail: event.detail,
        kind: "action" as const,
      })),
    ),
  );
});

route("POST", "admin/payouts/:id/status", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(
    z.object({ status: z.enum(["failed", "cancelled", "approved"]), note: z.string().trim().min(1, "Add a short note for the audit log.").max(500) }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const current = await db.query.payouts.findFirst({ where: eq(payouts.id, params.id) });
  if (!current) return fail("not_found", "Payout record not found.", 404);
  const next = parsed.values.status;
  if (next === "cancelled" && current.status !== "pending") return fail("invalid_state", "Only a pending payout can be cancelled.", 409);
  if (next === "failed" && current.status === "cancelled") return fail("invalid_state", "A cancelled payout can't be marked failed.", 409);
  if (next === "approved" && current.status !== "pending") return fail("invalid_state", "Only a pending payout can be approved.", 409);
  const [updated] = await db
    .update(payouts)
    .set({ status: next, updatedAt: new Date(), version: current.version + 1, note: parsed.values.note })
    .where(eq(payouts.id, current.id))
    .returning();
  await db.insert(payoutEvents).values({
    id: newId("peh"),
    payoutId: current.id,
    action: `payout_${next}`,
    actor: me.name,
    detail: parsed.values.note,
  });
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "payouts",
    action: `payout_${next}`,
    detail: `Payout ${current.id} marked ${next}: ${parsed.values.note}`,
  });
  const creator = await db.query.users.findFirst({ where: eq(users.id, current.creatorId) });
  const history = await db.query.payoutEvents.findMany({ where: eq(payoutEvents.payoutId, current.id) });
  return ok(
    toPayout(
      updated,
      creator?.name ?? "—",
      history.map((event) => ({
        id: event.id,
        at: event.at.toISOString(),
        actor: event.actor,
        area: "payouts" as const,
        action: event.action,
        detail: event.detail,
        kind: "action" as const,
      })),
    ),
  );
});

function toDispute(row: typeof disputes.$inferSelect, notes: { id: string; at: string; actor: string; note: string }[], extras: { learnerName: string; creatorName: string; courseTitle: string }): DisputeRecord {
  return {
    id: row.id,
    type: row.type as DisputeRecord["type"],
    status: row.status as DisputeRecord["status"],
    orderId: row.orderId,
    courseTitle: extras.courseTitle,
    learnerName: extras.learnerName,
    creatorName: extras.creatorName,
    amountInPaise: row.amountInPaise,
    openedAt: row.createdAt.toISOString(),
    summary: row.summary,
    notes,
  };
}

route("GET", "admin/disputes", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.disputes.findMany({ orderBy: [desc(disputes.createdAt)] });
  const out: DisputeRecord[] = [];
  for (const row of rows) {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, row.orderId) });
    const learner = order ? await db.query.users.findFirst({ where: eq(users.id, order.userId) }) : null;
    const course = order ? await db.query.courses.findFirst({ where: eq(courses.id, order.courseId) }) : null;
    const creator = course ? await db.query.users.findFirst({ where: eq(users.id, course.creatorId) }) : null;
    const notes = await db.query.disputeNotes.findMany({ where: eq(disputeNotes.disputeId, row.id) });
    out.push(
      toDispute(
        row,
        notes.map((note) => ({ id: note.id, at: note.at.toISOString(), actor: note.actorLabel, note: note.note })),
        { learnerName: learner?.name ?? "—", creatorName: creator?.name ?? "—", courseTitle: order?.courseTitle ?? "—" },
      ),
    );
  }
  return ok(out);
});

route("POST", "admin/disputes/:id/status", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(z.object({ status: z.enum(["open", "under_review", "resolved"]) }), await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const [updated] = await db
    .update(disputes)
    .set({ status: parsed.values.status, updatedAt: new Date() })
    .where(eq(disputes.id, params.id))
    .returning();
  if (!updated) return fail("not_found", "Dispute not found.", 404);
  await db.insert(disputeNotes).values({
    id: newId("dn"),
    disputeId: params.id,
    actorLabel: me.name,
    note: `Status changed to ${parsed.values.status.replace("_", " ")}.`,
  });
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "disputes",
    action: "dispute_status",
    detail: `${params.id} moved to ${parsed.values.status}.`,
  });
  return ok({ id: updated.id, status: updated.status });
});

route("POST", "admin/disputes/:id/notes", async (req, ctx, params) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(z.object({ note: z.string().trim().min(1, "Write the note first.").max(2000) }), await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const dispute = await db.query.disputes.findFirst({ where: eq(disputes.id, params.id) });
  if (!dispute) return fail("not_found", "Dispute not found.", 404);
  const [note] = await db
    .insert(disputeNotes)
    .values({ id: newId("dn"), disputeId: params.id, actorLabel: me.name, note: parsed.values.note })
    .returning();
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "disputes",
    action: "dispute_note",
    detail: `Note added to ${params.id} (${dispute.type}).`,
  });
  return ok({ id: note.id });
});

route("GET", "admin/settings", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  return ok(await readPlatformFlags());
});

route("PATCH", "admin/settings", async (req, ctx) => {
  const me = admin(ctx);
  if (!me) return fail("admin_required", "Administrator access required.", 403);
  const parsed = parseBody(
    z.object({
      manualPayoutRecording: z.boolean().optional(),
      maintenanceMode: z.boolean().optional(),
      learnerSignups: z.boolean().optional(),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const existing = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, "flags") });
  const merged = { ...(existing?.value ?? {}), ...parsed.values };
  await db
    .insert(platformSettings)
    .values({ key: "flags", value: merged })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: merged } });
  await audit({
    actorId: me.id,
    actorLabel: me.name,
    area: "settings",
    action: "flags_updated",
    detail: `Flags updated: ${Object.keys(parsed.values).join(", ")}.`,
  });
  return ok(await readPlatformFlags());
});

route("GET", "admin/audit-logs", async (_req, ctx) => {
  if (!admin(ctx)) return fail("admin_required", "Administrator access required.", 403);
  const rows = await db.query.auditLogs.findMany({ orderBy: [desc(auditLogs.createdAt)], limit: 200 });
  return ok(rows.map(toAudit));
});

route("GET", "admin/grant", async () => fail("forbidden", "Admin provisioning happens via the secure server-side script only.", 403));
