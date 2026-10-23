import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { cleanEnv, normalizeDatabaseUrl } from "@/db/url";

/**
 * Server database connection (privileged driver user). Authorization is
 * verified in every route handler; RLS (src/db/rls.sql) provides
 * defense-in-depth for any non-superuser role.
 */
type AppDb = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __ckPool?: Pool;
  __ckDb?: AppDb;
};

function createPool(): Pool {
  const defaultMax = process.env.VERCEL ? 3 : 10;
  const parsedMax = Number.parseInt(cleanEnv(process.env.DATABASE_POOL_MAX), 10);
  const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : defaultMax;

  const instance = new Pool({
    connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
    max,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

  instance.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  return instance;
}

export const pool: Pool = globalForDb.__ckPool ?? createPool();
globalForDb.__ckPool = pool;

export const db: AppDb = globalForDb.__ckDb ?? drizzle(pool, { schema });
globalForDb.__ckDb = db;
