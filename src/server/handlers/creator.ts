import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  commissionLedger,
  courses,
  enrollments,
  notifications,
  orders,
  sections,
  lessons,
  supportTickets,
  users,
} from "@/db/schema";
import { route } from "@/server/router";
import { fail, ok, parseBody, requireUser, requireVerifiedUser } from "@/server/http";
import { newId } from "@/server/auth";
import type { CreatorProfile } from "@/lib/creator-types";
import type { AnalyticsData, DashboardData } from "@/lib/services/creator-data";
import type { CourseStatus, CreatorNotification, SupportTicket } from "@/lib/creator-types";
import { APP_BASE_URL } from "@/server/env";

/** Creator profile + business data views (self-scoped, server-verified). */

function profileOf(user: {
  id: string;
  name: string;
  email: string;
  handle: string | null;
  tagline: string;
  avatarUrl: string | null;
  niche: string;
  links: { label: string; url: string }[];
}): CreatorProfile {
  return {
    handle: user.handle ?? "",
    displayName: user.name,
    tagline: user.tagline,
    avatarUrl: user.avatarUrl ?? "/images/avatars/meera.jpg",
    niche: user.niche,
    links: user.links,
    publicUrl: user.handle ? `${APP_BASE_URL}/@${user.handle}` : "",
  };
}

route("GET", "creator/profile", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  return ok(profileOf(auth as NonNullable<typeof ctx.user>));
});

const profilePatchSchema = z.object({
  handle: z.string().regex(/^[a-z0-9-]{3,30}$/, "3–30 characters, lowercase letters, numbers, hyphens.").optional(),
  displayName: z.string().trim().min(2).max(80).optional(),
  tagline: z.string().trim().max(140).optional(),
  niche: z.string().trim().max(40).optional(),
  links: z.array(z.object({ label: z.string().trim().min(1).max(30), url: z.string().url().max(300) })).max(6).optional(),
});

route("PATCH", "creator/profile", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if ("code" in (user as object)) return user as never;
  const parsed = parseBody(profilePatchSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const me = user as NonNullable<typeof ctx.user>;
  if (parsed.values.handle) {
    const handle = parsed.values.handle.toLowerCase();
    const reserved = ["admin", "support", "coursekit", "help", "pricing", "api", "learn", "creator", "login", "signup"];
    if (reserved.includes(handle)) {
      return fail("handle_taken", `“${handle}” isn't available. Try another handle.`, 409, { handle: ["This handle is taken."] });
    }
    const taken = await db.query.users.findFirst({ where: and(eq(users.handle, handle)) });
    if (taken && taken.id !== me.id) {
      return fail("handle_taken", `“${handle}” isn't available. Try another handle.`, 409, { handle: ["This handle is taken."] });
    }
    await db.update(users).set({ handle, updatedAt: new Date() }).where(eq(users.id, me.id));
  }
  await db
    .update(users)
    .set({
      ...(parsed.values.displayName !== undefined ? { name: parsed.values.displayName } : {}),
      ...(parsed.values.tagline !== undefined ? { tagline: parsed.values.tagline } : {}),
      ...(parsed.values.niche !== undefined ? { niche: parsed.values.niche } : {}),
      ...(parsed.values.links !== undefined ? { links: parsed.values.links } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id));
  const fresh = await db.query.users.findFirst({ where: eq(users.id, me.id) });
  return ok(profileOf(fresh!));
});

route("GET", "creator/username-check", async (req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const me = auth as NonNullable<typeof ctx.user>;
  const handle = (new URL(req.url).searchParams.get("handle") ?? "").toLowerCase();
  if (!/^[a-z0-9-]{3,30}$/.test(handle)) return ok({ available: false, reason: "invalid" });
  const taken = await db.query.users.findFirst({ where: eq(users.handle, handle) });
  return ok({ available: !taken || taken.id === me.id });
});

async function myCourseIds(userId: string): Promise<string[]> {
  const rows = await db.query.courses.findMany({ where: eq(courses.creatorId, userId) });
  return rows.map((row) => row.id);
}

async function creatorFinance(courseIds: string[]) {
  if (courseIds.length === 0) {
    return { paidOrders: [], gross: 0, fees: 0 };
  }
  const paidOrders = await db.query.orders.findMany({
    where: and(inArray(orders.courseId, courseIds), eq(orders.status, "paid")),
    orderBy: [sql`${orders.placedAt} DESC`],
  });
  return {
    paidOrders,
    gross: paidOrders.reduce((sum, order) => sum + order.grossInPaise, 0),
    fees: paidOrders.reduce((sum, order) => sum + order.platformFeeInPaise, 0),
  };
}

route("GET", "creator/dashboard", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  const courseIds = await myCourseIds(user.id);
  const finance = await creatorFinance(courseIds);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPaid = finance.paidOrders.filter((order) => order.placedAt >= cutoff);
  const learnerRows = courseIds.length
    ? await db.query.enrollments.findMany({ where: inArray(enrollments.courseId, courseIds) })
    : [];
  const payoutRows = await db.query.commissionLedger.findMany({
    where: and(eq(commissionLedger.creatorId, user.id), eq(commissionLedger.status, "accrued")),
  });
  const { payoutsTotal, payoutList } = await creatorPayoutTotals(user.id);
  const share = payoutRows.reduce((sum, entry) => sum + entry.creatorShareInPaise, 0);
  const paidCourses = await db.query.courses.findMany({ where: eq(courses.creatorId, user.id) });
  const notificationRows = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, user.id), eq(notifications.channel, "in_app")),
    orderBy: [sql`${notifications.createdAt} DESC`],
  });
  const data: DashboardData = {
    overview: {
      grossLast30dInPaise: recentPaid.reduce((sum, order) => sum + order.grossInPaise, 0),
      ordersLast30d: recentPaid.length,
      enrollmentsLast30d: recentPaid.length,
      publishedCourses: paidCourses.filter((row) => row.status === "published").length,
      draftCourses: paidCourses.filter((row) => row.status === "draft").length,
    },
    earnings: {
      grossInPaise: finance.gross,
      platformFeesInPaise: finance.fees,
      creatorShareInPaise: share,
      availableInPaise: Math.max(0, share - payoutsTotal),
      paidOutInPaise: payoutsTotal,
    },
    recentOrders: finance.paidOrders.slice(0, 5).map((order) => ({
      id: order.id,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      buyerName: "—",
      buyerEmail: "—",
      grossInPaise: order.grossInPaise,
      platformFeeInPaise: order.platformFeeInPaise,
      creatorShareInPaise: order.creatorShareInPaise,
      status: "paid" as const,
      placedAt: order.placedAt.toISOString(),
      demo: false,
    })),
    performance: [],
    notifications: notificationRows.slice(0, 10).map((row) => toNotification(row)),
    profile: profileOf(user),
  };
  data.performance = await coursePerformance(courseIds);
  void learnerRows;
  void payoutList;
  return ok(data);
});

async function coursePerformance(courseIds: string[]) {
  if (courseIds.length === 0) return [];
  const perCourse: {
    courseId: string;
    title: string;
    status: CourseStatus;
    sales: number;
    enrollments: number;
    grossInPaise: number;
    shareInPaise: number;
  }[] = [];
  for (const courseId of courseIds) {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
    const paid = await db.query.orders.findMany({
      where: and(eq(orders.courseId, courseId), eq(orders.status, "paid")),
    });
    perCourse.push({
      courseId,
      title: course?.title ?? "Untitled",
      status: (course?.status ?? "draft") as CourseStatus,
      sales: paid.length,
      enrollments: paid.length,
      grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      shareInPaise: paid.reduce((sum, order) => sum + order.creatorShareInPaise, 0),
    });
  }
  return perCourse.sort((a, b) => b.grossInPaise - a.grossInPaise);
}

async function creatorPayoutTotals(creatorId: string) {
  const rows = await db.query.commissionLedger.findMany({
    where: eq(commissionLedger.creatorId, creatorId),
  });
  void rows;
  const { payouts } = await import("@/db/schema");
  const payoutRows = await db.query.payouts.findMany({
    where: and(eq(payouts.creatorId, creatorId), eq(payouts.status, "recorded")),
  });
  const payoutsTotal = payoutRows.reduce((sum, payout) => sum + payout.amountInPaise, 0);
  return { payoutsTotal, payoutList: payoutRows };
}

route("GET", "creator/analytics", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  const courseIds = await myCourseIds(user.id);
  const finance = await creatorFinance(courseIds);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPaid = finance.paidOrders.filter((order) => order.placedAt >= cutoff);
  // 8 weekly buckets
  const now = Date.now();
  const salesSeries = [] as { label: string; grossInPaise: number; orders: number }[];
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
    const end = w === 0 ? now + 1 : start + 7 * 24 * 60 * 60 * 1000;
    const bucket = finance.paidOrders.filter((order) => order.placedAt.getTime() >= start && order.placedAt.getTime() < end);
    salesSeries.push({
      label: new Date(end).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      grossInPaise: bucket.reduce((sum, order) => sum + order.grossInPaise, 0),
      orders: bucket.length,
    });
  }
  const data: AnalyticsData = {
    overview: {
      grossLast30dInPaise: recentPaid.reduce((sum, order) => sum + order.grossInPaise, 0),
      ordersLast30d: recentPaid.length,
      enrollmentsLast30d: recentPaid.length,
      publishedCourses: 0,
      draftCourses: 0,
    },
    salesSeries,
    enrollmentSeries: salesSeries.map((point) => ({ label: point.label, enrollments: point.orders })),
    performance: await coursePerformance(courseIds),
  };
  return ok(data);
});

route("GET", "creator/students", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  const courseIds = await myCourseIds(user.id);
  if (courseIds.length === 0) return ok([]);
  const rows = await db
    .select({ enrollment: enrollments, course: courses, learner: users })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(inArray(enrollments.courseId, courseIds))
    .orderBy(sql`${enrollments.createdAt} DESC`);
  return ok(
    rows.map((row) => ({
      id: row.enrollment.id,
      fullName: row.learner.name,
      email: row.learner.email,
      courseId: row.course.id,
      courseTitle: row.course.title,
      enrolledAt: row.enrollment.createdAt.toISOString(),
      status: "active" as const,
    })),
  );
});

route("GET", "creator/orders", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  const courseIds = await myCourseIds(user.id);
  if (courseIds.length === 0) return ok([]);
  const rows = await db
    .select({ order: orders, learner: users, course: courses })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(courses, eq(courses.id, orders.courseId))
    .where(and(inArray(orders.courseId, courseIds), eq(orders.status, "paid")))
    .orderBy(sql`${orders.placedAt} DESC`);
  return ok(
    rows.map((row) => ({
      id: row.order.id,
      courseId: row.course.id,
      courseTitle: row.course.title,
      buyerName: row.learner.name,
      buyerEmail: row.learner.email,
      grossInPaise: row.order.grossInPaise,
      platformFeeInPaise: row.order.platformFeeInPaise,
      creatorShareInPaise: row.order.creatorShareInPaise,
      status: "paid" as const,
      placedAt: row.order.placedAt.toISOString(),
      demo: false,
    })),
  );
});

route("GET", "creator/earnings", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  const ledgerRows = await db.query.commissionLedger.findMany({
    where: and(eq(commissionLedger.creatorId, user.id), eq(commissionLedger.status, "accrued")),
  });
  const gross = ledgerRows.reduce((sum, entry) => sum + entry.grossInPaise, 0);
  const fees = ledgerRows.reduce((sum, entry) => sum + entry.commissionInPaise, 0);
  const share = ledgerRows.reduce((sum, entry) => sum + entry.creatorShareInPaise, 0);
  const { payoutsTotal, payoutList } = await creatorPayoutTotals(user.id);
  return ok({
    summary: {
      grossInPaise: gross,
      platformFeesInPaise: fees,
      creatorShareInPaise: share,
      availableInPaise: Math.max(0, share - payoutsTotal),
      paidOutInPaise: payoutsTotal,
    },
    payouts: payoutList.map((payout) => ({
      id: payout.id,
      amountInPaise: payout.amountInPaise,
      reference: payout.transferRef ?? "",
      status: "recorded" as const,
      recordedAt: (payout.recordedAt ?? payout.createdAt).toISOString(),
      note: payout.note,
    })),
  });
});

function toNotification(row: typeof notifications.$inferSelect): CreatorNotification {
  const payload = row.payload as { title?: string; body?: string };
  return {
    id: row.id,
    kind: row.template.startsWith("payout") ? "payout" : row.template.startsWith("sale") || row.template.startsWith("enrollment") ? "enrollment" : "system",
    title: payload.title ?? row.template,
    body: payload.body ?? "",
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
  };
}

route("GET", "creator/notifications", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  const rows = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, user.id), eq(notifications.channel, "in_app")),
    orderBy: [sql`${notifications.createdAt} DESC`],
  });
  return ok(rows.slice(0, 25).map(toNotification));
});

route("POST", "creator/notifications/read-all", async (_req, ctx) => {
  const auth = requireUser(ctx);
  if ("code" in (auth as object)) return auth as never;
  const user = auth as NonNullable<typeof ctx.user>;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), sql`${notifications.readAt} IS NULL`));
  return ok(undefined);
});

route("POST", "support/tickets", async (req, ctx) => {
  const parsed = parseBody(
    z.object({
      category: z.string().trim().min(1).max(80),
      subject: z.string().trim().min(1).max(120),
      body: z.string().trim().min(20).max(4000),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const author = ctx.user;
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      id: newId("tkt"),
      userId: author?.id ?? null,
      category: parsed.values.category,
      subject: parsed.values.subject,
      body: parsed.values.body,
      authorLabel: author ? `${author.name} <${author.email}>` : "anonymous visitor",
    })
    .returning();
  const out: SupportTicket = {
    id: ticket.id,
    category: ticket.category,
    subject: ticket.subject,
    body: ticket.body,
    createdAt: ticket.createdAt.toISOString(),
    status: "open",
  };
  return ok(out, { status: 201 });
});

void sections;
void lessons;
