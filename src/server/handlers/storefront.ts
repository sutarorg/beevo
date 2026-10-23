import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  lessonMedia,
  lessons,
  mediaAssets,
  platformSettings,
  sections,
  users,
} from "@/db/schema";
import { route } from "@/server/router";
import { fail, ok } from "@/server/http";
import type {
  PublicCourseCard,
  PublicCoursePage,
  PublicCreatorInfo,
  PublicCreatorPage,
  PublicSectionMeta,
} from "@/lib/learner-types";

/**
 * Public storefront — only intentionally public fields: creator profile card
 * + published courses. No media refs, no enrolments, no private data.
 */

async function isMaintenanceMode(): Promise<boolean> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, "flags"),
  });
  const flags = (row?.value ?? {}) as { maintenanceMode?: boolean };
  return flags.maintenanceMode === true;
}

async function resolvePublicCreator(
  handle: string,
): Promise<{ row: typeof users.$inferSelect; info: PublicCreatorInfo } | null> {
  const creator = await db.query.users.findFirst({
    where: and(eq(users.handle, handle.toLowerCase()), isNull(users.suspendedAt)),
  });
  if (!creator || !creator.handle) return null;
  return {
    row: creator,
    info: {
      handle: creator.handle,
      displayName: creator.name,
      avatarUrl: creator.avatarUrl || "/images/avatars/meera.jpg",
      tagline: creator.tagline,
      niche: creator.niche || "Creator",
      links: creator.links,
    },
  };
}

route("GET", "storefront/:handle", async (_req, _ctx, params) => {
  if (await isMaintenanceMode()) {
    return fail(
      "maintenance",
      "Storefronts are temporarily undergoing scheduled maintenance. Please check back shortly.",
      503,
    );
  }
  const resolved = await resolvePublicCreator(params.handle);
  if (!resolved) {
    return fail("not_found", "This creator page doesn't exist or isn't public anymore.", 404);
  }
  const rows = await db.query.courses.findMany({
    where: and(eq(courses.creatorId, resolved.row.id), eq(courses.status, "published")),
  });
  const cards: PublicCourseCard[] = [];
  for (const row of rows) {
    const cover = row.coverAssetId
      ? await db.query.mediaAssets.findFirst({
          where: and(eq(mediaAssets.id, row.coverAssetId), eq(mediaAssets.status, "verified")),
        })
      : null;
    const [{ count }] = await db
      .select({ count: sql<number>`count(${lessons.id})::int` })
      .from(lessons)
      .innerJoin(sections, eq(sections.id, lessons.sectionId))
      .where(eq(sections.courseId, row.id));
    cards.push({
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title,
      shortDescription: row.shortDescription,
      priceInPaise: row.priceInPaise ?? 0,
      coverPreviewUrl: cover ? `/api/v1/media/access?assetId=${cover.id}` : null,
      lessonCount: count,
    });
  }
  const page: PublicCreatorPage = { ...resolved.info, courses: cards };
  return ok(page);
});

route("GET", "storefront/:handle/:slug", async (_req, _ctx, params) => {
  if (await isMaintenanceMode()) {
    return fail(
      "maintenance",
      "Storefronts are temporarily undergoing scheduled maintenance. Please check back shortly.",
      503,
    );
  }
  const resolved = await resolvePublicCreator(params.handle);
  if (!resolved) {
    return fail("not_found", "This creator page doesn't exist or isn't public anymore.", 404);
  }
  const course = await db.query.courses.findFirst({
    where: and(
      eq(courses.creatorId, resolved.row.id),
      eq(courses.slug, params.slug),
      eq(courses.status, "published"),
    ),
  });
  if (!course) {
    return fail(
      "not_found",
      "This course isn't available. It may be unpublished, archived, or the link is wrong.",
      404,
    );
  }
  const cover = course.coverAssetId
    ? await db.query.mediaAssets.findFirst({
        where: and(eq(mediaAssets.id, course.coverAssetId), eq(mediaAssets.status, "verified")),
      })
    : null;
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
        .select({
          lessonId: lessonMedia.lessonId,
          assetId: lessonMedia.assetId,
          duration: mediaAssets.durationLabel,
        })
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
  let previewMarked = false;
  const publicSections: PublicSectionMeta[] = sectionRows.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: lessonRows
      .filter((lesson) => lesson.sectionId === section.id)
      .map((lesson) => {
        const links = mediaLinks.filter((link) => link.lessonId === lesson.id);
        const isPreview = !previewMarked && lesson.type === "video" && links.length > 0;
        if (isPreview) previewMarked = true;
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type as "video" | "resources",
          durationLabel: links[0]?.duration ?? undefined,
          resourceCount: lesson.type === "resources" ? links.length : 0,
          isPreview,
        };
      }),
  }));
  const videoCount = lessonRows.filter((lesson) => lesson.type === "video").length;
  const resourceCount = mediaLinks.filter((link) => {
    const lesson = lessonRows.find((row) => row.id === link.lessonId);
    return lesson?.type === "resources";
  }).length;
  const minutes = Math.max(lessonRows.length * 8, 5);
  const page: PublicCoursePage = {
    id: course.id,
    slug: course.slug ?? course.id,
    title: course.title,
    shortDescription: course.shortDescription,
    priceInPaise: course.priceInPaise ?? 0,
    coverPreviewUrl: cover ? `/api/v1/media/access?assetId=${cover.id}` : null,
    outcomes: course.outcomes,
    sections: publicSections,
    lessonCount: lessonRows.length,
    videoCount,
    resourceCount,
    durationLabel:
      minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
    creator: resolved.info,
  };
  return ok(page);
});
