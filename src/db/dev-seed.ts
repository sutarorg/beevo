import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { LOCAL_UPLOADS_ENABLED, writeLocalObject } from "@/server/storage";

/**
 * Development seed for the in-process database.
 *
 * Runs only when the local development database boots (no DATABASE_URL,
 * outside production) and the database is empty. It creates one creator with
 * published courses so every storefront, checkout, and learner screen has
 * real, database-backed content to work with. Nothing here is used in
 * production, and `npm run db:seed` remains the production provisioning path.
 */

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

const SEED_PASSWORD = process.env.SEED_PASSWORD?.trim() || "Beevo1234";

type Db = NodePgDatabase<typeof schema>;

// Minimal valid ftyp+moov MP4 header stub for local dev seed assets.
const DEV_MP4_STUB = Buffer.from(
  "00000018667479706d703432000000006d70343269736f6d000000086d646174",
  "hex",
);

async function seedCover(
  db: Db,
  input: { id: string; courseId: string; uploaderId: string; fileName: string; source: string },
): Promise<string | null> {
  if (!LOCAL_UPLOADS_ENABLED) return null;
  try {
    const bytes = readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), input.source));
    const storageKey = `courses/${input.courseId}/cover/${input.id}/${input.fileName}`;
    await writeLocalObject(storageKey, bytes);
    await db
      .insert(schema.mediaAssets)
      .values({
        id: input.id,
        uploaderId: input.uploaderId,
        courseId: input.courseId,
        kind: "cover",
        fileName: input.fileName,
        mimeType: "image/jpeg",
        declaredSizeBytes: bytes.byteLength,
        verifiedSizeBytes: bytes.byteLength,
        storageKey,
        status: "verified",
        verifiedAt: new Date(),
      })
      .onConflictDoNothing();
    return input.id;
  } catch (error) {
    console.error("[db] cover seed skipped:", (error as Error).message);
    return null;
  }
}

async function seedVideo(
  db: Db,
  input: {
    id: string;
    courseId: string;
    uploaderId: string;
    fileName: string;
    durationLabel: string;
  },
): Promise<string | null> {
  if (!LOCAL_UPLOADS_ENABLED) return null;
  const storageKey = `courses/${input.courseId}/video/${input.id}/${input.fileName}`;
  await writeLocalObject(storageKey, DEV_MP4_STUB);
  await db
    .insert(schema.mediaAssets)
    .values({
      id: input.id,
      uploaderId: input.uploaderId,
      courseId: input.courseId,
      kind: "video",
      fileName: input.fileName,
      mimeType: "video/mp4",
      declaredSizeBytes: DEV_MP4_STUB.byteLength,
      verifiedSizeBytes: DEV_MP4_STUB.byteLength,
      durationLabel: input.durationLabel,
      storageKey,
      status: "verified",
      verifiedAt: new Date(),
    })
    .onConflictDoNothing();
  return input.id;
}

async function seedResource(
  db: Db,
  input: { id: string; courseId: string; uploaderId: string; fileName: string; body: string },
): Promise<boolean> {
  if (!LOCAL_UPLOADS_ENABLED) return false;
  const bytes = Buffer.from(input.body, "utf8");
  const storageKey = `courses/${input.courseId}/resource/${input.id}/${input.fileName}`;
  await writeLocalObject(storageKey, bytes);
  await db
    .insert(schema.mediaAssets)
    .values({
      id: input.id,
      uploaderId: input.uploaderId,
      courseId: input.courseId,
      kind: "resource",
      fileName: input.fileName,
      mimeType: "text/csv",
      declaredSizeBytes: bytes.byteLength,
      verifiedSizeBytes: bytes.byteLength,
      storageKey,
      status: "verified",
      verifiedAt: new Date(),
    })
    .onConflictDoNothing();
  return true;
}

export async function seedDevelopmentDatabase(db: Db): Promise<void> {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, "meera@beevo.dev") });
  if (existing) return;

  const now = new Date();
  const creatorId = "usr_dev_creator";
  const adminId = "usr_dev_admin";

  await db.insert(schema.users).values([
    {
      id: creatorId,
      email: "meera@beevo.dev",
      name: "Meera Kapoor",
      passwordHash: hashPassword(SEED_PASSWORD),
      handle: "meera-shoots",
      tagline: "Teaching 86k subscribers to shoot on film, not filters.",
      niche: "Photography",
      links: [{ label: "Instagram", url: "https://instagram.com" }],
      emailVerifiedAt: now,
    },
    {
      id: "usr_dev_learner",
      email: "kavya@beevo.dev",
      name: "Kavya Raghavan",
      passwordHash: hashPassword(SEED_PASSWORD),
      emailVerifiedAt: now,
    },
    {
      id: adminId,
      email: "admin@beevo.dev",
      name: "Platform Admin",
      passwordHash: hashPassword(SEED_PASSWORD),
      emailVerifiedAt: now,
    },
  ]);
  await db.insert(schema.adminRoles).values({ userId: adminId, grantedBy: "dev-seed" }).onConflictDoNothing();

  const courses = [
    {
      id: "course_dev_film",
      title: "Film Photography Foundations",
      slug: "film-photography-foundations",
      shortDescription: "Metering, film stocks, and scanning — your first 10 rolls done right.",
      outcomes: [
        "Rate and meter any film stock confidently",
        "Expose for shadows without guessing",
        "Scan and grade your own negatives",
      ],
      priceInPaise: 149900,
      cover: "public/images/courses/photography.jpg",
    },
    {
      id: "course_dev_starter",
      title: "Start Shooting on Film",
      slug: "start-shooting-on-film",
      shortDescription: "A free, no-jargon introduction to loading, metering, and your first roll.",
      outcomes: ["Load a roll without wasting frames", "Understand ISO, aperture, and shutter", "Shoot your first roll with confidence"],
      priceInPaise: 0,
      cover: "public/images/courses/cooking.jpg",
    },
    {
      id: "course_dev_light",
      title: "Light & Colour for Creators",
      slug: "light-and-colour",
      shortDescription: "Read natural light like a photographer and colour-grade with intent.",
      outcomes: ["See direction and quality of light", "Build a repeatable grade", "Shoot consistently indoors"],
      priceInPaise: 249900,
      cover: "public/images/courses/fitness.jpg",
    },
  ];

  for (const [index, course] of courses.entries()) {
    await db.insert(schema.courses).values({
      id: course.id,
      creatorId,
      title: course.title,
      shortDescription: course.shortDescription,
      outcomes: course.outcomes,
      priceInPaise: course.priceInPaise,
      status: "published",
      slug: course.slug,
      publishedAt: now,
    });
    const coverId = await seedCover(db, {
      id: `asset_dev_cover_${index + 1}`,
      courseId: course.id,
      uploaderId: creatorId,
      fileName: `${course.slug}-cover.jpg`,
      source: course.cover,
    });
    if (coverId) {
      await db.update(schema.courses).set({ coverAssetId: coverId }).where(eq(schema.courses.id, course.id));
    }

    const section1Id = `${course.id}_sec_1`;
    const section2Id = `${course.id}_sec_2`;
    await db.insert(schema.sections).values([
      {
        id: section1Id,
        courseId: course.id,
        title: "Getting started",
        position: 0,
      },
      {
        id: section2Id,
        courseId: course.id,
        title: "Light & exposure",
        position: 1,
      },
    ]);

    const lesson1Id = `${course.id}_les_1`;
    const lesson2Id = `${course.id}_les_2`;
    const lesson4Id = `${course.id}_les_4`;

    await db.insert(schema.lessons).values([
      {
        id: lesson1Id,
        sectionId: section1Id,
        type: "video",
        title: "Welcome & how this course works",
        description: "What you need, what you'll shoot, and how to get the most from each lesson.",
        isPreview: true,
        position: 0,
      },
      {
        id: lesson2Id,
        sectionId: section1Id,
        type: "video",
        title: "The one setting that changes everything",
        description: "A practical walkthrough of exposure, with exercises you can shoot today.",
        isPreview: true,
        position: 1,
      },
      {
        id: lesson4Id,
        sectionId: section2Id,
        type: "video",
        title: "Metering shadows in natural light",
        description: "Sunny 16, incident vs reflective metering, and when to trust your eyes.",
        isPreview: false,
        position: 0,
      },
    ]);

    const videoLessons = [
      { lessonId: lesson1Id, assetId: `${course.id}_asset_vid_1`, fileName: "welcome.mp4", durationLabel: "4:12" },
      { lessonId: lesson2Id, assetId: `${course.id}_asset_vid_2`, fileName: "exposure-setting.mp4", durationLabel: "8:35" },
      { lessonId: lesson4Id, assetId: `${course.id}_asset_vid_4`, fileName: "metering-shadows.mp4", durationLabel: "11:40" },
    ];
    for (const vid of videoLessons) {
      const seededVideoId = await seedVideo(db, {
        id: vid.assetId,
        courseId: course.id,
        uploaderId: creatorId,
        fileName: vid.fileName,
        durationLabel: vid.durationLabel,
      });
      if (seededVideoId) {
        await db
          .insert(schema.lessonMedia)
          .values({ lessonId: vid.lessonId, assetId: seededVideoId, position: 0 })
          .onConflictDoNothing();
      }
    }

    if (course.priceInPaise > 0) {
      const resourceId = `${course.id}_asset_guide`;
      const seeded = await seedResource(db, {
        id: resourceId,
        courseId: course.id,
        uploaderId: creatorId,
        fileName: "film-stock-guide.csv",
        body: "stock,iso,character,best_for\nPortra 400,400,warm skin tones,portraits\nHP5 Plus,400,classic grain,documentary\nEktar 100,100,fine grain,landscapes\n",
      });
      if (seeded) {
        const resourceLessonId = `${course.id}_les_3`;
        await db.insert(schema.lessons).values({
          id: resourceLessonId,
          sectionId: section1Id,
          type: "resources",
          title: "Film stock guide & worksheets",
          description: "The stock comparison sheet plus the exposure worksheet used in this course.",
          position: 2,
        });
        await db.insert(schema.lessonMedia).values({ lessonId: resourceLessonId, assetId: resourceId, position: 0 });
      }
    }
  }

  console.log("[db] development seed created: creator @meera-shoots with 3 published courses.");
}
