# Beevo — Project Specification

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
| Auth | First-party email + password on PostgreSQL sessions (`src/server/auth.ts`) |
| Database | PostgreSQL *(Supabase in production; local dev scaffold uses the same `DATABASE_URL` name)* |
| Payments | Razorpay Payment Gateway (server-verified orders + signed webhooks) |
| Transactional email | Resend (`src/server/email.ts`) |
| Storage / media delivery | Cloudflare R2 (local `.uploads/` fallback in development) |
| Version control | GitHub |
| Deployment | Vercel-compatible |

## 4. Routes

### Public (implemented in Prompt 1)

`/`, `/features`, `/how-it-works`, `/pricing`, `/faq`, `/terms`, `/privacy`, `/refund-policy`

### Blog (static content)

`/blog` (guide index, grouped by topic) and `/blog/[slug]` (ten long-form articles:
platform comparisons, pricing, selling in India, launch playbooks, audience
conversion). Content lives in `src/content/blog/`; Article + BreadcrumbList +
FAQPage JSON-LD, Article Open Graph, and sitemap entries are generated from it.

### Public storefront (live data)

`/@username` (creator storefront), `/@username/course-slug` (course sales page + Razorpay checkout)

### SEO surfaces

`/robots.txt` (`src/app/robots.ts`), `/sitemap.xml` (`src/app/sitemap.ts`, revalidated hourly:
static pages + non-empty storefronts + published courses). Every public page carries a canonical
URL, Open Graph/Twitter metadata and JSON-LD; the private app trees (`/creator`, `/learn`, `/admin`,
auth) are `noindex` via metadata and `X-Robots-Tag`. `npm run seo:audit` verifies the surface
against a running server.

### Auth

`/login`, `/signup`, `/forgot-password`, `/forgot-password/reset` (completion, token via query param)

Auth screens also render: email-verification pending, successful-auth redirect, auth error, and service-unavailable states.

### Creator app (live data)

`/creator/dashboard`, `/creator/courses`, `/creator/courses/new`, `/creator/courses/[courseId]/edit` (stages: details, curriculum, pricing, review), `/creator/students`, `/creator/orders`, `/creator/analytics`, `/creator/profile`, `/creator/earnings`, `/creator/settings`, `/creator/support`

### Learner app (live data)

`/learn/courses` (library + continue learning), `/learn/courses/[courseId]` (course + curriculum), `/learn/courses/[courseId]/lessons/[lessonId]` (player + progress), `/learn/purchases`, `/learn/settings`, `/learn/support` (`/learn` redirects)

### Admin console (role-gated, live data)

`/admin/dashboard`, `/admin/creators`, `/admin/learners`, `/admin/courses`, `/admin/orders`, `/admin/payments`, `/admin/commission-ledger`, `/admin/earnings`, `/admin/payouts`, `/admin/disputes`, `/admin/settings`, `/admin/audit-logs`

### API

Business routes live under `/api/v1/*` (single catch-all router in `src/server/router.ts`
with handlers in `src/server/handlers/`): auth, courses, uploads, media, creator,
learner, storefront, checkout, admin, and the Razorpay webhook.

## 5. Phases

| Phase | Scope | Status |
| --- | --- | --- |
| Prompt 1 | Public website + auth screens | Complete |
| Prompt 2 | Creator dashboard + course builder | Complete |
| Prompt 3 | Public storefront + course sales pages + checkout & learner app | Complete |
| Prompt 4 | Admin console | Complete |
| Prompt 5 | Backend: PostgreSQL schema/RLS, first-party auth, Razorpay, Resend, R2/local storage, server authorization | Complete |
| Prompt 6 | End-to-end tests + DEPLOYMENT.md | Planned |

Phases reuse the same routes, domain types (`src/lib/domain.ts`), validation schemas (`src/lib/validation.ts`), legal copy (`src/lib/legal.ts`), business rules, and environment definitions (`.env.example`).

## 6. Environment definitions

Canonical definitions live in `.env.example`:

| Variable | Purpose | Phase |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | scaffold |
| `NEXT_PUBLIC_USE_MOCKS` | Explicit opt-in to mock service adapters. Never enable in real production. | 1 |
| `NEXT_PUBLIC_APP_URL` | Absolute site URL for metadata/emails (canonical origin; `https://beevo.in` in production) | 1 |
| `GOOGLE_SITE_VERIFICATION` | Search Console verification token (optional; omitted when empty) | 1 |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | 5 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase | 5 |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments | 5 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email | 5 |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_BASE_URL` | Media storage | 5 |

No secrets are committed anywhere; `.env.example` contains names only.
