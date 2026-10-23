import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import type { CourseEditor, CourseSection } from "@/lib/creator-types";
import type {
  PublicCourseCard,
  PublicCoursePage,
  PublicCreatorInfo,
  PublicCreatorPage,
  PublicLessonMeta,
  PublicSectionMeta,
} from "@/lib/learner-types";
import { MOCK_CURRENT_CREATOR } from "@/lib/mocks/creator-app";
import { readMockCourses } from "@/lib/services/courses";
import { consumeForcedFailure, mockLatency } from "@/lib/services/mock-utils";

/**
 * Storefront service contract — public, read-only reads for creator pages.
 *
 * HARD RULES (mirrored by the Prompt 5 backend):
 *  - only `published` courses are ever returned;
 *  - handles resolve to public profile fields only;
 *  - lesson media refs/storages keys are NEVER exposed — only counts,
 *    durations, and titles; one preview lesson is marked per course.
 */

export interface StorefrontService {
  getCreator(handle: string): Promise<ApiResult<PublicCreatorPage>>;
  getCourse(handle: string, slug: string): Promise<ApiResult<PublicCoursePage>>;
}

const CREATORS: Record<string, PublicCreatorInfo> = {
  "meera-shoots": {
    handle: MOCK_CURRENT_CREATOR.handle,
    displayName: MOCK_CURRENT_CREATOR.displayName,
    avatarUrl: MOCK_CURRENT_CREATOR.avatarUrl,
    tagline: MOCK_CURRENT_CREATOR.tagline,
    niche: MOCK_CURRENT_CREATOR.niche,
    links: MOCK_CURRENT_CREATOR.links,
  },
};

function err<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function publishedCourses(): CourseEditor[] {
  return readMockCourses().filter((course) => course.status === "published");
}

function toCard(course: CourseEditor): PublicCourseCard {
  return {
    id: course.id,
    slug: course.slug ?? course.id,
    title: course.title,
    shortDescription: course.shortDescription,
    priceInPaise: course.priceInPaise ?? 0,
    coverPreviewUrl: course.cover?.previewUrl ?? null,
    lessonCount: course.sections.reduce((sum, section) => sum + section.lessons.length, 0),
  };
}

/** The first video lesson is the free preview; everything else stays locked. */
function toPublicSections(sections: CourseSection[]): PublicSectionMeta[] {
  let previewMarked = false;
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: section.lessons.map((lesson): PublicLessonMeta => {
      const isPreview = !previewMarked && lesson.type === "video";
      if (isPreview) previewMarked = true;
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        durationLabel: lesson.media[0]?.durationLabel,
        resourceCount: lesson.type === "resources" ? lesson.media.length : 0,
        isPreview,
      };
    }),
  }));
}

function countByType(course: CourseEditor, type: "video" | "resources"): number {
  return course.sections.reduce(
    (sum, section) => sum + section.lessons.filter((lesson) => lesson.type === type).length,
    0,
  );
}

function estimateDurationLabel(course: CourseEditor): string {
  const minutes = course.sections.reduce(
    (sum, section) => sum + section.lessons.length * 8,
    0,
  );
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

class MockStorefrontService implements StorefrontService {
  async getCreator(handle: string): Promise<ApiResult<PublicCreatorPage>> {
    await mockLatency(220, 180);
    const forced = consumeForcedFailure<PublicCreatorPage>();
    if (forced) return forced;
    const creator = CREATORS[handle];
    if (!creator) {
      return err("not_found", "This creator page doesn't exist or isn't public anymore.");
    }
    const courses = publishedCourses()
      .filter((course) => course.creatorHandle === handle)
      .map(toCard);
    return ok({ ...creator, courses });
  }

  async getCourse(handle: string, slug: string): Promise<ApiResult<PublicCoursePage>> {
    await mockLatency(220, 180);
    const forced = consumeForcedFailure<PublicCoursePage>();
    if (forced) return forced;
    const creator = CREATORS[handle];
    if (!creator) {
      return err("not_found", "This creator page doesn't exist or isn't public anymore.");
    }
    const course = publishedCourses().find(
      (item) => item.creatorHandle === handle && item.slug === slug,
    );
    if (!course) {
      return err(
        "not_found",
        "This course isn't available. It may be unpublished, archived, or the link is wrong.",
      );
    }
    return ok({
      id: course.id,
      slug: course.slug ?? course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      priceInPaise: course.priceInPaise ?? 0,
      coverPreviewUrl: course.cover?.previewUrl ?? null,
      outcomes: course.outcomes,
      sections: toPublicSections(course.sections),
      lessonCount: course.sections.reduce((sum, s) => sum + s.lessons.length, 0),
      videoCount: countByType(course, "video"),
      resourceCount: course.sections.reduce(
        (sum, s) =>
          sum +
          s.lessons
            .filter((l) => l.type === "resources")
            .reduce((inner, l) => inner + l.media.length, 0),
        0,
      ),
      durationLabel: estimateDurationLabel(course),
      creator,
    });
  }
}

const mockStorefrontService = new MockStorefrontService();

// ---------------------------------------------------------------------------
// Live adapter — public, read-only storefront reads from the real database.
// ---------------------------------------------------------------------------

import { get as apiGet } from "@/lib/services/api";

class ApiStorefrontService implements StorefrontService {
  getCreator(handle: string) {
    return apiGet<PublicCreatorPage>(`storefront/${encodeURIComponent(handle)}`);
  }
  getCourse(handle: string, slug: string) {
    return apiGet<PublicCoursePage>(
      `storefront/${encodeURIComponent(handle)}/${encodeURIComponent(slug)}`,
    );
  }
}

const apiStorefrontService = new ApiStorefrontService();

export function getStorefrontService(): StorefrontService | null {
  if (USE_MOCK_SERVICES) return mockStorefrontService;
  return apiStorefrontService;
}
