import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  collectionsAllowed,
  DATABASE_URL,
  PAYMENTS_LIVE_ENABLED,
  R2,
  razorpayConfigured,
  razorpaySecretMatchesKeyId,
  resendConfigured,
} from "@/server/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasInjectedDb = Boolean((globalThis as { __ckTestDb?: boolean }).__ckTestDb);
  if (!DATABASE_URL && !hasInjectedDb) {
    return Response.json(
      {
        ok: false,
        db: "not_configured",
        schemaReady: false,
        providers: {
          storage: R2.configured,
          email: resendConfigured,
          payments: razorpayConfigured,
          collectionsAllowed,
          paymentsLiveEnabled: PAYMENTS_LIVE_ENABLED,
          razorpaySecretMatchesKeyId,
        },
      },
      { status: 503 },
    );
  }

  try {
    const res = await db.execute(
      sql`select to_regclass('public.users') is not null as schema_ready`,
    );
    const row = (res.rows?.[0] ?? null) as { schema_ready?: boolean } | null;
    const schemaReady = Boolean(row?.schema_ready);
    return Response.json(
      {
        ok: schemaReady,
        db: "connected",
        schemaReady,
        providers: {
          storage: R2.configured,
          email: resendConfigured,
          payments: razorpayConfigured,
          collectionsAllowed,
          paymentsLiveEnabled: PAYMENTS_LIVE_ENABLED,
          razorpaySecretMatchesKeyId,
        },
      },
      { status: schemaReady ? 200 : 503 },
    );
  } catch (error) {
    const cause = (error as { cause?: { code?: string }; code?: string })?.cause;
    const code = cause?.code ?? (error as { code?: string })?.code ?? "db_error";
    return Response.json(
      {
        ok: false,
        db: "unreachable",
        dbErrorCode: code,
        schemaReady: false,
        providers: {
          storage: R2.configured,
          email: resendConfigured,
          payments: razorpayConfigured,
          collectionsAllowed,
          paymentsLiveEnabled: PAYMENTS_LIVE_ENABLED,
          razorpaySecretMatchesKeyId,
        },
      },
      { status: 503 },
    );
  }
}
