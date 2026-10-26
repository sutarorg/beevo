import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { DATABASE_AVAILABLE, db, ensureDatabaseReady } from "@/db";
import {
  courses,
  lessonMedia,
  lessons,
  mediaAssets,
  platformSettings,
  sections,
  users,
} from "@/db/schema";
import type {
  PublicCourseCard,
  PublicCoursePage,
  PublicCreatorInfo,
  PublicCreatorPage,
  PublicPreviewPlayback,
  PublicSectionMeta,
} from "@/lib/learner-types";
import { isMissingDuration, parseDurationLabel } from "@/lib/utils";

/**
 * Public storefront reads shared by the API handlers and the server-rendered
 * storefront pages.
 *
 * Keeping one implementation means the HTML Google receives, the JSON the
 * client app hydrates from, and the URLs in `sitemap.xml` can never disagree
 * about what is public: only `published` courses from non-suspended creators
 * are ever returned. Nothing private (emails, media keys, enrolments) is
 * selected.
 */

/** Thrown when the storefront cannot be read at all (database unavailable). */
export class StorefrontUnavailableError extends Error {
  constructor(message = "Storefront data is temporarily unavailable.") {
    super(message);
    this.name = "StorefrontUnavailableError";
  }
}

const LEGACY_DEFAULT_AVATARS = new Set([
  "/images/avatars/meera.jpg",
  "/images/avatars/ayaan.jpg",
  "/images/avatars/diya.jpg",
]);

async function assertDatabaseReady(): Promise<void> {
  if (!DATABASE_AVAILABLE) {
    throw new StorefrontUnavailableError("Database connection isn't configured yet.");
  }
  // No-op in production; waits for the local development database (PGlite)
  // to finish applying migrations + seed before the first read.
  await ensureDatabaseReady();
}

/** Scheduled storefront maintenance pauses public pages (temporary 5xx). */
export async function isStorefrontMaintenanceMode(): Promise<boolean> {
  await assertDatabaseReady();
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, "flags"),
  });
  const flags = (row?.value ?? {}) as { maintenanceMode?: boolean };
  return flags.maintenanceMode === true;
}

async function resolvePublicCreator(
  handle: string,
): Promise<{ row: typeof users.$inferSelect; info: PublicCreatorInfo } | null> {
  const normalized = handle.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(normalized)) return null;
  // Handles are stored lowercase, but old rows and hand-typed links can differ
  // in case — resolve case-insensitively so a live storefront never 404s.
  const creator = await db.query.users.findFirst({
    where: and(sql`lower(${users.handle}) = ${normalized}`, isNull(users.suspendedAt)),
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

/**
 * Public creator page (profile + published course cards).
 *
 * Returns `null` for unknown/suspended creators so callers can answer with a
 * real 404. Throws only when the database itself is unavailable.
 *
 * Wrapped in React `cache` so `generateMetadata` and the page component share
 * one set of queries per request.
 */
export const loadPublicCreatorPage = cache(
  async (handle: string): Promise<PublicCreatorPage | null> => {
    await assertDatabaseReady();
    const resolved = await resolvePublicCreator(handle);
    if (!resolved) return null;

    const rows = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        shortDescription: courses.shortDescription,
        priceInPaise: courses.priceInPaise,
        coverAssetId: courses.coverAssetId,
      })
      .from(courses)
      .where(and(eq(courses.creatorId, resolved.row.id), eq(courses.status, "published")))
      .orderBy(desc(courses.publishedAt), asc(courses.title));

    const courseIds = rows.map((row) => row.id);
    const coverIds = rows
      .map((row) => row.coverAssetId)
      .filter((id): id is string => Boolean(id));

    // Two grouped queries instead of one query per course (avoids N+1 on
    // storefronts with many published courses).
    const verifiedCovers = coverIds.length
      ? await db
          .select({ id: mediaAssets.id })
          .from(mediaAssets)
          .where(
            and(inArray(mediaAssets.id, coverIds), eq(mediaAssets.status, "verified")),
          )
      : [];
    const lessonCounts = courseIds.length
      ? await db
          .select({
            courseId: sections.courseId,
            count: sql<number>`count(${lessons.id})::int`,
          })
          .from(sections)
          .innerJoin(lessons, eq(lessons.sectionId, sections.id))
          .where(inArray(sections.courseId, courseIds))
          .groupBy(sections.courseId)
      : [];

    const coverSet = new Set(verifiedCovers.map((cover) => cover.id));
    const cards: PublicCourseCard[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug ?? row.id,
      title: row.title,
      shortDescription: row.shortDescription,
      priceInPaise: row.priceInPaise ?? 0,
      coverPreviewUrl:
        row.coverAssetId && coverSet.has(row.coverAssetId)
          ? `/api/v1/media/access?assetId=${row.coverAssetId}`
          : null,
      lessonCount: lessonCounts.find((count) => count.courseId === row.id)?.count ?? 0,
    }));

    return { ...resolved.info, courses: cards };
  },
);

function formatCourseDuration(totalSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/**
 * Public course sales page. Published-only; `null` means "show a 404".
 * Wrapped in React `cache` so metadata + page share one read.
 */
export const loadPublicCoursePage = cache(
  async (handle: string, slug: string): Promise<PublicCoursePage | null> => {
    await assertDatabaseReady();
    if (!slug || slug.length > 200) return null;
    const resolved = await resolvePublicCreator(handle);
    if (!resolved) return null;

    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.creatorId, resolved.row.id),
        eq(courses.slug, slug),
        eq(courses.status, "published"),
      ),
    });
    if (!course) return null;

    const cover = course.coverAssetId
      ? await db.query.mediaAssets.findFirst({
          where: and(
            eq(mediaAssets.id, course.coverAssetId),
            eq(mediaAssets.status, "verified"),
          ),
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
          const isPreview =
            lesson.isPreview === true && lesson.type === "video" && links.length > 0;
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
        : Math.max(videoCount, 1) * 8 * 60;

    return {
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
  },
);

// ---------------------------------------------------------------------------
// Sitemap inputs
// ---------------------------------------------------------------------------

export interface PublishedCourseSitemapRow {
  handle: string;
  slug: string;
  lastModified: Date;
}

/**
 * Every published course URL that is safe to advertise to search engines:
 * creator not suspended, handle and slug present. A missing/unauthorised
 * database returns an empty list so `sitemap.xml` keeps serving the static
 * marketing pages instead of failing the whole response.
 */
export async function listPublishedCourseUrls(): Promise<PublishedCourseSitemapRow[]> {
  if (!DATABASE_AVAILABLE) return [];
  try {
    await ensureDatabaseReady();
    const rows = await db
      .select({
        handle: users.handle,
        slug: courses.slug,
        publishedAt: courses.publishedAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(users, eq(users.id, courses.creatorId))
      .where(
        and(
          eq(courses.status, "published"),
          isNull(users.suspendedAt),
          isNotNull(users.handle),
          isNotNull(courses.slug),
        ),
      );

    return rows
      .filter(
        (row): row is typeof row & { handle: string; slug: string } =>
          Boolean(row.handle) && Boolean(row.slug),
      )
      .map((row) => ({
        handle: row.handle,
        slug: row.slug,
        lastModified: row.updatedAt ?? row.publishedAt ?? new Date(),
      }));
  } catch (error) {
    console.error("[seo] sitemap course query failed:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Free preview playback
// ---------------------------------------------------------------------------

export type PreviewPlaybackResult =
  | { status: "ok"; playback: PublicPreviewPlayback }
  | { status: "not_found" }
  | { status: "not_a_preview" }
  | { status: "preview_unavailable" };

/**
 * Short-lived playback session for a lesson the creator explicitly marked as
 * a free preview on a published course. The returned URL is same-origin and
 * re-authorised by `/api/v1/media/access` on every request, so no storage key
 * or bucket path ever leaves the server.
 */
export async function loadPreviewPlayback(
  handle: string,
  slug: string,
  lessonId: string,
): Promise<PreviewPlaybackResult> {
  await assertDatabaseReady();
  const resolved = await resolvePublicCreator(handle);
  if (!resolved) return { status: "not_found" };

  const course = await db.query.courses.findFirst({
    where: and(
      eq(courses.creatorId, resolved.row.id),
      eq(courses.slug, slug),
      eq(courses.status, "published"),
    ),
  });
  if (!course) return { status: "not_found" };

  const lesson = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      type: lessons.type,
      isPreview: lessons.isPreview,
    })
    .from(lessons)
    .innerJoin(sections, eq(sections.id, lessons.sectionId))
    .where(and(eq(lessons.id, lessonId), eq(sections.courseId, course.id)))
    .limit(1)
    .then((rows) => rows[0]);
  if (!lesson || lesson.type !== "video" || lesson.isPreview !== true) {
    return { status: "not_a_preview" };
  }

  const asset = await db
    .select({ asset: mediaAssets })
    .from(lessonMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, lessonMedia.assetId))
    .where(and(eq(lessonMedia.lessonId, lesson.id), eq(mediaAssets.status, "verified")))
    .orderBy(asc(lessonMedia.position))
    .limit(1)
    .then((rows) => rows[0]?.asset ?? null);
  if (!asset) return { status: "preview_unavailable" };

  const durationSeconds = parseDurationLabel(asset.durationLabel);
  return {
    status: "ok",
    playback: {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      durationLabel: isMissingDuration(asset.durationLabel)
        ? undefined
        : (asset.durationLabel ?? undefined),
      durationSeconds,
      url: `/api/v1/media/access?assetId=${asset.id}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      note: "Free preview · access is re-checked by the server on every playback.",
    },
  };
}
