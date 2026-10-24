import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiError, ApiResult } from "@/lib/domain";
import type { MediaRef, UploadKind, UploadSession } from "@/lib/creator-types";
import { consumeForcedFailure, mockId, mockLatency } from "@/lib/services/mock-utils";

/**
 * Media service contract — uploads today are simulated end-to-end and never
 * leave the device. Prompt 5 implements the same interface against
 * Cloudflare R2: beginUpload returns a signed PUT URL, performUpload streams
 * the file with progress, and the returned MediaRef carries the R2 object key.
 *
 * Mock rules (documented in FRONTEND_CONTRACTS.md):
 *  - every result is `simulated: true` and UI shows SIMULATED_UPLOAD_NOTE;
 *  - a file whose name contains "fail" errors mid-upload (retry path);
 *  - an AbortSignal cleanly cancels (cancel path).
 */

export interface UploadCallbacks {
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
  /** Optional local preview (e.g. data URL for images) attached to the ref. */
  previewUrl?: string;
  durationLabel?: string;
}

export interface MediaService {
  beginUpload(input: {
    /** Empty for uploads that aren't attached to a course (avatars). */
    courseId: string;
    kind: UploadKind;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
  }): Promise<ApiResult<UploadSession>>;
  performUpload(session: UploadSession, callbacks: UploadCallbacks): Promise<ApiResult<MediaRef>>;
  /** Permanently discard an unattached upload and its stored bytes. */
  deleteUpload(assetId: string): Promise<ApiResult<{ deleted: true }>>;
}

/** Frontend validation rules, mirrored by the real backend later. */
export const UPLOAD_RULES: Record<
  UploadKind,
  { accept: string; mimeTypes: string[]; maxBytes: number; label: string }
> = {
  cover: {
    accept: "image/jpeg,image/png,image/webp",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 5 * 1024 * 1024,
    label: "JPG, PNG or WebP up to 5 MB",
  },
  video: {
    accept: "video/mp4,video/quicktime,video/webm",
    mimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    maxBytes: 1024 * 1024 * 1024,
    label: "MP4, MOV or WebM up to 1 GB",
  },
  avatar: {
    accept: "image/jpeg,image/png,image/webp",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 5 * 1024 * 1024,
    label: "JPG, PNG or WebP up to 5 MB",
  },
  resource: {
    accept: ".pdf,.zip,.jpg,.jpeg,.png,.csv",
    mimeTypes: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "image/jpeg",
      "image/png",
      "text/csv",
    ],
    maxBytes: 500 * 1024 * 1024,
    label: "PDF, ZIP, JPG, PNG or CSV up to 500 MB",
  },
};

export function validateUploadFile(
  kind: UploadKind,
  file: { name: string; size: number; type: string },
): string | null {
  const rules = UPLOAD_RULES[kind];
  if (file.size > rules.maxBytes) {
    const gib = rules.maxBytes / (1024 * 1024 * 1024);
    const limit = Number.isInteger(gib)
      ? `${gib} GB`
      : `${Math.round(rules.maxBytes / (1024 * 1024))} MB`;
    return `“${file.name}” is too large — keep it under ${limit}.`;
  }
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const typeOk =
    rules.mimeTypes.includes(file.type) || rules.accept.split(",").includes(extension);
  if (!typeOk) {
    return `That file type isn't supported here. ${rules.label}.`;
  }
  return null;
}

class MockMediaService implements MediaService {
  private sessions = new Map<string, UploadSession>();

  async beginUpload(input: {
    courseId: string;
    kind: UploadKind;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
  }): Promise<ApiResult<UploadSession>> {
    await mockLatency(220, 180);
    const forced = consumeForcedFailure<UploadSession>();
    if (forced) return forced;
    const session: UploadSession = {
      id: mockId("upl"),
      kind: input.kind,
      fileName: input.fileName,
      sizeBytes: input.sizeBytes,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
    this.sessions.set(session.id, session);
    return { ok: true, data: session };
  }

  async performUpload(session: UploadSession, callbacks: UploadCallbacks): Promise<ApiResult<MediaRef>> {
    const existing = this.sessions.get(session.id);
    this.sessions.delete(session.id);
    if (!existing || new Date(existing.expiresAt).getTime() < Date.now()) {
      return {
        ok: false,
        error: { code: "upload_session_expired", message: "The upload session expired — start the upload again." },
      };
    }

    const willFail = existing.fileName.toLowerCase().includes("fail");
    const totalMs = Math.min(4200, Math.max(1400, existing.sizeBytes / 60_000));
    const startedAt = Date.now();

    return new Promise<ApiResult<MediaRef>>((resolve) => {
      const tick = () => {
        if (callbacks.signal?.aborted) {
          resolve({
            ok: false,
            error: { code: "upload_cancelled", message: "Upload cancelled." },
          });
          return;
        }
        const elapsed = Date.now() - startedAt;
        const percent = Math.min(100, Math.round((elapsed / totalMs) * 100));
        callbacks.onProgress(percent);
        if (willFail && percent >= 45) {
          resolve({
            ok: false,
            error: {
              code: "upload_failed",
              message: "Simulated upload failure (file name contains “fail”). Nothing was transferred.",
            },
          });
          return;
        }
        if (percent >= 100) {
          resolve({
            ok: true,
            data: {
              id: mockId("media"),
              kind: existing.kind,
              fileName: existing.fileName,
              sizeBytes: existing.sizeBytes,
              previewUrl: callbacks.previewUrl,
              durationLabel: callbacks.durationLabel,
              uploadedAt: new Date().toISOString(),
              simulated: true,
            },
          });
          return;
        }
        setTimeout(tick, 110);
      };
      setTimeout(tick, 110);
    });
  }

  async deleteUpload(_assetId: string): Promise<ApiResult<{ deleted: true }>> {
    await mockLatency(120, 80);
    return { ok: true, data: { deleted: true } };
  }
}

const mockMediaService = new MockMediaService();

// ---------------------------------------------------------------------------
// Live adapter — real R2 flow: server-signed PUT URL → browser PUT →
// server-side verification (the client never claims success as proof).
// ---------------------------------------------------------------------------

import { del as apiDelete, post as apiPost } from "@/lib/services/api";

interface LiveSessionResponse {
  uploadId: string;
  kind: UploadKind;
  fileName: string;
  sizeBytes: number;
  signedUrl: string;
  expiresAt: string;
}

const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
  zip: "application/zip",
  csv: "text/csv",
};

/** Browsers occasionally report legacy/invented aliases — normalise them. */
const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/x-webp": "image/webp",
  "video/mov": "video/quicktime",
  "video/mpeg4": "video/mp4",
  "application/x-zip": "application/zip",
};

export function resolveUploadMimeType(fileName: string, browserType: string): string {
  const trimmed = browserType.trim().toLowerCase();
  if (trimmed) return MIME_ALIASES[trimmed] ?? trimmed;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_MAP[ext] ?? "application/octet-stream";
}

interface XhrCallbacks {
  onBytes: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

function xhrPut(
  url: string,
  body: Blob,
  contentType: string,
  callbacks: XhrCallbacks,
): Promise<ApiResult<{ etag: string | null }>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const finish = (result: ApiResult<{ etag: string | null }>) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        callbacks.onBytes(event.loaded, event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        finish({ ok: true, data: { etag: xhr.getResponseHeader("ETag") } });
      } else {
        finish({
          ok: false,
          error: {
            code: xhr.status === 413 ? "upload_too_large" : "upload_failed",
            message: `Storage rejected the upload (HTTP ${xhr.status}). Try again.`,
          },
        });
      }
    };
    // Status 0 / onerror = the request never reached storage (offline, blocked,
    // or a CORS preflight the bucket refused). Small files may retry via the app.
    xhr.onerror = () =>
      finish({ ok: false, error: { code: "upload_network", message: "Network error during upload." } });
    xhr.onabort = () =>
      finish({ ok: false, error: { code: "upload_cancelled", message: "Upload cancelled." } });
    if (callbacks.signal) {
      if (callbacks.signal.aborted) {
        finish({ ok: false, error: { code: "upload_cancelled", message: "Upload cancelled." } });
        return;
      }
      callbacks.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}

function singlePut(
  url: string,
  file: File,
  contentType: string,
  callbacks: UploadCallbacks,
): Promise<ApiResult<void>> {
  return xhrPut(url, file, contentType, {
    signal: callbacks.signal,
    onBytes: (loaded, total) => callbacks.onProgress(Math.round((loaded / total) * 100)),
  }).then((result) => (result.ok ? { ok: true, data: undefined } : result));
}

/**
 * Direct PUT to storage, with one transparent retry through the app.
 *
 * Direct uploads are the fast path for small files (large files use multipart),
 * but they depend on the R2 bucket's CORS rules allowing this origin. When the
 * browser cannot reach the bucket at all, the same bytes are relayed to
 * /api/v1/uploads/put/:assetId, which writes them to the same R2 bucket
 * server-side — the file still lands in the cloud bucket instead of failing.
 */
async function putWithRelay(
  session: UploadSession,
  file: File,
  contentType: string,
  callbacks: UploadCallbacks,
): Promise<ApiResult<void>> {
  const signedUrl = session.signedUrl ?? "";
  const direct = await singlePut(signedUrl, file, contentType, callbacks);
  if (direct.ok) return direct;
  const canRelay =
    /^https?:\/\//i.test(signedUrl) &&
    direct.error.code === "upload_network" &&
    !callbacks.signal?.aborted;
  if (!canRelay) return direct;
  callbacks.onProgress(0);
  return singlePut(
    `/api/v1/uploads/put/${encodeURIComponent(session.id)}`,
    file,
    contentType,
    callbacks,
  );
}

const MULTIPART_THRESHOLD_BYTES = 32 * 1024 * 1024;
const MULTIPART_CONCURRENCY = 3;

interface MultipartStart {
  uploadId: string;
  partSize: number;
}

function cancelledUpload(): ApiResult<void> {
  return { ok: false, error: { code: "upload_cancelled", message: "Upload cancelled." } };
}

async function abortMultipart(assetId: string, uploadId: string): Promise<void> {
  await apiPost("uploads/multipart/abort", { assetId, uploadId });
}

/** Upload large files as small, independently signed R2 parts. */
async function putMultipart(
  session: UploadSession,
  file: File,
  contentType: string,
  callbacks: UploadCallbacks,
): Promise<ApiResult<void>> {
  if (callbacks.signal?.aborted) return cancelledUpload();
  const started = await apiPost<MultipartStart>("uploads/multipart/start", { assetId: session.id });
  if (!started.ok) return started;
  const { uploadId, partSize } = started.data;
  if (!Number.isInteger(partSize) || partSize <= 0) {
    await abortMultipart(session.id, uploadId);
    return {
      ok: false,
      error: { code: "bad_response", message: "Storage returned an invalid multipart part size." },
    };
  }

  const partCount = Math.ceil(file.size / partSize);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  callbacks.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const loadedByPart = new Map<number, number>();
  const completedParts: { partNumber: number; etag: string }[] = [];
  let nextPartNumber = 1;
  let failure: ApiError | null = null;

  const reportProgress = () => {
    const loaded = [...loadedByPart.values()].reduce((sum, bytes) => sum + bytes, 0);
    callbacks.onProgress(Math.min(99, Math.round((loaded / file.size) * 100)));
  };
  const recordFailure = (error: ApiError) => {
    if (!failure) failure = error;
    controller.abort();
  };

  const worker = async () => {
    while (!controller.signal.aborted && !failure) {
      const partNumber = nextPartNumber++;
      if (partNumber > partCount) return;
      const signed = await apiPost<{ signedUrl: string }>("uploads/multipart/sign-part", {
        assetId: session.id,
        uploadId,
        partNumber,
      });
      if (!signed.ok) {
        recordFailure(signed.error);
        return;
      }
      if (controller.signal.aborted) return;

      const start = (partNumber - 1) * partSize;
      const part = file.slice(start, Math.min(start + partSize, file.size));
      const uploaded = await xhrPut(signed.data.signedUrl, part, contentType, {
        signal: controller.signal,
        onBytes: (loaded) => {
          loadedByPart.set(partNumber, loaded);
          reportProgress();
        },
      });
      if (!uploaded.ok) {
        recordFailure(uploaded.error);
        return;
      }
      const etag = uploaded.data.etag?.trim();
      if (!etag) {
        recordFailure({
          code: "upload_failed",
          message: "Storage didn't return the part ETag. Check that the R2 CORS policy exposes ETag, then retry.",
        });
        return;
      }
      loadedByPart.set(partNumber, part.size);
      completedParts.push({ partNumber, etag });
      reportProgress();
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(MULTIPART_CONCURRENCY, partCount) }, () => worker()),
  );
  callbacks.signal?.removeEventListener("abort", abortFromCaller);

  if (failure || callbacks.signal?.aborted) {
    await abortMultipart(session.id, uploadId);
    return failure ? { ok: false, error: failure } : cancelledUpload();
  }

  const completed = await apiPost("uploads/multipart/complete", {
    assetId: session.id,
    uploadId,
    parts: completedParts.sort((a, b) => a.partNumber - b.partNumber),
  });
  if (!completed.ok) {
    await abortMultipart(session.id, uploadId);
    return completed;
  }
  return { ok: true, data: undefined };
}

class ApiMediaService implements MediaService {
  async beginUpload(input: {
    courseId: string;
    kind: UploadKind;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
  }): Promise<ApiResult<UploadSession>> {
    const mimeType = resolveUploadMimeType(input.fileName, input.mimeType);
    // Account-level media (profile photos) has NO course. Sending courseId: ""
    // used to fail the server's min(1) validation and surface as
    // "Couldn't start the upload" — the field is omitted unless a real id exists.
    const courseId = input.courseId.trim();
    const result = await apiPost<LiveSessionResponse>("uploads/session", {
      ...(courseId ? { courseId } : {}),
      kind: input.kind,
      fileName: input.fileName,
      sizeBytes: input.sizeBytes,
      mimeType,
    });
    if (!result.ok) return { ok: false, error: result.error };
    return {
      ok: true,
      data: {
        id: result.data.uploadId,
        kind: result.data.kind,
        fileName: result.data.fileName,
        sizeBytes: result.data.sizeBytes,
        expiresAt: result.data.expiresAt,
        signedUrl: result.data.signedUrl,
        mimeType,
      },
    };
  }

  async performUpload(session: UploadSession, callbacks: UploadCallbacks): Promise<ApiResult<MediaRef>> {
    if (!session.signedUrl || !session.file) {
      return {
        ok: false,
        error: { code: "upload_session_expired", message: "The upload session expired — start the upload again." },
      };
    }
    const file = session.file;
    const signedUrl = session.signedUrl;
    const contentType = session.mimeType || resolveUploadMimeType(file.name, file.type);
    const directR2 = /^https?:\/\//i.test(signedUrl);
    let put = directR2 && file.size >= MULTIPART_THRESHOLD_BYTES
      ? await putMultipart(session, file, contentType, callbacks)
      : await putWithRelay(session, file, contentType, callbacks);

    // A 413 can come from an intermediary rather than R2 itself. Retry through
    // multipart with 16 MiB requests instead of asking the creator to try the
    // exact same oversized request again.
    if (
      !put.ok &&
      put.error.code === "upload_too_large" &&
      directR2 &&
      !callbacks.signal?.aborted
    ) {
      callbacks.onProgress(0);
      put = await putMultipart(session, file, contentType, callbacks);
    }
    if (!put.ok) {
      await this.deleteUpload(session.id);
      return { ok: false, error: put.error };
    }

    callbacks.onProgress(100);
    // Server independently verifies the object before issuing the media ref.
    const completed = await apiPost<MediaRef>("uploads/complete", {
      assetId: session.id,
      ...(callbacks.durationLabel ? { durationLabel: callbacks.durationLabel } : {}),
    });
    if (!completed.ok) await this.deleteUpload(session.id);
    return completed;
  }

  deleteUpload(assetId: string): Promise<ApiResult<{ deleted: true }>> {
    return apiDelete<{ deleted: true }>(`uploads/${encodeURIComponent(assetId)}`);
  }
}

const apiMediaService = new ApiMediaService();

export function getMediaService(): MediaService | null {
  if (USE_MOCK_SERVICES) return mockMediaService;
  return apiMediaService;
}
