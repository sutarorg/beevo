# Beevo Phase 4 — FFmpeg Rendering & Railway Worker Infrastructure Research

**Date:** 2026-11-15  
**Scope:** Dedicated container video rendering architecture on Railway, FFmpeg filtergraph design (`zoompan`, `xfade`, `sidechaincompress`, `loudnorm`, `libass` Devanagari/Unicode subtitles), memory safety for 10-minute projects, and observable progress telemetry.

---

## 1. Why Rendering Must Run on a Persistent Container (Railway)

- **Serverless Incompatibility:** Next.js Route Handlers on Vercel enforce strict execution timeouts, limited ephemeral `/tmp` storage, and lack native `ffmpeg` + Noto Unicode font stacks.
- **Railway Dedicated Worker:**
  - Builds from `worker/Dockerfile` (`node:22-bookworm-slim` + `ffmpeg` + `fonts-noto-core` + `fonts-noto-ui-core` + `fontconfig`).
  - Exposes an HTTP `/health` endpoint on `process.env.PORT` for Railway liveness monitoring while running an internal database-backed job poller (`claim_next_generation_job`).
  - Graceful shutdown (`SIGTERM`/`SIGINT`) stops claiming new jobs, finishes active FFmpeg steps or releases leases cleanly so another worker resumes without orphaned jobs.

---

## 2. Scalable Two-Pass Segment Architecture (Handles 15s to 10-Minute Videos Safely)

Rendering 80–140 dynamic images for a **10-minute (600-second)** video in a single monolithic `filter_complex` graph exhausts RAM and causes FFmpeg OOM kills on 2–4 GB containers.

Beevo's worker therefore uses a **chunked segment architecture**:
1. **Per-Scene Clip Preparation:** Each approved scene image is rendered into a short normalized H.264 intermediate clip (`yuv420p`, `30 fps`, exact target width×height for `16:9` / `9:16` / `1:1` at `720p` or `1080p`) with smooth `zoompan` camera motion (`zoom_in`, `zoom_out`, `pan_left`, `pan_right`, `pan_up`, `pan_down`, `ken_burns`) computed strictly from the real aligned duration (`scene.endSeconds - scene.startSeconds`).
2. **Batched Transition Assembly (`xfade`):** Clips are stitched in bounded groups (e.g., 8–10 clips per batch) using FFmpeg `xfade` (`fade`, `slideleft`, `slideright`, `smoothleft`, `zoomin`, or zero-overlap hard cut) with exact cumulative offsets, then concatenated via FFmpeg concat demuxer (`-c copy`) into the master silent video stream.
3. **Narration + Music Ducking + SFX + Loudness Audio Mix:**
   - Narration chunks (for long scripts > 4,500 chars) are stitched seamlessly via FFmpeg `concat` filter (`aresample=48000`) and probed with `ffprobe` to record exact true duration before timeline alignment.
   - When background music is selected, FFmpeg applies `aloop` + volume trim + fade-in/fade-out + **`sidechaincompress`** keyed off the narration stream (`[narr]asplit=2[sc][mix]; [music][sc]sidechaincompress=threshold=0.015:ratio=6:attack=25:release=250[ducked]`) so narration remains crisp and dominant, followed by **`loudnorm=I=-16:TP=-1.5:LRA=11`** (EBU R128 broadcast standard).
4. **Unicode & Devanagari Subtitle Burn-In (`libass`):**
   - Beevo generates Advanced SubStation Alpha (`.ass`) files containing exact word-highlight (`\kf`) or sentence captions positioned at `bottom` / `middle` / `top`, rendered through FFmpeg's `ass=` filter (`libass` + HarfBuzz shaping) using installed **Noto Sans** and **Noto Sans Devanagari** fonts so English, Hindi, Marathi, Tamil, Bengali, Arabic, and Latin scripts render with proper ligatures and zero tofu glyphs.
5. **Master MP4 Encode & `ffprobe` Verification:**
   - Final mux encodes `libx264` (`-preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart`) + `aac` (`192k`, `48000 Hz`, stereo).
   - FFmpeg emits real machine-readable progress via `-progress pipe:1` (`out_time_us`, `frame`), parsed by the worker to update `render_jobs.processed_frames` and genuine generation progress percentages.
   - Before marking complete, `ffprobe -v error -show_format -show_streams -of json` verifies: valid MP4 container, valid H.264 video stream with exact dimensions, valid AAC audio stream, duration within tolerance of aligned timeline, and non-zero file size.

---

## 3. Target Resolution Matrix

| Aspect Ratio | 720p Dimensions | 1080p Dimensions |
| --- | --- | --- |
| `16:9` (YouTube / Landscape) | `1280×720` | `1920×1080` |
| `9:16` (Shorts / Reels) | `720×1280` | `1080×1920` |
| `1:1` (Square Social) | `720×720` | `1080×1080` |

*Cleanup discipline:* Every job renders inside `/tmp/beevo-render/{generationId}` and removes all temporary frames and intermediate clips in a `finally` block so container disk usage never leaks across jobs.
