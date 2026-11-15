# Beevo Live Generation Workspace UI Specification

**Route:** `/app/generations/[id]`  
**Component:** `src/components/app/GenerationWorkspaceClient.tsx`

---

## 1. Design Goals
The Live Generation Workspace is the mission-control view where a creator watches their approved storyboard become a synchronized cartoon MP4. It must communicate **exact backend reality** across Beevo's 6 production engines (`OpenAI`, `fal.ai`, `ElevenLabs`, `Beevo Dynamic Timeline Engine`, `FFmpeg`, `Cloudflare R2`) without ever fabricating progress percentages or placeholder media.

## 2. Main Generation Header (Dark Charcoal Studio Telemetry Bar)
Displays:
- **Project Title:** Real project title from database record (or honest `Generation Job #[id]` when awaiting backend connection)
- **Actual Stage Badge:** Displays the exact current pipeline stage enum (`idle`, `script_generation`, `storyboard`, `character_references`, `image_generation`, `narration_generation`, `audio_alignment`, `dynamic_timeline`, `ffmpeg_rendering`, `final_export`, `r2_upload`, `completed`, `failed`, or `unconfigured`)
- **Requested Duration:** Formatted minutes/seconds from the job specification (`—` when no record is loaded)
- **Credit Reservation:** Exact reserved credit amount (`ceil(duration_seconds / 15) × 25` — `—` when no job record exists)

## 3. Ten-Stage Production Pipeline Stepper
Rendered vertically on mobile and as a clean 2×5 / linear stage matrix on desktop, each stage maps directly to a real backend job step:

| # | Stage Key | Label | Engine |
| :-: | --- | --- | --- |
| 1 | `script_generation` | Script generation | OpenAI |
| 2 | `storyboard` | Storyboard | OpenAI |
| 3 | `character_references` | Character references | fal.ai |
| 4 | `image_generation` | Image generation | fal.ai |
| 5 | `narration_generation` | Narration generation | ElevenLabs |
| 6 | `audio_alignment` | Audio alignment | ElevenLabs |
| 7 | `dynamic_timeline` | Dynamic timeline | Beevo Engine |
| 8 | `ffmpeg_rendering` | FFmpeg rendering | FFmpeg |
| 9 | `final_export` | Final export | FFmpeg |
| 10 | `r2_upload` | R2 upload | Cloudflare R2 |

**Honesty Rule:** Never display a synthetic percentage (`47%`, `82%`) or animated fake progress bar. Only real stage status indicators (`Pending`, `In Progress`, `Completed`, `Failed`, `Awaiting Backend`) and measured counts are shown.

## 4. Workspace Telemetry Modules

### A. Progressive Live Image Grid
- Counter header strictly renders: **`Generated images: X / N`**
  - When no approved storyboard record exists yet: `Generated images: 0 / —` with caption *"Total image count is determined dynamically once the storyboard is approved."*
  - When a storyboard with `N` scenes exists: renders `N` visual slots; completed R2 image URLs display their real image, while pending scenes show an explicit `Pending` architectural slot.

### B. Narration & Alignment Widget
- **Voice:** Selected real ElevenLabs voice name (`—` until job loaded)
- **Narration Status:** `Awaiting job` / `Generating` / `Ready` / `Failed`
- **Actual Audio Duration:** Real measured seconds from ElevenLabs audio (`—` until returned)
- **Real Audio Preview:** HTML5 `<audio controls>` mounted *only* when a verified R2 narration URL exists; otherwise clearly marked unavailable
- **Timing Alignment Status:** Word/sentence timestamp extraction state

### C. Dynamic Timeline Widget
- Architectural multi-track readout displaying four synchronized horizontal lanes:
  1. **Scene Track** (individual scene cards scaled to actual aligned duration)
  2. **Narration Track** (spoken waveform/segment spans aligned to timestamps)
  3. **Captions Track** (timed caption blocks)
  4. **Transitions Track** (cut/crossfade/zoom/slide markers between scenes)
- When no aligned timeline exists yet, displays a clean labeled empty track canvas explaining that tracks populate automatically from ElevenLabs alignment timestamps.

### D. Rendering & R2 Upload Widget
- **Render Stage:** Exact FFmpeg step (`Idle`, `Motion pass`, `Audio mix`, `Subtitle burn`, `Muxing MP4`, `Done`)
- **Processed Frames:** Displays `processedFrames / totalFrames` **only** when measured by the render worker; otherwise `Not measured`
- **Rendering State** & **R2 Upload State:** Independent clear status badges

### E. Credit Summary Card
- **Starting Balance** (`—` until connected)
- **Reserved Credits** (`—`)
- **Final Deduction or Refund** (`—`)
- Transparent note: *"If generation fails at any stage, reserved credits are automatically released back to your balance."*

### F. Error & Completion States
- **Error Slot:** When `job.status === "failed"`, displays the exact backend error message and ONLY backend-supported recovery actions (`Return to Storyboard`, `Contact Support`).
- **Completion Stage:** Unlocks **only** when `job.r2Verified === true && Boolean(job.mp4Url)` — renders the real HTML5 `<video controls>` player, final verified duration, and `Download MP4` action linking to `/app/videos/[videoId]`.
