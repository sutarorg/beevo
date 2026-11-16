# Beevo Two-Pass Chunked FFmpeg Rendering Pipeline

**Implementation:** `worker/Dockerfile`, `worker/ffmpeg-builder.ts`, `worker/ffmpeg-renderer.ts`, `worker/index.ts`

## 1. Dedicated Railway Docker Runtime

Because 10-minute 1080p HD renders exceed serverless CPU/memory/duration limits, Beevo runs a standalone Node 22 + FFmpeg container (`worker/Dockerfile`):
- Pre-installs `ffmpeg`, `fontconfig`, `fonts-noto-core`, `fonts-noto-ui-core`, and `fonts-noto-color-emoji` (ensuring crisp English + Hindi Devanagari caption burn-in via `libass`).
- Configured via `railway.toml` with health check on `GET /health` (`0.0.0.0:${PORT:-8080}`).
- Maintains 60-second PostgreSQL lease heartbeats during long renders so jobs are never falsely reclaimed.

## 2. Two-Pass Chunked Render Architecture (Safe up to 10 Minutes / 100+ Scenes)

Building one monolithic FFmpeg filtergraph with 80+ images causes OOM crashes on container workers. Beevo renders cleanly in two passes:

1. **Pass 1 — Per-Segment Motion Clips (`buildSegmentEncodeArgs`):**
   - Renders each timeline segment individually from its private R2 image with deterministic `zoompan` camera motion (`zoom_in`, `zoom_out`, `pan_left`, `pan_right`, `pan_up`, `pan_down`, `ken_burns`) at exact target resolution (`1920x1080`, `1280x720`, `1080x1920`, or `1080x1080`), 30 fps, `yuv420p`, `libx264 -preset medium -crf 20`.
2. **Pass 2A — Chunked `xfade` Transition Stitching (`buildChunkXfadeArgs`):**
   - Stitches clips in memory-safe batches of up to 12 clips with exact `xfade` offsets (fade, fadeblack, slideleft, slideright), then concatenates chunks losslessly (`-f concat -c copy`) when `segments.length > 12`.
3. **Pass 2B — Master Audio Mix + Caption Burn-In (`buildFinalMasterEncodeArgs`):**
   - Mixes ElevenLabs narration with optional licensed `music_library` track using **`sidechaincompress`** auto-ducking whenever narration speaks.
   - Normalizes loudness to **`loudnorm=I=-16:TP=-1.5:LRA=11`**.
   - Burns styled `.ass` subtitles via `libass` when enabled.
   - Outputs web-ready MP4 (`H.264 High`, `AAC 192 kbps 44.1 kHz`, `-movflags +faststart`) + 1280px thumbnail JPG.
4. **Post-Render `ffprobe` Verification (`validateFfprobeJson`):**
   - Verifies both video and audio streams exist, width/height match target dimensions, output duration is within ±1.5s of narration duration, and file size is non-trivial before uploading privately to R2 and marking the generation `completed`.
   - Always cleans up `/tmp/beevo-render-*` directories in a `finally` block.
