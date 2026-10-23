"use client";

import { Mail, Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { StudentRecord } from "@/lib/creator-types";
import { useAsyncData } from "@/lib/hooks";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/creator/dialogs";
import {
  CardListSkeleton,
  DemoChip,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";

export default function CreatorStudentsPage() {
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listStudents()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selected, setSelected] = useState<StudentRecord | null>(null);

  const courseOptions = useMemo(() => {
    if (state.status !== "success") return [];
    return [...new Map(state.data.map((s) => [s.courseId, s.courseTitle])).entries()];
  }, [state]);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((student) => {
      if (courseFilter !== "all" && student.courseId !== courseFilter) return false;
      if (!query) return true;
      return (
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    });
  }, [state, search, courseFilter]);

  const selectedEnrolments = useMemo(() => {
    if (!selected || state.status !== "success") return [];
    return state.data.filter((s) => s.email === selected.email);
  }, [selected, state]);

  return (
    <div>
      <PageHeader
        title="Students"
        sub="The people learning from you — manage enrolments and reach them directly."
      >
        <DemoChip />
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-smoke" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email…"
            aria-label="Search students"
            className="pl-10"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          aria-label="Filter by course"
          className="rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-sm font-bold text-ink"
        >
          <option value="all">All courses</option>
          {courseOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={5} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="size-6 text-smoke" aria-hidden="true" />}
          title={state.data.length === 0 ? "No students yet" : "No one matches"}
          body={
            state.data.length === 0
              ? "Students appear here the moment someone buys and enrols."
              : "Try a different search or course filter."
          }
        >
          {state.data.length > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setCourseFilter("all");
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold text-smoke">
            {filtered.length} enrolment{filtered.length === 1 ? "" : "s"} (demo records)
          </p>
          <ul className="space-y-2.5">
            {filtered.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => setSelected(student)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3.5 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-sm font-bold">
                    {student.fullName.split(" ").map((part) => part[0]).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{student.fullName}</span>
                    <span className="block truncate text-xs text-smoke">{student.email}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block max-w-36 truncate text-xs font-bold text-ink sm:max-w-none">
                      {student.courseTitle}
                    </span>
                    <span className="text-[11px] text-smoke">enrolled {formatDate(student.enrolledAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.fullName ?? "Student"}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full border-2 border-ink bg-lime text-sm font-bold">
                {selected.fullName.split(" ").map((part) => part[0]).join("")}
              </span>
              <div>
                <p className="text-base font-bold text-ink">{selected.fullName}</p>
                <p className="text-sm text-smoke">{selected.email}</p>
              </div>
              <DemoChip />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">
                Enrolments ({selectedEnrolments.length})
              </p>
              <ul className="mt-2 space-y-2">
                {selectedEnrolments.map((enrolment) => (
                  <li key={enrolment.id} className="rounded-xl border-2 border-ink/15 bg-cream p-3">
                    <p className="text-sm font-bold text-ink">{enrolment.courseTitle}</p>
                    <p className="text-xs text-smoke">
                      Enrolled {formatDate(enrolment.enrolledAt)} · status: {enrolment.status}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <Button href={`mailto:${selected.email}`} variant="ink" size="sm" className="w-full">
              <Mail className="size-4" aria-hidden="true" />
              Email {selected.fullName.split(" ")[0]}
            </Button>
            <p className="text-[11px] text-smoke italic">
              Demo record — not a real learner. Messaging and progress tracking arrive with the backend.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
