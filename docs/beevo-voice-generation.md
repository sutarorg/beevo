# Beevo Voiceover Generation & Audio Alignment (ElevenLabs)

**Implementation:** `src/lib/elevenlabs/client.ts` & `src/features/alignment/engine.ts`

## 1. Live ElevenLabs Voice Catalog

`GET /api/voices` fetches real voices from `GET https://api.elevenlabs.io/v1/voices`, extracts preview URLs, gender, accent, age, and language labels, and caches briefly in memory. If `ELEVENLABS_API_KEY` is missing, the endpoint returns `503 SERVICE_UNAVAILABLE` with zero fabricated voices.

## 2. Long-Form Narration Chunking & Request Stitching

Because Beevo supports videos up to **10 minutes** (~1,350–1,600 words / ~9,000+ characters):
1. `splitScriptIntoSpeechChunks()` splits narration strictly on sentence boundaries—including English (`.`, `!`, `?`), Hindi/Devanagari purna viram (`।`), and CJK punctuation—respecting model limits (`eleven_multilingual_v2` ≤ 4,500 chars safe chunk budget; `eleven_flash_v2_5` / `eleven_turbo_v2_5` ≤ 10,000 chars).
2. Each chunk calls `POST /v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128`, passing `previous_text`, `next_text`, and `previous_request_ids` (up to 3 prior `request-id` headers) for seamless prosody continuity across chunk seams.
3. Chunks are concatenated cleanly via FFmpeg (`concat` demuxer → 44.1 kHz stereo MP3) and measured with `ffprobe` for exact actual duration.
4. `mergeRebasedAlignments()` offsets each chunk's `character_start_times_seconds` and `character_end_times_seconds` by the cumulative measured chunk durations so timestamps remain strictly monotonic across the full narration.

## 3. Custom Multilingual Alignment Engine (`alignNarrationToScenes`)

- Reconstructs word-level timestamps from ElevenLabs character timings using Unicode-safe word extraction (supporting English, Hindi Devanagari combining vowel signs/matras, Hinglish, and European diacritics).
- Maps each dynamic storyboard scene monotonically across the spoken word stream using sequential normalized token matching (preventing naive substring collisions when phrases repeat).
- Detects overlong narration spans relative to `visualPacing` (`calm` 9.0s, `balanced` 6.5s, `dynamic` 4.5s) and subdivides them into smooth continuous visual beats on natural pause boundaries with zero timeline gaps or overlaps.
