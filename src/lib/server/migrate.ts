import { pool } from "@/db";
import { SCHEMA_SQL } from "@/db/schema-sql";

/**
 * Boot-time schema self-healing.
 *
 * If the database is reachable but tables are missing (typical first
 * Vercel deploy), apply the embedded drizzle DDL idempotently.
 * Safe under concurrent cold starts via a Postgres advisory lock.
 * Disable with AUTO_MIGRATE=false and use `npx drizzle-kit push` instead.
 */

const MIGRATION_LOCK_KEY = 86224421;
let attempted = false;

export async function schemaPresent(): Promise<boolean> {
  const res = await pool.query<{ present: string | null }>(`SELECT to_regclass('public.users') AS present`);
  return !!res.rows[0]?.present;
}

export async function ensureSchema(force = false): Promise<{ migrated: boolean; reason?: string }> {
  if (process.env.AUTO_MIGRATE === "false") return { migrated: false, reason: "disabled" };
  if (attempted && !force) return { migrated: false, reason: "already-attempted" };
  attempted = true;

  if (!process.env.DATABASE_URL) return { migrated: false, reason: "no-database-url" };

  const client = await pool.connect();
  try {
    const check = await client.query(`SELECT to_regclass('public.users') AS present`);
    if (check.rows[0]?.present) return { migrated: false, reason: "present" };

    await client.query(`SELECT pg_advisory_lock($1)`, [MIGRATION_LOCK_KEY]);
    try {
      // Recheck under the lock — another instance may have just migrated.
      const recheck = await client.query(`SELECT to_regclass('public.users') AS present`);
      if (recheck.rows[0]?.present) return { migrated: false, reason: "present" };

      await client.query("BEGIN");
      await client.query(SCHEMA_SQL);
      await client.query("COMMIT");
      console.log("[beevo migrate] schema initialised (13 tables created)");
      return { migrated: true };
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

/** Detect "relation does not exist" (42P01) and friends. */
export function isSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; message?: string };
  return (
    anyErr.code === "42P01" ||
    (typeof anyErr.message === "string" && /relation "[\w.]+" does not exist/i.test(anyErr.message))
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
