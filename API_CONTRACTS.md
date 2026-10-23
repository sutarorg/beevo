# API Contracts

**Status: specification only.** No business API routes exist in Prompt 1 (frontend-only phase). This file defines what Prompt 5 must implement so the current frontend keeps working unchanged. No secrets here — only shapes and behaviour. Environment variable names are the ones defined in `.env.example`.

Conventions: JSON over HTTPS; all responses use the `ApiResult<T>` envelope (`{ ok: true, data } | { ok: false, error: { code, message, fieldErrors? } }`); errors are UI-safe and never leak provider internals; money is integer paise INR; rate limits return `429` with `code: "rate_limited"`.

## 1. Auth (Supabase)

Client-side via Supabase SDK implementing the `AuthService` interface from `src/lib/services/auth.ts`:

- Email + password signup with **email verification required**.
- Error mapping: Supabase errors → `AuthErrorCode` values (`invalid_credentials`, `email_already_in_use`, `email_not_verified`, `invalid_reset_token`, `rate_limited`).
- Password reset email → lands on `/forgot-password/reset?token=…` (recovery flow); completion calls `completePasswordReset`.
- Post-auth redirect destination: `POST_AUTH_PATH` (`/dashboard`) once Prompts 2–4 ship.
- `/login?error=session_expired|callback_failed|access_denied` renders the mapped banner.

## 2. Creators

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/creators/me` | GET, PATCH | Auth’d creator profile: `handle` (unique, url-safe), `displayName`, `tagline`, `avatarUrl` (R2), `niche`, `links[]`. |
| `/api/creators/check-handle?handle=` | GET | Availability probe for the profile form. |
| `/api/creators/[handle]` | GET | Public storefront payload = `CreatorPublicProfile`. 404s render the public not-found UI. |

Media: avatar upload via `/api/v1/uploads/session` (`kind: "avatar"`, `courseId: ""`) → signed PUT URL → `/api/v1/uploads/complete`; 5 MB, JPEG/PNG/WebP only. The resulting asset id is attached with `PATCH /api/v1/creator/profile { avatarAssetId }` (send `null` to clear), and the asset must be verified and owned by the caller.

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/v1/creator/payout-details` | GET, PUT | `{ accountNumber, ifsc, updatedAt }`. Account `^\d{9,18}$` after spaces are stripped; IFSC `^[A-Z]{4}0[A-Z0-9]{6}$` (upper-cased). Validation failures return `validation_failed` with `fieldErrors.accountNumber` / `fieldErrors.ifsc`. Stored on `users.payout_account_number` / `payout_ifsc` — admins use it to transfer earnings manually. |
| `/api/v1/creator/settings` | GET, PATCH | `{ email, notifySaleEmails, notifyWeeklySummary, notifyProductTips }`. PATCH accepts any subset of the three booleans and returns the full object. |
| `/api/v1/learn/settings` | GET, PATCH | `{ name, email, notifyLessonEmails, notifyReceiptEmails }`. Same partial-update semantics for learners. |

## 3. Courses

**Status:** the Prompt 2 creator UI speaks the `CourseService` contract through mock adapters; these routes implement it in Prompt 5.

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/courses` | GET, POST | GET lists the creator’s courses with stats (`CourseListItem[]`); POST creates an empty draft and returns the full `CourseEditor` (editor opens at “details”). |
| `/api/courses/[id]` | GET, PATCH | GET returns `CourseEditor`. PATCH autosaves details (`title`, `shortDescription`, `outcomes`, `cover` media ref) and `priceInPaise` — per-field debounced calls expected. |
| `/api/courses/[id]/status` | POST | `{ action: "publish" \| "unpublish" \| "archive" \| "unarchive" }`. Publish re-validates the readiness checklist authoritatively; failure returns `validation_failed` with `fieldErrors` grouped by editor stage. |
| `/api/courses/[id]/sections` | POST, PATCH, DELETE | Create/rename/delete sections; delete cascades lessons within the draft. |
| `/api/courses/[id]/sections/reorder` | PUT | `{ orderedSectionIds: string[] }` — unknown ids ignored, missing ids appended (idempotent). Same rule for lessons. |
| `/api/courses/[id]/sections/[sectionId]/lessons` | POST, PATCH, DELETE | Types: `video` (exactly one video `MediaRef`) and `resources` (1–5 file `MediaRef`s). |
| `/api/c/[slug]` | GET | Public, SEO-indexed course sales page: `CourseSummary` + curriculum outline + `CreatorPublicProfile` (creator subset). |

Media (R2): `POST /api/uploads/session` `{kind, fileName, sizeBytes, mimeType}` → `{ uploadId, signedUrl, expiresAt }`; client PUTs direct to R2; `POST /api/uploads/complete` `{uploadId}` → `MediaRef` (R2 key + delivery URL). Server re-validates the type/size limits from `UPLOAD_RULES`.

Rules: price as integer paise; readiness checklist = title + description + cover + creator profile + ≥1 section + every section has lessons with content + valid price; unpublish keeps enrolled students’ access; archived courses are read-only; deleting a course with purchases is a soft-delete.

## 4. Checkout & orders (Razorpay)

**Status:** Prompt 3 ships the full frontend payment state machine against a mock (`gateway: "razorpay-simulated"`). Prompt 5 keeps the same UI and swaps the adapter.

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/checkout` | POST | `{ courseId }` → creates pending order + Razorpay order id; returns `{ orderId, courseTitle, amountInPaise, platformFeeInPaise, currency: "INR", keyId }` — the exact `CheckoutOrder` shape the mock returns. |
| `/api/checkout/verify` | POST | Verifies `razorpay_payment_id` + `razorpay_signature` against `RAZORPAY_KEY_SECRET`; on success: mark paid, create enrolment (idempotent by orderId, mirroring mock `recordDemoPurchase`), queue receipt email. Maps to the frontend `processing → success/failed` transition. |
| `/api/webhooks/razorpay` | POST | Signature-verified (`RAZORPAY_WEBHOOK_SECRET`) `payment.captured` / `payment.failed` / `payment.pending`-style events; `captured` resolves the frontend `pending` state. Idempotent via provider event id. |

Frontend states ↔ gateway reality: `creating_order` (POST /api/checkout) → `checkout_open` (Checkout.js open) → `processing` (payment attempt) → `success` (signature verified + enrolment) / `failed` (payment.failed) / `cancelled` (Checkout.js dismiss) / `pending` (bank async, resolved by webhook). Order lifecycle: `created → paid → reversed?`. Commission: `platformFeeInPaise = round(gross × 0.08)` recorded on the order; creator share = gross − fee. Failed/reversed orders are ineligible and accrue no fee.

## 5. Enrolments & learning

**Status:** implemented by the mock `LearnerService` in Prompt 3; these routes back it with enrolment checks + R2 in Prompt 5.

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/learn/library` | GET | `LearnerCourseCard[]` — purchased courses with computed progress, last-accessed lesson, completion. |
| `/api/learn/courses/[courseId]` | GET | `LearnerCourseView` for an enrolled learner (sections/lessons with progress). `403 not_enrolled` when the learner hasn’t purchased; enrolment state is never trusted client-side. |
| `/api/learn/courses/[courseId]/lessons/[lessonId]` | GET | `LearnerLessonView` + marks last-accessed. Video lessons include a **short-lived signed R2 playback session** (≤ 24 h) — the mock’s simulated `playback` becomes `{ url, expiresAt }`. |
| `/api/learn/courses/[courseId]/lessons/[lessonId]/progress` | PUT | `ProgressPatch { completed?, positionSeconds? }` — upserts a progress row; replaces the mock’s sessionStorage writes. |
| `/api/learn/purchases` | GET | `PurchaseRecord[]` receipt history. |
| `/api/creators/me/learners` | GET | Creator’s learner list (name, email, course, enrolledAt, status). |

Signed media URLs expire (≤ 24 h). Course files are private R2 objects — never a public bucket path, never exposed in public storefront payloads.

## 6. Email (Resend)

Server-only via `/api/email/*` internal helpers (not public routes):

- `order_confirmation` — receipt + access link, sent on paid order.
- `creator_sale_notification` — new sale summary to the creator.
- Auth emails are Supabase’s own (verification, reset), branded via Supabase templates.

From: `RESEND_FROM_EMAIL`. Sends are queued/retried; failures are logged, orders are not rolled back on email failure.

## 7. Admin

**Status:** Prompt 4 implements the full admin console against the mock `AdminService`; these routes back it in Prompt 5. Every route requires the `platform_admin` role (enforced server-side via RLS + role claim — the frontend simulation is never the authorization layer).

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/admin/dashboard` | GET | `PlatformKpis` — counts, gross, commission, pending reconciliation, outstanding earnings, pending payouts, failed payment events. |
| `/api/admin/creators` | GET | `CreatorRow[]` with search/filters. |
| `/api/admin/creators/[id]` | GET | `CreatorDetail` (courses, history). |
| `/api/admin/creators/[id]/status` | POST | `{ status, reason }` — suspend requires a reason; audited. |
| `/api/admin/learners` | GET, plus `/[id]` | `LearnerRow[]` / `LearnerDetail` (enrolments, orders, support context). Views request only the fields they need. |
| `/api/admin/courses` | GET | `CourseAdminRow[]` with moderation filters. |
| `/api/admin/courses/[id]/moderate` | POST | `{ action: publish\|unpublish\|flag\|unflag, note }` — audited; must not alter learner access or financial records. |
| `/api/admin/orders` | GET | `AdminOrderRecord[]` with status/commission/reconciliation fields. |
| `/api/admin/orders/[id]/review` | POST | Marks human review only; no financial side effects. |
| `/api/admin/payments` | GET | Gateway events (attempts/successes/failures/pending) for ops monitoring. |
| `/api/admin/commission-ledger` | GET | `LedgerEntry[]` derived from settled orders. |
| `/api/admin/earnings` | GET, plus `/[creatorId]` | `CreatorEarningsRow[]` and detail (ledger + payouts). |
| `/api/admin/payouts` | GET, POST | POST creates a **pending** record `{ creatorId, amountInPaise }` validated against outstanding balance. |
| `/api/admin/payouts/[id]/record` | POST | `{ transferRef, transferDate }` — server validates status=pending, ref present, sane date; the only transition to `recorded`. |
| `/api/admin/payouts/[id]/status` | POST | `{ status: failed\|cancelled, note }` — transitions guarded in-process. |
| `/api/admin/disputes` | GET, plus `/[id]/status`, `/[id]/notes` | Chargebacks/reversals/legal exceptions only — **no standard refund endpoint exists**. |
| `/api/admin/settings` | GET, PATCH | Feature flags; payment connection status is provider-derived (read-only). |
| `/api/admin/audit-logs` | GET | Append-only `AuditLogEntry[]` (actor, area, action, detail, kind, at). |

Every admin mutation is (a) authorized by role, (b) validated in-process, and (c) written to the audit log in the same transaction. Payout flows never move money from the app — they record externally made transfers.

## 8. Health

`GET /api/health` → `{ ok: true }` (200) or 500. Already implemented; used by deployment checks.

## 9. Security requirements for Prompt 5

- Supabase Row Level Security on all tables; server routes enforce ownership even with RLS on.
- Webhook + checkout signature verification mandatory; raw body preserved for HMAC.
- Validation on the server reuses `src/lib/validation.ts` schemas; responses shape per `ApiResult`.
- No secret material in client bundles; only `NEXT_PUBLIC_*` values are public.
