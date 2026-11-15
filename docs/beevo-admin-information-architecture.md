# Beevo Admin Dashboard — Information Architecture & Route Map

**Base Path:** `/admin` (isolated layout under `src/app/admin/layout.tsx`, completely separate from public `(marketing)` and creator `/app` layouts; disallowed in `robots.ts`).

---

## 1. Navigation Taxonomy (10 Sidebar Items Across 3 Operational Groups)

### Operations
1. **Overview** (`/admin`) — Daily executive & operational pulse (16 documented KPIs across 4 logical bands, date range selector, 8 restrained trend charts, genuine recent activity stream).
2. **Users** (`/admin/users`, `/admin/users/[id]`) — Account directory, status governance (suspend/reactivate), full customer dossier (profile, credits, projects, videos, payments, ledger, generations, total AI cost), audited credit adjustment entry point.
3. **Generations** (`/admin/generations`, `/admin/generations/[id]`) — End-to-end 9-stage pipeline monitor (`Script creation` → `Final MP4 upload`), per-job telemetry table, and authorized-staff generation inspector (idea, script, storyboard, character refs, images, voice, alignment, timeline, render logs, retries, errors, ledger refs, cost records).

### Financials & Unit Economics
4. **Payments** (`/admin/payments`) — Read-only Razorpay payment & order ledger with detail drawer and backend-verified refund request workflow (no frontend status mutation).
5. **Credit Ledger** (`/admin/credits`) — Immutable ledger viewer across all credit transaction types plus audited administrative Add/Deduct adjustment workbench (user search/select, delta, mandatory reason, review step, confirmation modal).
6. **AI Costs** (`/admin/ai-costs`) — Provider-by-provider cost breakdown (OpenAI, fal.ai, ElevenLabs, FFmpeg workers, Cloudflare R2 storage) + Profitability & Contribution Margin dashboard explicitly separating Actual Provider Billing from Estimates.

### Assets & Governance
7. **Media Library** (`/admin/media-library`) — Private R2 asset inventory across all 7 asset categories (character refs, cartoon images, narration tracks, background music, SFX, captions, finished MP4s) with access-control enforcement indicators.
8. **Music Library** (`/admin/music-library`) — Approved, genuinely licensed background music & SFX manager with audio preview controls, usage rights, license reference, active toggle, and upload/register draft interface (zero fake tracks).
9. **Configuration** (`/admin/configuration`) — Distinct server-side settings panels (Pricing packs, Credit rules, Generation settings, Creative presets) with zero exposed secret keys and confirmation gating for sensitive changes.
10. **Audit Logs** (`/admin/audit-logs`) — Strictly read-only chronological audit trail (admin actor, action, target, result, timestamp, structured metadata) with multi-axis filters.

---

## 2. Complete Route Inventory (12 Routes, Zero Duplicates)

| # | Route | Primary Purpose | Secondary / Detail Views |
| --- | --- | --- | --- |
| 1 | `/admin` | Executive & Operational Overview | Date range presets + custom period |
| 2 | `/admin/users` | User Directory & Status Management | Links to `/admin/users/[id]` |
| 3 | `/admin/users/[id]` | Customer Dossier & Account Controls | Profile, Credits, Projects, Videos, Payments, Ledger, Generations, Cost |
| 4 | `/admin/generations` | 9-Stage Pipeline Monitoring Table | Links to `/admin/generations/[id]` |
| 5 | `/admin/generations/[id]` | Deep Generation Telemetry Inspector | Staff privacy notice, logs, retries, errors, costs |
| 6 | `/admin/payments` | Razorpay Receipts & Refund Operations | Slide-over payment detail drawer |
| 7 | `/admin/credits` | Credit Ledger + Audited Adjustment Workbench | Review & confirmation dialog |
| 8 | `/admin/ai-costs` | Provider Telemetry + Contribution Margin | Actual vs Estimate provenance badges |
| 9 | `/admin/media-library` | Private R2 Asset Inventory | Access & storage key metadata |
| 10 | `/admin/music-library` | Licensed Music & SFX Catalog Manager | Real audio player + add-track form |
| 11 | `/admin/configuration` | Pricing, Credit Rules, Pipeline & Presets | Sensitive-change confirmation dialog |
| 12 | `/admin/audit-logs` | Read-Only Admin Audit Trail | Expandable metadata inspector |

---

## 3. Documented KPI Calculation Specifications (`/admin`)

| KPI | Documented Formula / Source | Missing-Data Rule |
| --- | --- | --- |
| Total users | `COUNT(profiles)` | Show `—` when unconfigured |
| New users | `COUNT(profiles WHERE created_at IN range)` | Show `—` |
| Active users | `COUNT(DISTINCT user_id FROM generations OR projects WHERE updated_at IN range)` | Show `—` |
| Total projects | `COUNT(projects WHERE created_at IN range)` | Show `—` |
| Completed videos | `COUNT(generations WHERE status = 'completed' AND r2_verified = true AND created_at IN range)` | Show `—` |
| Failed generations | `COUNT(generations WHERE status = 'failed' AND created_at IN range)` | Show `—` |
| Total generated minutes | `SUM(actual_duration_seconds) / 60` across verified completed renders | Show `—` |
| Total image requests | `COUNT(fal_image_requests WHERE created_at IN range)` (initial + retries + regenerations) | Show `—` |
| Credits issued | `SUM(credits) WHERE type IN ('purchase', 'admin_adjustment_add')` | Show `—` |
| Credits consumed | `SUM(ABS(credits)) WHERE type = 'deduction'` | Show `—` |
| Reserved credits | `SUM(credits) WHERE type = 'reservation' AND settled_at IS NULL` | Show `—` |
| Gross payment receipts | `SUM(amount_paise) / 100 WHERE razorpay_status = 'captured'` (net of voided orders) | Show `—` (never `₹0` if missing) |
| Net revenue (ex. tax) | `(Gross receipts - Refunds) / (1 + configured_gst_rate)` | Show `—` if receipts or tax config missing |
| Provider expenditure | `OpenAI actual + fal.ai actual + ElevenLabs actual + R2 actual` | Show `—` if any provider feed missing |
| Rendering expenditure | `SUM(ffmpeg_worker_compute_cost_inr)` for period | Show `—` |
| Contribution margin | `(Net revenue ex. tax - Payment fees - Provider expenditure - Rendering expenditure - Storage cost) / Net revenue ex. tax × 100` | Show `—` if denominator missing or `0` |
