import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * CourseKit production schema (Prompt 5).
 * Money = integer paise. Historical financial rows are never deleted
 * (courses/orders cascade only where no financial history can exist).
 * RLS is enabled via src/db/rls.sql; the API additionally verifies
 * ownership/authorization server-side on every request.
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  handle: text("handle").unique(),
  tagline: text("tagline").notNull().default(""),
  avatarUrl: text("avatar_url"),
  niche: text("niche").notNull().default(""),
  links: jsonb("links").$type<{ label: string; url: string }[]>().notNull().default([]),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("users_handle_idx").on(t.handle)]);

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const authTokens = pgTable("auth_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(), // verify | reset
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Admin membership is provisioned server-side only (script/ops), never via API payloads. */
export const adminRoles = pgTable("admin_roles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  grantedBy: text("granted_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  shortDescription: text("short_description").notNull().default(""),
  outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
  coverAssetId: text("cover_asset_id"),
  priceInPaise: integer("price_in_paise"),
  status: text("status").notNull().default("draft"), // draft | published | unpublished | archived
  slug: text("slug").unique(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("courses_creator_idx").on(t.creatorId),
  index("courses_status_slug_idx").on(t.status, t.slug),
]);

export const sections = pgTable("sections", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sections_course_idx").on(t.courseId, t.position)]);

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  sectionId: text("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // video | resources
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("lessons_section_idx").on(t.sectionId, t.position)]);

export const mediaAssets = pgTable("media_assets", {
  id: text("id").primaryKey(),
  uploaderId: text("uploader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").references(() => courses.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // cover | video | resource
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  declaredSizeBytes: bigint("declared_size_bytes", { mode: "number" }).notNull(),
  storageKey: text("storage_key").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending | verified | deleted
  verifiedSizeBytes: bigint("verified_size_bytes", { mode: "number" }),
  durationLabel: text("duration_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
}, (t) => [index("media_uploader_idx").on(t.uploaderId), index("media_course_idx").on(t.courseId)]);

export const lessonMedia = pgTable("lesson_media", {
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  assetId: text("asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.lessonId, t.assetId] })]);

export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("enrollments_user_course_unique").on(t.userId, t.courseId),
  index("enrollments_course_idx").on(t.courseId),
]);

export const lessonProgress = pgTable("lesson_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  positionSeconds: integer("position_seconds").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.lessonId] })]);

export const lastAccessed = pgTable("last_accessed", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.courseId] })]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  courseTitle: text("course_title").notNull(),
  grossInPaise: integer("gross_in_paise").notNull(),
  platformFeeInPaise: integer("platform_fee_in_paise").notNull().default(0),
  creatorShareInPaise: integer("creator_share_in_paise").notNull().default(0),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("created"), // created | paid | failed | expired | paid_reversed
  providerRef: text("provider_ref").unique(),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}, (t) => [
  index("orders_user_idx").on(t.userId),
  index("orders_course_idx").on(t.courseId),
  index("orders_status_idx").on(t.status),
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  providerPaymentId: text("provider_payment_id").unique(),
  method: text("method"),
  status: text("status").notNull(), // captured | failed | pending | reversed
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("payments_order_idx").on(t.orderId)]);

export const commissionLedger = pgTable("commission_ledger", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
  paymentId: text("payment_id").notNull().unique().references(() => payments.id, { onDelete: "restrict" }),
  creatorId: text("creator_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  grossInPaise: integer("gross_in_paise").notNull(),
  rateBps: integer("rate_bps").notNull().default(800), // 8% in basis points, recorded per entry
  commissionInPaise: integer("commission_in_paise").notNull(),
  creatorShareInPaise: integer("creator_share_in_paise").notNull(),
  gatewayCostInPaise: integer("gateway_cost_in_paise"), // null until provider reports real costs
  adjustments: jsonb("adjustments").$type<{ at: string; actor: string; reason: string; deltaInPaise: number; reference: string }[]>().notNull().default([]),
  status: text("status").notNull().default("accrued"), // accrued | reversed
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ledger_creator_idx").on(t.creatorId), index("ledger_status_idx").on(t.status)]);

export const payouts = pgTable("payouts", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  amountInPaise: integer("amount_in_paise").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | recorded | failed | cancelled
  beneficiaryMasked: text("beneficiary_masked").notNull(),
  transferRef: text("transfer_ref").unique(),
  transferDate: date("transfer_date"),
  note: text("note").notNull().default(""),
  createdBy: text("created_by").notNull(),
  recordedBy: text("recorded_by"),
  version: integer("version").notNull().default(1), // optimistic locking against concurrent double-pay
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("payouts_creator_idx").on(t.creatorId), index("payouts_status_idx").on(t.status)]);

export const payoutEvents = pgTable("payout_events", {
  id: text("id").primaryKey(),
  payoutId: text("payout_id").notNull().references(() => payouts.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("payout_events_payout_idx").on(t.payoutId)]);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // provider event id — unique = idempotency
  provider: text("provider").notNull(),
  type: text("type").notNull(),
  processingStatus: text("processing_status").notNull().default("processed"), // processed | failed | duplicate_ignored
  attempts: integer("attempts").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel").notNull().default("email"),
  template: text("template").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  dedupeKey: text("dedupe_key").notNull().unique(), // duplicate webhooks can't resend
  status: text("status").notNull().default("pending"), // pending | sent | failed | skipped_not_configured
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only by convention: no update/delete paths exist in code; protected by RLS + grants. */
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorLabel: text("actor_label").notNull(),
  area: text("area").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  kind: text("kind").notNull().default("action"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_area_idx").on(t.area), index("audit_created_idx").on(t.createdAt)]);

export const disputes = pgTable("disputes", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  type: text("type").notNull(), // chargeback | dispute | reversal | legal_exception
  status: text("status").notNull().default("open"), // open | under_review | resolved
  amountInPaise: integer("amount_in_paise").notNull(),
  summary: text("summary").notNull(),
  openedByLabel: text("opened_by_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const disputeNotes = pgTable("dispute_notes", {
  id: text("id").primaryKey(),
  disputeId: text("dispute_id").notNull().references(() => disputes.id, { onDelete: "cascade" }),
  actorLabel: text("actor_label").notNull(),
  note: text("note").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
});

export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  category: text("category").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  authorLabel: text("author_label").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sqlNow = sql`now()`;
