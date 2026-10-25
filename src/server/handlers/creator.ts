import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  commissionLedger,
  courses,
  enrollments,
  mediaAssets,
  notifications,
  orders,
  payouts,
  supportTickets,
  users,
} from "@/db/schema";
import { route } from "@/server/router";
import { fail, ok, parseBody, requireCreatorUser, requireVerifiedCreatorUser } from "@/server/http";
import { newId } from "@/server/auth";
import type { CreatorProfile, CreatorSettings, PayoutDetails } from "@/lib/creator-types";
import type { AnalyticsData, DashboardData } from "@/lib/services/creator-data";
import type { CourseStatus, CreatorNotification, SupportTicket } from "@/lib/creator-types";
import { APP_BASE_URL, resolveRequestBaseUrl } from "@/server/env";
import { RESERVED_HANDLES, suggestHandle } from "@/server/handles";
import {
  cleanupMediaAssets,
  mediaAccessPath,
  mediaAssetIdFromAccessUrl,
} from "@/server/media-cleanup";

/** Creator profile + business data views (self-scoped, server-verified). */

/**
 * Legacy rows may still point at the bundled demo portraits that older builds
 * used as a "default avatar". Those must never be shown as somebody's face —
 * treat them as "no photo" so the UI falls back to the user icon.
 */
const LEGACY_DEFAULT_AVATARS = new Set([
  "/images/avatars/meera.jpg",
  "/images/avatars/ayaan.jpg",
  "/images/avatars/diya.jpg",
]);

function realAvatarUrl(value: string | null): string | null {
  if (!value) return null;
  if (LEGACY_DEFAULT_AVATARS.has(value)) return null;
  return value;
}

function profileOf(
  user: {
    id: string;
    name: string;
    email: string;
    handle: string | null;
    tagline: string;
    avatarUrl: string | null;
    niche: string;
    links: { label: string; url: string }[];
  },
  baseUrl: string = APP_BASE_URL,
): CreatorProfile {
  return {
    handle: user.handle ?? "",
    displayName: user.name,
    tagline: user.tagline,
    avatarUrl: realAvatarUrl(user.avatarUrl),
    niche: user.niche,
    links: user.links,
    // The URL is built from the host that actually served the request, so the
    // shareable storefront link is always the live site.
    publicUrl: user.handle ? `${baseUrl}/@${user.handle}` : "",
  };
}

route("GET", "creator/profile", async (req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  const baseUrl = resolveRequestBaseUrl(req);
  if (!user.handle) {
    // Never leave a creator without a live storefront address.
    const handle = await suggestHandle(user.name, user.email);
    await db.update(users).set({ handle, updatedAt: new Date() }).where(eq(users.id, user.id));
    return ok(profileOf({ ...user, handle }, baseUrl));
  }
  return ok(profileOf(user, baseUrl));
});

const profilePatchSchema = z.object({
  avatarAssetId: z.string().min(1).nullable().optional(),
  handle: z
    .string()
    .regex(/^[a-z0-9-]{3,30}$/, "3–30 characters, lowercase letters, numbers, hyphens.")
    .optional(),
  displayName: z.string().trim().min(2).max(80).optional(),
  tagline: z.string().trim().max(140).optional(),
  niche: z.string().trim().max(40).optional(),
  links: z
    .array(z.object({ label: z.string().trim().min(1).max(30), url: z.string().url().max(300) }))
    .max(6)
    .optional(),
});

route("PATCH", "creator/profile", async (req, ctx) => {
  const me = requireVerifiedCreatorUser(ctx);
  if (me instanceof Response) return me;
  const parsed = parseBody(profilePatchSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;

  let nextAvatarUrl: string | null | undefined;
  if (parsed.values.avatarAssetId === null) {
    nextAvatarUrl = null;
  } else if (parsed.values.avatarAssetId !== undefined) {
    const asset = await db.query.mediaAssets.findFirst({
      where: and(
        eq(mediaAssets.id, parsed.values.avatarAssetId),
        eq(mediaAssets.uploaderId, me.id),
        eq(mediaAssets.status, "verified"),
        eq(mediaAssets.kind, "avatar"),
      ),
    });
    if (!asset) {
      return fail("validation_failed", "That photo isn't a verified upload yet.", 422, {
        avatar: ["Upload the photo again."],
      });
    }
    nextAvatarUrl = mediaAccessPath(asset.id);
  }

  if (parsed.values.handle) {
    const handle = parsed.values.handle.toLowerCase();
    if (RESERVED_HANDLES.has(handle)) {
      return fail("handle_taken", `“${handle}” isn't available. Try another handle.`, 409, {
        handle: ["This handle is taken."],
      });
    }
    const taken = await db.query.users.findFirst({ where: and(eq(users.handle, handle)) });
    if (taken && taken.id !== me.id) {
      return fail("handle_taken", `“${handle}” isn't available. Try another handle.`, 409, {
        handle: ["This handle is taken."],
      });
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
      ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id));

  const previousAvatarAssetId = mediaAssetIdFromAccessUrl(me.avatarUrl);
  if (
    nextAvatarUrl !== undefined &&
    previousAvatarAssetId &&
    mediaAccessPath(previousAvatarAssetId) !== nextAvatarUrl
  ) {
    const previousAvatar = await db.query.mediaAssets.findFirst({
      where: and(
        eq(mediaAssets.id, previousAvatarAssetId),
        eq(mediaAssets.uploaderId, me.id),
        eq(mediaAssets.kind, "avatar"),
      ),
    });
    if (previousAvatar) await cleanupMediaAssets([previousAvatar]);
  }

  const fresh = await db.query.users.findFirst({ where: eq(users.id, me.id) });
  return ok(profileOf(fresh!, resolveRequestBaseUrl(req)));
});

const payoutDetailsSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => /^\d{9,18}$/.test(value), "Enter a valid bank account number (9–18 digits)."),
  ifsc: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value),
      "Enter a valid IFSC code, e.g. HDFC0001234.",
    ),
});

function payoutDetailsOf(user: {
  payoutAccountNumber: string | null;
  payoutIfsc: string | null;
  payoutDetailsUpdatedAt: Date | null;
}): PayoutDetails {
  return {
    accountNumber: user.payoutAccountNumber ?? "",
    ifsc: user.payoutIfsc ?? "",
    updatedAt: user.payoutDetailsUpdatedAt?.toISOString() ?? null,
  };
}

route("GET", "creator/payout-details", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  return ok(payoutDetailsOf(user));
});

route("PUT", "creator/payout-details", async (req, ctx) => {
  const me = requireVerifiedCreatorUser(ctx);
  if (me instanceof Response) return me;
  const parsed = parseBody(payoutDetailsSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  await db
    .update(users)
    .set({
      payoutAccountNumber: parsed.values.accountNumber,
      payoutIfsc: parsed.values.ifsc,
      payoutDetailsUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id));
  const fresh = await db.query.users.findFirst({ where: eq(users.id, me.id) });
  return ok(payoutDetailsOf(fresh!));
});

function settingsOf(user: {
  email: string;
  notifySaleEmails: boolean;
  notifyWeeklySummary: boolean;
  notifyProductTips: boolean;
}): CreatorSettings {
  return {
    email: user.email,
    notifySaleEmails: user.notifySaleEmails,
    notifyWeeklySummary: user.notifyWeeklySummary,
    notifyProductTips: user.notifyProductTips,
  };
}

route("GET", "creator/settings", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  return ok(settingsOf(user));
});

route("PATCH", "creator/settings", async (req, ctx) => {
  const me = requireCreatorUser(ctx);
  if (me instanceof Response) return me;
  const parsed = parseBody(
    z.object({
      notifySaleEmails: z.boolean().optional(),
      notifyWeeklySummary: z.boolean().optional(),
      notifyProductTips: z.boolean().optional(),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  await db
    .update(users)
    .set({ ...parsed.values, updatedAt: new Date() })
    .where(eq(users.id, me.id));
  const fresh = await db.query.users.findFirst({ where: eq(users.id, me.id) });
  return ok(settingsOf(fresh!));
});

route("GET", "creator/username-check", async (req, ctx) => {
  const me = requireCreatorUser(ctx);
  if (me instanceof Response) return me;
  const handle = (new URL(req.url).searchParams.get("handle") ?? "").toLowerCase();
  if (!/^[a-z0-9-]{3,30}$/.test(handle)) return ok({ available: false, reason: "invalid" });
  if (RESERVED_HANDLES.has(handle)) return ok({ available: false, reason: "reserved" });
  const taken = await db.query.users.findFirst({ where: eq(users.handle, handle) });
  return ok({ available: !taken || taken.id === me.id });
});

async function myCourses(userId: string) {
  return db.query.courses.findMany({ where: eq(courses.creatorId, userId) });
}

async function creatorFinance(courseIds: string[]) {
  if (courseIds.length === 0) {
    return { orders: [], paidOrders: [], gross: 0, fees: 0 };
  }
  const allOrders = await db
    .select({ order: orders, learner: users })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(and(inArray(orders.courseId, courseIds), inArray(orders.status, ["paid", "paid_reversed"])))
    .orderBy(sql`${orders.placedAt} DESC`);
  const paidOrders = allOrders.filter((row) => row.order.status === "paid");
  return {
    orders: allOrders,
    paidOrders,
    gross: paidOrders.reduce((sum, row) => sum + row.order.grossInPaise, 0),
    fees: paidOrders.reduce((sum, row) => sum + row.order.platformFeeInPaise, 0),
  };
}

route("GET", "creator/dashboard", async (req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  const creatorCourses = await myCourses(user.id);
  const courseIds = creatorCourses.map((row) => row.id);
  const finance = await creatorFinance(courseIds);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPaid = finance.paidOrders.filter((row) => row.order.placedAt >= cutoff);
  const payoutRows = await db.query.commissionLedger.findMany({
    where: and(eq(commissionLedger.creatorId, user.id), eq(commissionLedger.status, "accrued")),
  });
  const { payoutsTotal } = await creatorPayoutTotals(user.id);
  const share = payoutRows.reduce((sum, entry) => sum + entry.creatorShareInPaise, 0);
  const notificationRows = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, user.id), eq(notifications.channel, "in_app")),
    orderBy: [sql`${notifications.createdAt} DESC`],
  });
  const data: DashboardData = {
    overview: {
      grossLast30dInPaise: recentPaid.reduce((sum, row) => sum + row.order.grossInPaise, 0),
      ordersLast30d: recentPaid.length,
      enrollmentsLast30d: recentPaid.length,
      publishedCourses: creatorCourses.filter((row) => row.status === "published").length,
      draftCourses: creatorCourses.filter((row) => row.status === "draft").length,
    },
    earnings: {
      grossInPaise: finance.gross,
      platformFeesInPaise: finance.fees,
      creatorShareInPaise: share,
      availableInPaise: Math.max(0, share - payoutsTotal),
      paidOutInPaise: payoutsTotal,
    },
    recentOrders: finance.orders.slice(0, 5).map(({ order, learner }) => ({
      id: order.id,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      buyerName: learner?.name ?? "—",
      buyerEmail: learner?.email ?? "—",
      grossInPaise: order.grossInPaise,
      platformFeeInPaise: order.platformFeeInPaise,
      creatorShareInPaise: order.creatorShareInPaise,
      status: order.status === "paid" ? ("paid" as const) : ("refunded" as const),
      placedAt: order.placedAt.toISOString(),
      demo: false,
    })),
    performance: await coursePerformance(creatorCourses),
    notifications: notificationRows.slice(0, 10).map((row) => toNotification(row)),
    profile: profileOf(user, resolveRequestBaseUrl(req)),
  };
  return ok(data);
});

async function coursePerformance(creatorCourses: (typeof courses.$inferSelect)[]) {
  if (creatorCourses.length === 0) return [];
  const perCourse: {
    courseId: string;
    title: string;
    status: CourseStatus;
    sales: number;
    enrollments: number;
    grossInPaise: number;
    shareInPaise: number;
  }[] = [];
  for (const course of creatorCourses) {
    const paid = await db.query.orders.findMany({
      where: and(eq(orders.courseId, course.id), eq(orders.status, "paid")),
    });
    perCourse.push({
      courseId: course.id,
      title: course.title || "Untitled",
      status: course.status as CourseStatus,
      sales: paid.length,
      enrollments: paid.length,
      grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      shareInPaise: paid.reduce((sum, order) => sum + order.creatorShareInPaise, 0),
    });
  }
  return perCourse.sort((a, b) => b.grossInPaise - a.grossInPaise);
}

async function creatorPayoutTotals(creatorId: string) {
  const payoutRows = await db.query.payouts.findMany({
    where: and(eq(payouts.creatorId, creatorId), eq(payouts.status, "recorded")),
  });
  const payoutsTotal = payoutRows.reduce((sum, payout) => sum + payout.amountInPaise, 0);
  return { payoutsTotal, payoutList: payoutRows };
}

route("GET", "creator/analytics", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  const creatorCourses = await myCourses(user.id);
  const courseIds = creatorCourses.map((row) => row.id);
  const finance = await creatorFinance(courseIds);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPaid = finance.paidOrders.filter((row) => row.order.placedAt >= cutoff);
  // 8 weekly buckets
  const now = Date.now();
  const salesSeries = [] as { label: string; grossInPaise: number; orders: number }[];
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 24 * 60 * 60 * 1000;
    const end = w === 0 ? now + 1 : start + 7 * 24 * 60 * 60 * 1000;
    const bucket = finance.paidOrders.filter(
      (row) => row.order.placedAt.getTime() >= start && row.order.placedAt.getTime() < end,
    );
    salesSeries.push({
      label: new Date(end).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      grossInPaise: bucket.reduce((sum, row) => sum + row.order.grossInPaise, 0),
      orders: bucket.length,
    });
  }
  const data: AnalyticsData = {
    overview: {
      grossLast30dInPaise: recentPaid.reduce((sum, row) => sum + row.order.grossInPaise, 0),
      ordersLast30d: recentPaid.length,
      enrollmentsLast30d: recentPaid.length,
      publishedCourses: creatorCourses.filter((row) => row.status === "published").length,
      draftCourses: creatorCourses.filter((row) => row.status === "draft").length,
    },
    salesSeries,
    enrollmentSeries: salesSeries.map((point) => ({ label: point.label, enrollments: point.orders })),
    performance: await coursePerformance(creatorCourses),
  };
  return ok(data);
});

route("GET", "creator/students", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  const courseIds = (await myCourses(user.id)).map((row) => row.id);
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
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  const courseIds = (await myCourses(user.id)).map((row) => row.id);
  if (courseIds.length === 0) return ok([]);
  const rows = await db
    .select({ order: orders, learner: users, course: courses })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(courses, eq(courses.id, orders.courseId))
    .where(and(inArray(orders.courseId, courseIds), inArray(orders.status, ["paid", "paid_reversed"])))
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
      status: row.order.status === "paid" ? ("paid" as const) : ("refunded" as const),
      placedAt: row.order.placedAt.toISOString(),
      demo: false,
    })),
  );
});

route("GET", "creator/earnings", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
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
    kind: row.template.startsWith("payout")
      ? "payout"
      : row.template.startsWith("sale") || row.template.startsWith("enrollment")
        ? "enrollment"
        : "system",
    title: payload.title ?? row.template,
    body: payload.body ?? "",
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
  };
}

route("GET", "creator/notifications", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
  const rows = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, user.id), eq(notifications.channel, "in_app")),
    orderBy: [sql`${notifications.createdAt} DESC`],
  });
  return ok(rows.slice(0, 25).map(toNotification));
});

route("POST", "creator/notifications/read-all", async (_req, ctx) => {
  const user = requireCreatorUser(ctx);
  if (user instanceof Response) return user;
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
