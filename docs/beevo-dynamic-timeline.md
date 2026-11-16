# Beevo Dynamic Timeline & Caption Engine

**Implementation:** `src/features/captions/engine.ts` & `src/features/timeline/generator.ts`

## 1. Zero Fixed Scene-Count Architecture

Beevo **never** locks scene count or visual duration to a rigid formula (e.g., "4 scenes per minute"). Instead:
1. OpenAI plans as many distinct scenes `N` as the story and pacing require.
2. ElevenLabs produces the real spoken audio + character-level timestamp stream.
3. `alignNarrationToScenes()` computes exact `startSeconds`, `endSeconds`, and `durationSeconds` for every scene/beat from real spoken timestamps.
4. `buildDynamicTimeline()` binds every scene/beat to its validated R2 cartoon image key, assigned camera motion (`zoom_in`, `zoom_out`, `pan_left`, `pan_right`, `pan_up`, `pan_down`, `ken_burns`), and transition (`cut`, `crossfade`, `dip_to_black`, `slide_left`, `slide_right`), enforcing:
   - `segments[0].startSeconds === 0`
   - `segments[i].startSeconds === segments[i - 1].endSeconds` (continuous, zero black frames)
   - `segments.at(-1).endSeconds === actualAudioDurationSeconds` (exact audio-video sync)
   - Every segment references a verified R2 storage key.

## 2. Multilingual Captions (ASS + SRT)

`generateCaptionsFromWords()` transforms word-level timestamps into:
- **SubRip (`.srt`)** for external player download / accessibility.
- **Advanced SubStation Alpha (`.ass`)** for crisp `libass` burn-in during FFmpeg Pass 2B, supporting:
  - `word_highlight` karaoke highlighting (`{\k...}` tags synced to exact spoken word durations in Beevo Yellow `#FFC928`)
  - `phrase` / `subtitle_bar` modes
  - Configurable position (`bottom`, `center`, `top`), size (`small`, `medium`, `large`), colors, and Unicode fonts (`Noto Sans`, `Noto Sans Devanagari` installed inside `worker/Dockerfile`).
