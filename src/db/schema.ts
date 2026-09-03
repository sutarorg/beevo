import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------- Auth ------------------------------- */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  /** How the account authenticates — drives password flows. */
  authProvider: varchar("auth_provider", { length: 20 }).notNull().default("email"),
  /** NULL until the user has set their own password (OAuth-created accounts). */
  passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
  prefs: jsonb("prefs").$type<{ timezone: string; digest: boolean }>().notNull().default({ timezone: "Asia/Kolkata (GMT+5:30)", digest: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Personal access tokens — only a hash is stored; plaintext shown once. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    prefix: varchar("prefix", { length: 24 }).notNull(),
    lastFour: varchar("last_four", { length: 8 }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    scopes: text("scopes").notNull().default("posts:read posts:write analytics:read"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("api_keys_ws_idx").on(t.workspaceId)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    currentWorkspaceId: uuid("current_workspace_id"),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

/* ---------------------------- Workspaces ---------------------------- */
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: varchar("plan", { length: 10 }).notNull().default("free"),
  planRenewsAt: timestamp("plan_renews_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("editor"), // owner | admin | editor | viewer
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("members_unique").on(t.workspaceId, t.userId)]
);

export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: varchar("role", { length: 20 }).notNull().default("editor"),
    tokenHash: text("token_hash").notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | accepted | expired
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invites_ws_idx").on(t.workspaceId)]
);

/* -------------------------- Social accounts ------------------------- */
export const socialAccounts = pgTable(
  "social_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 20 }).notNull(),
    platformAccountId: text("platform_account_id").notNull(),
    handle: text("handle").notNull(),
    displayName: text("display_name").notNull(),
    followers: integer("followers").notNull().default(0),
    avatarUrl: text("avatar_url"),
    avatarHue: integer("avatar_hue").notNull().default(40),
    accessTokenEnc: text("access_token_enc"),
    refreshTokenEnc: text("refresh_token_enc"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    scopes: text("scopes").notNull().default(""),
    status: varchar("status", { length: 20 }).notNull().default("connected"), // connected | expiring | simulated | disconnected
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("account_unique").on(t.workspaceId, t.platform, t.platformAccountId),
    index("account_ws_idx").on(t.workspaceId),
  ]
);

/* ------------------------------- Posts ------------------------------ */
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    caption: text("caption").notNull().default(""),
    platforms: jsonb("platforms").$type<string[]>().notNull().default([]),
    status: varchar("status", { length: 20 }).$type<PostStatus>().notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    media: jsonb("media").$type<string[]>().notNull().default([]),
    metrics: jsonb("metrics")
      .$type<{ likes: number; comments: number; shares: number; impressions: number }>()
      .notNull()
      .default({ likes: 0, comments: 0, shares: 0, impressions: 0 }),
    aiAssisted: integer("ai_assisted").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_ws_idx").on(t.workspaceId),
    index("posts_status_idx").on(t.status),
    index("posts_due_idx").on(t.status, t.scheduledAt),
  ]
);

export const postTargets = pgTable(
  "post_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 20 }).notNull(),
    socialAccountId: uuid("social_account_id").references(() => socialAccounts.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | publishing | published | failed
    platformPostId: text("platform_post_id"),
    url: text("url"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("targets_post_idx").on(t.postId), index("targets_status_idx").on(t.status)]
);

/* ------------------------------- Media ------------------------------ */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    storageKey: text("storage_key"),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_ws_idx").on(t.workspaceId)]
);

/* ---------------------------- Analytics ----------------------------- */
export const metricsSnapshots = pgTable(
  "metrics_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    platform: varchar("platform", { length: 20 }).notNull(),
    impressions: integer("impressions").notNull().default(0),
    engagement: integer("engagement").notNull().default(0),
    followers: integer("followers").notNull().default(0),
  },
  (t) => [uniqueIndex("snapshot_unique").on(t.workspaceId, t.date, t.platform)]
);

/* --------------------------- Notifications -------------------------- */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 20 }).notNull().default("tip"), // published | failed | account | plan | tip
    title: text("title").notNull(),
    body: text("body").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notif_ws_idx").on(t.workspaceId)]
);

/* ------------------------------ Billing ----------------------------- */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 10 }).notNull().default("pro"),
    cycle: varchar("cycle", { length: 10 }).notNull().default("monthly"),
    amountInr: integer("amount_inr").notNull(),
    /** Authoritative amounts in paise (base + 18% GST). */
    basePaise: integer("base_paise").notNull().default(0),
    gstPaise: integer("gst_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull().default(0),
    currency: varchar("currency", { length: 6 }).notNull().default("INR"),
    /** Real payment instrument returned by Razorpay (card/upi/netbanking…). */
    method: varchar("method", { length: 20 }),
    methodDetail: text("method_detail"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    status: varchar("status", { length: 20 }).notNull().default("created"), // created | paid | failed | demo
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_ws_idx").on(t.workspaceId)]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    description: text("description").notNull(),
    amountInr: integer("amount_inr").notNull(),
    gstInr: integer("gst_inr").notNull().default(0),
    /** Authoritative amounts in paise. */
    basePaise: integer("base_paise").notNull().default(0),
    gstPaise: integer("gst_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull().default(0),
    status: varchar("status", { length: 10 }).notNull().default("paid"),
    razorpayPaymentId: text("razorpay_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invoices_ws_idx").on(t.workspaceId)]
);
