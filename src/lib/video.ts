/**
 * Browser-side video metadata helpers.
 *
 * Durations are read from the file itself with a hidden <video> element the
 * moment a creator selects it — before the upload starts — so the value that
 * reaches the database (`durationLabel`) is a real measurement, never a
 * placeholder. Metadata loading needs no network round-trip and no server
 * transcoding (the bytes are local to the browser).
 */

const METADATA_TIMEOUT_MS = 15_000;

/**
 * Resolve the duration of a local video file in whole seconds.
 * Returns `null` when the browser cannot decode the metadata (unsupported
 * codec, corrupt file) — callers must then omit the label rather than store
 * a fake "0:00".
 */
export function readVideoDurationSeconds(file: File): Promise<number | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|m4v|ogv)$/i.test(file.name)) {
    return Promise.resolve(null);
  }

  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const finish = (seconds: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(seconds && Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null);
    };

    const timer = window.setTimeout(() => finish(null), METADATA_TIMEOUT_MS);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => finish(video.duration), { once: true });
    // Some browsers report duration only on the first `durationchange`.
    video.addEventListener("durationchange", () => {
      if (video.duration && Number.isFinite(video.duration)) finish(video.duration);
    });
    video.addEventListener("error", () => finish(null), { once: true });
    video.src = objectUrl;
    // Safari needs an explicit load() after src assignment.
    video.load();
  });
}

/**
 * Read the duration of an already-stored video by URL (used to backfill
 * lessons uploaded before durations were captured). Resolves null on failure.
 */
export function readRemoteVideoDurationSeconds(url: string): Promise<number | null> {
  if (typeof document === "undefined" || !url) return Promise.resolve(null);
  return new Promise<number | null>((resolve) => {
    const video = document.createElement("video");
    let settled = false;
    const finish = (seconds: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(seconds && Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null);
    };
    const timer = window.setTimeout(() => finish(null), METADATA_TIMEOUT_MS);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => finish(video.duration), { once: true });
    video.addEventListener("error", () => finish(null), { once: true });
    video.src = url;
    video.load();
  });
}
