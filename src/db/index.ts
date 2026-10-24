import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { cleanEnv, normalizeDatabaseUrl } from "@/db/url";

/**
 * Server database connection (privileged driver user). Authorization is
 * verified in every route handler; RLS (src/db/rls.sql) provides
 * defense-in-depth for any non-superuser role.
 *
 * Local development convenience: when DATABASE_URL is absent outside
 * production, an in-process PostgreSQL (PGlite — the real Postgres engine
 * compiled to WebAssembly) boots with the repository migrations applied, so
 * every flow (auth, courses, checkout, learner player) is fully functional
 * without external infrastructure. Production always uses DATABASE_URL.
 */
type AppDb = NodePgDatabase<typeof schema>;

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
const devDatabaseAllowed =
  !connectionString &&
  process.env.NODE_ENV !== "production" &&
  cleanEnv(process.env.BEEVO_DISABLE_DEV_DB) !== "true";

export const DATABASE_URL_CONFIGURED = Boolean(connectionString);
export const IS_DEV_DATABASE = !connectionString && devDatabaseAllowed;
export const DATABASE_AVAILABLE = Boolean(connectionString) || devDatabaseAllowed;

const globalForDb = globalThis as unknown as {
  __ckPool?: Pool;
  __ckDb?: AppDb;
  __ckDevDbReady?: Promise<void>;
};

function createPool(): Pool {
  const defaultMax = process.env.VERCEL ? 3 : 10;
  const parsedMax = Number.parseInt(cleanEnv(process.env.DATABASE_POOL_MAX), 10);
  const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : defaultMax;

  const instance = new Pool({
    connectionString,
    max,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

  instance.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  return instance;
}

/** Ordered DDL from the repository migrations (single source of truth). */
function migrationSql(): string {
  const dir = path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql") && /^\d{4}_/.test(file))
    .sort();
  return files
    .map((file) => readFileSync(path.join(dir, file), "utf8"))
    .join("\n")
    .split("--> statement-breakpoint")
    .join("\n");
}

function createDevDatabase(): AppDb {
  const client = new PGlite();
  const devDb = drizzlePglite(client, { schema }) as unknown as AppDb;

  // PGlite serialises work in call order: schema + seed are queued before any
  // request handler can issue its first query.
  globalForDb.__ckDevDbReady = (async () => {
    await client.exec(migrationSql());
    const { seedDevelopmentDatabase } = await import("@/db/dev-seed");
    await seedDevelopmentDatabase(devDb);
    console.log("[db] local development database ready (in-process PostgreSQL).");
  })().catch((error) => {
    console.error("[db] local development database failed to initialise:", error);
    throw error;
  });

  return devDb;
}

export const pool: Pool | null = connectionString
  ? (globalForDb.__ckPool ?? createPool())
  : null;
if (pool) globalForDb.__ckPool = pool;

export const db: AppDb =
  globalForDb.__ckDb ??
  (connectionString
    ? drizzle(pool!, { schema })
    : devDatabaseAllowed
      ? createDevDatabase()
      : // No database in production: handlers fail with a clear, actionable
        // service_unavailable instead of crashing at import time.
        drizzle(new Pool({ connectionString: "postgresql://unconfigured", max: 1, connectionTimeoutMillis: 1 }), {
          schema,
        }));

globalForDb.__ckDb = db;

/** Resolves once the local development database has schema + seed data. */
export async function ensureDatabaseReady(): Promise<void> {
  if (globalForDb.__ckDevDbReady) await globalForDb.__ckDevDbReady;
}
