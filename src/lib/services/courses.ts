import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import type {
  CourseEditor,
  CourseListItem,
  CourseSection,
  CourseStatus,
  Lesson,
  LessonType,
  MediaRef,
  ReadinessItem,
} from "@/lib/creator-types";
import { seedCourses, seedOrders } from "@/lib/mocks/creator-app";
import {
  consumeForcedFailure,
  containsFailTrigger,
  mockId,
  mockLatency,
} from "@/lib/services/mock-utils";

/**
 * Course service contract — the ONLY interface the creator app uses for
 * course data. Prompt 5 implements this against PostgreSQL + R2; today a
 * session-persisted in-memory mock powers the whole draft workflow.
 */

export type CourseStage = "details" | "curriculum" | "pricing" | "review";

export interface CourseDetailsPatch {
  title?: string;
  shortDescription?: string;
  outcomes?: string[];
  cover?: MediaRef | null;
}

export interface LessonInput {
  type: LessonType;
  title: string;
  description: string;
  media: MediaRef[];
}

export interface CourseService {
  /** Create a new empty draft and return it (editor opens at "details"). */
  createDraft(): Promise<ApiResult<CourseEditor>>;
  getCourse(courseId: string): Promise<ApiResult<CourseEditor>>;
  listCourses(): Promise<ApiResult<CourseListItem[]>>;
  /** Autosave target for details fields (per-field calls are fine). */
  saveDetails(courseId: string, patch: CourseDetailsPatch): Promise<ApiResult<CourseEditor>>;
  setPrice(courseId: string, priceInPaise: number): Promise<ApiResult<CourseEditor>>;

  addSection(courseId: string, title: string): Promise<ApiResult<CourseSection>>;
  updateSection(courseId: string, sectionId: string, patch: { title: string }): Promise<ApiResult<CourseSection>>;
  deleteSection(courseId: string, sectionId: string): Promise<ApiResult<void>>;
  reorderSections(courseId: string, orderedSectionIds: string[]): Promise<ApiResult<void>>;

  addLesson(courseId: string, sectionId: string, input: LessonInput): Promise<ApiResult<Lesson>>;
  updateLesson(courseId: string, sectionId: string, lessonId: string, patch: LessonInput): Promise<ApiResult<Lesson>>;
  deleteLesson(courseId: string, sectionId: string, lessonId: string): Promise<ApiResult<void>>;
  reorderLessons(courseId: string, sectionId: string, orderedLessonIds: string[]): Promise<ApiResult<void>>;

  /** Server-side readiness validation happens here; UI mirrors client-side. */
  publish(courseId: string): Promise<ApiResult<CourseEditor>>;
  unpublish(courseId: string): Promise<ApiResult<CourseEditor>>;
  archive(courseId: string): Promise<ApiResult<CourseEditor>>;
  unarchive(courseId: string): Promise<ApiResult<CourseEditor>>;
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "untitled-course";
}

/** Client-mirrored checklist; the service repeats it authoritatively. */
export function readinessChecklist(course: CourseEditor): ReadinessItem[] {
  const lessonCounts = course.sections.map((section) => section.lessons.length);
  const emptySections = lessonCounts.filter((count) => count === 0).length;
  return [
    {
      key: "title",
      label: "Course title completed",
      ok: course.title.trim().length > 0,
      stage: "details",
    },
    {
      key: "description",
      label: "Short description completed",
      ok: course.shortDescription.trim().length > 0,
      stage: "details",
    },
    {
      key: "cover",
      label: "Cover image selected",
      ok: course.cover !== null,
      stage: "details",
    },
    {
      key: "creator",
      label: "Creator profile available",
      ok: course.creatorHandle.trim().length > 0,
      stage: "details",
    },
    {
      key: "sections",
      label: "At least one section",
      ok: course.sections.length > 0,
      stage: "curriculum",
    },
    {
      key: "lessons",
      label: "Every section has lessons",
      ok: course.sections.length > 0 && emptySections === 0,
      stage: "curriculum",
      detail: emptySections > 0 ? `${emptySections} section${emptySections > 1 ? "s" : ""} still empty` : undefined,
    },
    {
      key: "lesson-media",
      label: "Lessons have their content",
      ok:
        course.sections.length > 0 &&
        course.sections.every((section) =>
          section.lessons.every(
            (lesson) => lesson.title.trim().length > 0 && lesson.media.length > 0,
          ),
        ),
      stage: "curriculum",
      detail: "Every video lesson needs a video; every resource lesson needs a file.",
    },
    {
      key: "price",
      label: "Valid price in INR",
      ok: course.priceInPaise !== null && course.priceInPaise > 0,
      stage: "pricing",
    },
  ];
}

export function isReadyToPublish(course: CourseEditor): boolean {
  return readinessChecklist(course).every((item) => item.ok);
}

// ---------------------------------------------------------------------------
// Mock adapter — in-memory, session-persisted, deterministic failure triggers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "coursekit_mock_courses_v1";

function loadCourses(): CourseEditor[] {
  const seeded = seedCourses();
  if (typeof window === "undefined") return seeded;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return seeded;
    const parsed = JSON.parse(raw) as CourseEditor[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seeded;
  } catch {
    return seeded;
  }
}

function persist(courses: CourseEditor[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // Quota exceeded — keep the session running on memory only.
  }
}

/** Reset all demo data to the seed (demo control). */
export function resetCourseMockData(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Read the mock course catalogue fresh from storage. Used by the storefront
 * and learner services so studio edits (publish/unpublish) reflect publicly
 * within the same browser session — a single demo source of truth.
 */
export function readMockCourses(): CourseEditor[] {
  return loadCourses();
}

function err<T>(code: string, message: string, fieldErrors?: Record<string, string[]>): ApiResult<T> {
  return { ok: false, error: { code, message, fieldErrors } };
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

class MockCourseService implements CourseService {
  private courses: CourseEditor[];

  constructor() {
    this.courses = loadCourses();
  }

  private find(courseId: string): CourseEditor | null {
    return this.courses.find((course) => course.id === courseId) ?? null;
  }

  private touch(course: CourseEditor): void {
    course.updatedAt = new Date().toISOString();
    persist(this.courses);
  }

  /** Save/upload failure trigger: "[fail]" in any edited text forces an error. */
  private failIfTriggered(values: (string | undefined)[]): ApiResult<never> | null {
    if (values.some(containsFailTrigger)) {
      return err(
        "save_failed",
        "Simulated save failure (your text contained the [fail] trigger). Your changes are safe — retry to save.",
      );
    }
    return null;
  }

  async createDraft(): Promise<ApiResult<CourseEditor>> {
    await mockLatency();
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const draft: CourseEditor = {
      id: mockId("draft"),
      creatorHandle: "meera-shoots",
      status: "draft",
      slug: null,
      title: "",
      shortDescription: "",
      outcomes: [],
      cover: null,
      priceInPaise: null,
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
    };
    this.courses = [draft, ...this.courses];
    persist(this.courses);
    return ok(structuredClone(draft));
  }

  async getCourse(courseId: string): Promise<ApiResult<CourseEditor>> {
    await mockLatency(200, 150);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) {
      return err("not_found", "We couldn't find that course. It may have been removed or the link is wrong.");
    }
    return ok(structuredClone(course));
  }

  async listCourses(): Promise<ApiResult<CourseListItem[]>> {
    await mockLatency(200, 200);
    const forced = consumeForcedFailure<CourseListItem[]>();
    if (forced) return forced;
    const orders = seedOrders();
    const items: CourseListItem[] = this.courses.map((course) => {
      const paid = orders.filter(
        (order) => order.courseId === course.id && order.status === "paid",
      );
      return {
        id: course.id,
        title: course.title || "Untitled course",
        status: course.status,
        coverPreviewUrl: course.cover?.previewUrl ?? null,
        priceInPaise: course.priceInPaise,
        lessonCount: course.sections.reduce((sum, s) => sum + s.lessons.length, 0),
        updatedAt: course.updatedAt,
        publishedAt: course.publishedAt,
        salesCount: paid.length,
        enrollmentCount: paid.length,
        grossInPaise: paid.reduce((sum, order) => sum + order.grossInPaise, 0),
      };
    });
    return ok(items);
  }

  async saveDetails(courseId: string, patch: CourseDetailsPatch): Promise<ApiResult<CourseEditor>> {
    await mockLatency(280, 220);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const triggered = this.failIfTriggered([
      patch.title,
      patch.shortDescription,
      ...(patch.outcomes ?? []),
    ]);
    if (triggered) return triggered as ApiResult<CourseEditor>;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Draft not found — reload the editor.");
    if (patch.title !== undefined) course.title = patch.title;
    if (patch.shortDescription !== undefined) course.shortDescription = patch.shortDescription;
    if (patch.outcomes !== undefined) course.outcomes = patch.outcomes;
    if (patch.cover !== undefined) course.cover = patch.cover;
    this.touch(course);
    return ok(structuredClone(course));
  }

  async setPrice(courseId: string, priceInPaise: number): Promise<ApiResult<CourseEditor>> {
    await mockLatency(250, 150);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Draft not found — reload the editor.");
    if (!Number.isInteger(priceInPaise) || priceInPaise <= 0) {
      return err("invalid_price", "Enter a price above ₹0.", { pricing: ["Enter a price above ₹0."] });
    }
    if (priceInPaise > 5_000_000_0) {
      return err("invalid_price", "Keep the price under ₹5,00,000.", {
        pricing: ["Keep the price under ₹5,00,000."],
      });
    }
    course.priceInPaise = priceInPaise;
    this.touch(course);
    return ok(structuredClone(course));
  }

  async addSection(courseId: string, title: string): Promise<ApiResult<CourseSection>> {
    await mockLatency();
    const forced = consumeForcedFailure<CourseSection>();
    if (forced) return forced;
    const triggered = this.failIfTriggered([title]);
    if (triggered) return triggered as ApiResult<CourseSection>;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Draft not found — reload the editor.");
    if (!title.trim()) return err("validation_failed", "Give the section a title.", { title: ["Give the section a title."] });
    const section: CourseSection = { id: mockId("sec"), title: title.trim(), lessons: [] };
    course.sections.push(section);
    this.touch(course);
    return ok(structuredClone(section));
  }

  async updateSection(courseId: string, sectionId: string, patch: { title: string }): Promise<ApiResult<CourseSection>> {
    await mockLatency(220, 150);
    const forced = consumeForcedFailure<CourseSection>();
    if (forced) return forced;
    const triggered = this.failIfTriggered([patch.title]);
    if (triggered) return triggered as ApiResult<CourseSection>;
    const course = this.find(courseId);
    const section = course?.sections.find((s) => s.id === sectionId);
    if (!course || !section) return err("not_found", "Section not found — reload the editor.");
    if (!patch.title.trim()) return err("validation_failed", "Give the section a title.", { title: ["Give the section a title."] });
    section.title = patch.title.trim();
    this.touch(course);
    return ok(structuredClone(section));
  }

  async deleteSection(courseId: string, sectionId: string): Promise<ApiResult<void>> {
    await mockLatency(220, 150);
    const forced = consumeForcedFailure<void>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Draft not found — reload the editor.");
    course.sections = course.sections.filter((s) => s.id !== sectionId);
    this.touch(course);
    return ok(undefined);
  }

  async reorderSections(courseId: string, orderedSectionIds: string[]): Promise<ApiResult<void>> {
    await mockLatency(180, 120);
    const forced = consumeForcedFailure<void>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Draft not found — reload the editor.");
    const byId = new Map(course.sections.map((s) => [s.id, s]));
    const next: CourseSection[] = [];
    for (const id of orderedSectionIds) {
      const section = byId.get(id);
      if (section) {
        next.push(section);
        byId.delete(id);
      }
    }
    course.sections = [...next, ...byId.values()];
    this.touch(course);
    return ok(undefined);
  }

  async addLesson(courseId: string, sectionId: string, input: LessonInput): Promise<ApiResult<Lesson>> {
    await mockLatency();
    const forced = consumeForcedFailure<Lesson>();
    if (forced) return forced;
    const triggered = this.failIfTriggered([input.title, input.description]);
    if (triggered) return triggered as ApiResult<Lesson>;
    const course = this.find(courseId);
    const section = course?.sections.find((s) => s.id === sectionId);
    if (!course || !section) return err("not_found", "Section not found — reload the editor.");
    if (!input.title.trim()) return err("validation_failed", "Give the lesson a title.", { title: ["Give the lesson a title."] });
    if (input.media.length === 0) {
      return err("validation_failed", "Attach the lesson content before saving.", {
        media: [input.type === "video" ? "Upload the lesson video." : "Attach at least one file."],
      });
    }
    const lesson: Lesson = { id: mockId("les"), ...input, title: input.title.trim() };
    section.lessons.push(lesson);
    this.touch(course);
    return ok(structuredClone(lesson));
  }

  async updateLesson(courseId: string, sectionId: string, lessonId: string, patch: LessonInput): Promise<ApiResult<Lesson>> {
    await mockLatency();
    const forced = consumeForcedFailure<Lesson>();
    if (forced) return forced;
    const triggered = this.failIfTriggered([patch.title, patch.description]);
    if (triggered) return triggered as ApiResult<Lesson>;
    const course = this.find(courseId);
    const section = course?.sections.find((s) => s.id === sectionId);
    const lesson = section?.lessons.find((l) => l.id === lessonId);
    if (!course || !section || !lesson) return err("not_found", "Lesson not found — reload the editor.");
    if (!patch.title.trim()) return err("validation_failed", "Give the lesson a title.", { title: ["Give the lesson a title."] });
    if (patch.media.length === 0) {
      return err("validation_failed", "Attach the lesson content before saving.", {
        media: [patch.type === "video" ? "Upload the lesson video." : "Attach at least one file."],
      });
    }
    lesson.type = patch.type;
    lesson.title = patch.title.trim();
    lesson.description = patch.description;
    lesson.media = patch.media;
    this.touch(course);
    return ok(structuredClone(lesson));
  }

  async deleteLesson(courseId: string, sectionId: string, lessonId: string): Promise<ApiResult<void>> {
    await mockLatency(220, 150);
    const forced = consumeForcedFailure<void>();
    if (forced) return forced;
    const course = this.find(courseId);
    const section = course?.sections.find((s) => s.id === sectionId);
    if (!course || !section) return err("not_found", "Section not found — reload the editor.");
    section.lessons = section.lessons.filter((l) => l.id !== lessonId);
    this.touch(course);
    return ok(undefined);
  }

  async reorderLessons(courseId: string, sectionId: string, orderedLessonIds: string[]): Promise<ApiResult<void>> {
    await mockLatency(180, 120);
    const forced = consumeForcedFailure<void>();
    if (forced) return forced;
    const course = this.find(courseId);
    const section = course?.sections.find((s) => s.id === sectionId);
    if (!course || !section) return err("not_found", "Section not found — reload the editor.");
    const byId = new Map(section.lessons.map((l) => [l.id, l]));
    const next: Lesson[] = [];
    for (const id of orderedLessonIds) {
      const lesson = byId.get(id);
      if (lesson) {
        next.push(lesson);
        byId.delete(id);
      }
    }
    section.lessons = [...next, ...byId.values()];
    this.touch(course);
    return ok(undefined);
  }

  async publish(courseId: string): Promise<ApiResult<CourseEditor>> {
    await mockLatency(400, 300);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Draft not found — reload the editor.");
    // Authoritative readiness validation, mirroring the client checklist.
    const missing = readinessChecklist(course).filter((item) => !item.ok);
    if (missing.length > 0) {
      const fieldErrors: Record<string, string[]> = {};
      for (const item of missing) {
        (fieldErrors[item.stage] ??= []).push(item.label);
      }
      return err(
        "validation_failed",
        `This course isn't ready to publish yet. ${missing.length} item${missing.length > 1 ? "s" : ""} need attention.`,
        fieldErrors,
      );
    }
    course.status = "published";
    course.slug = course.slug ?? slugify(course.title);
    course.publishedAt = course.publishedAt ?? new Date().toISOString();
    this.touch(course);
    return ok(structuredClone(course));
  }

  async unpublish(courseId: string): Promise<ApiResult<CourseEditor>> {
    await mockLatency(300, 200);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Course not found.");
    if (course.status !== "published") {
      return err("invalid_state", "Only a published course can be unpublished.");
    }
    course.status = "unpublished";
    this.touch(course);
    return ok(structuredClone(course));
  }

  async archive(courseId: string): Promise<ApiResult<CourseEditor>> {
    await mockLatency(300, 200);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Course not found.");
    course.status = "archived";
    this.touch(course);
    return ok(structuredClone(course));
  }

  async unarchive(courseId: string): Promise<ApiResult<CourseEditor>> {
    await mockLatency(300, 200);
    const forced = consumeForcedFailure<CourseEditor>();
    if (forced) return forced;
    const course = this.find(courseId);
    if (!course) return err("not_found", "Course not found.");
    if (course.status !== "archived") {
      return err("invalid_state", "Only an archived course can be restored.");
    }
    course.status = "draft";
    this.touch(course);
    return ok(structuredClone(course));
  }
}

let instance: MockCourseService | null = null;

function getMock(): MockCourseService {
  instance ??= new MockCourseService();
  return instance;
}

// ---------------------------------------------------------------------------
// Live adapter — real backend over /api/v1 (identical contract, real data)
// ---------------------------------------------------------------------------

import { del, get as apiGet, post as apiPost, patch as apiPatch, put as apiPut } from "@/lib/services/api";

class ApiCourseService implements CourseService {
  createDraft() {
    return apiPost<CourseEditor>("courses", {});
  }
  getCourse(courseId: string) {
    return apiGet<CourseEditor>(`courses/${courseId}`);
  }
  listCourses() {
    return apiGet<CourseListItem[]>("courses");
  }
  saveDetails(courseId: string, patch: CourseDetailsPatch) {
    return apiPatch<CourseEditor>(`courses/${courseId}`, {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.shortDescription !== undefined ? { shortDescription: patch.shortDescription } : {}),
      ...(patch.outcomes !== undefined ? { outcomes: patch.outcomes } : {}),
      ...(patch.cover !== undefined ? { coverAssetId: patch.cover ? patch.cover.id : null } : {}),
    });
  }
  setPrice(courseId: string, priceInPaise: number) {
    return apiPatch<CourseEditor>(`courses/${courseId}`, { priceInPaise });
  }
  addSection(courseId: string, title: string) {
    return apiPost<CourseSection>(`courses/${courseId}/sections`, { title });
  }
  updateSection(courseId: string, sectionId: string, patch: { title: string }) {
    return apiPatch<CourseSection>(`courses/${courseId}/sections/${sectionId}`, patch);
  }
  deleteSection(courseId: string, sectionId: string) {
    return del<void>(`courses/${courseId}/sections/${sectionId}`);
  }
  reorderSections(courseId: string, orderedSectionIds: string[]) {
    return apiPut<void>(`courses/${courseId}/sections/reorder`, { orderedSectionIds });
  }
  addLesson(courseId: string, sectionId: string, input: LessonInput) {
    return apiPost<Lesson>(`courses/${courseId}/sections/${sectionId}/lessons`, {
      type: input.type,
      title: input.title,
      description: input.description,
      mediaIds: input.media.map((ref) => ref.id),
    });
  }
  updateLesson(courseId: string, sectionId: string, lessonId: string, patch: LessonInput) {
    return apiPatch<Lesson>(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
      type: patch.type,
      title: patch.title,
      description: patch.description,
      mediaIds: patch.media.map((ref) => ref.id),
    });
  }
  deleteLesson(courseId: string, sectionId: string, lessonId: string) {
    return del<void>(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
  }
  reorderLessons(courseId: string, sectionId: string, orderedLessonIds: string[]) {
    return apiPut<void>(`courses/${courseId}/sections/${sectionId}/lessons/reorder`, { orderedLessonIds });
  }
  publish(courseId: string) {
    return apiPost<CourseEditor>(`courses/${courseId}/status`, { action: "publish" });
  }
  unpublish(courseId: string) {
    return apiPost<CourseEditor>(`courses/${courseId}/status`, { action: "unpublish" });
  }
  archive(courseId: string) {
    return apiPost<CourseEditor>(`courses/${courseId}/status`, { action: "archive" });
  }
  unarchive(courseId: string) {
    return apiPost<CourseEditor>(`courses/${courseId}/status`, { action: "unarchive" });
  }
}

const apiCourseService = new ApiCourseService();

/**
 * Returns the configured course service: mock only with the explicit mock
 * flag, otherwise the live API adapter.
 */
export function getCourseService(): CourseService | null {
  if (USE_MOCK_SERVICES) return getMock();
  return apiCourseService;
}
