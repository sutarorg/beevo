import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import type { CourseEditor } from "@/lib/creator-types";
import type {
  LearnerCourseCard,
  LearnerCourseView,
  LearnerLessonMeta,
  LearnerLessonView,
  LearnerProfile,
  LearnerSectionView,
  LearnerSettings,
  ProgressPatch,
  PurchaseRecord,
} from "@/lib/learner-types";
import {
  DEMO_LEARNER,
  seedLearnerLastAccessed,
  seedLearnerProgress,
  seedLearnerPurchases,
} from "@/lib/mocks/learner";
import { readMockCourses } from "@/lib/services/courses";
import { consumeForcedFailure, mockLatency } from "@/lib/services/mock-utils";

/**
 * Learner service contract — session (demo sign-in), library, enrolment
 * checks, lesson access, progress, and purchase history.
 *
 * Prompt 5 replaces this with Supabase-authenticated reads: enrolment checks
 * against orders, signed R2 playback sessions, and persistent progress rows.
 * The mock stores progress in sessionStorage — it never claims to have
 * written to a production database.
 */

export interface LearnerService {
  getSession(): { signedIn: boolean; profile: LearnerProfile | null };
  signIn(email: string): Promise<ApiResult<LearnerProfile>>;
  signOut(): void;
  getLibrary(): Promise<ApiResult<LearnerCourseCard[]>>;
  getCourse(courseId: string): Promise<ApiResult<LearnerCourseView>>;
  getLesson(courseId: string, lessonId: string): Promise<ApiResult<LearnerLessonView>>;
  updateProgress(courseId: string, lessonId: string, patch: ProgressPatch): Promise<ApiResult<void>>;
  listPurchases(): Promise<ApiResult<PurchaseRecord[]>>;
  getSettings(): Promise<ApiResult<LearnerSettings>>;
  updateSettings(patch: Partial<Omit<LearnerSettings, "email">>): Promise<ApiResult<LearnerSettings>>;
}

const STORAGE_KEY = "beevo_mock_learner_v1";

interface LearnerDb {
  session: { name: string; email: string } | null;
  purchases: PurchaseRecord[];
  progress: Record<string, Record<string, { completed: boolean; positionSeconds: number; updatedAt: string }>>;
  lastAccessed: Record<string, { lessonId: string; at: string }>;
  notifyLessonEmails?: boolean;
  notifyReceiptEmails?: boolean;
}

function seedDb(): LearnerDb {
  return {
    session: null,
    purchases: seedLearnerPurchases(),
    progress: seedLearnerProgress(),
    lastAccessed: seedLearnerLastAccessed(),
  };
}

function loadDb(): LearnerDb {
  if (typeof window === "undefined") return seedDb();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDb();
    return JSON.parse(raw) as LearnerDb;
  } catch {
    return seedDb();
  }
}

function persist(db: LearnerDb): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // session runs on memory only
  }
}

export function resetLearnerMockData(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

const AUTH_REQUIRED = "auth_required";

class MockLearnerService implements LearnerService {
  private db: LearnerDb;

  constructor() {
    this.db = loadDb();
  }

  private save() {
    persist(this.db);
  }

  getSession(): { signedIn: boolean; profile: LearnerProfile | null } {
    return { signedIn: this.db.session !== null, profile: this.db.session };
  }

  async signIn(email: string): Promise<ApiResult<LearnerProfile>> {
    await mockLatency(400, 300);
    const forced = consumeForcedFailure<LearnerProfile>();
    if (forced) return forced;
    const trimmed = email.trim();
    const name = trimmed.includes("@")
      ? trimmed
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : DEMO_LEARNER.name;
    this.db.session = { name: name || DEMO_LEARNER.name, email: trimmed };
    this.save();
    return ok({ ...this.db.session });
  }

  signOut(): void {
    this.db = loadDb();
    this.db.session = null;
    this.save();
  }

  private requireAuth(): ApiResult<never> | null {
    if (!this.db.session) {
      return err(AUTH_REQUIRED, "Sign in to view your courses.");
    }
    return null;
  }

  private ownedCourseIds(): Set<string> {
    return new Set(this.db.purchases.filter((purchase) => purchase.status === "paid").map((p) => p.courseId));
  }

  private courseStats(course: CourseEditor): {
    totalLessons: number;
    completedLessons: number;
    progressPct: number;
    completedAll: boolean;
  } {
    const lessonIds = course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.id));
    const completed = lessonIds.filter((id) => this.db.progress[course.id]?.[id]?.completed).length;
    const total = lessonIds.length;
    return {
      totalLessons: total,
      completedLessons: completed,
      progressPct: total === 0 ? 0 : Math.round((completed / total) * 100),
      completedAll: total > 0 && completed === total,
    };
  }

  async getLibrary(): Promise<ApiResult<LearnerCourseCard[]>> {
    await mockLatency(280, 220);
    const forced = consumeForcedFailure<LearnerCourseCard[]>();
    if (forced) return forced;
    const gate = this.requireAuth();
    if (gate) return gate as ApiResult<LearnerCourseCard[]>;
    const owned = this.ownedCourseIds();
    const cards: LearnerCourseCard[] = [];
    for (const course of readMockCourses()) {
      if (!owned.has(course.id)) continue;
      const stats = this.courseStats(course);
      const access = this.db.lastAccessed[course.id] ?? null;
      cards.push({
        courseId: course.id,
        slug: course.slug ?? course.id,
        title: course.title,
        creatorName: "Meera Kapoor",
        creatorHandle: course.creatorHandle,
        coverPreviewUrl: course.cover?.previewUrl ?? null,
        lastAccessedLessonId: access?.lessonId ?? null,
        lastAccessedAt: access?.at ?? null,
        ...stats,
      });
    }
    return ok(cards.sort((a, b) => (b.lastAccessedAt ?? "").localeCompare(a.lastAccessedAt ?? "")));
  }

  async getCourse(courseId: string): Promise<ApiResult<LearnerCourseView>> {
    await mockLatency(240, 180);
    const forced = consumeForcedFailure<LearnerCourseView>();
    if (forced) return forced;
    const gate = this.requireAuth();
    if (gate) return gate as ApiResult<LearnerCourseView>;
    if (!this.ownedCourseIds().has(courseId)) {
      return err("not_enrolled", "You haven't purchased this course. Enrol first to start learning.");
    }
    const course = readMockCourses().find((item) => item.id === courseId);
    if (!course) return err("not_found", "This course is no longer available.");
    const stats = this.courseStats(course);
    const sections: LearnerSectionView[] = course.sections.map((section, index) => ({
      id: section.id,
      title: section.title || `Section ${index + 1}`,
      lessons: section.lessons.map((lesson) => this.toLessonMeta(course.id, lesson)),
    }));
    return ok({
      courseId: course.id,
      slug: course.slug ?? course.id,
      title: course.title,
      creatorName: "Meera Kapoor",
      creatorHandle: course.creatorHandle,
      coverPreviewUrl: course.cover?.previewUrl ?? null,
      sections,
      lastAccessedLessonId: this.db.lastAccessed[course.id]?.lessonId ?? sections[0]?.lessons[0]?.id ?? null,
      ...stats,
    });
  }

  private toLessonMeta(courseId: string, lesson: CourseEditor["sections"][number]["lessons"][number]): LearnerLessonMeta {
    const saved = this.db.progress[courseId]?.[lesson.id];
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      durationLabel: lesson.media[0]?.durationLabel,
      completed: saved?.completed ?? false,
      positionSeconds: saved?.positionSeconds ?? 0,
      resources:
        lesson.type === "resources"
          ? lesson.media.map((ref) => ({ id: ref.id, fileName: ref.fileName, sizeBytes: ref.sizeBytes }))
          : [],
    };
  }

  async getLesson(courseId: string, lessonId: string): Promise<ApiResult<LearnerLessonView>> {
    await mockLatency(220, 160);
    const forced = consumeForcedFailure<LearnerLessonView>();
    if (forced) return forced;
    const gate = this.requireAuth();
    if (gate) return gate as ApiResult<LearnerLessonView>;
    if (!this.ownedCourseIds().has(courseId)) {
      return err("not_enrolled", "You haven't purchased this course.");
    }
    const course = readMockCourses().find((item) => item.id === courseId);
    if (!course) return err("not_found", "This course is no longer available.");
    const flat = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({ section, lesson })),
    );
    const index = flat.findIndex((entry) => entry.lesson.id === lessonId);
    if (index === -1) return err("not_found", "That lesson isn't part of this course.");
    const { section, lesson } = flat[index];

    this.db.lastAccessed[courseId] = { lessonId, at: new Date().toISOString() };
    const saved = this.db.progress[courseId]?.[lessonId];
    this.db.progress[courseId] = {
      ...this.db.progress[courseId],
      [lessonId]: {
        completed: saved?.completed ?? false,
        positionSeconds: saved?.positionSeconds ?? 0,
        updatedAt: new Date().toISOString(),
      },
    };
    this.save();

    const durationSeconds = lesson.media[0]?.durationLabel
      ? lesson.media[0].durationLabel.split(":").reduce((acc, part) => acc * 60 + Number(part), 0)
      : 480;

    return ok({
      courseId,
      courseTitle: course.title,
      courseSlug: course.slug ?? course.id,
      lesson: this.toLessonMeta(courseId, lesson),
      sectionTitle: section.title,
      prevLessonId: index > 0 ? flat[index - 1].lesson.id : null,
      nextLessonId: index < flat.length - 1 ? flat[index + 1].lesson.id : null,
      playback: {
        mode: "unavailable",
        durationSeconds,
        resumeAtSeconds: Math.min(saved?.positionSeconds ?? 0, Math.max(durationSeconds - 10, 0)),
        note: "Demo data has no video file — connect media storage to stream lessons.",
      },
    });
  }

  async updateProgress(courseId: string, lessonId: string, patch: ProgressPatch): Promise<ApiResult<void>> {
    await mockLatency(120, 80);
    const forced = consumeForcedFailure<void>();
    if (forced) return forced;
    const gate = this.requireAuth();
    if (gate) return gate as ApiResult<void>;
    const saved = this.db.progress[courseId]?.[lessonId];
    this.db.progress[courseId] = {
      ...this.db.progress[courseId],
      [lessonId]: {
        completed: patch.completed ?? saved?.completed ?? false,
        positionSeconds: patch.positionSeconds ?? saved?.positionSeconds ?? 0,
        updatedAt: new Date().toISOString(),
      },
    };
    this.save();
    return ok(undefined);
  }

  async listPurchases(): Promise<ApiResult<PurchaseRecord[]>> {
    await mockLatency(240, 160);
    const forced = consumeForcedFailure<PurchaseRecord[]>();
    if (forced) return forced;
    const gate = this.requireAuth();
    if (gate) return gate as ApiResult<PurchaseRecord[]>;
    return ok([...this.db.purchases].sort((a, b) => b.placedAt.localeCompare(a.placedAt)));
  }

  async getSettings(): Promise<ApiResult<LearnerSettings>> {
    const session = this.db.session;
    return ok<LearnerSettings>({
      name: session?.name ?? "Learner",
      email: session?.email ?? "learner@beevo.in",
      notifyLessonEmails: this.db.notifyLessonEmails ?? true,
      notifyReceiptEmails: this.db.notifyReceiptEmails ?? true,
    });
  }

  async updateSettings(
    patch: Partial<Omit<LearnerSettings, "email">>,
  ): Promise<ApiResult<LearnerSettings>> {
    await mockLatency(200, 150);
    this.db.notifyLessonEmails = patch.notifyLessonEmails ?? this.db.notifyLessonEmails ?? true;
    this.db.notifyReceiptEmails = patch.notifyReceiptEmails ?? this.db.notifyReceiptEmails ?? true;
    this.save();
    return this.getSettings();
  }

}

let instance: MockLearnerService | null = null;

function getMock(): MockLearnerService {
  instance ??= new MockLearnerService();
  return instance;
}

// ---------------------------------------------------------------------------
// Live adapter — real enrolments, progress, and purchases via /api/v1/learn/*
// ---------------------------------------------------------------------------

import { clearLocalSession, fetchSession } from "@/lib/services/auth";
import { get as apiGet, patch as apiPatch, put as apiPut } from "@/lib/services/api";

class ApiLearnerService implements LearnerService {
  private sessionCache: { signedIn: boolean; profile: LearnerProfile | null } | null = null;

  getSession(): { signedIn: boolean; profile: LearnerProfile | null } {
    return this.sessionCache ?? { signedIn: false, profile: null };
  }

  /** Async refresh used by live shells. */
  async refreshSession(): Promise<void> {
    const session = await fetchSession();
    this.sessionCache = session.user
      ? { signedIn: true, profile: { name: session.user.fullName, email: session.user.email } }
      : { signedIn: false, profile: null };
  }

  async signIn(email: string) {
    return err<LearnerProfile>("use_login_page", "Live mode signs in through the login page.");
  }

  signOut(): void {
    this.sessionCache = { signedIn: false, profile: null };
    clearLocalSession();
    void fetch("/api/v1/auth/logout", { method: "POST", credentials: "same-origin" });
  }

  getLibrary() {
    return apiGet<LearnerCourseCard[]>("learn/library");
  }
  getCourse(courseId: string) {
    return apiGet<LearnerCourseView>(`learn/courses/${courseId}`);
  }
  getLesson(courseId: string, lessonId: string) {
    return apiGet<LearnerLessonView>(`learn/courses/${courseId}/lessons/${lessonId}`);
  }
  updateProgress(courseId: string, lessonId: string, patch: ProgressPatch) {
    return apiPut<void>(`learn/courses/${courseId}/lessons/${lessonId}/progress`, patch);
  }
  listPurchases() {
    return apiGet<PurchaseRecord[]>("learn/purchases");
  }
  getSettings() {
    return apiGet<LearnerSettings>("learn/settings");
  }
  updateSettings(patch: Partial<Omit<LearnerSettings, "email">>) {
    return apiPatch<LearnerSettings>("learn/settings", patch);
  }
}

const apiLearnerService = new ApiLearnerService();

export function getLearnerService(): LearnerService | null {
  if (USE_MOCK_SERVICES) return getMock();
  return apiLearnerService;
}
