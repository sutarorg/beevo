/**
 * Secure server-side provisioning script (run with: npx tsx src/server/seed.ts)
 *
 * Creates the first accounts and demo content directly against the database.
 * Admin membership can ONLY be granted here (or by hand in SQL) — never via
 * any API or user-controlled payload.
 */
import { config } from "dotenv";
config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { hashPassword, newId } from "@/server/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const PASSWORD = process.env.SEED_PASSWORD ?? "Demo1234";

async function upsertUser(input: { email: string; name: string; handle?: string; tagline?: string; niche?: string; verified?: boolean }) {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, input.email) });
  if (existing) {
    console.log(`exists: ${input.email}`);
    return existing;
  }
  const [user] = await db
    .insert(schema.users)
    .values({
      id: newId("usr"),
      email: input.email,
      name: input.name,
      passwordHash: hashPassword(PASSWORD),
      handle: input.handle ?? null,
      tagline: input.tagline ?? "",
      niche: input.niche ?? "",
      emailVerifiedAt: input.verified ? new Date() : null,
    })
    .returning();
  console.log(`created: ${input.email}`);
  return user;
}

async function main() {
  const creator = await upsertUser({
    email: "meera@coursekit.dev",
    name: "Meera Kapoor",
    handle: "meera-shoots",
    tagline: "Teaching 86k subscribers to shoot on film, not filters.",
    niche: "Photography",
    verified: true,
  });
  const learner = await upsertUser({ email: "kavya@coursekit.dev", name: "Kavya Raghavan", verified: true });
  const admin = await upsertUser({ email: "admin@coursekit.dev", name: "Platform Admin", verified: true });

  await db
    .insert(schema.adminRoles)
    .values({ userId: admin.id, grantedBy: "seed-script" })
    .onConflictDoNothing();

  // One published course with curriculum (no media assets — R2 not configured
  // in this environment; covers/lessons still exercise the real read paths).
  const existingCourse = await db.query.courses.findFirst({ where: eq(schema.courses.creatorId, creator.id) });
  if (!existingCourse) {
    const courseId = "course_film";
    await db.insert(schema.courses).values({
      id: courseId,
      creatorId: creator.id,
      title: "Film Photography Foundations",
      shortDescription: "Metering, film stocks, and scanning — your first 10 rolls done right.",
      outcomes: ["Rate and meter any film stock confidently", "Expose for shadows without guessing", "Scan and grade your own negatives"],
      priceInPaise: 149900,
      status: "published",
      slug: "film-photography-foundations",
      publishedAt: new Date(),
    });
    const [sec1] = await db.insert(schema.sections).values({ id: "sec_film_1", courseId, title: "Getting started", position: 0 }).returning();
    await db.insert(schema.lessons).values([
      { id: "les_film_1", sectionId: sec1.id, type: "video", title: "Welcome & how this course works", description: "What you need, what you'll shoot, and how the community works.", position: 0 },
      { id: "les_film_2", sectionId: sec1.id, type: "resources", title: "Gear checklist & film stock guide", description: "Printable checklist for your first camera and film order.", position: 1 },
    ]);
    console.log("created course: Film Photography Foundations (published)");
  } else {
    console.log(`course exists: ${existingCourse.id}`);
  }

  console.log(`Seed complete. Passwords for all seeded accounts: ${PASSWORD}`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
