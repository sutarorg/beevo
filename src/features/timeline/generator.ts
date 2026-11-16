import type { AlignedSceneTiming } from "@/features/alignment/engine";
import type { CaptionCue, CaptionStyleConfig } from "@/features/captions/engine";

export type CameraMotionType =
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "pan_up"
  | "pan_down"
  | "ken_burns";

export type TransitionType = "crossfade" | "slide_left" | "slide_right" | "zoom" | "cut";

export interface DynamicTimelineSegment {
  segmentIndex: number;
  sceneId: string;
  sceneNumber: number;
  beatIndex: number;
  assetStorageKey: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  cameraMotion: CameraMotionType;
  transitionIn: TransitionType;
  transitionDurationSeconds: number;
}

export interface DynamicTimelineDocument {
  version: number;
  projectId: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
  width: number;
  height: number;
  fps: number;
  totalDurationSeconds: number;
  dynamicSceneCount: number;
  dynamicImageCount: number;
  segments: DynamicTimelineSegment[];
  audio: {
    narrationStorageKey: string;
    narrationDurationSeconds: number;
    musicStorageKey: string | null;
    musicVolume: number;
    musicDuckingEnabled: boolean;
    sfxEvents: { storageKey: string; atSeconds: number; volume: number }[];
  };
  captions: {
    enabled: boolean;
    assStorageKey: string | null;
    srtStorageKey: string | null;
    cueCount: number;
    style: CaptionStyleConfig;
  };
}

export class TimelineResourceLimitError extends Error {
  readonly code = "TIMELINE_RESOURCE_LIMIT_EXCEEDED";
  constructor(message: string) {
    super(message);
    this.name = "TimelineResourceLimitError";
  }
}

export function resolveOutputDimensions(
  aspectRatio: "16:9" | "9:16" | "1:1",
  resolution: "720p" | "1080p"
): { width: number; height: number } {
  const is1080 = resolution === "1080p";
  if (aspectRatio === "9:16") {
    return is1080 ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
  }
  if (aspectRatio === "1:1") {
    return is1080 ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
  }
  return is1080 ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
}

const AUTOMATIC_MOTIONS: CameraMotionType[] = [
  "zoom_in",
  "pan_right",
  "zoom_out",
  "pan_left",
  "ken_burns",
];

function resolveCameraMotion(
  preference: string,
  sceneInstruction: string,
  idx: number
): CameraMotionType {
  const combined = `${preference} ${sceneInstruction}`.toLowerCase();
  if (combined.includes("zoom out") || combined.includes("zoom_out")) return "zoom_out";
  if (combined.includes("pan left") || combined.includes("pan_left")) return "pan_left";
  if (combined.includes("pan right") || combined.includes("pan_right")) return "pan_right";
  if (combined.includes("pan up") || combined.includes("pan_up")) return "pan_up";
  if (combined.includes("pan down") || combined.includes("pan_down")) return "pan_down";
  if (combined.includes("zoom in") || combined.includes("zoom_in")) return "zoom_in";
  if (combined.includes("ken")) return "ken_burns";
  return AUTOMATIC_MOTIONS[idx % AUTOMATIC_MOTIONS.length];
}

function resolveTransition(preference: string, sceneTransition: string): TransitionType {
  const raw = (preference !== "automatic" ? preference : sceneTransition).toLowerCase();
  if (raw.includes("cut")) return "cut";
  if (raw.includes("slide_right") || raw.includes("slide right")) return "slide_right";
  if (raw.includes("slide")) return "slide_left";
  if (raw.includes("zoom")) return "zoom";
  return "crossfade";
}

/**
 * Generates a structured, versioned Dynamic Timeline JSON document combining:
 *  - Dynamically sized scenes and validated R2 image assets
 *  - Real audio-aligned timings (never fixed durations)
 *  - Camera motion, transitions, captions, music ducking, and SFX
 * Enforces explicit resource ceilings without silently dropping scenes.
 */
export function buildDynamicTimeline(params: {
  projectId: string;
  version: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
  alignedScenes: AlignedSceneTiming[];
  sceneImageStorageKeys: Map<string, string>;
  narrationStorageKey: string;
  totalAudioDurationSeconds: number;
  cameraPreference: string;
  transitionPreference: string;
  musicStorageKey: string | null;
  musicVolume: number;
  sfxEvents?: { storageKey: string; atSeconds: number; volume: number }[];
  captionStyle: CaptionStyleConfig;
  captionCues: CaptionCue[];
  assStorageKey: string | null;
  srtStorageKey: string | null;
  maxScenesLimit?: number;
  maxAssetsLimit?: number;
}): DynamicTimelineDocument {
  const maxScenesLimit = params.maxScenesLimit ?? 160;
  const maxAssetsLimit = params.maxAssetsLimit ?? 200;

  if (params.alignedScenes.length === 0) {
    throw new Error("Cannot build timeline: zero aligned scenes provided.");
  }
  if (params.alignedScenes.length > maxScenesLimit) {
    throw new TimelineResourceLimitError(
      `Project generated ${params.alignedScenes.length} visual segments, exceeding the configured safety limit of ${maxScenesLimit} scenes. Adjust pacing to 'calm' or split into shorter chapters.`
    );
  }

  const uniqueAssets = new Set<string>();
  const segments: DynamicTimelineSegment[] = params.alignedScenes.map((seg, idx) => {
    const beatKey = `${seg.sceneId}:beat:${seg.beatIndex}`;
    const storageKey =
      params.sceneImageStorageKeys.get(beatKey) ?? params.sceneImageStorageKeys.get(seg.sceneId);
    if (!storageKey) {
      throw new Error(
        `Missing validated image asset in Cloudflare R2 for scene ${seg.sceneNumber} (beat ${seg.beatIndex}).`
      );
    }
    uniqueAssets.add(storageKey);

    const transitionIn =
      idx === 0
        ? "cut"
        : resolveTransition(params.transitionPreference, seg.transition);
    const transitionDurationSeconds =
      transitionIn === "cut" ? 0 : Math.min(0.45, seg.transitionWindowSeconds);

    return {
      segmentIndex: idx + 1,
      sceneId: seg.sceneId,
      sceneNumber: seg.sceneNumber,
      beatIndex: seg.beatIndex,
      assetStorageKey: storageKey,
      startSeconds: seg.startSeconds,
      endSeconds: seg.endSeconds,
      durationSeconds: seg.durationSeconds,
      cameraMotion: resolveCameraMotion(params.cameraPreference, seg.cameraInstruction, idx),
      transitionIn,
      transitionDurationSeconds,
    };
  });

  if (uniqueAssets.size > maxAssetsLimit) {
    throw new TimelineResourceLimitError(
      `Project requires ${uniqueAssets.size} image assets, exceeding configured limit of ${maxAssetsLimit}.`
    );
  }

  const dims = resolveOutputDimensions(params.aspectRatio, params.resolution);

  return {
    version: params.version,
    projectId: params.projectId,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    width: dims.width,
    height: dims.height,
    fps: 30,
    totalDurationSeconds: params.totalAudioDurationSeconds,
    dynamicSceneCount: new Set(segments.map((s) => s.sceneId)).size,
    dynamicImageCount: segments.length,
    segments,
    audio: {
      narrationStorageKey: params.narrationStorageKey,
      narrationDurationSeconds: params.totalAudioDurationSeconds,
      musicStorageKey: params.musicStorageKey,
      musicVolume: Math.max(0, Math.min(0.45, params.musicVolume)),
      musicDuckingEnabled: Boolean(params.musicStorageKey),
      sfxEvents: params.sfxEvents ?? [],
    },
    captions: {
      enabled: params.captionStyle.enabled && params.captionStyle.mode !== "off",
      assStorageKey: params.assStorageKey,
      srtStorageKey: params.srtStorageKey,
      cueCount: params.captionCues.length,
      style: params.captionStyle,
    },
  };
}
