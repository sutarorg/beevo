"use client";

import { Check, CheckCheck, CloudDownload, FileText } from "lucide-react";
import type { LearnerLessonView } from "@/lib/learner-types";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Downloadable resource rows (server-authorized short-lived links). */
export function ResourceDownloads({ view }: { view: LearnerLessonView }) {
  const toast = useToast();
  if (view.lesson.resources.length === 0) return null;

  const download = async (resource: { id: string; fileName: string; sizeBytes: number }) => {
    try {
      const res = await fetch(
        `/api/v1/media/access?assetId=${encodeURIComponent(resource.id)}&download=1&format=json`,
        { credentials: "same-origin" },
      );
      const json = (await res.json()) as {
        ok: boolean;
        data?: { url: string };
        error?: { message: string };
      };
      if (!json.ok || !json.data?.url) {
        toast.push({
          variant: "error",
          title: "Download not available",
          description: json.error?.message ?? "You don't have access to this file.",
        });
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = json.data.url;
      anchor.download = resource.fileName;
      anchor.rel = "noopener";
      anchor.click();
      toast.push({ variant: "success", title: "Download started" });
    } catch {
      toast.push({
        variant: "error",
        title: "Download failed",
        description: "Could not reach the server.",
      });
    }
  };

  return (
    <ul className="space-y-2">
      {view.lesson.resources.map((resource) => (
        <li
          key={resource.id}
          className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white p-3"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
            <FileText className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{resource.fileName}</p>
            <p className="text-[11px] text-smoke">{formatBytes(resource.sizeBytes)}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void download(resource)}>
            <CloudDownload className="size-4" aria-hidden="true" />
            Download
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Completed/not-completed toggle with clear labels. */
export function CompletionToggle({
  completed,
  saving,
  onChange,
}: {
  completed: boolean;
  saving: boolean;
  onChange: (completed: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!completed)}
      disabled={saving}
      aria-pressed={completed}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50",
        completed ? "bg-lime text-ink shadow-hard-xs" : "bg-white text-ink hover:bg-parchment",
      )}
    >
      {completed ? (
        <>
          <CheckCheck className="size-4" aria-hidden="true" /> Completed — tap to undo
        </>
      ) : (
        <>
          <Check className="size-4" aria-hidden="true" /> Mark lesson complete
        </>
      )}
    </button>
  );
}
