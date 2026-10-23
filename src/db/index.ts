import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

/**
 * Server database connection (privileged driver user). Authorization is
 * verified in every route handler; RLS (src/db/rls.sql) provides
 * defense-in-depth for any non-superuser role.
 */
const globalForDb = globalThis as unknown as { __ckPool?: Pool };

export const pool =
  globalForDb.__ckPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__ckPool = pool;

export const db = drizzle(pool, { schema });
