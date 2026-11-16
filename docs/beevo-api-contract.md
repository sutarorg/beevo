# Beevo Backend API Contract (Phase 4)

All Route Handlers return standardized JSON envelopes (`{ ok: true, data }` on success, `{ ok: false, error: { code, message } }` on failure) with `Cache-Control: no-store, max-age=0` and Zod input validation.

## 1. Public Endpoints

| Method & Path | Auth | Behavior |
|---|---|---|
| `GET /api/health` | Public | Live readiness booleans across Supabase, OpenAI, fal.ai, ElevenLabs, R2, Razorpay, and Resend (never leaks secrets). |
| `GET /api/packages` | Public | Returns active credit packs (`starter`, `creator`, `studio`) from `credit_packages` (or published defaults if DB unconfigured). |
| `GET /api/voices` | Public | Queries live ElevenLabs `/v1/voices` catalog; returns `503 SERVICE_UNAVAILABLE` if `ELEVENLABS_API_KEY` is absent. |
| `GET /api/music` | Public | Lists active licensed `music_library` tracks with short-lived presigned R2 preview URLs. |

## 2. Authentication Endpoints

| Method & Path | Auth | Behavior |
|---|---|---|
| `POST /api/auth/signup` | Public (rate-limited) | Creates Supabase Auth account, triggers `handle_new_user`, and enqueues Resend Welcome email. |
| `POST /api/auth/login` | Public (rate-limited) | Signs in via Supabase SSR password auth and sets HTTP-only session cookies. |
| `POST /api/auth/logout` | Session | Revokes Supabase SSR cookies. |
| `POST /api/auth/reset-password` | Public (rate-limited) | Triggers Supabase Auth password recovery email. |
| `GET /api/auth/callback` | Public | Exchanges PKCE auth code for SSR session and redirects safely to internal path. |

## 3. Authenticated Studio & Billing Endpoints

| Method & Path | Auth | Behavior |
|---|---|---|
| `GET / PATCH /api/me` | User | Reads/updates profile and returns current wallet balance. |
| `GET /api/credits` | User | Returns `availableCredits`, `reservedCredits`, and `lifetimePurchasedCredits`. |
| `GET /api/credits/transactions` | User | Paginated history from immutable `credit_ledger`. |
| `POST /api/payments/create-order` | User | Creates server-validated Razorpay order in integer paise. |
| `POST /api/payments/verify` | User | Verifies checkout HMAC over server-stored `razorpay_order_id`, confirms live capture with Razorpay API, and atomically credits wallet once. |
| `GET / POST /api/projects` | User | Lists user projects or creates project + `project_settings` with authoritative server credit calculation. |
| `GET / PATCH / DELETE /api/projects/[id]` | Owner/Admin | Reads project with fresh presigned asset URLs, updates project/settings, or deletes project + R2 assets. |
| `POST /api/projects/[id]/generate-script` | Owner/Admin | Runs OpenAI Responses API Structured Outputs script generator and logs `provider_usage`. |
| `POST /api/projects/[id]/generate-storyboard` | Owner/Admin | Generates Visual Style Bible, character sheet plans, and dynamic N-scene storyboard; validates script coverage. |
| `POST /api/projects/[id]/generate` | Owner/Admin | Atomically reserves `ceil(duration_seconds / 15) * 25` credits and enqueues durable `generation_jobs` row. |
| `GET /api/generations/[id]` | Owner/Admin | Returns live stage status, `completed_image_count / dynamic_image_count`, presigned scene URLs, timeline, and final MP4 URL. |
| `GET /api/generations/[id]/events` | Owner/Admin | Authenticated Server-Sent Events (SSE) stream reading live PostgreSQL state. |
| `POST /api/generations/[id]/cancel` | Owner/Admin | Cancels job/render and atomically releases unused reserved credits. |
| `PATCH /api/scenes/[id]` | Owner/Admin | Edits scene narration, visual description, prompt, camera angle, or transition. |
| `POST /api/scenes/[id]/regenerate-image` | Owner/Admin | Regenerates a single scene via fal.ai FLUX 3 Klein, validates via Sharp, stores in private R2. |
| `GET /api/videos` | User | Lists finished MP4 videos with expiring presigned URLs. |
| `GET /api/videos/[id]/download` | Owner/Admin | Issues 15-minute presigned R2 `attachment` download URL for verified owner. |
| `GET /api/notifications` & `PATCH /api/notifications/[id]/read` | User | Lists and acknowledges notifications. |

## 4. Provider Webhooks & Admin Endpoints

- **Webhooks:** `POST /api/webhooks/razorpay` (raw-body HMAC + event deduplication), `POST /api/webhooks/fal` (HMAC + deduplication).
- **Admin (`requireAdmin` + `audit_logs`):** `GET /api/admin/overview`, `GET /api/admin/users`, `GET / PATCH /api/admin/users/[id]`, `POST /api/admin/credits/adjust`, `GET /api/admin/credits/ledger`, `GET /api/admin/generations`, `GET /api/admin/generations/[id]`, `POST /api/admin/generations/[id]/retry`, `GET /api/admin/payments`, `POST /api/admin/payments/[id]/refund`, `GET /api/admin/costs`, `GET /api/admin/media`, `GET / POST /api/admin/music`, `PATCH /api/admin/music/[id]`, `GET / PATCH /api/admin/config`, `GET /api/admin/audit-logs`.
