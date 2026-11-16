import { describe, expect, it } from "vitest";
import type { DynamicTimelineDocument } from "@/features/timeline/generator";
import { buildProjectR2Key, validateR2Upload } from "@/lib/r2/client";
import {
  buildChunkXfadeArgs,
  buildFinalMasterEncodeArgs,
  buildSegmentEncodeArgs,
  buildZoompanFilter,
  parseFfmpegProgressOutTimeSeconds,
  validateFfprobeJson,
} from "../worker/ffmpeg-builder";

const MOCK_TIMELINE: DynamicTimelineDocument = {
  version: 1,
  projectId: "proj-1",
  aspectRatio: "16:9",
  resolution: "1080p",
  width: 1920,
  height: 1080,
  fps: 30,
  totalDurationSeconds: 12,
  dynamicSceneCount: 2,
  dynamicImageCount: 2,
  segments: [
    {
      segmentIndex: 1,
      sceneId: "s1",
      sceneNumber: 1,
      beatIndex: 1,
      assetStorageKey: "users/u1/projects/proj-1/scenes/s1.png",
      startSeconds: 0,
      endSeconds: 6,
      durationSeconds: 6,
      cameraMotion: "zoom_in",
      transitionIn: "cut",
      transitionDurationSeconds: 0,
    },
    {
      segmentIndex: 2,
      sceneId: "s2",
      sceneNumber: 2,
      beatIndex: 1,
      assetStorageKey: "users/u1/projects/proj-1/scenes/s2.png",
      startSeconds: 6,
      endSeconds: 12,
      durationSeconds: 6,
      cameraMotion: "pan_right",
      transitionIn: "crossfade",
      transitionDurationSeconds: 0.4,
    },
  ],
  audio: {
    narrationStorageKey: "users/u1/projects/proj-1/audio/narr.mp3",
    narrationDurationSeconds: 12,
    musicStorageKey: "catalog/music/sunny.mp3",
    musicVolume: 0.16,
    musicDuckingEnabled: true,
    sfxEvents: [],
  },
  captions: {
    enabled: true,
    assStorageKey: "users/u1/projects/proj-1/renders/c.ass",
    srtStorageKey: "users/u1/projects/proj-1/renders/c.srt",
    cueCount: 3,
    style: {
      enabled: true,
      mode: "word_highlight",
      position: "bottom",
      size: "medium",
      font: "Noto Sans",
      color: "#FFFFFF",
      highlightColor: "#FFC928",
      backgroundColor: "#171717CC",
    },
  },
};

describe("Domain 7: FFmpeg Render Graph & Private R2 Storage Guardrails", () => {
  it("compiles zoompan camera motion filters and Pass 1 segment encode args", () => {
    const motions = [
      "zoom_in",
      "zoom_out",
      "pan_left",
      "pan_right",
      "pan_up",
      "pan_down",
      "ken_burns",
    ] as const;
    for (const m of motions) {
      const vf = buildZoompanFilter({ motion: m, width: 1920, height: 1080, fps: 30, durationSeconds: 5 });
      expect(vf).toContain("zoompan=");
      expect(vf).toContain("s=1920x1080");
      expect(vf).toContain("yuv420p");
    }

    const segArgs = buildSegmentEncodeArgs({
      inputImagePath: "/tmp/s1.png",
      outputClipPath: "/tmp/c1.mp4",
      segment: MOCK_TIMELINE.segments[0],
      width: 1920,
      height: 1080,
      fps: 30,
    });
    expect(segArgs).toContain("libx264");
    expect(segArgs).toContain("yuv420p");
  });

  it("compiles Pass 2A xfade transitions and Pass 2B master encode with sidechaincompress + loudnorm + libass", () => {
    const chunkArgs = buildChunkXfadeArgs({
      clipPaths: ["/tmp/c1.mp4", "/tmp/c2.mp4"],
      segments: MOCK_TIMELINE.segments,
      outputChunkPath: "/tmp/chunk0.mp4",
      fps: 30,
    });
    const xfadeFilter = chunkArgs[chunkArgs.indexOf("-filter_complex") + 1];
    expect(xfadeFilter).toContain("xfade=transition=fade");

    const masterArgs = buildFinalMasterEncodeArgs({
      concatListOrVideoPath: "/tmp/chunk0.mp4",
      isConcatList: false,
      narrationPath: "/tmp/narr.mp3",
      musicPath: "/tmp/music.mp3",
      assSubtitlePath: "/tmp/captions.ass",
      timeline: MOCK_TIMELINE,
      outputMp4Path: "/tmp/final.mp4",
    });
    const filterComplex = masterArgs[masterArgs.indexOf("-filter_complex") + 1];
    expect(filterComplex).toContain("ass='");
    expect(filterComplex).toContain("sidechaincompress=");
    expect(filterComplex).toContain("loudnorm=I=-16:TP=-1.5:LRA=11");
    expect(masterArgs).toContain("+faststart");
  });

  it("parses FFmpeg progress timestamps and validates FFprobe MP4 outputs strictly", () => {
    expect(parseFfmpegProgressOutTimeSeconds("frame=120\nout_time_us=4500000\n")).toBe(4.5);

    const okProbe = validateFfprobeJson(
      {
        streams: [
          { codec_type: "video", width: 1920, height: 1080 },
          { codec_type: "audio" },
        ],
        format: { duration: "12.04", size: "4500000" },
      },
      { width: 1920, height: 1080, durationSeconds: 12 }
    );
    expect(okProbe.valid).toBe(true);

    const brokenProbe = validateFfprobeJson(
      {
        streams: [{ codec_type: "video", width: 640, height: 360 }],
        format: { duration: "2.0", size: "500" },
      },
      { width: 1920, height: 1080, durationSeconds: 12 }
    );
    expect(brokenProbe.valid).toBe(false);
    expect(brokenProbe.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("sanitizes private R2 keys against path traversal and validates MIME/size limits", () => {
    const key = buildProjectR2Key({
      userId: "user-123",
      projectId: "proj-456",
      folder: "scenes",
      fileName: "../../../etc/passwd.png",
    });
    expect(key).not.toContain("..");
    expect(key.startsWith("users/user-123/projects/proj-456/scenes/")).toBe(true);

    expect(() =>
      validateR2Upload({ assetType: "cartoon_image", contentType: "image/png", sizeBytes: 500_000 })
    ).not.toThrow();
    expect(() =>
      validateR2Upload({
        assetType: "cartoon_image",
        contentType: "application/x-executable",
        sizeBytes: 1024,
      })
    ).toThrow();
    expect(() =>
      validateR2Upload({
        assetType: "cartoon_image",
        contentType: "image/png",
        sizeBytes: 999_999_999,
      })
    ).toThrow();
  });
});
