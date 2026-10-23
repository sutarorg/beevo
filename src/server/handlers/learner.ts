import { z } from "zod";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  enrollments,
  lastAccessed,
  lessonMedia,
  lessonProgress,
  lessons,
  mediaAssets,
  orders,
  sections,
  users,
} from "@/db/schema";
import { route } from "@/server/router";
import { fail, ok, parseBody, requireUser } from "@/server/http";
import type {
  LearnerCourseCard,
  LearnerCourseView,
  LearnerLessonMeta,
  LearnerLessonView,
  LearnerSectionView,
  PurchaseRecord,
} from "@/lib/learner-types";
import { presignUrl } from "@/server/storage";
import { R2 } from "@/server/env";

/** Learner surface — every read checks enrolment server-side. */

async function enrolledCourse(userId: string, courseId: string) {
  const enrollment = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
  });
  if (!enrollment) return null;
  return db.query.courses.findFirst({ where: eq(courses.id, courseId) });
}

async function progressMap(userId: string, courseId: string) {
  const rows = await db.query.lessonProgress.findMany({
    where: and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId)),
  });
  return new Map(rows.map((row) => [row.lessonId, row]));
}

route("GET", "learn/library", async (_req, ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const enrollRows = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, user.id),
  });
  if (enrollRows.length === 0) return ok([] as LearnerCourseCard[]);
  const courseRows = await db.query.courses.findMany({
    where: inArray(
      courses.id,
      enrollRows.map((row) => row.courseId),
    ),
  });
  const cards: LearnerCourseCard[] = [];
  for (const course of courseRows) {
    const creator = await db.query.users.findFirst({ where: eq(users.id, course.creatorId) });
    const lessonRows = await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(sections, eq(sections.id, lessons.sectionId))
      .where(eq(sections.courseId, course.id));
    const progress = await progressMap(user.id, course.id);
    const completed = lessonRows.filter((row) => progress.get(row.id)?.completed).length;
    const access = await db.query.lastAccessed.findFirst({
      where: and(eq(lastAccessed.userId, user.id), eq(lastAccessed.courseId, course.id)),
    });
    const cover = course.coverAssetId
      ? await db.query.mediaAssets.findFirst({
          where: and(eq(mediaAssets.id, course.coverAssetId), eq(mediaAssets.status, "verified")),
        })
      : null;
    const total = lessonRows.length;
    cards.push({
      courseId: course.id,
      slug: course.slug ?? course.id,
      title: course.title,
      creatorName: creator?.name ?? "Creator",
      creatorHandle: creator?.handle ?? "",
      coverPreviewUrl: cover ? `/api/v1/media/access?assetId=${cover.id}` : null,
      totalLessons: total,
      completedLessons: completed,
      progressPct: total === 0 ? 0 : Math.round((completed / total) * 100),
      lastAccessedLessonId: access?.lessonId ?? null,
      lastAccessedAt: access?.at.toISOString() ?? null,
      completedAll: total > 0 && completed === total,
    });
  }
  cards.sort((a, b) => (b.lastAccessedAt ?? "").localeCompare(a.lastAccessedAt ?? ""));
  return ok(cards);
});

route("GET", "learn/courses/:courseId", async (_req, ctx, params) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const course = await enrolledCourse(user.id, params.courseId);
  if (!course) {
    return fail(
      "not_enrolled",
      "You haven't purchased this course. Enrol first to start learning.",
      403,
    );
  }
  const creator = await db.query.users.findFirst({ where: eq(users.id, course.creatorId) });
  const sectionRows = await db.query.sections.findMany({
    where: eq(sections.courseId, course.id),
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
  const mediaLinks = lessonRows.length
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
  const progress = await progressMap(user.id, course.id);
  const toMeta = (lesson: (typeof lessonRows)[number]): LearnerLessonMeta => {
    const saved = progress.get(lesson.id);
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type as "video" | "resources",
      durationLabel: mediaLinks.find((link) => link.lessonId === lesson.id)?.asset.durationLabel ?? undefined,
      completed: saved?.completed ?? false,
      positionSeconds: saved?.positionSeconds ?? 0,
      resources:
        lesson.type === "resources"
          ? mediaLinks
              .filter((link) => link.lessonId === lesson.id)
              .map((link) => ({
                id: link.asset.id,
                fileName: link.asset.fileName,
                sizeBytes: Number(link.asset.verifiedSizeBytes ?? link.asset.declaredSizeBytes),
              }))
          : [],
    };
  };
  const views: LearnerSectionView[] = sectionRows.map((section, index) => ({
    id: section.id,
    title: section.title || `Section ${index + 1}`,
    lessons: lessonRows.filter((lesson) => lesson.sectionId === section.id).map(toMeta),
  }));
  const total = lessonRows.length;
  const completed = lessonRows.filter((lesson) => progress.get(lesson.id)?.completed).length;
  const access = await db.query.lastAccessed.findFirst({
    where: and(eq(lastAccessed.userId, user.id), eq(lastAccessed.courseId, course.id)),
  });
  const cover = course.coverAssetId
    ? await db.query.mediaAssets.findFirst({
        where: and(eq(mediaAssets.id, course.coverAssetId), eq(mediaAssets.status, "verified")),
      })
    : null;
  const view: LearnerCourseView = {
    courseId: course.id,
    slug: course.slug ?? course.id,
    title: course.title,
    creatorName: creator?.name ?? "Creator",
    creatorHandle: creator?.handle ?? "",
    coverPreviewUrl: cover ? `/api/v1/media/access?assetId=${cover.id}` : null,
    sections: views,
    totalLessons: total,
    completedLessons: completed,
    progressPct: total === 0 ? 0 : Math.round((completed / total) * 100),
    completedAll: total > 0 && completed === total,
    lastAccessedLessonId: access?.lessonId ?? views[0]?.lessons[0]?.id ?? null,
  };
  return ok(view);
});

route("GET", "learn/courses/:courseId/lessons/:lessonId", async (_req, ctx, params) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const course = await enrolledCourse(user.id, params.courseId);
  if (!course) return fail("not_enrolled", "You haven't purchased this course.", 403);
  const flat = await db
    .select({ lesson: lessons, section: sections })
    .from(lessons)
    .innerJoin(sections, eq(sections.id, lessons.sectionId))
    .where(eq(sections.courseId, course.id))
    .orderBy(asc(sections.position), asc(lessons.position));
  const index = flat.findIndex((entry) => entry.lesson.id === params.lessonId);
  if (index === -1) return fail("not_found", "That lesson isn't part of this course.", 404);
  const current = flat[index];
  const progress = await progressMap(user.id, course.id);
  const saved = progress.get(current.lesson.id);

  // Mark last-accessed server-side.
  await db
    .insert(lastAccessed)
    .values({ userId: user.id, courseId: course.id, lessonId: current.lesson.id, at: new Date() })
    .onConflictDoUpdate({
      target: [lastAccessed.userId, lastAccessed.courseId],
      set: { lessonId: current.lesson.id, at: new Date() },
    });
  await db
    .insert(lessonProgress)
    .values({ userId: user.id, lessonId: current.lesson.id, courseId: course.id })
    .onConflictDoNothing();

  const links = await db
    .select({ asset: mediaAssets })
    .from(lessonMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
    .where(and(eq(lessonMedia.lessonId, current.lesson.id), eq(mediaAssets.status, "verified")))
    .orderBy(asc(lessonMedia.position));

  const isVideo = current.lesson.type === "video";
  const videoAsset = isVideo ? links[0]?.asset : null;
  let playback: LearnerLessonView["playback"] = {
    mode: "simulated",
    durationSeconds: 0,
    resumeAtSeconds: 0,
    note: "",
  };
  if (isVideo && videoAsset) {
    if (R2.configured) {
      const signed = presignUrl({
        method: "GET",
        key: videoAsset.storageKey,
        expiresSeconds: 900,
      });
      const durationLabel = videoAsset.durationLabel ?? "8:00";
      const parsedSeconds = durationLabel
        .split(":")
        .map(Number)
        .reduce((acc, part) => (Number.isFinite(part) ? acc * 60 + part : acc), 0);
      const durationSeconds = parsedSeconds > 0 ? parsedSeconds : 480;
      playback = {
        mode: "direct",
        deliveryUrl: `/api/v1/media/access?assetId=${videoAsset.id}`,
        url: signed.url,
        expiresAt: signed.expiresAt,
        durationSeconds,
        resumeAtSeconds: Math.min(saved?.positionSeconds ?? 0, Math.max(durationSeconds - 10, 0)),
        note: "Secure short-lived delivery URL.",
      };
    } else {
      playback = {
        mode: "simulated",
        durationSeconds: 480,
        resumeAtSeconds: Math.min(saved?.positionSeconds ?? 0, 470),
        note: "Media storage isn't configured — playback is simulated until it is.",
      };
    }
  }

  const meta: LearnerLessonMeta = {
    id: current.lesson.id,
    title: current.lesson.title,
    description: current.lesson.description,
    type: current.lesson.type as "video" | "resources",
    durationLabel: videoAsset?.durationLabel ?? undefined,
    completed: saved?.completed ?? false,
    positionSeconds: saved?.positionSeconds ?? 0,
    resources:
      current.lesson.type === "resources"
        ? links.map(({ asset }) => ({
            id: asset.id,
            fileName: asset.fileName,
            sizeBytes: Number(asset.verifiedSizeBytes ?? asset.declaredSizeBytes),
          }))
        : [],
  };
  const view: LearnerLessonView = {
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug ?? course.id,
    lesson: meta,
    sectionTitle: current.section.title,
    prevLessonId: index > 0 ? flat[index - 1].lesson.id : null,
    nextLessonId: index < flat.length - 1 ? flat[index + 1].lesson.id : null,
    playback,
  };
  return ok(view);
});

route("PUT", "learn/courses/:courseId/lessons/:lessonId/progress", async (req, ctx, params) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const course = await enrolledCourse(user.id, params.courseId);
  if (!course) return fail("not_enrolled", "You haven't purchased this course.", 403);

  const belongs = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(sections, eq(sections.id, lessons.sectionId))
    .where(and(eq(sections.courseId, course.id), eq(lessons.id, params.lessonId)))
    .limit(1);
  if (belongs.length === 0) {
    return fail("not_found", "That lesson isn't part of this course.", 404);
  }

  const parsed = parseBody(
    z.object({
      completed: z.boolean().optional(),
      positionSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
    }),
    await req.json().catch(() => ({})),
  );
  if ("response" in parsed) return parsed.response;
  const existing = await db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, user.id),
      eq(lessonProgress.lessonId, params.lessonId),
    ),
  });
  const next = {
    completed: parsed.values.completed ?? existing?.completed ?? false,
    positionSeconds: parsed.values.positionSeconds ?? existing?.positionSeconds ?? 0,
  };
  await db
    .insert(lessonProgress)
    .values({
      userId: user.id,
      lessonId: params.lessonId,
      courseId: course.id,
      ...next,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { ...next, updatedAt: new Date() },
    });
  return ok(undefined);
});

route("GET", "learn/purchases", async (_req, ctx) => {
  const user = requireUser(ctx);
  if (user instanceof Response) return user;
  const rows = await db.query.orders.findMany({
    where: and(
      eq(orders.userId, user.id),
      inArray(orders.status, ["paid", "paid_reversed"]),
    ),
    orderBy: [sql`${orders.placedAt} DESC`],
  });
  const records: PurchaseRecord[] = rows.map((row) => ({
    id: `lpur_${row.id}`,
    orderId: row.id,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    amountInPaise: row.grossInPaise,
    status: row.status === "paid" ? ("paid" as const) : ("refunded" as const),
    placedAt: row.placedAt.toISOString(),
    demo: false,
  }));
  return ok(records);
});
