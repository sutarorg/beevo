import { sql } from "drizzle-orm";
import { db } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus: "up" | "down" = "up";
  try {
    await db.execute(sql`select 1`);
  } catch {
    dbStatus = "down";
  }
  return NextResponse.json(
    {
      ok: dbStatus === "up",
      service: "beevo-api",
      db: dbStatus,
      time: new Date().toISOString(),
    },
    { status: dbStatus === "up" ? 200 : 503 }
  );
}
