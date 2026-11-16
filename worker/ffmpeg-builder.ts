import type {
  CameraMotionType,
  DynamicTimelineDocument,
  DynamicTimelineSegment,
  TransitionType,
} from "../src/features/timeline/generator";

/**
 * Maps Beevo camera motion directives to verified FFmpeg zoompan expressions.
 * Supersamples input at 2x target resolution to eliminate sub-pixel jitter.
 */
export function buildZoompanFilter(params: {
  motion: CameraMotionType;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
}): string {
  const frames = Math.max(15, Math.round(params.durationSeconds * params.fps));
  const superW = params.width * 2;
  const superH = params.height * 2;

  let zExpr = "min(zoom+0.0007,1.12)";
  let xExpr = "iw/2-(iw/zoom/2)";
  let yExpr = "ih/2-(ih/zoom/2)";

  switch (params.motion) {
    case "zoom_in":
      zExpr = `1+0.12*(on/${frames})`;
      xExpr = "iw/2-(iw/zoom/2)";
      yExpr = "ih/2-(ih/zoom/2)";
      break;
    case "zoom_out":
      zExpr = `1.12-0.12*(on/${frames})`;
      xExpr = "iw/2-(iw/zoom/2)";
      yExpr = "ih/2-(ih/zoom/2)";
      break;
    case "pan_left":
      zExpr = "1.12";
      xExpr = `(iw-iw/zoom)*(1-on/${frames})`;
      yExpr = "ih/2-(ih/zoom/2)";
      break;
    case "pan_right":
      zExpr = "1.12";
      xExpr = `(iw-iw/zoom)*(on/${frames})`;
      yExpr = "ih/2-(ih/zoom/2)";
      break;
    case "pan_up":
      zExpr = "1.12";
      xExpr = "iw/2-(iw/zoom/2)";
      yExpr = `(ih-ih/zoom)*(1-on/${frames})`;
      break;
    case "pan_down":
      zExpr = "1.12";
      xExpr = "iw/2-(iw/zoom/2)";
      yExpr = `(ih-ih/zoom)*(on/${frames})`;
      break;
    case "ken_burns":
      zExpr = `1+0.10*(on/${frames})`;
      xExpr = `(iw-iw/zoom)*(0.25+0.5*(on/${frames}))`;
      yExpr = `(ih-ih/zoom)*(0.35+0.3*(on/${frames}))`;
      break;
  }

  return [
    `scale=${superW}:${superH}:force_original_aspect_ratio=increase`,
    `crop=${superW}:${superH}`,
    `zoompan=z='${zExpr}':x='${xExpr}':y='${yExpr}':d=${frames}:s=${params.width}x${params.height}:fps=${params.fps}`,
    "format=yuv420p",
    "setsar=1",
  ].join(",");
}

export function mapTransitionToXfade(transition: TransitionType): string {
  switch (transition) {
    case "slide_left":
      return "slideleft";
    case "slide_right":
      return "slideright";
    case "zoom":
      return "smoothup";
    case "crossfade":
    default:
      return "fade";
  }
}

/**
 * Pass 1 arguments: Renders a single dynamic scene still into a motion-animated MP4 clip.
 */
export function buildSegmentEncodeArgs(params: {
  inputImagePath: string;
  outputClipPath: string;
  segment: DynamicTimelineSegment;
  width: number;
  height: number;
  fps: number;
}): string[] {
  const vf = buildZoompanFilter({
    motion: params.segment.cameraMotion,
    width: params.width,
    height: params.height,
    fps: params.fps,
    durationSeconds: params.segment.durationSeconds,
  });

  return [
    "-y",
    "-loop",
    "1",
    "-i",
    params.inputImagePath,
    "-vf",
    vf,
    "-t",
    params.segment.durationSeconds.toFixed(3),
    "-r",
    String(params.fps),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-an",
    params.outputClipPath,
  ];
}

/**
 * Pass 2A arguments: Combines a bounded batch of segment clips (up to 12 clips)
 * using FFmpeg's `xfade` filter while preserving exact segment timing offsets.
 */
export function buildChunkXfadeArgs(params: {
  clipPaths: string[];
  segments: DynamicTimelineSegment[];
  outputChunkPath: string;
  fps: number;
}): string[] {
  if (params.clipPaths.length === 1) {
    return ["-y", "-i", params.clipPaths[0], "-c", "copy", params.outputChunkPath];
  }

  const args: string[] = ["-y"];
  for (const clip of params.clipPaths) {
    args.push("-i", clip);
  }

  const filterParts: string[] = [];
  let prevLabel = "[0:v]";
  let cumulativeDuration = params.segments[0].durationSeconds;

  for (let i = 1; i < params.clipPaths.length; i++) {
    const seg = params.segments[i];
    const xfadeDuration =
      seg.transitionIn === "cut" ? 0.04 : Math.max(0.1, Math.min(0.45, seg.transitionDurationSeconds));
    const offset = Math.max(0.1, Number((cumulativeDuration - xfadeDuration).toFixed(3)));
    const outLabel = i === params.clipPaths.length - 1 ? "[vout]" : `[v${i}]`;
    const xfadeType = mapTransitionToXfade(seg.transitionIn);

    filterParts.push(
      `${prevLabel}[${i}:v]xfade=transition=${xfadeType}:duration=${xfadeDuration.toFixed(3)}:offset=${offset.toFixed(3)}${outLabel}`
    );
    prevLabel = outLabel;
    cumulativeDuration = offset + seg.durationSeconds;
  }

  args.push(
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    "[vout]",
    "-r",
    String(params.fps),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-an",
    params.outputChunkPath
  );

  return args;
}

function escapeFfmpegFilterPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

/**
 * Pass 2B (Final Master Encode) arguments:
 * - Combines visual video stream (concat demuxer or single chunk)
 * - Burns in `.ass` Unicode captions via `libass` when enabled
 * - Mixes ElevenLabs narration + optional background music with `sidechaincompress` ducking + `loudnorm`
 * - Produces web-streaming MP4 (`libx264` + `aac` + `+faststart`) and emits machine-readable `-progress pipe:1`.
 */
export function buildFinalMasterEncodeArgs(params: {
  concatListOrVideoPath: string;
  isConcatList: boolean;
  narrationPath: string;
  musicPath: string | null;
  assSubtitlePath: string | null;
  timeline: DynamicTimelineDocument;
  outputMp4Path: string;
}): string[] {
  const args: string[] = ["-y", "-progress", "pipe:1", "-nostats"];

  if (params.isConcatList) {
    args.push("-f", "concat", "-safe", "0", "-i", params.concatListOrVideoPath);
  } else {
    args.push("-i", params.concatListOrVideoPath);
  }

  // Input 1: Narration audio
  args.push("-i", params.narrationPath);

  // Optional Input 2: Looping licensed background music
  const hasMusic = Boolean(params.musicPath && params.timeline.audio.musicVolume > 0);
  if (hasMusic && params.musicPath) {
    args.push("-stream_loop", "-1", "-i", params.musicPath);
  }

  const filterChains: string[] = [];
  let videoMap = "0:v";

  if (params.timeline.captions.enabled && params.assSubtitlePath) {
    const escapedAss = escapeFfmpegFilterPath(params.assSubtitlePath);
    filterChains.push(`[0:v]ass='${escapedAss}',format=yuv420p[vcap]`);
    videoMap = "[vcap]";
  }

  if (hasMusic) {
    const musicVol = params.timeline.audio.musicVolume.toFixed(3);
    const fadeOutStart = Math.max(0, params.timeline.totalDurationSeconds - 2.0).toFixed(2);
    filterChains.push(
      `[1:a]asplit=2[narr_sc][narr_mix]`,
      `[2:a]volume=${musicVol},afade=t=in:st=0:d=1.2,afade=t=out:st=${fadeOutStart}:d=2.0[bg_shaped]`,
      `[bg_shaped][narr_sc]sidechaincompress=threshold=0.025:ratio=6:attack=35:release=320[bg_ducked]`,
      `[narr_mix][bg_ducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`
    );
  } else {
    filterChains.push(`[1:a]loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
  }

  args.push(
    "-filter_complex",
    filterChains.join(";"),
    "-map",
    videoMap,
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    "-shortest",
    params.outputMp4Path
  );

  return args;
}

export function parseFfmpegProgressOutTimeSeconds(stdoutChunk: string): number | null {
  const match = stdoutChunk.match(/out_time_us=(\d+)/);
  if (!match) return null;
  const micros = Number(match[1]);
  if (!Number.isFinite(micros) || micros < 0) return null;
  return Number((micros / 1_000_000).toFixed(2));
}

export interface FfprobeValidationResult {
  valid: boolean;
  errors: string[];
  width: number;
  height: number;
  durationSeconds: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

export function validateFfprobeJson(
  probePayload: {
    streams?: { codec_type?: string; width?: number; height?: number }[];
    format?: { duration?: string; size?: string };
  },
  expected: { width: number; height: number; durationSeconds: number }
): FfprobeValidationResult {
  const streams = probePayload.streams ?? [];
  const videoStream = streams.find((s) => s.codec_type === "video");
  const audioStream = streams.find((s) => s.codec_type === "audio");
  const durationSeconds = Number(probePayload.format?.duration ?? 0);
  const sizeBytes = Number(probePayload.format?.size ?? 0);

  const errors: string[] = [];
  if (!videoStream) errors.push("Rendered MP4 is missing a video stream.");
  if (!audioStream) errors.push("Rendered MP4 is missing an audio stream.");
  if (sizeBytes < 10_000) errors.push("Rendered MP4 file size is unexpectedly small.");
  if (videoStream && (videoStream.width !== expected.width || videoStream.height !== expected.height)) {
    errors.push(
      `Rendered dimensions ${videoStream.width}x${videoStream.height} do not match expected ${expected.width}x${expected.height}.`
    );
  }
  if (Math.abs(durationSeconds - expected.durationSeconds) > Math.max(3, expected.durationSeconds * 0.08)) {
    errors.push(
      `Rendered duration ${durationSeconds.toFixed(1)}s diverges too far from narration duration ${expected.durationSeconds.toFixed(1)}s.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    width: Number(videoStream?.width ?? 0),
    height: Number(videoStream?.height ?? 0),
    durationSeconds: Number(durationSeconds.toFixed(2)),
    hasVideo: Boolean(videoStream),
    hasAudio: Boolean(audioStream),
  };
}
