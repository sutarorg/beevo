import { pool } from "@/db";
import { SCHEMA_SQL } from "@/db/schema-sql";

/**
 * Boot-time schema self-healing.
 *
 * Handles BOTH drift scenarios from real deployments:
 *  - Tables entirely missing (fresh deploy) → applies the embedded
 *    drizzle DDL (idempotent: IF NOT EXISTS everywhere, duplicate
 *    constraints trapped in DO blocks).
 *  - Tables exist but COLUMNS are missing because the table was created
 *    by an older build (e.g. users was created before `avatar_url` /
 *    `prefs` existed) → applies ALTER TABLE … ADD COLUMN IF NOT EXISTS
 *    with constant defaults, which is instant and safe even on
 *    populated tables (Postgres 11+).
 *
 * Safe under concurrent cold starts via a Postgres advisory lock.
 * Disable with AUTO_MIGRATE=false and use `npx drizzle-kit push` instead.
 */

const MIGRATION_LOCK_KEY = 86224421;
let attempted = false;

const CORE_TABLES = [
  "users",
  "sessions",
  "workspaces",
  "workspace_members",
  "workspace_invites",
  "social_accounts",
  "posts",
  "post_targets",
  "media_assets",
  "metrics_snapshots",
  "notifications",
  "payments",
  "invoices",
  "api_keys",
];

/**
 * Contracts for columns that may be missing on databases created by older
 * builds. Every statement is idempotent (`IF NOT EXISTS`) and every
 * NOT NULL addition carries a constant default, so these run instantly
 * against live production tables without table rewrites.
 */
const UPGRADE_SQL: string[] = [
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prefs" jsonb NOT NULL DEFAULT '{"timezone":"Asia/Kolkata (GMT+5:30)","digest":true}'::jsonb;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" varchar(20) NOT NULL DEFAULT 'email';`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_set_at" timestamptz;`,
  // Legacy email-password signups get marked as having a password so their
  // change-password flow keeps requiring the current one.
  // (Drizzle marks them via signup; these statements cover drifted DBs.)
  `ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "name" text NOT NULL DEFAULT 'Default token';`,
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "base_paise" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "gst_paise" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "total_paise" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "method" varchar(20);`,
  `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "method_detail" text;`,
  `ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "base_paise" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "gst_paise" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "total_paise" integer NOT NULL DEFAULT 0;`,
];

export async function schemaPresent(): Promise<boolean> {
  const res = await pool.query<{ present: string | null }>(`SELECT to_regclass('public.users') AS present`);
  return !!res.rows[0]?.present;
}

/** Columns the current code requires (table → columns). */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  users: ["avatar_url", "prefs", "auth_provider", "password_set_at"],
  payments: ["base_paise", "gst_paise", "total_paise", "method", "method_detail"],
  invoices: ["base_paise", "gst_paise", "total_paise"],
};

export interface SchemaReport {
  missingTables: string[];
  missingColumns: string[];
  ok: boolean;
}

/** Honest per-table/per-column audit — the old boolean check hid drift. */
export async function schemaReport(): Promise<SchemaReport> {
  const tables = await pool.query<{ name: string }>(
    `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existingTables = new Set(tables.rows.map((r) => r.name));
  const missingTables = CORE_TABLES.filter((t) => !existingTables.has(t));

  const missingColumns: string[] = [];
  if (missingTables.length < CORE_TABLES.length) {
    const cols = await pool.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`
    );
    const existing = new Set(cols.rows.map((r) => `${r.table_name}.${r.column_name}`));
    for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
      if (!existingTables.has(table)) continue;
      for (const col of columns) {
        if (!existing.has(`${table}.${col}`)) missingColumns.push(`${table}.${col}`);
      }
    }
  }
  return { missingTables, missingColumns, ok: missingTables.length === 0 && missingColumns.length === 0 };
}

async function missingTables(client: { query: (q: string, v?: unknown[]) => Promise<{ rows: { name: string }[] }> }): Promise<string[]> {
  const res = await client.query(
    `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existing = new Set(res.rows.map((r) => r.name));
  return CORE_TABLES.filter((t) => !existing.has(t));
}

export async function ensureSchema(force = false): Promise<{ migrated: boolean; reason?: string }> {
  if (process.env.AUTO_MIGRATE === "false") return { migrated: false, reason: "disabled" };
  if (attempted && !force) return { migrated: false, reason: "already-attempted" };
  attempted = true;
  if (!process.env.DATABASE_URL) return { migrated: false, reason: "no-database-url" };

  const client = await pool.connect();
  let migrated = false;
  try {
    await client.query(`SELECT pg_advisory_lock($1)`, [MIGRATION_LOCK_KEY]);
    try {
      /* 1️⃣  create any missing tables/indexes from the full DDL */
      const missing = await missingTables(client);
      if (missing.length > 0) {
        await client.query("BEGIN");
        await client.query(SCHEMA_SQL);
        await client.query("COMMIT");
        console.log(`[beevo migrate] created missing tables: ${missing.join(", ")}`);
        migrated = true;
      }

      /* 2️⃣  always run column upgrades — fixes tables created by older builds */
      for (const stmt of UPGRADE_SQL) {
        try {
          await client.query(stmt);
        } catch (err) {
          console.warn("[beevo migrate] upgrade skipped:", stmt.slice(0, 80), "→", err instanceof Error ? err.message : err);
        }
      }
      return { migrated };
    } finally {
      await client.query(`SELECT pg_advisory_unlock($1)`, [MIGRATION_LOCK_KEY]).catch(() => undefined);
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("[beevo migrate] failed:", err);
    return { migrated: false, reason: err instanceof Error ? err.message : "unknown" };
  } finally {
    client.release();
  }
}

/** Detect "relation does not exist" (42P01) — missing table. */
export function isSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; message?: string; cause?: { code?: string } };
  return (
    anyErr.code === "42P01" ||
    anyErr.cause?.code === "42P01" ||
    (typeof anyErr.message === "string" && /relation "[\w.]+" does not exist/i.test(anyErr.message))
  );
}

/** Detect "column does not exist" (42703) — table created by an older build. */
export function isUndefinedColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; message?: string; cause?: { code?: string } };
  return (
    anyErr.code === "42703" ||
    anyErr.cause?.code === "42703" ||
    (typeof anyErr.message === "string" && /column "[\w.]+" does not exist/i.test(anyErr.message))
  );
}

export function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; message?: string };
  return (
    ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(anyErr.code ?? "") ||
    (typeof anyErr.message === "string" &&
      /connect|timeout|certificate|no pg_hba|endpoint is disabled|too many clients/i.test(anyErr.message))
  );
}
