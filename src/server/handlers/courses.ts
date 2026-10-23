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
import { buildStorageKey, presignUrl, UPLOAD_LIMITS, verifyObjectExists } from "@/server/storage";
import { R2 } from "@/server/env";
import type { CourseEditor, CourseListItem, CourseSection, Lesson, MediaRef } from "@/lib/creator-types";
import { readinessChecklist } from "@/lib/services/courses";

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
    previewUrl: asset.kind === "cover" ? `/api/v1/media/access?assetId=${asset.id}` : undefined,
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
        media: mediaByLesson.get(lesson.id) ?? [],
      })),
  }));
  return {
    id: course.id,
    creatorHandle: creator?.handle ?? "",
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
  await db
    .delete(sections)
    .where(and(eq(sections.id, params.sectionId), eq(sections.courseId, params.id)));
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, params.id));
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
  await db
    .update(lessons)
    .set({
      type: parsed.values.type,
      title: parsed.values.title,
      description: parsed.values.description,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, params.lessonId), eq(lessons.sectionId, params.sectionId)));
  await db.delete(lessonMedia).where(eq(lessonMedia.lessonId, params.lessonId));
  await db.insert(lessonMedia).values(
    parsed.values.mediaIds.map((assetId, position) => ({
      lessonId: params.lessonId,
      assetId,
      position,
    })),
  );
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, course.id));
  const editor = await editorFor(course.id);
  const updated = editor?.sections.flatMap((s) => s.lessons).find((l) => l.id === params.lessonId);
  return ok(updated);
});

route("DELETE", "courses/:id/sections/:sectionId/lessons/:lessonId", async (_req, ctx, params) => {
  const user = requireVerifiedUser(ctx);
  if (user instanceof Response) return user;
  if (!(await ownCourse(params.id, user.id))) return fail("not_found", "Draft not found.", 404);
  await db
    .delete(lessons)
    .where(and(eq(lessons.id, params.lessonId), eq(lessons.sectionId, params.sectionId)));
  await db.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, params.id));
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
  courseId: z.string().min(1),
  kind: z.enum(["cover", "video", "resource"]),
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
      media: [`Keep it under ${Math.round(limits.maxBytes / (1024 * 1024))} MB.`],
    });
  }
  // Ownership is verified BEFORE a key is minted.
  if (!(await ownCourse(input.courseId, user.id))) {
    return fail("not_found", "Course not found.", 404);
  }
  if (!R2.configured) {
    return fail(
      "provider_not_configured",
      "Media storage isn't configured yet (R2 credentials missing). Uploads are disabled until it is.",
      503,
    );
  }
  const assetId = newId("media");
  const storageKey = buildStorageKey({
    courseId: input.courseId,
    kind: input.kind,
    assetId,
    fileName: input.fileName,
  });
  await db.insert(mediaAssets).values({
    id: assetId,
    uploaderId: user.id,
    courseId: input.courseId,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    declaredSizeBytes: input.sizeBytes,
    storageKey,
  });
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
  const head = await verifyObjectExists(asset.storageKey);
  if (!head) {
    return fail(
      "upload_not_verified",
      "We couldn't verify the uploaded object in storage. Try the upload again.",
      409,
    );
  }
  const drift = Math.abs(head.sizeBytes - Number(asset.declaredSizeBytes));
  if (drift > Math.max(1024, Number(asset.declaredSizeBytes) * 0.02)) {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, asset.id));
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
  if (asset.kind === "cover") allowed = true; // covers are public sales-page assets
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
      // Public preview rule: the FIRST video lesson of a published course.
      const course = await db.query.courses.findFirst({ where: eq(courses.id, asset.courseId) });
      if (course?.status === "published") {
        const firstVideo = await db
          .select({ assetId: lessonMedia.assetId })
          .from(lessonMedia)
          .innerJoin(lessons, eq(lessons.id, lessonMedia.lessonId))
          .innerJoin(sections, eq(sections.id, lessons.sectionId))
          .where(and(eq(sections.courseId, asset.courseId), eq(lessons.type, "video")))
          .orderBy(asc(sections.position), asc(lessons.position))
          .limit(1);
        if (firstVideo[0]?.assetId === asset.id) allowed = true;
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
  if (!R2.configured) return fail("provider_not_configured", "Media storage isn't configured.", 503);

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

  // Cover images are loaded via <Image> / <img>; streaming bytes avoids cross-origin 302 errors in /_next/image.
  if (asset.kind === "cover") {
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
