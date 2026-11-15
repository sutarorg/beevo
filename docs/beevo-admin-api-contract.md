# Beevo Admin API & Security Contract (Phase 3 → Phase 4 Handoff)

**TypeScript Source of Truth:** `src/lib/admin-types.ts` & `src/lib/admin-api.ts`

This contract governs every read, write, error, and authorization boundary consumed by the `/admin` frontend so Phase 4 (Supabase SSR + Postgres RLS + Razorpay + OpenAI + fal.ai + ElevenLabs + FFmpeg + Cloudflare R2) plugs in cleanly without changing UI components.

---

## 1. Server-Side Security & Authorization Contract
- **Frontend Role Checks Are Never Authoritative:** Every `/api/admin/**` route handler and `/admin/**` Server Component MUST validate the user session server-side using `@supabase/ssr` `supabase.auth.getUser()` AND verify admin privileges via `profiles.role IN ('admin', 'super_admin')` (and matching Postgres RLS policies).
- **Secrets Isolation:** `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `FAL_KEY`, `ELEVENLABS_API_KEY`, and `R2_SECRET_ACCESS_KEY` must never be passed to Client Components or returned in `/api/admin/configuration`.
- **Standard Error Envelope (`AdminApiResponse<T>`):**
  - `200 OK` → `{ state: "connected", data: T }`
  - `401 Unauthorized` → `{ state: "unauthorized", error: { code: "UNAUTHORIZED", message } }`
  - `403 Forbidden` → `{ state: "forbidden", error: { code: "FORBIDDEN", message } }`
  - `401 Session Expired` → `{ state: "session_expired", error: { code: "SESSION_EXPIRED", message } }`
  - `429 Too Many Requests` → `{ state: "rate_limited", error: { code: "RATE_LIMITED", retryAfterSeconds, message } }`
  - `500+ Error` → `{ state: "error", error: { code: "INTERNAL_ERROR", message } }`
  - Phase 3 Unconfigured → `{ state: "unconfigured", data: empty }`

---

## 2. Endpoint Surface (`/api/admin/**`)

| Method | Endpoint | Consumer Route | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/admin/overview?from=&to=` | `/admin` | Returns 16 nullable KPIs with provenance, 8 time-series datasets, and recent activity feed |
| `GET` | `/api/admin/users?q=&status=&sort=&from=&to=&page=` | `/admin/users` | Paginated operational user table |
| `GET` | `/api/admin/users/:id` | `/admin/users/[id]` | Full user dossier (profile, wallet, projects, videos, payments, ledger, generations, total AI cost) |
| `POST` | `/api/admin/users/:id/status` | `/admin/users`, `/admin/users/[id]` | Audited `suspend` / `reactivate` action with required reason → writes `audit_logs` |
| `GET` | `/api/admin/generations?user=&status=&stage=&provider=&failedOnly=&duration=&from=&to=&page=` | `/admin/generations` | Paginated 9-stage generation monitoring list |
| `GET` | `/api/admin/generations/:id` | `/admin/generations/[id]` | Full operational generation dossier (idea, script, storyboard, refs, images, voice, alignment, timeline, logs, retries, errors, ledger refs, costs); logs staff access in `audit_logs` |
| `GET` | `/api/admin/payments?q=&status=&refundStatus=&sort=&from=&to=&page=` | `/admin/payments` | Read-only Razorpay payment & order records |
| `POST` | `/api/admin/payments/:id/refund` | `/admin/payments` | Initiates verified Razorpay Refund API call server-side with audit entry; never edits status client-side |
| `GET` | `/api/admin/credits/ledger?q=&type=&from=&to=&page=` | `/admin/credits` | Immutable append-only credit ledger entries |
| `POST` | `/api/admin/credits/adjustments` | `/admin/credits`, `/admin/users/[id]` | Audited Add/Deduct credit ledger posting (`userId`, `direction`, `credits`, `reason`, `idempotencyKey`); inserts ledger row + `audit_logs` row atomically |
| `GET` | `/api/admin/ai-costs?from=&to=` | `/admin/ai-costs` | Provider breakdowns (OpenAI, fal.ai, ElevenLabs, FFmpeg, R2) + profitability model with `billingSource: 'actual' \| 'estimated' \| 'unavailable'` per metric |
| `GET` | `/api/admin/media?type=&owner=&q=&page=` | `/admin/media-library` | Private R2 asset inventory metadata (signed temporary URLs generated on authorized demand only) |
| `GET` | `/api/admin/music` | `/admin/music-library` | Approved licensed music & SFX catalog |
| `POST` / `PATCH` | `/api/admin/music` / `/api/admin/music/:id` | `/admin/music-library` | Upload/register licensed track or toggle active status (audited) |
| `GET` / `PATCH` | `/api/admin/configuration` | `/admin/configuration` | Read & update non-secret server-side pricing, credit rules, generation settings, and creative presets (requires elevated authorization + audit entry) |
| `GET` | `/api/admin/audit-logs?actor=&action=&result=&from=&to=&page=` | `/admin/audit-logs` | Strictly read-only chronological audit trail (no update/delete endpoints) |

---

## 3. Financial Integrity Guarantees
- Currency amounts transmitted in integer minor units (`paise` for INR) or explicit decimal strings alongside ISO currency code (`INR` / `USD`).
- Missing financial metrics serialize as `null` — NEVER defaulted to `0`.
- Every mutating admin endpoint requires a non-empty `reason` where applicable, enforces idempotency keys for financial writes, and atomically records an immutable `audit_logs` row (`actorId`, `action`, `targetType`, `targetId`, `result`, `timestamp`, `metadata`).
