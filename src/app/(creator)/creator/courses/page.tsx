"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  Clapperboard,
  Eye,
  Globe,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatINR } from "@/lib/domain";
import type { CourseEditor, CourseListItem, CourseStatus } from "@/lib/creator-types";
import { useAsyncData } from "@/lib/hooks";
import { getCourseService } from "@/lib/services/courses";
import { formatDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/creator/dialogs";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
  StatusChip,
} from "@/components/creator/ui";
import { StorefrontPreviewModal } from "@/components/creator/wizard/stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

const FILTERS: { value: CourseStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
];

type Sort = "updated" | "sales" | "price";

export default function CreatorCoursesPage() {
  const toast = useToast();
  const service = getCourseService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listCourses()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CourseStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [confirm, setConfirm] = useState<
    | { kind: "publish" | "unpublish" | "archive" | "restore" | "delete"; course: CourseListItem }
    | null
  >(null);
  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<CourseEditor | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const items = useMemo(() => {
    if (state.status !== "success") return [];
    let list = state.data;
    if (filter !== "all") list = list.filter((item) => item.status === filter);
    const query = search.trim().toLowerCase();
    if (query) list = list.filter((item) => item.title.toLowerCase().includes(query));
    const sorted = [...list];
    if (sort === "updated") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (sort === "sales") sorted.sort((a, b) => b.salesCount - a.salesCount);
    if (sort === "price") sorted.sort((a, b) => (b.priceInPaise ?? 0) - (a.priceInPaise ?? 0));
    return sorted;
  }, [state, filter, search, sort]);

  const openPreview = async (course: CourseListItem) => {
    if (!service) return;
    setPreviewLoading(course.id);
    const result = await service.getCourse(course.id);
    setPreviewLoading(null);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't open preview", description: result.error.message });
      return;
    }
    setPreview(result.data);
  };

  const runAction = async () => {
    if (!confirm || !service) return;
    setActing(true);
    const { kind, course } = confirm;
    const result =
      kind === "publish"
        ? await service.publish(course.id)
        : kind === "unpublish"
          ? await service.unpublish(course.id)
          : kind === "archive"
            ? await service.archive(course.id)
            : kind === "delete"
              ? await service.deleteCourse(course.id)
              : await service.unarchive(course.id);
    setActing(false);
    setConfirm(null);
    if (!result.ok) {
      const missing = result.error.fieldErrors
        ? Object.values(result.error.fieldErrors).flat()
        : [];
      toast.push({
        variant: "error",
        title: kind === "publish" ? "Not ready to publish" : "Action failed",
        description:
          missing.length > 0
            ? `${result.error.message} Missing: ${missing.join(", ")}.`
            : result.error.message,
      });
      return;
    }
    toast.push({
      variant: "success",
      title:
        kind === "publish"
          ? "Course published"
          : kind === "unpublish"
            ? "Course unpublished"
            : kind === "archive"
              ? "Course archived"
              : "Course restored to drafts",
      description:
        kind === "publish"
          ? "It's live on your storefront and ready to share."
          : undefined,
    });
    reload();
  };

  return (
    <div>
      <PageHeader
        title="My courses"
        sub="Draft, publish, and maintain everything you sell."
      >
        <Button href="/creator/courses/new" variant="accent" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Create course
        </Button>
      </PageHeader>

      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-smoke" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search course titles…"
            aria-label="Search courses"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === item.value
                  ? "border-ink bg-ink text-cream"
                  : "border-ink bg-white text-ink hover:bg-parchment"
              }`}
            >
              {item.label}
            </button>
          ))}
          <label className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-smoke">
            <ArrowUpDown className="size-3.5" aria-hidden="true" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              aria-label="Sort courses"
              className="rounded-lg border-2 border-ink bg-white px-2 py-1.5 text-xs font-bold text-ink"
            >
              <option value="updated">Recently updated</option>
              <option value="sales">Most sales</option>
              <option value="price">Highest price</option>
            </select>
          </label>
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={4} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : state.data.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="size-6 text-smoke" aria-hidden="true" />}
          title="No courses yet"
          body="Your first course starts as a private draft — publish it whenever it's ready."
        >
          <Button href="/creator/courses/new" variant="accent" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Create your first course
          </Button>
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6 text-smoke" aria-hidden="true" />}
          title="Nothing matches"
          body="Try a different search term or clear the status filter."
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Clear search & filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              previewLoading={previewLoading === course.id}
              onPreview={() => void openPreview(course)}
              onAction={(kind) => setConfirm({ kind, course })}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "publish"
            ? "Publish this course?"
            : confirm?.kind === "unpublish"
              ? "Unpublish this course?"
              : confirm?.kind === "archive"
                ? "Archive this course?"
                : confirm?.kind === "delete"
                  ? "Delete this course?"
                  : "Restore this course?"
        }
        body={
          confirm ? (
            {
              publish: (
                <>
                  <span className="font-semibold text-ink">“{confirm.course.title}”</span> will go live on
                  your storefront and become purchasable through your link.
                </>
              ),
              unpublish: (
                <>
                  New buyers won&apos;t be able to purchase{" "}
                  <span className="font-semibold text-ink">“{confirm.course.title}”</span>. Enrolled students
                  keep their access.
                </>
              ),
              archive: (
                <>
                  <span className="font-semibold text-ink">“{confirm.course.title}”</span> moves to the
                  archive — hidden from your storefront and read-only until restored. Student access is
                  unaffected.
                </>
              ),
              restore: (
                <>
                  <span className="font-semibold text-ink">“{confirm.course.title}”</span> returns to
                  drafts so you can edit and re-publish it.
                </>
              ),
              delete: (
                <>
                  <span className="font-semibold text-ink">“{confirm.course.title}”</span> and its
                  uploaded course media are permanently deleted. Courses with learners or orders
                  can&apos;t be deleted — archive those instead.
                </>
              ),
            }[confirm.kind]
          ) : null
        }
        confirmLabel={
          confirm?.kind === "publish"
            ? "Publish"
            : confirm?.kind === "unpublish"
              ? "Unpublish"
              : confirm?.kind === "archive"
                ? "Archive"
                : confirm?.kind === "delete"
                  ? "Delete course"
                  : "Restore"
        }
        danger={
          confirm?.kind === "archive" ||
          confirm?.kind === "unpublish" ||
          confirm?.kind === "delete"
        }
        loading={acting}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />

      {preview ? (
        <StorefrontPreviewModal course={preview} open={preview !== null} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}

function CourseRow({
  course,
  previewLoading,
  onPreview,
  onAction,
}: {
  course: CourseListItem;
  previewLoading: boolean;
  onPreview: () => void;
  onAction: (kind: "publish" | "unpublish" | "archive" | "restore" | "delete") => void;
}) {
  return (
    <li className="rounded-3xl border-2 border-ink bg-white p-4 shadow-hard-xs sm:p-5">
      <div className="flex items-start gap-4">
        <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-parchment sm:block">
          {course.coverPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.coverPreviewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <Clapperboard className="size-6 text-smoke" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={course.status} />
          </div>
          <h2 className="mt-1.5 truncate text-base font-bold text-ink sm:text-lg">{course.title}</h2>
          <p className="mt-0.5 text-xs text-smoke">
            {course.priceInPaise !== null ? formatINR(course.priceInPaise) : "No price"} ·{" "}
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} · updated{" "}
            {formatDate(course.updatedAt)}
            {course.publishedAt ? ` · published ${formatDate(course.publishedAt)}` : ""}
          </p>
          <p className="mt-1 text-xs font-semibold text-smoke">
            {course.salesCount} sale{course.salesCount === 1 ? "" : "s"} · {course.enrollmentCount}{" "}
            enrolment{course.enrollmentCount === 1 ? "" : "s"} ·{" "}
            <span className="text-ink">{formatINR(course.grossInPaise)} gross</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-ink/10 pt-3">
        <Button href={`/creator/courses/${course.id}/edit`} variant="ink" size="sm">
          <Pencil className="size-3.5" aria-hidden="true" />
          {course.status === "archived" ? "View (read-only)" : "Edit"}
        </Button>
        <Button variant="outline" size="sm" onClick={onPreview} loading={previewLoading}>
          <Eye className="size-3.5" aria-hidden="true" />
          Preview
        </Button>
        {course.status === "draft" || course.status === "unpublished" ? (
          <Button variant="lime" size="sm" onClick={() => onAction("publish")}>
            <Globe className="size-3.5" aria-hidden="true" />
            Publish
          </Button>
        ) : null}
        {course.status === "published" ? (
          <Button variant="outline" size="sm" onClick={() => onAction("unpublish")}>
            Unpublish
          </Button>
        ) : null}
        {course.salesCount === 0 && course.enrollmentCount === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction("delete")}
            className="border-accent-deep text-accent-deep hover:bg-accent-deep hover:text-cream"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
        {course.status !== "archived" ? (
          <Button variant="outline" size="sm" onClick={() => onAction("archive")}>
            <Archive className="size-3.5" aria-hidden="true" />
            Archive
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onAction("restore")}>
            <ArchiveRestore className="size-3.5" aria-hidden="true" />
            Restore
          </Button>
        )}
      </div>
    </li>
  );
}
