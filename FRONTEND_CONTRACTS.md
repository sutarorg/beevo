# Frontend Contracts

Contracts the Prompt 1 frontend relies on. Prompt 5 implements these on the backend **without rewriting pages**. Source of truth in code: `src/lib/domain.ts`, `src/lib/services/auth.ts`, `src/lib/validation.ts`.

## 1. Money

- All money is **integer paise** (`number`) with currency `INR`.
- Formatting happens only at the UI edge via `formatINR()`.
- `PLATFORM_COMMISSION_RATE = 0.08`. `commissionBreakdown(grossInPaise)` splits a sale into `{ grossInPaise, platformFeeInPaise, creatorShareInPaise }`.
- Illustrative math is always paired with the disclaimer: gateway charges and applicable taxes settle separately; nothing is an earnings/payout guarantee.

## 2. Domain models

```ts
interface CourseSummary {
  id: string; slug: string; title: string; blurb: string;
  coverUrl: string;               // R2-delivered media in production
  priceInPaise: number; lessonCount: number;
  durationLabel: string; level: "Beginner" | "Intermediate" | "All levels";
}

interface CreatorPublicProfile {
  id: string; handle: string;             // /@handle
  displayName: string; tagline: string; avatarUrl: string; niche: string;
  stats: { courseCount: number; learnerCount: number };
  links: { label: string; url: string }[];
  courses: CourseSummary[];
}
```

## 3. API envelope & async state

```ts
interface ApiError { code: string; message: string; fieldErrors?: Record<string, string[]>; }
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
type AsyncState<T> =
  | { status: "idle" } | { status: "loading" }
  | { status: "success"; data: T } | { status: "error"; error: ApiError };
```

All service functions return `ApiResult<T>` — UI never reads raw provider errors.

## 4. Authentication service

`AuthService` (src/lib/services/auth.ts) — the only auth surface the UI uses.

| Method | Input | Success | Notable errors |
| --- | --- | --- | --- |
| `signUp` | `{ fullName, email, password }` | `{ email, verificationRequired: true }` | `email_already_in_use` |
| `resendVerification` | `email` | `{ email }` | `rate_limited` |
| `signIn` | `{ email, password }` | `AuthSession` | `invalid_credentials`, `email_not_verified` |
| `requestPasswordReset` | `email` | `{ email }` | always succeeds (anti-enumeration) |
| `completePasswordReset` | `{ token, password }` | `{ success: true }` | `invalid_reset_token` |
| `signOut` | — | `{ success: true }` | — |

`AuthErrorCode`: `invalid_credentials | email_already_in_use | email_not_verified | invalid_reset_token | rate_limited | service_unavailable | unknown`.

### Auth UI states rendered in Prompt 1

1. Signup form → **email-verification pending** (with resend + 30s cooldown).
2. Login form → **successful-auth redirect** (success panel → countdown → redirect; today it exits to `/` because the dashboard ships in a later phase — `POST_AUTH_PATH` in `src/lib/config.ts`).
3. **Auth error** — inline banner + toast (login failures, `email_already_in_use`, invalid reset token, `?error=` codes on `/login`).
4. Password-reset **completion** (`/forgot-password/reset?token=…`) and **success** states.
5. **Unavailable** state when no provider is configured (production without mock flag).

### Mock adapter behaviour (demo only)

Deterministic, documented, never silent:

| Scenario | Trigger |
| --- | --- |
| Signup fails `email_already_in_use` | email = `taken@demo.test` |
| Signin fails `invalid_credentials` | email ends with `@fail.demo` |
| Reset fails `invalid_reset_token` | token missing or shorter than 6 chars |
| Everything else well-formed | succeeds |

Mock adapters activate when mock mode is on. Resolution: `NEXT_PUBLIC_USE_MOCKS` env var if set, otherwise the explicit in-source `REPO_SERVICE_MODE` in `src/lib/config.ts` ("mock" during Prompts 1–4; immune to sandbox `.env` resets). Every auth screen shows a **“Demo mode · mock services”** badge and a demo cheatsheet explains the triggers. With mocks off, auth pages render the unavailable panel instead of faking success.

## 5. Validation

Zod schemas in `src/lib/validation.ts` — `loginSchema`, `signupSchema`, `forgotPasswordSchema`, `resetPasswordSchema`. `validateFields` returns `{ values }` or a `{ fieldErrors }` map keyed by field name (`_form` for form-level). Password rule: ≥ 8 chars, ≥ 1 letter, ≥ 1 number, ≤ 72 chars. Server handlers in Prompt 5 must re-validate with the same schemas.

## 6. Mock data isolation

- All demo content lives in `src/lib/mocks/` (`creators.ts` for now) — clearly labelled in code and UI ("Demo" sticker + `MOCK_DATA_NOTICE` caption).
- Page components never hardcode example creators/courses; they import from the mock module through the shared domain types.
- No fake payments, revenue, payouts, or "real" learner records anywhere.

## 7. States every view must handle

`loading` (route `loading.tsx` + spinner), `error` (`error.tsx` boundary with retry), `empty` (future list views), `unavailable` (service not configured), `success` (toasts + panels). Toast notifications via `useToast()` (success/error/info, auto-dismiss, dismissible).

## 8. Creator app contracts (Prompt 2)

Routes `/creator/*` (Studio shell: sidebar on desktop, bottom-nav + "More" sheet on mobile, demo workspace strip with visible demo controls). Mock adapters persist course drafts to `sessionStorage` (`beevo_mock_courses_v1`), so leaving and resuming the editor works within the session; the "Reset demo data" control re-seeds.

### CourseService (src/lib/services/courses.ts)

`createDraft, getCourse, listCourses, saveDetails, setPrice, addSection, updateSection, deleteSection, reorderSections, addLesson, updateLesson, deleteLesson, reorderLessons, publish, unpublish, archive, unarchive` — all returning `ApiResult` over the `CourseEditor` model (`src/lib/creator-types.ts`). Ordering is array order; reorder calls send ordered id arrays. `publish` runs the authoritative readiness validation and returns `validation_failed` with `fieldErrors` grouped by stage (`details | curriculum | pricing`) — the client mirrors the same `readinessChecklist()` for instant feedback.

### MediaService (src/lib/services/media.ts)

`beginUpload({kind, fileName, sizeBytes, mimeType}) → UploadSession`, `performUpload(session, {onProgress, signal, previewUrl, durationLabel}) → MediaRef`, and `deleteUpload(assetId)` for unattached files. Kinds/rule table in `UPLOAD_RULES`; `validateUploadFile` is the shared client-side check (cover/avatar ≤5MB images; video ≤1GB mp4/mov/webm; resources ≤500MB pdf/zip/images/csv, max 5). Large live uploads use direct R2 multipart requests; R2 CORS must allow `POST` and expose `ETag`. A single-PUT HTTP 413 also switches to multipart rather than failing. Every mock `MediaRef` carries `simulated: true` and UI shows `SIMULATED_UPLOAD_NOTE` ("no file left your device"). Cancellation returns `upload_cancelled` (silent in UI); errors support retry with the retained File.

### CreatorDataService (src/lib/services/creator-data.ts)

`getDashboard, getAnalytics, listStudents, listOrders, getEarnings, getProfile, updateProfile, listNotifications, markAllNotificationsRead, submitSupportTicket`. Orders carry `demo: true` and every money view shows a Demo label. Earnings/analytics figures derive from seeded sample orders only — never presented as real transactions.

### Autosave contract

Keystroke → validate immediately → debounce 800ms → "Saving…" → `saveDetails` → "Saved" (auto-clears) or preserved value + error + Retry. Blur flushes pending saves. Same pattern for title, description, outcomes.

### Failure triggers (demo)

- Any save text containing `[fail]` → `save_failed` (retry path).
- Upload filename containing `fail` → mid-upload `upload_failed`.
- "Fail next request" demo control → next call returns `service_unavailable`.
- Profile handle validation: reserved handles `admin, support, beevo, help, pricing` → `handle_taken`.

## 9. Storefront, checkout & learner contracts (Prompt 3)

Types in `src/lib/learner-types.ts`. Public shapes are delivery-safe: no storage keys, signed URLs, payment secrets, or media refs — only titles, counts, durations, and preview flags.

### StorefrontService (src/lib/services/storefront.ts)

- `getCreator(handle) → PublicCreatorPage` — profile + **published courses only**; unknown handle → `not_found` (page shows a neutral not-found state that doesn't reveal private info).
- `getCourse(handle, slug) → PublicCoursePage` — **published only** (unpublished/archived/draft → `not_found`). Lessons expose `PublicLessonMeta` (never media refs); exactly one video lesson is flagged `isPreview`.
- Public routes: `/@username`, `/@username/course-slug` (App Router `[handle]` requiring a literal `@` prefix; anything else → `notFound()`). No marketplace/catalogue/discovery feed exists or links to these pages — discovery stays on the creator's channels.

### CheckoutService (src/lib/services/checkout.ts)

Drives the payment state machine: `ready → creating_order → checkout_open → processing → success | failed | cancelled | pending`. Contracts: `createOrder(courseId) → CheckoutOrder {orderId, amountInPaise, platformFeeInPaise, currency, gateway:"razorpay-simulated", keyId:"rzp_test_DEMO_NOT_A_REAL_KEY"}`; `settlePayment(orderId, outcome)`; `confirmPendingPayment(orderId)`. The mock gateway panel offers explicit success/decline/bank-pending/cancel choices; every receipt notes **"Simulated payment — no money was charged"**. No Razorpay secrets anywhere; the shape matches the real Prompt 5 flow (order creation → Checkout.js events → signature verification). On success the UI calls `learner.recordDemoPurchase(order)` (idempotent by orderId). Sign-in happens inline and the selected course stays in context throughout the handoff.

### LearnerService (src/lib/services/learner.ts)

- Session: `getSession()` (sync), `signIn(email)` (demo), `signOut()`; unauthenticated calls return `auth_required` and the shell shows the sign-in panel.
- Library & access: `getLibrary()`, `getCourse(courseId)` (403-equivalent `not_enrolled`), `getLesson(courseId, lessonId)` (marks last-accessed; returns a **simulated** playback session — duration + resume position, never a delivery URL).
- Progress: `updateProgress(courseId, lessonId, {completed?, positionSeconds?})` — sessionStorage only, labelled demo; `listPurchases()` (records carry `demo: true`).

### Simulated playback & downloads

Player: fake clock with play/pause/seek/speed/fullscreen, position persisted via debounced `updateProgress`, auto-complete on end, completed/incomplete states, prev/next navigation, expandable sections. Resource downloads generate an honest placeholder Blob ("simulated download — no real course file was stored").

## 10. Admin console contracts (Prompt 4)

Routes `/admin/*` behind a **simulated** admin session (`AdminService.getSession/signIn/signOut`; the gate is labelled "not real security" — Prompt 5 adds server authorization). Types in `src/lib/admin-types.ts`; mock seed in `src/lib/mocks/admin.ts`; the mock service persists mutations + an audit trail to sessionStorage.

### AdminService (src/lib/services/admin.ts)

Reads: `getDashboard` (KPIs), `listCreators/getCreator`, `listLearners/getLearner`, `listCourses`, `listOrders`, `listPaymentEvents`, `getCommissionLedger`, `getCreatorEarnings/getCreatorEarningsDetail`, `listPayouts`, `listDisputes`, `getSettings`, `listAuditLogs`.

Mutations (all append `AdminEvent` entries to the mock audit log): `setCreatorStatus` (suspend requires a reason), `moderateCourse` (publish/unpublish/flag/unflag — never touches learner access or financials), `reviewOrder` (review flag only), `createPayout` (creates `pending`, validates against outstanding balance), `recordPayout` (requires status `pending` + bank/UTR reference ≥6 chars + non-future date; the only path from `pending` to `recorded` — never automatic), `setPayoutStatus` (failed|cancelled, note required), `setDisputeStatus/addDisputeNote`, `updateSettings`.

### Financial derivation rule

All money figures are derived **once** inside the service from base records (`ledger()`/`earningsFor()`): gross, 8% commission (shared rule), estimated gateway cost (2%, labelled est.), creator share, payable, paid-out (sum of `recorded` payouts), outstanding (payable − paid-out). Pages display only — no per-page math, and copy always separates *outstanding* (not paid) from *paid out* (recorded transfers).

### Status vocabularies

Orders: paid/pending/failed/refunded × reconciliation settled/pending/exception × commission accrued/waived/reversed. Payouts: pending → recorded | failed | cancelled (recorded ⇒ transferRef + transferDate + recordedBy present). Disputes: chargeback/dispute/reversal/legal_exception × open/under_review/resolved. No standard-refund flow exists anywhere; disputes are the only remedy surface.

### Commission rounding rule

Fee paise = `Math.round(grossPaise × 0.08)` — round half up to the nearest paise. Implemented once in `commissionBreakdown()` (`src/lib/domain.ts`) and reused by orders, analytics, earnings, pricing stage, and the marketing calculator. The pricing stage labels it a frontend estimate; the server-side checkout calculation (Prompt 5) is authoritative.
