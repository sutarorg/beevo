import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Serverless-friendly pool:
 *  - never throws at import time (a missing DATABASE_URL must not 500 the
 *    whole route bundle — the API layer returns a structured 503 instead)
 *  - TLS enabled automatically for remote hosts (Neon/Vercel Postgres),
 *    skipped for local postgres
 *  - short connection timeout so cold starts fail fast & cleanly
 */

const databaseUrl = process.env.DATABASE_URL || "";

const isLocalHost = /localhost|127\.0\.0\.1|::1/.test(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __beevoPool?: Pool;
};

function makePool(): Pool {
  return new Pool({
    connectionString: databaseUrl || undefined,
    ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
    max: 4, // serverless: keep it small — each lambda gets its own pool
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10_000,
  });
}

export const pool = globalForDb.__beevoPool ?? makePool();

// Reuse across hot reloads and serverless warm invocations.
if (databaseUrl) globalForDb.__beevoPool = pool;

export const dbConfigured = !!databaseUrl;

export const db = drizzle(pool);
