# Beevo Cartoon Image Generation Architecture (fal.ai Image-Only)

**Implementation:** `src/lib/fal/client.ts`, `src/features/pipeline/orchestrator.ts`, `src/app/api/scenes/[id]/regenerate-image/route.ts`

## 1. Strict Image-Only Policy Guardrail

Beevo **never** integrates fal.ai video generation models. `assertFalImageOnlyModel()` enforces an explicit allowlist of verified fal.ai image endpoints and immediately throws `POLICY_VIOLATION` if any video model (`kling-video`, `minimax-video`, `veo`, `runway`, `sora`, etc.) is passed.

Approved image endpoints (verified November 2026):
- **Default text-to-image:** `blackforestlabs/flux-3/klein/text-to-image` (`$0.009` / 1K)
- **Default multi-reference character consistency:** `blackforestlabs/flux-3/klein/edit-image` (`$0.009` / 1K, up to 10 reference images)
- **Optional higher-tier image overrides:** `blackforestlabs/flux-3/text-to-image`, `blackforestlabs/flux-3/edit-image`, `fal-ai/flux-2-pro`, `fal-ai/flux-pro/kontext`

## 2. Character Reference & Scene Generation Flow

1. **Character Reference Sheets:** For every planned character in `characters`, Beevo generates a clean centered studio portrait via `flux-3/klein/text-to-image`, validates the raster buffer with `sharp`, and uploads it privately to Cloudflare R2 (`users/{uid}/projects/{pid}/characters/`).
2. **Multi-Reference Scene Generation:** For each dynamic scene `1..N`, Beevo signs short-lived (30-min) R2 URLs for referenced character sheets and submits `flux-3/klein/edit-image` via fal.ai's async Queue API (`https://queue.fal.run/{model}`).
3. **Sharp Image Validation:** `validateGeneratedImageBuffer()` decodes every downloaded image before persistence—rejecting payloads `< 1 KB`, non-raster responses, low-resolution images (`< 512px`), or severe aspect ratio drift.
4. **Live Progress & Single-Scene Regeneration:** Each completed scene updates `generations.completed_image_count` and emits an SSE event (`Generated images: X / N`). Creators can regenerate any single scene via `POST /api/scenes/[id]/regenerate-image`, preserving variant history in `scene_assets`.
