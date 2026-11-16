# Beevo Phase 4 — Backend, Auth, Database & Integration Research

**Date:** 2026-11-15  
**Scope:** Current official API contracts, schemas, limits, security patterns, and operational practices across Next.js 15, Supabase PostgreSQL/SSR, OpenAI Responses API, fal.ai Image Queue API, ElevenLabs TTS-with-Timestamps, Razorpay, Cloudflare R2, and Resend.

---

## 1. Next.js 15 App Router & Security Architecture

- **Route Handlers & Server Components:** All privileged reads and mutations execute in Next.js App Router Route Handlers (`src/app/api/**/route.ts`) or Server Components using validated inputs (Zod). Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `ELEVENLABS_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`) must never use the `NEXT_PUBLIC_` prefix.
- **Caching Discipline:** Authenticated user routes, credit balances, generation telemetry, and admin endpoints explicitly disable static caching (`export const dynamic = "force-dynamic"` / `Cache-Control: no-store`).
- **Security Headers:** Apply strict headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`) via `next.config.ts` / middleware while preserving live preview iframe compatibility where required.

---

## 2. Supabase PostgreSQL, Auth SSR, RLS & Job Queue

- **Authentication & SSR (`@supabase/ssr`):**
  - Middleware refreshes expired auth cookies using `createServerClient` and validates session tokens via `getClaims()` / `getUser()` — never trusting client-supplied `getSession()` or localStorage state for authorization.
  - Admin access is verified exclusively on the server against the trusted PostgreSQL `user_roles` table (`role = 'admin'`) using `is_admin(auth.uid())` (SECURITY DEFINER with locked `search_path`).
- **Row Level Security (RLS):**
  - Every customer-owned table (`profiles`, `credit_wallets`, `credit_ledger`, `payments`, `projects`, `project_settings`, `characters`, `storyboards`, `scenes`, `assets`, `scene_assets`, `voice_generations`, `timelines`, `generations`, `render_jobs`, `notifications`) enables RLS scoped to `auth.uid() = user_id`.
  - Customers have **read-only** access to `credit_wallets`, `credit_ledger`, and `payments`. Balance changes occur **only** via atomic `SECURITY DEFINER` PostgreSQL functions called by server Route Handlers or the authenticated worker.
- **Database-Backed Background Job Queue (No Inngest / No Redis):**
  - Uses PostgreSQL `SELECT ... FOR UPDATE SKIP LOCKED` inside `claim_next_generation_job(p_worker_id, p_lease_seconds)` for race-free multi-worker claiming.
  - Supports worker identity, periodic heartbeat renewal, stale lease expiry recovery (`lease_expires_at < NOW()`), configurable retry budgets with exponential backoff, cancel-request flags, and dead-letter transitions.
- **Realtime Updates:** Authenticated Supabase Realtime channel subscriptions (respecting RLS on `generations` and `generation_events`) plus a server-authenticated SSE fallback (`GET /api/generations/[id]/events`) stream genuine stage progress (`Generated images: X / N`).

---

## 3. OpenAI Responses API & Structured Outputs

- **Verified Endpoint & SDK Pattern (2026):**
  - Official `openai` Node SDK calls `client.responses.create({ model, instructions, input, text: { format: { type: "json_schema", name, strict: true, schema } } })`.
  - `strict: true` enforces schema adherence at generation time; every object property must be listed in `required` with `additionalProperties: false`.
  - Token consumption is returned on `response.usage` (`input_tokens`, `output_tokens`) and persisted to `provider_usage` per generation stage (script vs. storyboard).
  - No separate Responses API surcharge applies beyond model token rates.
- **Modular Beevo Story Engine:**
  - Accepts user idea or full script, target duration (`15s–600s`), language, audience, cartoon style, aspect ratio, pacing (`calm`/`balanced`/`dynamic`), narration tone, character notes, and custom instructions.
  - Produces structured script, Visual Style Bible, character definitions, and a **dynamically sized scene array** driven by narrative beats rather than a hardcoded scene count.

---

## 4. fal.ai — Image Generation Only (No Video API)

- **Verified Image Models (Nov 2026):**
  - Primary high-efficiency generation & multi-reference editing: **FLUX 3 Klein** (`blackforestlabs/flux-3/klein/text-to-image` and `blackforestlabs/flux-3/klein/edit-image`, accepting up to **10 reference images** for character & scene consistency).
  - Optional flagship quality tier: **FLUX 3 Image / Edit** (`blackforestlabs/flux-3/text-to-image`, `blackforestlabs/flux-3/edit-image`) or **FLUX 2 Pro / FLUX Kontext Pro** (`fal-ai/flux-2-pro`, `fal-ai/flux-pro/kontext`).
  - **Strict Constraint:** Beevo integrates fal.ai **strictly for still cartoon character sheets and scene illustrations**—never fal.ai video generation.
- **Queue API & Webhooks:**
  - Base URL: `https://queue.fal.run/{model_id}` authenticated with `Authorization: Key ${FAL_KEY}`.
  - Submitting returns `request_id`, `status_url`, and `response_url`, supporting optional `fal_webhook` query parameter for asynchronous delivery (`POST /api/webhooks/fal`) and safe polling in the worker.
  - Server errors and queue wait time are never billed by fal.ai.

---

## 5. ElevenLabs — Text-to-Speech with Character Timestamps

- **Verified Endpoint & Schema (2026):**
  - Voice discovery: `GET https://api.elevenlabs.io/v1/voices` (header `xi-api-key`) returns genuine catalog `voice_id`, `name`, `labels`, `preview_url`, and verified language capabilities—never hardcoded synthetic voices.
  - Timestamped narration: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps` returns:
    - `audio_base64`
    - `alignment`: `{ characters: string[], character_start_times_seconds: number[], character_end_times_seconds: number[] }`
    - `normalized_alignment`: same structure for normalized spoken text
  - Long-form continuity: Respect per-request model limits (`10,000` chars on `eleven_multilingual_v2` and `eleven_v4`; `5,000` on `eleven_v3`; `40,000` on `eleven_flash_v2_5`). Split long scripts (e.g., 10-minute videos ≈ 8,000–10,000 chars) on sentence boundaries with safe headroom (`<= 4,500` chars/chunk), passing `previous_text` and `next_text` (or up to 3 `previous_request_ids`), rebasing each chunk's timestamps by exact probed audio duration, and concatenating smoothly in FFmpeg.

---

## 6. Razorpay Orders, Signature Verification & Webhooks

- **Canonical Server-Side Flow:**
  1. Server looks up active package in `credit_packages` (integer paise: `29900`, `59900`, `89900`) — never trusts client amount.
  2. Creates Razorpay Order via Orders API (`POST /v1/orders`) and stores a `created` row in `payments` with `razorpay_order_id`.
  3. Checkout returns `razorpay_payment_id` and `razorpay_signature`. Server verifies `HMAC-SHA256(stored_razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)` using `crypto.timingSafeEqual` — **crucially using the server-stored `razorpay_order_id`**, not the client-supplied order ID.
  4. **Authoritative Webhook (`POST /api/webhooks/razorpay`):** Computes `HMAC-SHA256(rawBodyBytes, RAZORPAY_WEBHOOK_SECRET)` with `crypto.timingSafeEqual` against `x-razorpay-signature`. Deduplicates on unique `x-razorpay-event-id` / payload event ID in `webhook_events`.
  5. Only after confirmed capture (verified payment fetch + webhook `payment.captured`/`order.paid`) does PostgreSQL `allocate_purchase_credits` grant credits once using an idempotency key (`razorpay_capture:{payment_id}`).
  6. Refunds execute solely server-side via Razorpay Refunds API from an authorized admin endpoint and settle on `refund.processed`.

---

## 7. Cloudflare R2 & Resend Email Delivery

- **Cloudflare R2 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`):**
  - Endpoint: `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, region `"auto"`.
  - Strictly private bucket organization: `users/{user_id}/projects/{project_id}/{characters|scenes|audio|renders}/...` plus `catalog/music/` and `catalog/sfx/`.
  - Short-lived presigned GET URLs (e.g., `900s` expiry) generated only after server ownership or admin RBAC check; CORS configured explicitly for browser uploads; lifecycle rules expire abandoned temporary uploads.
- **Resend (`resend` SDK):**
  - Sends transactional HTML emails (Welcome, Verification, Purchase Success, Video Completed, Video Failed, Refund, Account Notice) from a verified Beevo domain with durable `email_outbox` rows and worker retry backoff. Email delivery errors never roll back a completed video render or credit settlement.
