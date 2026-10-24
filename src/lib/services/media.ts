import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
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
    maxBytes: 500 * 1024 * 1024,
    label: "MP4, MOV or WebM up to 500 MB",
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
    maxBytes: 50 * 1024 * 1024,
    label: "PDF, ZIP, JPG, PNG or CSV up to 50 MB",
  },
};

export function validateUploadFile(
  kind: UploadKind,
  file: { name: string; size: number; type: string },
): string | null {
  const rules = UPLOAD_RULES[kind];
  if (file.size > rules.maxBytes) {
    const mb = Math.round(rules.maxBytes / (1024 * 1024));
    return `“${file.name}” is too large — keep it under ${mb} MB.`;
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
}

const mockMediaService = new MockMediaService();

// ---------------------------------------------------------------------------
// Live adapter — real R2 flow: server-signed PUT URL → browser PUT →
// server-side verification (the client never claims success as proof).
// ---------------------------------------------------------------------------

import { post as apiPost } from "@/lib/services/api";

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

function xhrPut(
  url: string,
  file: File,
  contentType: string,
  callbacks: UploadCallbacks,
): Promise<ApiResult<void>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        callbacks.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true, data: undefined });
      } else {
        resolve({
          ok: false,
          error: { code: "upload_failed", message: `Storage rejected the upload (HTTP ${xhr.status}). Try again.` },
        });
      }
    };
    // Status 0 / onerror = the request never reached storage (offline, blocked,
    // or a CORS preflight the bucket refused). The caller retries via the app.
    xhr.onerror = () =>
      resolve({ ok: false, error: { code: "upload_network", message: "Network error during upload." } });
    if (callbacks.signal) {
      callbacks.signal.addEventListener("abort", () => {
        xhr.abort();
        resolve({ ok: false, error: { code: "upload_cancelled", message: "Upload cancelled." } });
      });
    }
    xhr.send(file);
  });
}

/**
 * Direct PUT to storage, with one transparent retry through the app.
 *
 * Direct uploads are the fast path (and the only path for large videos), but
 * they depend on the R2 bucket's CORS rules allowing this origin. When the
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
  const direct = await xhrPut(signedUrl, file, contentType, callbacks);
  if (direct.ok) return direct;
  const canRelay =
    /^https?:\/\//i.test(signedUrl) &&
    direct.error.code === "upload_network" &&
    !callbacks.signal?.aborted;
  if (!canRelay) return direct;
  callbacks.onProgress(0);
  return xhrPut(`/api/v1/uploads/put/${encodeURIComponent(session.id)}`, file, contentType, callbacks);
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
    const contentType = session.mimeType || resolveUploadMimeType(session.file.name, session.file.type);
    const put = await putWithRelay(session, session.file, contentType, callbacks);
    if (!put.ok) return { ok: false, error: put.error };
    callbacks.onProgress(100);
    // Server independently verifies the object before issuing the media ref.
    return apiPost<MediaRef>("uploads/complete", {
      assetId: session.id,
      ...(callbacks.durationLabel ? { durationLabel: callbacks.durationLabel } : {}),
    });
  }
}

const apiMediaService = new ApiMediaService();

export function getMediaService(): MediaService | null {
  if (USE_MOCK_SERVICES) return mockMediaService;
  return apiMediaService;
}
