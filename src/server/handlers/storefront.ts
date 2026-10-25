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
  PublicPreviewPlayback,
  PublicSectionMeta,
} from "@/lib/learner-types";
import { isMissingDuration, parseDurationLabel } from "@/lib/utils";

/** Course runtime label from measured seconds: 3723 -> "1h 2m". */
function formatCourseDuration(totalSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const LEGACY_DEFAULT_AVATARS = new Set([
  "/images/avatars/meera.jpg",
  "/images/avatars/ayaan.jpg",
  "/images/avatars/diya.jpg",
]);

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
  // Handles are stored lowercase, but old rows and hand-typed links can differ
  // in case — resolve case-insensitively so a live storefront never 404s.
  const creator = await db.query.users.findFirst({
    where: and(sql`lower(${users.handle}) = ${handle.trim().toLowerCase()}`, isNull(users.suspendedAt)),
  });
  if (!creator || !creator.handle) return null;
  return {
    row: creator,
    info: {
      handle: creator.handle,
      displayName: creator.name,
      // No stock photo: null renders the generic user icon on the storefront.
      avatarUrl:
        creator.avatarUrl && !LEGACY_DEFAULT_AVATARS.has(creator.avatarUrl)
          ? creator.avatarUrl
          : null,
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
  // Fully public, published-only data: safe for shared/browser caches.
  // A creator's publish/edit becomes visible within a minute, and stale
  // copies may be served while revalidating instead of blocking buyers.
  return ok(page, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  });
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
  const publicSections: PublicSectionMeta[] = sectionRows.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: lessonRows
      .filter((lesson) => lesson.sectionId === section.id)
      .map((lesson) => {
        const links = mediaLinks.filter((link) => link.lessonId === lesson.id);
        // Preview access is an explicit creator choice on the lesson itself —
        // never inferred from position ("first video"). A preview needs real
        // playable media, so an empty video lesson stays locked.
        const isPreview = lesson.isPreview === true && lesson.type === "video" && links.length > 0;
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type as "video" | "resources",
          // A stored "0:00" is a placeholder, not a fact — never show it.
          durationLabel: isMissingDuration(links[0]?.duration)
            ? undefined
            : (links[0]?.duration ?? undefined),
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
  // Real total runtime: sum of the measured video durations. Only when no
  // video has a duration yet do we fall back to an estimate.
  const measuredSeconds = mediaLinks.reduce((total, link) => {
    const lesson = lessonRows.find((row) => row.id === link.lessonId);
    if (lesson?.type !== "video") return total;
    return total + parseDurationLabel(link.duration);
  }, 0);
  const totalSeconds =
    measuredSeconds > 0
      ? measuredSeconds
      : Math.max(lessonRows.filter((lesson) => lesson.type === "video").length, 1) * 8 * 60;
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
    durationLabel: formatCourseDuration(totalSeconds),
    creator: resolved.info,
  };
  return ok(page, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  });
});

/**
 * Free preview playback.
 *
 * Only a video lesson the creator explicitly marked as a preview on a
 * PUBLISHED course resolves. The response is a same-origin delivery URL that
 * the media route re-authorizes (short-lived R2 signature or local stream), so
 * no storage key, bucket path, or long-lived URL ever reaches the browser.
 */
route("GET", "storefront/:handle/:slug/lessons/:lessonId/preview", async (_req, _ctx, params) => {
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
    return fail("not_found", "This course isn't available right now.", 404);
  }
  const lesson = await db
    .select({ id: lessons.id, title: lessons.title, type: lessons.type, isPreview: lessons.isPreview })
    .from(lessons)
    .innerJoin(sections, eq(sections.id, lessons.sectionId))
    .where(and(eq(lessons.id, params.lessonId), eq(sections.courseId, course.id)))
    .limit(1)
    .then((rows) => rows[0]);
  if (!lesson || lesson.type !== "video" || lesson.isPreview !== true) {
    return fail(
      "not_a_preview",
      "This lesson isn't a free preview. Enrol in the course to watch it.",
      403,
    );
  }
  const asset = await db
    .select({ asset: mediaAssets })
    .from(lessonMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
    .where(and(eq(lessonMedia.lessonId, lesson.id), eq(mediaAssets.status, "verified")))
    .orderBy(asc(lessonMedia.position))
    .limit(1)
    .then((rows) => rows[0]?.asset ?? null);
  if (!asset) {
    return fail("preview_unavailable", "The preview video isn't ready yet — try again shortly.", 409);
  }
  const durationSeconds = parseDurationLabel(asset.durationLabel);
  const playback: PublicPreviewPlayback = {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    durationLabel: isMissingDuration(asset.durationLabel) ? undefined : (asset.durationLabel ?? undefined),
    durationSeconds,
    url: `/api/v1/media/access?assetId=${asset.id}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    note: "Free preview · access is re-checked by the server on every playback.",
  };
  return ok(playback);
});
