import { z } from "zod";
import { NextResponse } from "next/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  enrollments,
  lessonMedia,
  lessons,
  mediaAssets,
  orders,
  sections,
  users,
} from "@/db/schema";
import { route } from "@/server/router";
import { fail, ok, parseBody, requireUser, requireVerifiedUser } from "@/server/http";
import { newId } from "@/server/auth";
import {
  abortMultipartUpload,
  buildStorageKey,
  completeMultipartUpload,
  createMultipartUpload,
  formatUploadLimit,
  LOCAL_UPLOADS_ENABLED,
  MULTIPART_PART_SIZE_BYTES,
  presignMultipartPart,
  presignUrl,
  putObject,
  readLocalObject,
  statLocalObject,
  UPLOAD_LIMITS,
  verifyObjectExists,
  writeLocalObject,
} from "@/server/storage";
import { cleanupMediaAssets } from "@/server/media-cleanup";
import { R2 } from "@/server/env";
import type { CourseEditor, CourseListItem, CourseSection, Lesson, MediaRef } from "@/lib/creator-types";
import { readinessChecklist } from "@/lib/services/courses";
import { audit } from "@/server/audit";

/**
 * Creator course management — every mutation verifies ownership server-side
 * (even though RLS also exists) and validates with zod.
 */

async function ownCourse(courseId: string, creatorId: string) {
  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), eq(courses.creatorId, creatorId)),
  });
  return course ?? null;
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "untitled-course";
}

function toMediaRef(asset: typeof mediaAssets.$inferSelect): MediaRef {
  return {
    id: asset.id,
    kind: asset.kind as MediaRef["kind"],
    fileName: asset.fileName,
    sizeBytes: Number(asset.verifiedSizeBytes ?? asset.declaredSizeBytes),
    // Cover/avatar render directly; videos carry the same owner-authorized
    // access URL so the studio can measure a real duration for assets that
    // were uploaded before durations were captured.
    previewUrl:
      asset.kind === "cover" || asset.kind === "avatar" || asset.kind === "video"
        ? `/api/v1/media/access?assetId=${asset.id}`
        : undefined,
    durationLabel: asset.durationLabel ?? undefined,
    uploadedAt: asset.createdAt.toISOString(),
    simulated: false,
  };
}

async function editorFor(courseId: string): Promise<CourseEditor | null> {
  const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) });
  if (!course) return null;
  const creator = await db.query.users.findFirst({ where: eq(users.id, course.creatorId) });
  const sectionRows = await db.query.sections.findMany({
    where: eq(sections.courseId, courseId),
    orderBy: [asc(sections.position)],
  });
  const lessonRows = sectionRows.length
    ? await db.query.lessons.findMany({
        where: inArray(
          lessons.sectionId,
          sectionRows.map((row) => row.id),
        ),
        orderBy: [asc(lessons.position)],
      })
    : [];
  const mediaRows = lessonRows.length
    ? await db
        .select({ lessonId: lessonMedia.lessonId, asset: mediaAssets })
        .from(lessonMedia)
        .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
        .where(
          and(
            inArray(
              lessonMedia.lessonId,
              lessonRows.map((row) => row.id),
            ),
            eq(mediaAssets.status, "verified"),
          ),
        )
        .orderBy(asc(lessonMedia.position))
    : [];
  const cover = course.coverAssetId
    ? await db.query.mediaAssets.findFirst({
        where: and(eq(mediaAssets.id, course.coverAssetId), eq(mediaAssets.status, "verified")),
      })
    : null;
  const mediaByLesson = new Map<string, MediaRef[]>();
  for (const row of mediaRows) {
    const list = mediaByLesson.get(row.lessonId) ?? [];
    list.push(toMediaRef(row.asset));
    mediaByLesson.set(row.lessonId, list);
  }
  const assembled: CourseSection[] = sectionRows.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: lessonRows
      .filter((lesson) => lesson.sectionId === section.id)
      .map((lesson) => ({
        id: lesson.id,
        type: lesson.type as Lesson["type"],
        title: lesson.title,
        description: lesson.description,
        isPreview: lesson.isPreview,
        media: mediaByLesson.get(lesson.id) ?? [],
      })),
  }));
  return {
    id: course.id,
    creatorHandle: creator?.handle ?? "",
    creatorName: creator?.name ?? "",
    status: course.status as CourseEditor["status"],
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    outcomes: course.outcomes,
    cover: cover ? toMediaRef(cover) : null,
    priceInPaise: course.priceInPaise,
    sections: assembled,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    publishedAt: course.publishedAt?.toISOString() ?? null,
  };
}

route("POST", "courses", async (_req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const id = newId("course");
  await db.insert(courses).values({ id, creatorId: user.id });
  const editor = await editorFor(id);
  return ok(editor, { status: 201 });
});

route("GET", "courses", async (_req, ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const rows = await db.query.courses.findMany({
    where: eq(courses.creatorId, user.id),
    orderBy: [sql`${courses.updatedAt} DESC`],
  });
  const stats = rows.length
    ? await db
        .select({
          courseId: enrollments.courseId,
          count: sql<number>`count(*)::int`,
        })
        .from(enrollments)
        .where(
          inArray(
            enrollments.courseId,
            rows.map((row) => row.id),
          ),
        )
        .groupBy(enrollments.courseId)
    : [];
  const grosses = rows.length
    ? await db
        .select({
          courseId: orders.courseId,
          gross: sql<number>`coalesce(sum(gross_in_paise),0)::int`,
        })
        .from(orders)
        .where(
          and(
            inArray(
              orders.courseId,
              rows.map((row) => row.id),
            ),
            eq(orders.status, "paid"),
          ),
        )
        .groupBy(orders.courseId)
    : [];
  const coverIds = rows.map((row) => row.coverAssetId).filter(Boolean) as string[];
  const covers = coverIds.length
    ? await db.query.mediaAssets.findMany({
        where: and(inArray(mediaAssets.id, coverIds), eq(mediaAssets.status, "verified")),
      })
    : [];
  const lessonCounts = rows.length
    ? await db
        .select({
          courseId: sections.courseId,
          count: sql<number>`count(${lessons.id})::int`,
        })
        .from(lessons)
        .innerJoin(sections, eq(sections.id, lessons.sectionId))
        .where(
          inArray(
            sections.courseId,
            rows.map((row) => row.id),
          ),
        )
        .groupBy(sections.courseId)
    : [];
  const items: CourseListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title || "Untitled course",
    status: row.status as CourseListItem["status"],
    coverPreviewUrl: covers.find((asset) => asset.id === row.coverAssetId)
      ? `/api/v1/media/access?assetId=${row.coverAssetId}`
      : null,
    priceInPaise: row.priceInPaise,
    lessonCount: lessonCounts.find((count) => count.courseId === row.id)?.count ?? 0,
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    salesCount: stats.find((stat) => stat.courseId === row.id)?.count ?? 0,
    enrollmentCount: stats.find((stat) => stat.courseId === row.id)?.count ?? 0,
    grossInPaise: grosses.find((gross) => gross.courseId === row.id)?.gross ?? 0,
  }));
  return ok(items);
});

route("GET", "courses/:id", async (_req, ctx, params) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  if (!(await ownCourse(params.id, user.id))) {
    return fail(
      "not_found",
      "We couldn't find that course. It may have been removed or the link is wrong.",
      404,
    );
  }
  return ok(await editorFor(params.id));
});

const detailsSchema = z.object({
  title: z.string().trim().max(120).optional(),
  shortDescription: z.string().trim().max(220).optional(),
  outcomes: z.array(z.string().trim().min(1).max(140)).max(12).optional(),
  coverAssetId: z.string().nullable().optional(),
  priceInPaise: z.number().int().positive().max(50_000_000).optional(),
});

route("PATCH", "courses/:id", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) return fail("not_found", "Draft not found — reload the editor.", 404);
  if (course.status === "archived") {
    return fail("invalid_state", "Archived courses are read-only. Restore first.", 409);
  }
  const parsed = parseBody(detailsSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const patch = parsed.values;

  let nextCoverAssetId: string | null | undefined;
  if (patch.coverAssetId === null) {
    nextCoverAssetId = null;
  } else if (patch.coverAssetId !== undefined) {
    // Cover must be a verified image owned by this creator.
    const asset = await db.query.mediaAssets.findFirst({
      where: and(
        eq(mediaAssets.id, patch.coverAssetId),
        eq(mediaAssets.uploaderId, user.id),
        eq(mediaAssets.courseId, course.id),
        eq(mediaAssets.status, "verified"),
        eq(mediaAssets.kind, "cover"),
      ),
    });
    if (!asset) {
      return fail("validation_failed", "Cover image isn't a verified upload yet.", 422, {
        cover: ["Upload a cover image first."],
      });
    }
    nextCoverAssetId = asset.id;
  }

  await db
    .update(courses)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.shortDescription !== undefined ? { shortDescription: patch.shortDescription } : {}),
      ...(patch.outcomes !== undefined ? { outcomes: patch.outcomes } : {}),
      ...(patch.priceInPaise !== undefined ? { priceInPaise: patch.priceInPaise } : {}),
      ...(nextCoverAssetId !== undefined ? { coverAssetId: nextCoverAssetId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(courses.id, course.id));

  if (
    nextCoverAssetId !== undefined &&
    course.coverAssetId &&
    course.coverAssetId !== nextCoverAssetId
  ) {
    const previousCover = await db.query.mediaAssets.findFirst({
      where: and(
        eq(mediaAssets.id, course.coverAssetId!),
        eq(mediaAssets.uploaderId, user.id),
      ),
    });
    if (previousCover) await cleanupMediaAssets([previousCover]);
  }

  return ok(await editorFor(course.id));
});

route("POST", "courses/:id/status", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) return fail("not_found", "Course not found.", 404);
  const parsed = parseBody(
    z.object({ action: z.enum(["publish", "unpublish", "archive", "unarchive"]) }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const { action } = parsed.values;

  if (action === "publish") {
    if (course.status !== "draft" && course.status !== "unpublished") {
      return fail("invalid_state", "Only drafts or unpublished courses can be published.", 409);
    }
    // Authoritative server-side readiness validation — cannot be bypassed by HTTP.
    const editor = await editorFor(course.id);
    if (!editor) return fail("not_found", "Course not found.", 404);
    if (!editor.creatorHandle) {
      return fail("validation_failed", "Set up your creator profile handle before publishing.", 422, {
        details: ["Creator profile available (handle + display name)"],
      });
    }
    const missing = readinessChecklist(editor).filter((item) => !item.ok);
    if (missing.length > 0) {
      const fieldErrors: Record<string, string[]> = {};
      for (const item of missing) (fieldErrors[item.stage] ??= []).push(item.label);
      return fail(
        "validation_failed",
        `This course isn't ready to publish yet. ${missing.length} item${missing.length > 1 ? "s" : ""} need attention.`,
        422,
        fieldErrors,
      );
    }
    let slug = course.slug ?? slugify(editor.title);
    const slugTaken = await db.query.courses.findFirst({ where: and(eq(courses.slug, slug)) });
    if (slugTaken && slugTaken.id !== course.id) slug = `${slug}-${course.id.slice(-6)}`;
    await db
      .update(courses)
      .set({
        status: "published",
        slug,
        publishedAt: course.publishedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, course.id));
    return ok(await editorFor(course.id));
  }
  if (action === "unpublish") {
    if (course.status !== "published") {
      return fail("invalid_state", "Only a published course can be unpublished.", 409);
    }
    await db
      .update(courses)
      .set({ status: "unpublished", updatedAt: new Date() })
      .where(eq(courses.id, course.id));
    return ok(await editorFor(course.id));
  }
  if (action === "archive") {
    await db
      .update(courses)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(courses.id, course.id));
    return ok(await editorFor(course.id));
  }
  if (course.status !== "archived") {
    return fail("invalid_state", "Only an archived course can be restored.", 409);
  }
  await db
    .update(courses)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(courses.id, course.id));
  return ok(await editorFor(course.id));
});

/**
 * Delete a course.
 *
 * Business rule: a course is only deletable while it has no history — no paid
 * orders and no enrolments. Once a learner has bought access, the course row
 * (and its financial trail) must survive; archiving is the offered alternative.
 * Objects in R2 for the course's media are cleaned up best-effort afterwards.
 */
route("DELETE", "courses/:id", async (_req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) {
    return fail("not_found", "We couldn't find that course — it may already be deleted.", 404);
  }

  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.courseId, course.id))
    .limit(1);
  const [enrolment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id))
    .limit(1);

  if (order || enrolment) {
    return fail(
      "course_has_history",
      "This course already has learners or orders, so it can't be deleted. Archive it instead — existing learners keep access and financial records stay intact.",
      409,
    );
  }

  const assets = await db.query.mediaAssets.findMany({
    where: eq(mediaAssets.courseId, course.id),
  });

  await db.delete(courses).where(eq(courses.id, course.id));

  // The database cascade removes the rows; this also removes the underlying
  // R2/local objects, including pending or previously detached course media.
  await cleanupMediaAssets(assets);

  await audit({
    actorId: user.id,
    actorLabel: user.name,
    area: "courses",
    action: "course_deleted",
    detail: `Deleted course “${course.title || course.id}” (${assets.length} media object(s)).`,
    kind: "event",
  });

  return ok({ deleted: true as const, id: course.id });
});

// ---- Sections ---------------------------------------------------------------

const sectionSchema = z.object({
  title: z.string().trim().min(1, "Give the section a title.").max(120),
});

route("POST", "courses/:id/sections", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) return fail("not_found", "Draft not found — reload the editor.", 404);
  const parsed = parseBody(sectionSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(position),-1)::int` })
    .from(sections)
    .where(eq(sections.courseId, course.id));
  const [section] = await db
    .insert(sections)
    .values({ id: newId("sec"), courseId: course.id, title: parsed.values.title, position: max + 1 })
    .returning();
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, course.id));
  return ok({ id: section.id, title: section.title, lessons: [] as Lesson[] }, { status: 201 });
});

route("PATCH", "courses/:id/sections/:sectionId", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) return fail("not_found", "Draft not found — reload the editor.", 404);
  const parsed = parseBody(sectionSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  await db
    .update(sections)
    .set({ title: parsed.values.title })
    .where(and(eq(sections.id, params.sectionId), eq(sections.courseId, course.id)));
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, course.id));
  const editor = await editorFor(course.id);
  const updated = editor?.sections.find((s) => s.id === params.sectionId);
  if (!updated) return fail("not_found", "Section not found — reload the editor.", 404);
  return ok(updated);
});

route("DELETE", "courses/:id/sections/:sectionId", async (_req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!(await ownCourse(params.id, user.id))) return fail("not_found", "Draft not found.", 404);
  const section = await db.query.sections.findFirst({
    where: and(eq(sections.id, params.sectionId), eq(sections.courseId, params.id)),
  });
  if (!section) return fail("not_found", "Section not found.", 404);
  const assets = await db
    .select({ asset: mediaAssets })
    .from(lessonMedia)
    .innerJoin(lessons, eq(lessons.id, lessonMedia.lessonId))
    .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
    .where(eq(lessons.sectionId, section.id))
    .then((rows) => rows.map((row) => row.asset));

  await db.delete(sections).where(eq(sections.id, section.id));
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, params.id));
  await cleanupMediaAssets(assets);
  return ok(undefined);
});

route("PUT", "courses/:id/sections/reorder", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!(await ownCourse(params.id, user.id))) return fail("not_found", "Draft not found.", 404);
  const parsed = parseBody(
    z.object({ orderedSectionIds: z.array(z.string()).max(200) }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  await db.transaction(async (tx) => {
    for (const [index, sectionId] of parsed.values.orderedSectionIds.entries()) {
      await tx
        .update(sections)
        .set({ position: index })
        .where(and(eq(sections.id, sectionId), eq(sections.courseId, params.id)));
    }
  });
  return ok(undefined);
});

// ---- Lessons -----------------------------------------------------------------

const lessonSchema = z.object({
  type: z.enum(["video", "resources"]),
  title: z.string().trim().min(1, "Give the lesson a title.").max(140),
  description: z.string().trim().max(1000).default(""),
  mediaIds: z.array(z.string()).max(5),
  /** Free preview is a video-only affordance; resource lessons always lock. */
  isPreview: z.boolean().optional(),
});

async function assertMediaUsable(
  userId: string,
  course: string,
  type: "video" | "resources",
  mediaIds: string[],
) {
  if (mediaIds.length === 0) return { error: "Attach the lesson content before saving." };
  if (type === "video" && mediaIds.length !== 1) {
    return { error: "A video lesson holds exactly one video file." };
  }
  const assets = await db.query.mediaAssets.findMany({
    where: and(
      inArray(mediaAssets.id, mediaIds),
      eq(mediaAssets.uploaderId, userId),
      eq(mediaAssets.courseId, course),
      eq(mediaAssets.status, "verified"),
    ),
  });
  if (assets.length !== mediaIds.length) {
    return { error: "One or more files aren't verified uploads yet." };
  }
  const expectedKind = type === "video" ? "video" : "resource";
  if (assets.some((asset) => asset.kind !== expectedKind)) {
    return { error: "File type doesn't match the lesson type." };
  }
  return { assets };
}

route("POST", "courses/:id/sections/:sectionId/lessons", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) return fail("not_found", "Draft not found — reload the editor.", 404);
  const section = await db.query.sections.findFirst({
    where: and(eq(sections.id, params.sectionId), eq(sections.courseId, course.id)),
  });
  if (!section) return fail("not_found", "Section not found — reload the editor.", 404);
  const parsed = parseBody(lessonSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const media = await assertMediaUsable(
    user.id,
    course.id,
    parsed.values.type,
    parsed.values.mediaIds,
  );
  if ("error" in media) {
    return fail("validation_failed", media.error!, 422, { media: [media.error!] });
  }
  const lessonId = newId("les");
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(position),-1)::int` })
    .from(lessons)
    .where(eq(lessons.sectionId, section.id));
  const [lesson] = await db
    .insert(lessons)
    .values({
      id: lessonId,
      sectionId: section.id,
      type: parsed.values.type,
      title: parsed.values.title,
      description: parsed.values.description,
      isPreview: parsed.values.type === "video" ? parsed.values.isPreview === true : false,
      position: max + 1,
    })
    .returning();
  await db.insert(lessonMedia).values(
    parsed.values.mediaIds.map((assetId, position) => ({
      lessonId: lesson.id,
      assetId,
      position,
    })),
  );
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, course.id));
  const editor = await editorFor(course.id);
  const created = editor?.sections.flatMap((s) => s.lessons).find((l) => l.id === lesson.id);
  return ok(created, { status: 201 });
});

route("PATCH", "courses/:id/sections/:sectionId/lessons/:lessonId", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const course = await ownCourse(params.id, user.id);
  if (!course) return fail("not_found", "Draft not found — reload the editor.", 404);
  const [target] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(sections, eq(sections.id, lessons.sectionId))
    .where(
      and(
        eq(lessons.id, params.lessonId),
        eq(lessons.sectionId, params.sectionId),
        eq(sections.courseId, course.id),
      ),
    )
    .limit(1);
  if (!target) return fail("not_found", "Lesson not found — reload the editor.", 404);

  const parsed = parseBody(lessonSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const media = await assertMediaUsable(
    user.id,
    course.id,
    parsed.values.type,
    parsed.values.mediaIds,
  );
  if ("error" in media) {
    return fail("validation_failed", media.error!, 422, { media: [media.error!] });
  }
  const previousAssets = await db
    .select({ asset: mediaAssets })
    .from(lessonMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
    .where(eq(lessonMedia.lessonId, target.id))
    .then((rows) => rows.map((row) => row.asset));

  await db.transaction(async (tx) => {
    await tx
      .update(lessons)
      .set({
        type: parsed.values.type,
        title: parsed.values.title,
        description: parsed.values.description,
        isPreview: parsed.values.type === "video" ? parsed.values.isPreview === true : false,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, target.id));
    await tx.delete(lessonMedia).where(eq(lessonMedia.lessonId, target.id));
    await tx.insert(lessonMedia).values(
      parsed.values.mediaIds.map((assetId, position) => ({
        lessonId: target.id,
        assetId,
        position,
      })),
    );
    await tx.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, course.id));
  });
  await cleanupMediaAssets(previousAssets);

  const editor = await editorFor(course.id);
  const updated = editor?.sections.flatMap((s) => s.lessons).find((l) => l.id === target.id);
  return ok(updated);
});

route("DELETE", "courses/:id/sections/:sectionId/lessons/:lessonId", async (_req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!(await ownCourse(params.id, user.id))) return fail("not_found", "Draft not found.", 404);
  const [target] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(sections, eq(sections.id, lessons.sectionId))
    .where(
      and(
        eq(lessons.id, params.lessonId),
        eq(lessons.sectionId, params.sectionId),
        eq(sections.courseId, params.id),
      ),
    )
    .limit(1);
  if (!target) return fail("not_found", "Lesson not found.", 404);
  const assets = await db
    .select({ asset: mediaAssets })
    .from(lessonMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
    .where(eq(lessonMedia.lessonId, target.id))
    .then((rows) => rows.map((row) => row.asset));

  await db.delete(lessons).where(eq(lessons.id, target.id));
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, params.id));
  await cleanupMediaAssets(assets);
  return ok(undefined);
});

route("PUT", "courses/:id/sections/:sectionId/lessons/reorder", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!(await ownCourse(params.id, user.id))) return fail("not_found", "Draft not found.", 404);
  const parsed = parseBody(
    z.object({ orderedLessonIds: z.array(z.string()).max(400) }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  await db.transaction(async (tx) => {
    for (const [index, lessonId] of parsed.values.orderedLessonIds.entries()) {
      await tx
        .update(lessons)
        .set({ position: index })
        .where(and(eq(lessons.id, lessonId), eq(lessons.sectionId, params.sectionId)));
    }
  });
  return ok(undefined);
});

// ---- Upload sessions (R2) -----------------------------------------------------

const uploadSessionSchema = z.object({
  /** Optional for account-level media (profile photos); required for course media. */
  courseId: z.string().min(1).optional(),
  kind: z.enum(["cover", "video", "resource", "avatar"]),
  fileName: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1).max(100),
});

route("POST", "uploads/session", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const parsed = parseBody(uploadSessionSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const input = parsed.values;
  const limits = UPLOAD_LIMITS[input.kind];
  if (!(limits.mimeTypes as readonly string[]).includes(input.mimeType)) {
    return fail("validation_failed", `That file type isn't supported for ${input.kind} uploads.`, 422, {
      media: ["Unsupported file type."],
    });
  }
  if (input.sizeBytes > limits.maxBytes) {
    return fail("validation_failed", "File is too large for this upload type.", 422, {
      media: [`Keep it under ${formatUploadLimit(limits.maxBytes)}.`],
    });
  }
  if (input.kind === "avatar") {
    if (input.courseId) {
      return fail("validation_failed", "Profile photos aren't attached to a course.", 422);
    }
  } else if (!input.courseId) {
    return fail("validation_failed", "A course is required for this upload.", 422, {
      media: ["Choose a course first."],
    });
  }
  // Ownership is verified BEFORE a key is minted.
  if (input.courseId && !(await ownCourse(input.courseId, user.id))) {
    return fail("not_found", "Course not found.", 404);
  }
  if (!R2.configured && !LOCAL_UPLOADS_ENABLED) {
    return fail(
      "provider_not_configured",
      "Media storage isn't configured yet (R2 credentials missing). Uploads are disabled until it is.",
      503,
    );
  }
  const assetId = newId("media");
  const storageKey = buildStorageKey({
    courseId: input.courseId ?? null,
    ownerId: user.id,
    kind: input.kind,
    assetId,
    fileName: input.fileName,
  });
  await db.insert(mediaAssets).values({
    id: assetId,
    uploaderId: user.id,
    courseId: input.courseId ?? null,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    declaredSizeBytes: input.sizeBytes,
    storageKey,
  });
  if (R2.configured) {
    const signed = presignUrl({
      method: "PUT",
      key: storageKey,
      expiresSeconds: 900,
      contentType: input.mimeType,
    });
    return ok(
      {
        uploadId: assetId,
        kind: input.kind,
        fileName: input.fileName,
        sizeBytes: input.sizeBytes,
        signedUrl: signed.url,
        expiresAt: signed.expiresAt,
      },
      { status: 201 },
    );
  }
  // Local development fallback: the browser PUTs straight back to this app.
  return ok(
    {
      uploadId: assetId,
      kind: input.kind,
      fileName: input.fileName,
      sizeBytes: input.sizeBytes,
      signedUrl: `/api/v1/uploads/put/${assetId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    { status: 201 },
  );
});

/**
 * Same-origin upload target.
 *
 * Two legitimate uses, one handler:
 *  1. Local development without R2 credentials — bytes land in .uploads/.
 *  2. A relay when the browser's direct PUT to R2 is blocked (bucket CORS not
 *     yet allowing the app origin, corporate proxies, …). The bytes are then
 *     written to the same R2 bucket server-side, so the media still ends up in
 *     the cloud bucket instead of failing the upload.
 *
 * Large videos/resources use direct R2 multipart uploads instead: serverless
 * request bodies are capped well below the 1 GB video limit.
 */
const MAX_RELAY_BYTES = 20 * 1024 * 1024;

route("PUT", "uploads/put/:assetId", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!R2.configured && !LOCAL_UPLOADS_ENABLED) {
    return fail(
      "provider_not_configured",
      "Media storage isn't configured yet (R2 credentials missing). Uploads are disabled until it is.",
      503,
    );
  }
  const asset = await db.query.mediaAssets.findFirst({
    where: and(eq(mediaAssets.id, params.assetId), eq(mediaAssets.uploaderId, user.id)),
  });
  if (!asset) return fail("not_found", "Upload session not found.", 404);
  if (asset.status !== "pending") {
    return fail("invalid_state", "This upload was already completed.", 409);
  }
  const declared = Number(asset.declaredSizeBytes);
  const limits = UPLOAD_LIMITS[asset.kind as keyof typeof UPLOAD_LIMITS];
  if (!limits) return fail("validation_failed", "Unsupported upload type.", 422);
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > Math.min(limits.maxBytes, MAX_RELAY_BYTES)) {
    return fail(
      "relay_too_large",
      "This file is too large to relay through the app. Upload it again on a network that can reach storage directly.",
      413,
    );
  }
  const body = Buffer.from(await req.arrayBuffer());
  if (body.byteLength === 0) return fail("validation_failed", "The uploaded file was empty.", 422);
  if (body.byteLength > Math.min(limits.maxBytes, MAX_RELAY_BYTES)) {
    return fail("validation_failed", "File is too large for this upload type.", 422);
  }
  if (Math.abs(body.byteLength - declared) > Math.max(1024, declared * 0.02)) {
    return fail("upload_size_mismatch", "The uploaded file doesn't match the declared size.", 409);
  }
  if (R2.configured) {
    const written = await putObject(asset.storageKey, body, asset.mimeType);
    if (!written) {
      return fail(
        "upload_failed",
        "We couldn't write the file to storage. Check the R2 bucket credentials and try again.",
        502,
      );
    }
    return ok({ uploaded: true, storage: "r2" as const });
  }
  await writeLocalObject(asset.storageKey, body);
  return ok({ uploaded: true, storage: "local" as const });
});

const multipartAssetSchema = z.object({
  assetId: z.string().min(1),
});
const multipartUploadSchema = multipartAssetSchema.extend({
  uploadId: z.string().min(1).max(2048),
});

async function pendingUploadAsset(assetId: string, userId: string) {
  const asset = await db.query.mediaAssets.findFirst({
    where: and(
      eq(mediaAssets.id, assetId),
      eq(mediaAssets.uploaderId, userId),
      eq(mediaAssets.status, "pending"),
    ),
  });
  return asset ?? null;
}

function multipartUnavailable() {
  return fail(
    "provider_not_configured",
    "Multipart uploads need Cloudflare R2 to be configured.",
    503,
  );
}

route("POST", "uploads/multipart/start", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!R2.configured) return multipartUnavailable();
  const parsed = parseBody(multipartAssetSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const asset = await pendingUploadAsset(parsed.values.assetId, user.id);
  if (!asset) return fail("not_found", "Upload session not found.", 404);
  const uploadId = await createMultipartUpload(asset.storageKey, asset.mimeType);
  if (!uploadId) {
    return fail("upload_failed", "We couldn't start the multipart upload in storage. Try again.", 502);
  }
  return ok({ uploadId, partSize: MULTIPART_PART_SIZE_BYTES }, { status: 201 });
});

route("POST", "uploads/multipart/sign-part", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!R2.configured) return multipartUnavailable();
  const parsed = parseBody(
    multipartUploadSchema.extend({
      partNumber: z.number().int().min(1).max(10_000),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const asset = await pendingUploadAsset(parsed.values.assetId, user.id);
  if (!asset) return fail("not_found", "Upload session not found.", 404);
  const partCount = Math.ceil(Number(asset.declaredSizeBytes) / MULTIPART_PART_SIZE_BYTES);
  if (parsed.values.partNumber > partCount) {
    return fail("validation_failed", "That upload part is outside the declared file size.", 422);
  }
  const signed = presignMultipartPart({
    key: asset.storageKey,
    uploadId: parsed.values.uploadId,
    partNumber: parsed.values.partNumber,
    contentType: asset.mimeType,
  });
  return ok({ signedUrl: signed.url, expiresAt: signed.expiresAt });
});

route("POST", "uploads/multipart/complete", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!R2.configured) return multipartUnavailable();
  const parsed = parseBody(
    multipartUploadSchema.extend({
      parts: z
        .array(
          z.object({
            partNumber: z.number().int().min(1).max(10_000),
            etag: z.string().trim().min(1).max(2048),
          }),
        )
        .min(1)
        .max(10_000),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const asset = await pendingUploadAsset(parsed.values.assetId, user.id);
  if (!asset) return fail("not_found", "Upload session not found.", 404);
  const partCount = Math.ceil(Number(asset.declaredSizeBytes) / MULTIPART_PART_SIZE_BYTES);
  const parts = [...parsed.values.parts].sort((a, b) => a.partNumber - b.partNumber);
  if (
    parts.length !== partCount ||
    parts.some((part, index) => part.partNumber !== index + 1)
  ) {
    return fail("validation_failed", "The multipart upload is missing one or more parts.", 422);
  }
  const completed = await completeMultipartUpload({
    key: asset.storageKey,
    uploadId: parsed.values.uploadId,
    parts,
  });
  if (!completed) {
    return fail("upload_failed", "We couldn't finish the multipart upload in storage. Try again.", 502);
  }
  return ok({ completed: true as const });
});

route("POST", "uploads/multipart/abort", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!R2.configured) return multipartUnavailable();
  const parsed = parseBody(multipartUploadSchema, await req.json().catch(() => ({})));
  if ("response" in parsed) return parsed.response;
  const asset = await pendingUploadAsset(parsed.values.assetId, user.id);
  if (!asset) return fail("not_found", "Upload session not found.", 404);
  try {
    await abortMultipartUpload(asset.storageKey, parsed.values.uploadId);
    return ok({ aborted: true as const });
  } catch {
    return fail("upload_failed", "We couldn't abort the multipart upload. Try again.", 502);
  }
});

/** Delete an uploaded but no-longer-wanted asset and its stored bytes. */
route("DELETE", "uploads/:assetId", async (_req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const asset = await db.query.mediaAssets.findFirst({
    where: and(eq(mediaAssets.id, params.assetId), eq(mediaAssets.uploaderId, user.id)),
  });
  if (!asset) return ok({ deleted: true as const });
  const cleaned = await cleanupMediaAssets([asset]);
  if (cleaned.skippedIds.includes(asset.id)) {
    return fail("media_in_use", "This file is still attached. Remove it from the lesson or profile first.", 409);
  }
  if (cleaned.failedIds.includes(asset.id)) {
    return fail("storage_delete_failed", "We couldn't delete the file from storage. Try again.", 502);
  }
  return ok({ deleted: true as const });
});

/**
 * Backfill/refresh a media asset's duration label (owner only).
 *
 * Durations are measured in the creator's browser from the real file, so this
 * endpoint exists for two legitimate cases: assets uploaded before duration
 * capture shipped, and a re-measured file that replaced a placeholder. It can
 * never be used to touch another creator's asset or a non-video file.
 */
route("PATCH", "uploads/:assetId", async (req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const parsed = parseBody(
    z.object({
      durationLabel: z
        .string()
        .trim()
        .regex(/^\d{1,3}:[0-5]\d(:[0-5]\d)?$/, "Send a duration like 4:12 or 1:02:03."),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const asset = await db.query.mediaAssets.findFirst({
    where: and(eq(mediaAssets.id, params.assetId), eq(mediaAssets.uploaderId, user.id)),
  });
  if (!asset) return fail("not_found", "Upload not found.", 404);
  if (asset.kind !== "video") {
    return fail("validation_failed", "Only video uploads carry a duration.", 422);
  }
  const [updated] = await db
    .update(mediaAssets)
    .set({ durationLabel: parsed.values.durationLabel })
    .where(eq(mediaAssets.id, asset.id))
    .returning();
  return ok(toMediaRef(updated));
});

route("POST", "uploads/complete", async (req, ctx) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  const parsed = parseBody(
    z.object({
      assetId: z.string().min(1),
      durationLabel: z.string().trim().max(20).optional(),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const asset = await db.query.mediaAssets.findFirst({
    where: and(eq(mediaAssets.id, parsed.values.assetId), eq(mediaAssets.uploaderId, user.id)),
  });
  if (!asset) return fail("not_found", "Upload session not found.", 404);
  if (asset.status === "verified") return ok(toMediaRef(asset)); // idempotent
  // Independent server-side verification — the client's claim is never trusted.
  const head = R2.configured
    ? await verifyObjectExists(asset.storageKey)
    : await statLocalObject(asset.storageKey).then((info) =>
        info ? { sizeBytes: info.sizeBytes, contentType: asset.mimeType } : null,
      );
  if (!head) {
    return fail(
      "upload_not_verified",
      "We couldn't verify the uploaded object in storage. Try the upload again.",
      409,
    );
  }
  const drift = Math.abs(head.sizeBytes - Number(asset.declaredSizeBytes));
  if (drift > Math.max(1024, Number(asset.declaredSizeBytes) * 0.02)) {
    await cleanupMediaAssets([asset]);
    return fail(
      "upload_size_mismatch",
      "The uploaded file doesn't match the declared size. Upload it again.",
      409,
    );
  }
  const [verified] = await db
    .update(mediaAssets)
    .set({
      status: "verified",
      verifiedSizeBytes: head.sizeBytes,
      verifiedAt: new Date(),
      ...(parsed.values.durationLabel ? { durationLabel: parsed.values.durationLabel } : {}),
    })
    .where(eq(mediaAssets.id, asset.id))
    .returning();
  return ok(toMediaRef(verified));
});

/** Server-authorized, short-lived media delivery (enrollment or public rules). */
route("GET", "media/access", async (req, ctx) => {
  const urlObj = new URL(req.url);
  const assetId = urlObj.searchParams.get("assetId") ?? "";
  const asset = await db.query.mediaAssets.findFirst({
    where: and(eq(mediaAssets.id, assetId), eq(mediaAssets.status, "verified")),
  });
  if (!asset) return fail("not_found", "Media not found.", 404);

  let allowed = false;
  if (asset.kind === "cover" || asset.kind === "avatar") allowed = true; // public profile assets
  if (!allowed && ctx.user) {
    if (asset.uploaderId === ctx.user.id || ctx.isAdmin) allowed = true;
  }
  if (!allowed && asset.courseId) {
    if (ctx.user) {
      const enrolled = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, asset.courseId)),
      });
      if (enrolled) allowed = true;
      if (!allowed) {
        const owns = await db.query.courses.findFirst({
          where: and(eq(courses.id, asset.courseId), eq(courses.creatorId, ctx.user.id)),
        });
        if (owns) allowed = true;
      }
    }
    if (!allowed && asset.kind === "video") {
      // Public preview rule: any video lesson the creator explicitly marked as
      // a free preview ("is_preview") on a published course. Nothing else is
      // playable without a verified enrolment.
      const course = await db.query.courses.findFirst({ where: eq(courses.id, asset.courseId) });
      if (course?.status === "published") {
        const previewAssets = await db
          .select({ assetId: lessonMedia.assetId })
          .from(lessonMedia)
          .innerJoin(lessons, eq(lessons.id, lessonMedia.lessonId))
          .innerJoin(sections, eq(sections.id, lessons.sectionId))
          .where(
            and(
              eq(sections.courseId, asset.courseId),
              eq(lessons.type, "video"),
              eq(lessons.isPreview, true),
            ),
          );
        if (previewAssets.some((row) => row.assetId === asset.id)) allowed = true;
      }
    }
  }
  if (!allowed) {
    return fail(
      ctx.user ? "not_enrolled" : "auth_required",
      "You don't have access to this media.",
      ctx.user ? 403 : 401,
    );
  }
  if (!R2.configured) {
    if (!LOCAL_UPLOADS_ENABLED) {
      return fail("provider_not_configured", "Media storage isn't configured.", 503);
    }
    const downloadLocal = urlObj.searchParams.get("download") === "1";
    if (downloadLocal) {
      const signedLocal = `/api/v1/media/access?assetId=${asset.id}&download=1`;
      return ok({
        url: signedLocal,
        expiresAt: new Date(Date.now() + 600 * 1000).toISOString(),
        fileName: asset.fileName,
        sizeBytes: Number(asset.verifiedSizeBytes ?? asset.declaredSizeBytes),
      });
    }
    const bytes = await readLocalObject(asset.storageKey);
    if (!bytes) return fail("not_found", "Media not found.", 404);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType || "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  const download = urlObj.searchParams.get("download") === "1";
  const wantsJson =
    download ||
    urlObj.searchParams.get("format") === "json" ||
    (req.headers.get("accept") ?? "").includes("application/json");
  const safeFileName = asset.fileName.replace(/["\\\r\n]/g, "_");
  const signed = presignUrl({
    method: "GET",
    key: asset.storageKey,
    expiresSeconds: 600,
    ...(download ? { responseContentDisposition: `attachment; filename="${safeFileName}"` } : {}),
  });

  if (wantsJson) {
    return ok({
      url: signed.url,
      expiresAt: signed.expiresAt,
      fileName: asset.fileName,
      sizeBytes: Number(asset.verifiedSizeBytes ?? asset.declaredSizeBytes),
    });
  }

  // Cover + avatar images are loaded via <Image> / <img>; streaming bytes avoids
  // cross-origin 302 errors in /_next/image and keeps the URL stable for CSS.
  if (asset.kind === "cover" || asset.kind === "avatar") {
    try {
      const upstream = await fetch(signed.url);
      if (upstream.ok && upstream.body) {
        return new NextResponse(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") || asset.mimeType || "image/jpeg",
            "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          },
        });
      }
    } catch {
      // Fall through to 302 redirect if upstream stream fails
    }
  }

  return NextResponse.redirect(signed.url, 302);
});
