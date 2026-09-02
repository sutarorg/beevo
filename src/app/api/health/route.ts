import { sql } from "drizzle-orm";
import { db, dbConfigured, pool } from "@/db";
import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

/**
 * Deployment checklist endpoint — open this after deploying and it tells
 * you exactly which environment variables are still missing.
 * (Presence booleans only — never exposes values.)
 */
export async function GET() {
  let dbStatus: "up" | "down" | "unconfigured" = "unconfigured";
  let schemaStatus: "ok" | "missing" | "unknown" = "unknown";

  if (dbConfigured) {
    try {
      await db.execute(sql`select 1`);
      dbStatus = "up";
      const res = await pool.query(`SELECT to_regclass('public.users') AS present`);
      schemaStatus = res.rows[0]?.present ? "ok" : "missing";
    } catch {
      dbStatus = "down";
    }
  }

  const oauth = env.oauth;
  const checks = {
    DATABASE_URL: dbConfigured,
    ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
    APP_URL: !!process.env.APP_URL,
    CRON_SECRET: !!process.env.CRON_SECRET,
    email: env.email.configured(),
    razorpay: env.billing.configured(),
    blobStorage: !!env.blobToken(),
    openAI: !!env.openAiKey(),
    oauth_google_youtube: !!(oauth.google().id && oauth.google().secret),
    oauth_meta_facebook_instagram: !!(oauth.meta().id && oauth.meta().secret),
    oauth_x: !!oauth.x().id,
    oauth_linkedin: !!(oauth.linkedin().id && oauth.linkedin().secret),
    oauth_pinterest: !!(oauth.pinterest().id && oauth.pinterest().secret),
  };

  const healthy = dbStatus === "up" && schemaStatus === "ok";
  const hint = !dbConfigured
    ? "Set DATABASE_URL (Neon/Vercel Postgres pooled URL) and redeploy."
    : dbStatus === "down"
      ? "DATABASE_URL is set but unreachable — check host/SSL. localhost cannot be reached from Vercel."
      : schemaStatus === "missing"
        ? "Tables are missing — the app self-heals this on first request, or run `npx drizzle-kit push`."
        : undefined;

  return NextResponse.json(
    { ok: healthy, service: "beevo-api", db: dbStatus, schema: schemaStatus, env: checks, ...(hint ? { hint } : {}), time: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
