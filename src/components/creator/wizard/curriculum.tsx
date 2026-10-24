"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  FileText,
  FolderPlus,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  CourseEditor,
  CourseSection,
  Lesson,
  LessonType,
  MediaRef,
} from "@/lib/creator-types";
import type { CourseService } from "@/lib/services/courses";
import { getMediaService, UPLOAD_RULES } from "@/lib/services/media";
import { formatBytes, formatDurationLabel, isMissingDuration } from "@/lib/utils";
import { readRemoteVideoDurationSeconds, readVideoDurationSeconds } from "@/lib/video";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { useMediaUpload, UploadProgressRow } from "@/components/creator/wizard/uploads";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

// ---------------------------------------------------------------------------
// Lesson editor dialog (create + edit, video + resources)
// ---------------------------------------------------------------------------

function LessonDialog({
  open,
  courseId,
  section,
  lesson,
  presetType,
  onClose,
  onSave,
  disabled,
}: {
  open: boolean;
  courseId: string;
  section: CourseSection;
  lesson: Lesson | null;
  presetType: LessonType;
  onClose: () => void;
  onSave: (input: {
    type: LessonType;
    title: string;
    description: string;
    media: MediaRef[];
    isPreview: boolean;
  }) => Promise<{ ok: boolean; fieldErrors?: Record<string, string[]>; message?: string }>;
  disabled: boolean;
}) {
  const toast = useToast();
  const [type, setType] = useState<LessonType>(lesson?.type ?? presetType);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [media, setMedia] = useState<MediaRef[]>(lesson?.media ?? []);
  const [isPreview, setIsPreview] = useState(lesson?.isPreview === true);
  const [readingDuration, setReadingDuration] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingMediaId, setRemovingMediaId] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload(type === "video" ? "video" : "resource", courseId);

  // Reset local state each time the dialog opens for a different lesson/section.
  const [openedFor, setOpenedFor] = useState<string>("");
  const openKey = `${section.id}:${lesson?.id ?? "new"}:${presetType}`;
  if (open && openedFor !== openKey) {
    setOpenedFor(openKey);
    setType(lesson?.type ?? presetType);
    setTitle(lesson?.title ?? "");
    setDescription(lesson?.description ?? "");
    setMedia(lesson?.media ?? []);
    setIsPreview(lesson?.isPreview === true);
    setReadingDuration(false);
    setTitleError(null);
    setMediaError(null);
    setSaving(false);
    setRemovingMediaId(null);
    upload.reset();
  }

  const uploadKind = type === "video" ? "video" : "resource";
  const uploadBusy = upload.state.phase === "readying" || upload.state.phase === "uploading";
  const hasMedia = media.length > 0;

  const removeMedia = async (ref: MediaRef) => {
    const wasAlreadyAttached = lesson?.media.some((item) => item.id === ref.id) ?? false;
    if (wasAlreadyAttached) {
      // Existing lesson media is detached (and deleted server-side) when the
      // lesson is saved, so cancelling the dialog leaves it untouched.
      setMedia((current) => current.filter((item) => item.id !== ref.id));
      return;
    }

    // A newly uploaded file is not part of the lesson yet, so discard it now
    // rather than leaving an orphan in PostgreSQL and R2.
    setRemovingMediaId(ref.id);
    const result = await upload.discard(ref.id);
    setRemovingMediaId(null);
    if (!result.ok) {
      toast.push({ variant: "error", title: "File not removed", description: result.error.message });
      return;
    }
    setMedia((current) => current.filter((item) => item.id !== ref.id));
    setMediaError(null);
  };

  const requestClose = async () => {
    if (saving || removingMediaId) return;
    if (uploadBusy) upload.cancel();
    const unsaved = media.filter(
      (ref) => !(lesson?.media.some((item) => item.id === ref.id) ?? false),
    );
    if (unsaved.length > 0) {
      setRemovingMediaId("dialog");
      const results = await Promise.all(unsaved.map((ref) => upload.discard(ref.id)));
      setRemovingMediaId(null);
      const failed = results.find((result) => !result.ok);
      if (failed && !failed.ok) {
        toast.push({
          variant: "error",
          title: "Uploads not discarded",
          description: failed.error.message,
        });
        return;
      }
    }
    onClose();
  };

  const save = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError("Give the lesson a title.");
      return;
    }
    if (!hasMedia) {
      setMediaError(uploadKind === "video" ? "Upload the lesson video before saving." : "Attach at least one file before saving.");
      return;
    }
    setSaving(true);
    const result = await onSave({
      type,
      title: cleanTitle,
      description: description.trim(),
      media,
      isPreview: type === "video" && isPreview,
    });
    setSaving(false);
    if (!result.ok) {
      setTitleError(result.fieldErrors?.title?.[0] ?? null);
      setMediaError(result.fieldErrors?.media?.[0] ?? null);
      toast.push({
        variant: "error",
        title: "Lesson not saved",
        description: result.message ?? "Fix the highlighted fields and try again.",
      });
      return;
    }
    toast.push({
      variant: "success",
      title: lesson ? "Lesson updated" : "Lesson added",
      description: `Saved in “${section.title}”.`,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={() => void requestClose()} title={lesson ? "Edit lesson" : "Add lesson"} wide>
      <div className="space-y-4">
        <Field id="lesson-title" label="Lesson title" error={titleError ?? undefined}>
          <Input
            id="lesson-title"
            value={title}
            invalid={Boolean(titleError)}
            onChange={(event) => {
              setTitle(event.target.value);
              if (event.target.value.trim()) setTitleError(null);
            }}
            placeholder={type === "video" ? "e.g. Metering without fear" : "e.g. Exposure cheat-sheet"}
          />
        </Field>

        {type === "video" ? (
          <Field id="lesson-description" label="Description (optional)">
            <textarea
              id="lesson-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="One or two sentences about what this lesson covers."
              className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
            />
          </Field>
        ) : null}

        {type === "video" ? (
          <label
            htmlFor="lesson-free-preview"
            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-ink bg-white p-3.5 transition-colors hover:bg-lime/20"
          >
            <input
              id="lesson-free-preview"
              type="checkbox"
              checked={isPreview}
              onChange={(event) => setIsPreview(event.target.checked)}
              disabled={saving || disabled}
              className="mt-0.5 size-4 shrink-0 accent-[#e8490f]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                Free preview
                {isPreview ? (
                  <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                    On
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-smoke">
                Anyone visiting your course page can watch this video before buying. Use it to
                show how you teach. Preview playback is re-checked server-side, so the rest of the
                course stays locked.
              </span>
            </span>
          </label>
        ) : null}

        {/* Existing attachments */}
        {media.length > 0 ? (
          <ul className="space-y-2">
            {media.map((ref) => (
              <li
                key={ref.id}
                className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white px-3 py-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-lime">
                  {ref.kind === "video" ? (
                    <Video className="size-4" aria-hidden="true" />
                  ) : (
                    <FileText className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{ref.fileName}</p>
                  <p className="text-[11px] text-smoke">
                    {formatBytes(ref.sizeBytes)}
                    {ref.durationLabel ? ` · ${ref.durationLabel}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeMedia(ref)}
                  aria-label={`Remove ${ref.fileName}`}
                  disabled={saving || removingMediaId !== null}
                  className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink/30 text-smoke transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Upload area */}
        {type === "video" && hasMedia ? null : (
          <div>
            {readingDuration ? (
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-ink bg-white p-3">
                <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-ink border-t-transparent" aria-hidden="true" />
                <p className="text-xs font-bold text-ink">Reading the video duration…</p>
              </div>
            ) : upload.state.phase === "readying" || upload.state.phase === "uploading" ? (
              <UploadProgressRow
                fileName={upload.state.fileName}
                progress={upload.state.phase === "uploading" ? upload.state.progress : 0}
                onCancel={upload.cancel}
              />
            ) : (
              <button
                type="button"
                disabled={saving || disabled}
                onClick={() => (uploadKind === "video" ? videoInputRef : fileInputRef).current?.click()}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-ink/50 bg-parchment/50 px-4 py-7 text-center transition-colors hover:border-ink disabled:opacity-50"
              >
                {uploadKind === "video" ? (
                  <Video className="size-6 text-ink" aria-hidden="true" />
                ) : (
                  <FileText className="size-6 text-ink" aria-hidden="true" />
                )}
                <span className="text-sm font-bold text-ink">
                  {uploadKind === "video" ? "Select lesson video" : media.length > 0 ? "Attach another file" : "Select files"}
                </span>
                <span className="text-xs text-smoke">{UPLOAD_RULES[uploadKind].label}</span>
                {upload.state.phase === "cancelled" ? (
                  <span className="text-xs font-bold text-accent-deep">Cancelled — select again to restart.</span>
                ) : null}
              </button>
            )}
            {upload.state.phase === "error" ? (
              <div className="mt-2 rounded-xl border-2 border-accent-deep bg-accent/5 p-3">
                <p className="text-xs font-bold text-accent-deep">{upload.state.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await upload.retry();
                      if (result.ok) {
                        setMedia((current) =>
                          uploadKind === "video" ? [result.data] : [...current, result.data],
                        );
                        setMediaError(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lime px-3 py-1 text-xs font-bold text-ink"
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> Retry upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      upload.reset();
                      (uploadKind === "video" ? videoInputRef : fileInputRef).current?.click();
                    }}
                    className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold text-ink"
                  >
                    Choose a different file
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {mediaError ? (
          <p role="alert" className="text-xs font-bold text-accent-deep">{mediaError}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2.5 border-t-2 border-ink/10 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => void requestClose()}
            disabled={saving || removingMediaId !== null}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={save}
            loading={saving || readingDuration}
            disabled={uploadBusy || readingDuration}
          >
            {readingDuration ? "Reading video…" : "Save lesson"}
          </Button>
        </div>
      </div>

      <input
        ref={videoInputRef}
        type="file"
        accept={UPLOAD_RULES.video.accept}
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          // Read the real duration from the file's own metadata before the
          // upload starts. If the browser can't decode it we omit the label
          // entirely instead of storing a misleading "0:00".
          setReadingDuration(true);
          const durationSeconds = await readVideoDurationSeconds(file);
          setReadingDuration(false);
          const result = await upload.start(file, {
            ...(durationSeconds ? { durationLabel: formatDurationLabel(durationSeconds) } : {}),
          });
          if (result.ok) {
            setMedia([result.data]);
            setMediaError(null);
          }
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={UPLOAD_RULES.resource.accept}
        className="hidden"
        onChange={async (event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          for (const file of files.slice(0, 5 - media.length)) {
            const result = await upload.start(file);
            if (result.ok) {
              setMedia((current) => (current.length >= 5 ? current : [...current, result.data]));
              setMediaError(null);
            }
          }
        }}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Curriculum stage
// ---------------------------------------------------------------------------

export function CurriculumStage({
  course,
  service,
  setCourse,
  readOnly = false,
  goToReview,
}: {
  course: CourseEditor;
  service: CourseService;
  setCourse: (course: CourseEditor) => void;
  readOnly?: boolean;
  goToReview: () => void;
}) {
  const toast = useToast();
  const [addingSection, setAddingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<
    | { kind: "section"; section: CourseSection }
    | { kind: "lesson"; section: CourseSection; lesson: Lesson }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [lessonDialog, setLessonDialog] = useState<{
    section: CourseSection;
    lesson: Lesson | null;
    presetType: LessonType;
  } | null>(null);

  const sections = course.sections;

  /**
   * Duration self-heal.
   *
   * Video lessons uploaded before durations were measured from the file carry
   * no label (or a stale placeholder), which is why the storefront curriculum
   * used to show "0:00". Opening the curriculum measures those videos once in
   * the creator's browser and writes the real value back, so existing courses
   * are corrected without re-uploading anything.
   */
  const repairedCourseRef = useRef<string | null>(null);
  useEffect(() => {
    if (repairedCourseRef.current === course.id) return;
    repairedCourseRef.current = course.id;
    const mediaService = getMediaService();
    if (!mediaService) return;
    const missing = course.sections
      .flatMap((section) => section.lessons)
      .filter((lesson) => lesson.type === "video")
      .map((lesson) => lesson.media[0])
      .filter((ref): ref is MediaRef => Boolean(ref && ref.previewUrl && isMissingDuration(ref.durationLabel)));
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      const repaired = new Map<string, string>();
      for (const ref of missing.slice(0, 20)) {
        if (cancelled) return;
        const seconds = await readRemoteVideoDurationSeconds(ref.previewUrl ?? "");
        if (cancelled || !seconds) continue;
        const label = formatDurationLabel(seconds);
        const saved = await mediaService.updateDuration(ref.id, label);
        if (saved.ok) repaired.set(ref.id, label);
      }
      if (cancelled || repaired.size === 0) return;
      setCourse({
        ...course,
        sections: course.sections.map((section) => ({
          ...section,
          lessons: section.lessons.map((lesson) => ({
            ...lesson,
            media: lesson.media.map((ref) =>
              repaired.has(ref.id) ? { ...ref, durationLabel: repaired.get(ref.id) } : ref,
            ),
          })),
        })),
      });
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per course load; `course` is captured deliberately as the
    // snapshot the measurements were taken from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const showError = (message: string) =>
    toast.push({ variant: "error", title: "That didn't work", description: message });

  const addSection = async () => {
    const clean = sectionTitle.trim();
    if (!clean) {
      setSectionError("Give the section a title.");
      return;
    }
    setSavingSection(true);
    const result = await service.addSection(course.id, clean);
    setSavingSection(false);
    if (!result.ok) {
      setSectionError(result.error.fieldErrors?.title?.[0] ?? result.error.message);
      return;
    }
    setCourse({ ...course, sections: [...sections, result.data] });
    setSectionTitle("");
    setSectionError(null);
    setAddingSection(false);
    toast.push({ variant: "success", title: "Section added", description: `“${result.data.title}” is in the curriculum.` });
  };

  const renameSection = async (section: CourseSection) => {
    const clean = renameValue.trim();
    if (!clean) {
      showError("Give the section a title.");
      return;
    }
    const result = await service.updateSection(course.id, section.id, { title: clean });
    if (!result.ok) {
      showError(result.error.message);
      return;
    }
    setCourse({
      ...course,
      sections: sections.map((item) => (item.id === section.id ? result.data : item)),
    });
    setRenamingId(null);
  };

  const reorderSection = async (index: number, delta: number) => {
    const next = moveItem(sections, index, delta);
    if (next === sections) return;
    const previous = sections;
    setCourse({ ...course, sections: next });
    const result = await service.reorderSections(
      course.id,
      next.map((section) => section.id),
    );
    if (!result.ok) {
      setCourse({ ...course, sections: previous });
      showError(result.error.message);
    }
  };

  const reorderLesson = async (section: CourseSection, index: number, delta: number) => {
    const nextLessons = moveItem(section.lessons, index, delta);
    if (nextLessons === section.lessons) return;
    const previous = section.lessons;
    applyLessons(section.id, nextLessons);
    const result = await service.reorderLessons(
      course.id,
      section.id,
      nextLessons.map((lesson) => lesson.id),
    );
    if (!result.ok) {
      applyLessons(section.id, previous);
      showError(result.error.message);
    }
  };

  const applyLessons = (sectionId: string, lessons: Lesson[]) => {
    setCourse({
      ...course,
      sections: sections.map((item) => (item.id === sectionId ? { ...item, lessons } : item)),
    });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    if (confirmDelete.kind === "section") {
      const result = await service.deleteSection(course.id, confirmDelete.section.id);
      setDeleting(false);
      if (!result.ok) {
        showError(result.error.message);
        return;
      }
      setCourse({ ...course, sections: sections.filter((item) => item.id !== confirmDelete.section.id) });
      toast.push({ variant: "info", title: "Section deleted" });
    } else {
      const result = await service.deleteLesson(course.id, confirmDelete.section.id, confirmDelete.lesson.id);
      setDeleting(false);
      if (!result.ok) {
        showError(result.error.message);
        return;
      }
      applyLessons(
        confirmDelete.section.id,
        confirmDelete.section.lessons.filter((item) => item.id !== confirmDelete.lesson.id),
      );
      toast.push({ variant: "info", title: "Lesson deleted" });
    }
    setConfirmDelete(null);
  };

  const saveLesson = async (
    section: CourseSection,
    lesson: Lesson | null,
    input: {
      type: LessonType;
      title: string;
      description: string;
      media: MediaRef[];
      isPreview: boolean;
    },
  ) => {
    const result = lesson
      ? await service.updateLesson(course.id, section.id, lesson.id, input)
      : await service.addLesson(course.id, section.id, input);
    if (!result.ok) {
      return { ok: false as const, fieldErrors: result.error.fieldErrors, message: result.error.message };
    }
    if (lesson) {
      applyLessons(section.id, section.lessons.map((item) => (item.id === lesson.id ? result.data : item)));
    } else {
      applyLessons(section.id, [...section.lessons, result.data]);
    }
    return { ok: true as const };
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Curriculum</h2>
          <p className="mt-0.5 text-sm text-smoke">
            Sections hold lessons. Video lessons play in the course; resource lessons are downloads.
          </p>
        </div>
        {!readOnly ? (
          <Button type="button" variant="ink" size="sm" onClick={() => { setAddingSection(true); setSectionError(null); }}>
            <FolderPlus className="size-4" aria-hidden="true" />
            Add section
          </Button>
        ) : null}
      </div>

      {sections.length === 0 && !addingSection ? (
        <div className="rounded-3xl border-2 border-dashed border-ink/40 bg-parchment/60 px-6 py-12 text-center">
          <Layers className="mx-auto size-8 text-smoke" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold text-ink">No sections yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-smoke">
            Structure your course like chapters — “Getting started”, “Deep dive”, “Next steps”.
          </p>
          {!readOnly ? (
            <Button type="button" variant="accent" size="sm" className="mt-5" onClick={() => setAddingSection(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Add your first section
            </Button>
          ) : null}
        </div>
      ) : null}

      <ol className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <li key={section.id} className="rounded-3xl border-2 border-ink bg-white shadow-hard-xs">
            <div className="flex items-center gap-2 border-b-2 border-ink/10 bg-parchment/60 px-4 py-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Move section ${section.title} up`}
                  disabled={readOnly || sectionIndex === 0}
                  onClick={() => reorderSection(sectionIndex, -1)}
                  className="grid size-6 place-items-center rounded-md border border-ink/20 text-smoke transition-colors hover:bg-lime hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move section ${section.title} down`}
                  disabled={readOnly || sectionIndex === sections.length - 1}
                  onClick={() => reorderSection(sectionIndex, 1)}
                  className="mt-0.5 grid size-6 place-items-center rounded-md border border-ink/20 text-smoke transition-colors hover:bg-lime hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              {renamingId === section.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void renameSection(section);
                      if (event.key === "Escape") setRenamingId(null);
                    }}
                    aria-label="Section title"
                    autoFocus
                    className="py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => renameSection(section)}
                    aria-label="Save section title"
                    className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime"
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(null)}
                    aria-label="Cancel rename"
                    className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink/30 text-smoke"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">
                      <span className="font-editorial mr-1.5 text-accent italic">{String(sectionIndex + 1).padStart(2, "0")}</span>
                      {section.title}
                    </p>
                    <p className="text-[11px] text-smoke">
                      {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {!readOnly ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        aria-label={`Rename section ${section.title}`}
                        onClick={() => { setRenamingId(section.id); setRenameValue(section.title); }}
                        className="grid size-8 place-items-center rounded-full border-2 border-ink/30 text-smoke transition-colors hover:border-ink hover:text-ink"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete section ${section.title}`}
                        onClick={() => setConfirmDelete({ kind: "section", section })}
                        className="grid size-8 place-items-center rounded-full border-2 border-ink/30 text-smoke transition-colors hover:border-accent hover:text-accent"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <ul className="divide-y divide-ink/10">
              {section.lessons.map((lesson, lessonIndex) => (
                <li key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-cream">
                    {lesson.type === "video" ? (
                      <Video className="size-4" aria-hidden="true" />
                    ) : (
                      <FileText className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      <span className="truncate">{lesson.title}</span>
                      {lesson.isPreview && lesson.type === "video" ? (
                        <span className="shrink-0 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                          Free preview
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-smoke">
                      {lesson.type === "video" ? "Video lesson" : `${lesson.media.length} file${lesson.media.length === 1 ? "" : "s"}`}
                      {lesson.media[0]?.durationLabel ? ` · ${lesson.media[0].durationLabel}` : ""}
                    </p>
                  </div>
                  {!readOnly ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Move lesson ${lesson.title} up`}
                        disabled={lessonIndex === 0}
                        onClick={() => reorderLesson(section, lessonIndex, -1)}
                        className="grid size-7 place-items-center rounded-md border border-ink/20 text-smoke hover:bg-lime hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move lesson ${lesson.title} down`}
                        disabled={lessonIndex === section.lessons.length - 1}
                        onClick={() => reorderLesson(section, lessonIndex, 1)}
                        className="grid size-7 place-items-center rounded-md border border-ink/20 text-smoke hover:bg-lime hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit lesson ${lesson.title}`}
                        onClick={() => setLessonDialog({ section, lesson, presetType: lesson.type })}
                        className="grid size-7 place-items-center rounded-md border border-ink/20 text-smoke hover:bg-lime hover:text-ink"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete lesson ${lesson.title}`}
                        onClick={() => setConfirmDelete({ kind: "lesson", section, lesson })}
                        className="grid size-7 place-items-center rounded-md border border-ink/20 text-smoke hover:border-accent hover:text-accent"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
              {section.lessons.length === 0 ? (
                <li className="px-4 py-4 text-center text-xs text-smoke">
                  Empty section — add a lesson below.
                </li>
              ) : null}
            </ul>

            {!readOnly ? (
              <div className="flex flex-wrap gap-2 border-t-2 border-ink/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setLessonDialog({ section, lesson: null, presetType: "video" })}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-lime"
                >
                  <Video className="size-3.5" aria-hidden="true" /> Video lesson
                </button>
                <button
                  type="button"
                  onClick={() => setLessonDialog({ section, lesson: null, presetType: "resources" })}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-lime"
                >
                  <FileText className="size-3.5" aria-hidden="true" /> Downloadable resources
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {addingSection ? (
        <div className="mt-4 rounded-3xl border-2 border-ink bg-parchment/70 p-4">
          <Field id="new-section-title" label="New section title" error={sectionError ?? undefined}>
            <Input
              id="new-section-title"
              value={sectionTitle}
              invalid={Boolean(sectionError)}
              onChange={(event) => {
                setSectionTitle(event.target.value);
                if (event.target.value.trim()) setSectionError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") void addSection();
                if (event.key === "Escape") setAddingSection(false);
              }}
              placeholder="e.g. Mastering exposure"
              autoFocus
            />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="accent" onClick={addSection} loading={savingSection}>
              Save section
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddingSection(false)} disabled={savingSection}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="ink" onClick={goToReview}>
            Continue to review
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmDelete?.kind === "section" ? "Delete this section?" : "Delete this lesson?"}
        body={
          confirmDelete?.kind === "section" ? (
            <>
              <span className="font-semibold text-ink">“{confirmDelete.section.title}”</span> and its{" "}
              {confirmDelete.section.lessons.length} lesson{confirmDelete.section.lessons.length === 1 ? "" : "s"} will be
              removed from the draft. This can’t be undone.
            </>
          ) : confirmDelete?.kind === "lesson" ? (
            <>
              <span className="font-semibold text-ink">“{confirmDelete.lesson.title}”</span> will be removed from{" "}
              {confirmDelete.section.title}. This can’t be undone.
            </>
          ) : null
        }
        confirmLabel={confirmDelete?.kind === "section" ? "Delete section" : "Delete lesson"}
        danger
        loading={deleting}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {lessonDialog ? (
        <LessonDialog
          open={lessonDialog !== null}
          courseId={course.id}
          section={lessonDialog.section}
          lesson={lessonDialog.lesson}
          presetType={lessonDialog.presetType}
          onClose={() => setLessonDialog(null)}
          disabled={readOnly}
          onSave={(input) => saveLesson(lessonDialog.section, lessonDialog.lesson, input)}
        />
      ) : null}
    </div>
  );
}
