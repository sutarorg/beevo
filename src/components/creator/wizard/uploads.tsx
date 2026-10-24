"use client";

import { FileUp, ImagePlus, RefreshCw, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ApiResult } from "@/lib/domain";
import type { MediaRef, UploadKind } from "@/lib/creator-types";
import {
  getMediaService,
  UPLOAD_RULES,
  validateUploadFile,
  type MediaService,
} from "@/lib/services/media";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type UploadPhase =
  | { phase: "idle" }
  | { phase: "readying"; fileName: string }
  | { phase: "uploading"; fileName: string; progress: number }
  | { phase: "error"; fileName: string; message: string }
  | { phase: "cancelled"; fileName: string };

/**
 * Full upload lifecycle against the media service: begin session →
 * stream with progress → media ref. Supports cancel (AbortSignal) and retry
 * (the selected File is retained for the retry path).
 */
export function useMediaUpload(kind: UploadKind, courseId: string) {
  const service: MediaService | null = getMediaService();
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<File | null>(null);
  const [state, setState] = useState<UploadPhase>({ phase: "idle" });

  const start = async (
    file: File,
    opts?: { previewUrl?: string; durationLabel?: string },
  ): Promise<ApiResult<MediaRef>> => {
    if (!service) {
      const message = "Media uploads are not available in this environment.";
      setState({ phase: "error", fileName: file.name, message });
      return { ok: false, error: { code: "unavailable", message } };
    }
    const validationError = validateUploadFile(kind, file);
    if (validationError) {
      setState({ phase: "error", fileName: file.name, message: validationError });
      return { ok: false, error: { code: "validation_failed", message: validationError } };
    }

    fileRef.current = file;
    abortRef.current = new AbortController();
    setState({ phase: "readying", fileName: file.name });

    const session = await service.beginUpload({
      courseId,
      kind,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    if (!session.ok) {
      setState({ phase: "error", fileName: file.name, message: session.error.message });
      return { ok: false, error: session.error };
    }

    setState({ phase: "uploading", fileName: file.name, progress: 0 });
    const result = await service.performUpload({ ...session.data, file }, {
      previewUrl: opts?.previewUrl,
      durationLabel: opts?.durationLabel,
      signal: abortRef.current.signal,
      onProgress: (progress) =>
        setState((current) =>
          current.phase === "uploading"
            ? { phase: "uploading", fileName: file.name, progress }
            : current,
        ),
    });

    if (!result.ok) {
      if (result.error.code === "upload_cancelled") {
        setState({ phase: "cancelled", fileName: file.name });
        return result;
      }
      setState({ phase: "error", fileName: file.name, message: result.error.message });
      return result;
    }
    setState({ phase: "idle" });
    fileRef.current = null;
    return result;
  };

  const cancel = () => abortRef.current?.abort();

  const retry = async (
    opts?: { previewUrl?: string },
  ): Promise<ApiResult<MediaRef>> => {
    const file = fileRef.current;
    if (!file) {
      return { ok: false, error: { code: "no_file", message: "Choose the file again to retry." } };
    }
    return start(file, opts);
  };

  const reset = () => {
    fileRef.current = null;
    setState({ phase: "idle" });
  };

  const discard = async (assetId: string): Promise<ApiResult<{ deleted: true }>> => {
    if (!service) {
      return {
        ok: false,
        error: { code: "unavailable", message: "Media uploads are not available in this environment." },
      };
    }
    return service.deleteUpload(assetId);
  };

  return { state, start, cancel, retry, reset, discard };
}

export function UploadProgressRow({
  fileName,
  progress,
  onCancel,
}: {
  fileName: string;
  progress: number;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-ink bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-bold text-ink">{fileName}</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel upload"
          className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink/30 text-smoke transition-colors hover:border-accent hover:text-accent"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-parchment">
        <div
          className="h-full bg-accent transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] font-bold text-smoke tabular-nums">
        Uploading… {progress}%
      </p>
    </div>
  );
}

/** Cover picker: validate → upload → preview → replace/remove. */
export function CoverUpload({
  courseId,
  cover,
  saving,
  onSave,
  disabled = false,
}: {
  courseId: string;
  cover: MediaRef | null;
  saving: boolean;
  onSave: (cover: MediaRef | null) => Promise<ApiResult<unknown>>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload("cover", courseId);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setSaveError(null);
    // Read a local preview so the chosen image shows instantly.
    let dataUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      dataUrl = await new Promise<string | undefined>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      });
      setPreviewUrl(dataUrl);
    }
    const result = await upload.start(file, { previewUrl: dataUrl });
    if (result.ok) {
      const saved = await onSave(result.data);
      if (!saved.ok) {
        setSaveError(saved.error.message);
        await upload.discard(result.data.id);
      }
    }
  };

  const shownCover = cover?.previewUrl ?? previewUrl;

  return (
    <div>
      <p className="mb-1.5 block text-sm font-semibold text-ink">
        Course cover <span className="text-accent">*</span>
      </p>

      {cover && upload.state.phase === "idle" ? (
        <div className="overflow-hidden rounded-2xl border-2 border-ink bg-white">
          <div className="relative aspect-[16/9]">
            {shownCover ? (
              <Image
                src={shownCover}
                alt="Course cover preview"
                fill
                unoptimized={shownCover.startsWith("data:")}
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center bg-parchment text-sm text-smoke">
                {cover.fileName}
              </div>
            )}
            <span className="absolute top-2 left-2 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold uppercase">
              Cover ready
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t-2 border-ink px-3 py-2">
            <p className="truncate text-xs text-smoke">
              {cover.fileName} · {formatBytes(cover.sizeBytes)}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={disabled || saving}
                onClick={() => inputRef.current?.click()}
                className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-bold text-ink transition-colors hover:bg-lime disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                disabled={disabled || saving}
                onClick={async () => {
                  const saved = await onSave(null);
                  if (!saved.ok) setSaveError(saved.error.message);
                }}
                aria-label="Remove cover"
                className="grid size-8 place-items-center rounded-full border-2 border-ink/30 text-smoke transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : upload.state.phase === "idle" || upload.state.phase === "cancelled" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/50 bg-parchment/50 px-4 py-10 text-center transition-colors hover:border-ink hover:bg-parchment disabled:opacity-50"
        >
          <span className="grid size-12 place-items-center rounded-2xl border-2 border-ink bg-white shadow-hard-xs">
            <ImagePlus className="size-6" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold text-ink">Upload cover</span>
          <span className="text-xs text-smoke">{UPLOAD_RULES.cover.label}</span>
          {upload.state.phase === "cancelled" ? (
            <span className="text-xs font-bold text-accent-deep">Upload cancelled — pick a file to restart.</span>
          ) : null}
        </button>
      ) : null}

      {upload.state.phase === "readying" || upload.state.phase === "uploading" ? (
        <UploadProgressRow
          fileName={upload.state.fileName}
          progress={upload.state.phase === "uploading" ? upload.state.progress : 0}
          onCancel={upload.cancel}
        />
      ) : null}

      {upload.state.phase === "error" ? (
        <div className="rounded-xl border-2 border-accent-deep bg-accent/5 p-3">
          <p className="text-xs font-bold text-accent-deep">{upload.state.message}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => upload.retry({ previewUrl })}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lime px-3 py-1 text-xs font-bold text-ink"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" /> Retry upload
            </button>
            <button
              type="button"
              onClick={() => {
                upload.reset();
                inputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold text-ink"
            >
              <FileUp className="size-3.5" aria-hidden="true" /> Choose a different file
            </button>
          </div>
        </div>
      ) : null}

      {saveError ? (
        <p className="mt-2 text-xs font-bold text-accent-deep">
          The draft kept its previous cover: {saveError}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_RULES.cover.accept}
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
