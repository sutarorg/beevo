# CourseKit — Project Specification

**One line:** A mobile-first SaaS where creators and influencers sell courses directly to the audience they already have — through their own links, from their own storefront.

**Explicitly not:** a marketplace. There is no public course catalogue, no shared discovery feed, no ranking algorithm. Buyers arrive exclusively through links the creator shares.

---

## 1. Business rules (fixed)

| Rule | Value |
| --- | --- |
| Plans | **Free only** — ₹0/month. There is no Pro plan and no paid creator subscription. |
| Platform commission | **8%** per successful eligible course sale. 92% accrues to the creator. |
| Failed / reversed / refunded sales | Not eligible; no commission. |
| Refunds | **No standard refunds** once access is granted — **except** where a refund or other remedy is required by applicable law. Mandatory consumer rights are never disclaimed. |
| Payouts | Recorded **manually by platform administrators** under the intended payment arrangement, **subject to provider approval** and settlement timelines. |
| Earnings claims | Any example arithmetic is illustrative; never present estimated creator earnings as guaranteed payouts. |
| Honesty | Never invent completed payment transactions, real revenue, payouts, or learner records. Demo data must be labelled and isolated. |

## 2. Actors

- **Creators** — manage their profile, courses, and learners; share storefront/course links.
- **Learners** — purchase courses and access purchased content via a learner dashboard.
- **Admins** — manage the platform; record creator payouts manually.

## 3. Technology

| Concern | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript |
| Auth | Supabase Auth *(wired in Prompt 5)* |
| Database | PostgreSQL *(Supabase in production; local dev scaffold uses the same `DATABASE_URL` name)* |
| Payments | Razorpay Payment Gateway *(Prompt 5)* |
| Transactional email | Resend *(Prompt 5)* |
| Storage / media delivery | Cloudflare R2 *(Prompt 5)* |
| Version control | GitHub |
| Deployment | Vercel-compatible |

## 4. Routes

### Public (implemented in Prompt 1)

`/`, `/features`, `/how-it-works`, `/pricing`, `/faq`, `/terms`, `/privacy`, `/refund-policy`

### Public storefront (implemented in Prompt 3, mock services)

`/@username` (creator storefront), `/@username/course-slug` (course sales page + simulated checkout)

### Auth interfaces (implemented in Prompt 1, mock service adapters)

`/login`, `/signup`, `/forgot-password`, `/forgot-password/reset` (completion, token via query param)

Auth screens also render: email-verification pending, successful-auth redirect, auth error, and service-unavailable states.

### Creator app (implemented in Prompt 2, frontend-only, mock service adapters)

`/creator/dashboard`, `/creator/courses`, `/creator/courses/new`, `/creator/courses/[courseId]/edit` (stages: details, curriculum, pricing, review), `/creator/students`, `/creator/orders`, `/creator/analytics`, `/creator/profile`, `/creator/earnings`, `/creator/settings`, `/creator/support`

### Learner app (implemented in Prompt 3, mock services)

`/learn/courses` (library + continue learning), `/learn/courses/[courseId]` (course + curriculum), `/learn/courses/[courseId]/lessons/[lessonId]` (simulated player + progress), `/learn/purchases`, `/learn/settings`, `/learn/support` (`/learn` redirects)

### Admin console (implemented in Prompt 4, mock services, simulated admin session)

`/admin/dashboard`, `/admin/creators`, `/admin/learners`, `/admin/courses`, `/admin/orders`, `/admin/payments`, `/admin/commission-ledger`, `/admin/earnings`, `/admin/payouts`, `/admin/disputes`, `/admin/settings`, `/admin/audit-logs`

### Reserved for later phases

`/api/*` business routes, payment webhooks.

## 5. Phases

| Phase | Scope | Status |
| --- | --- | --- |
| Prompt 1 | Public website + auth page interfaces (frontend only, mock adapters) | Complete |
| Prompt 2 | Creator dashboard + course builder (frontend only, mock adapters) | Complete |
| Prompt 3 | Public storefront + course sales pages + checkout & learner app (frontend only) | Complete |
| Prompt 4 | Admin console (frontend only, mock services) | Complete |
| Prompt 5 | Real backend: Supabase, Razorpay, Resend, R2, authorization | Planned |
| Prompt 6 | End-to-end tests + DEPLOYMENT.md | Planned |

Phases reuse the same routes, domain types (`src/lib/domain.ts`), validation schemas (`src/lib/validation.ts`), legal copy (`src/lib/legal.ts`), business rules, and environment definitions (`.env.example`).

## 6. Environment definitions

Canonical definitions live in `.env.example`:

| Variable | Purpose | Phase |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | scaffold |
| `NEXT_PUBLIC_USE_MOCKS` | Explicit opt-in to mock service adapters. Never enable in real production. | 1 |
| `NEXT_PUBLIC_APP_URL` | Absolute site URL for metadata/emails | 1 |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | 5 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase | 5 |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments | 5 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email | 5 |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_BASE_URL` | Media storage | 5 |

No secrets are committed anywhere; `.env.example` contains names only.
