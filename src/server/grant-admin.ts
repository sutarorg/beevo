/**
 * Grant platform_admin access to an existing user by email:
 *   npm run db:grant-admin -- you@beevo.in
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { cleanEnv, normalizeDatabaseUrl } from "@/db/url";

async function main() {
  const email = cleanEnv(process.argv[2] ?? process.env.ADMIN_EMAIL).toLowerCase();
  if (!email) {
    console.error("Usage: npm run db:grant-admin -- <email>");
    process.exit(1);
  }
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!connectionString) {
    console.error("Error: DATABASE_URL is not set in .env.local or .env.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user) {
    console.error(`No user found with email: ${email}. Sign up on /signup first.`);
    await pool.end();
    process.exit(1);
  }
  if (!user.emailVerifiedAt) {
    await db
      .update(schema.users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  }
  await db
    .insert(schema.adminRoles)
    .values({ userId: user.id, grantedBy: "grant-admin-cli" })
    .onConflictDoNothing();
  console.log(`Granted platform admin access to ${user.name} <${user.email}>.`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
