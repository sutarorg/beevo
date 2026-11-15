# Beevo Phase 3 — Admin Dashboard UX, FinOps & Security Research

**Date:** 2026-11-15  
**Scope:** Operational administration architecture, financial/credit-ledger governance, AI provider unit-economics monitoring, responsive accessible tables, and Next.js 15 + Supabase admin security patterns.

---

## 1. Repository Continuity Audit
Review of Phase 1 & Phase 2 artifacts confirms:
- **Brand & Tokens (`docs/beevo-design-system.md`, `tailwind.config.ts`):** Exact `BeevoLogo` (icon-only & wordmark), self-hosted `Sora` (display) + `Manrope` (UI/tabular-nums) fonts, honey yellow `#FFC928` (`--beevo-honey-text: #C48400` WCAG AA text), warm canvas `#FFFEFB`, white card surfaces `#FFFFFF`, subtle cream tint `#FFF9E9`, charcoal `#1B1916` (`beevo-ink` / `beevo-dark`), neutral muted gray `#6C675E`, and crisp `#ECE7DB` borders.
- **Confirmed Commercial Rules (`src/lib/beevo-data.ts`, `src/lib/app-types.ts`):**
  - Packs: Starter `₹299 / 300 credits`, Creator `₹599 / 800 credits`, Studio `₹899 / 1,500 credits`.
  - Metering: `100 credits / min`, `25 credits / 15-second block` (`ceil(duration_seconds / 15) × 25`), maximum single video `10 minutes (600s)`.
  - Pipeline Engines: OpenAI (script + dynamic storyboard), fal.ai (character references + scene images), ElevenLabs (voiceover + timestamp alignment), Beevo Dynamic Timeline, FFmpeg (motion, transitions, captions, MP4 export), Cloudflare R2 (private asset & MP4 storage), Razorpay (INR payments).
- **SEO & Route Isolation (`src/app/robots.ts`):** `/admin/` is already disallowed in `robots.ts` and has no existing duplicate routes under `src/app/admin/`.

---

## 2. SaaS Operational & Financial Dashboard Principles
Industry research across modern operational SaaS systems (financial ledgers, payment consoles, and AI FinOps platforms) highlights five non-negotiable standards:

1. **Compact Information Density Over Marketing Flourish:** Unlike consumer landing pages, operational dashboards eliminate large decorative hero banners, rainbow charts, and oversized card rounding in favor of tight `8–12px` card radii, restrained `1px` borders, `tabular-nums` alignment, and high scannability.
2. **Missing Data Is Never Zero:** Financial and telemetry metrics whose backend records are absent or not yet linked MUST display `—` / `Unavailable` with clear provenance rather than fabricating `₹0` or `0%` margin. Every KPI carries a documented calculation formula visible on inspection.
3. **Immutable Double-Entry Credit Ledger:** Balances are derived from append-only ledger rows (`purchase`, `reservation`, `deduction`, `release`, `refund`, `admin_adjustment`). Administrative adjustments never directly mutate a balance column; they post an audited delta entry with mandatory actor, reason, preview review, and confirmation step.
4. **Payment Administration Safety (Razorpay):** Payment status (`authorized`, `captured`, `failed`, `refunded`) is strictly read-only in the admin UI and synced exclusively via verified Razorpay webhooks. Refunds are initiated only through audited, confirmed server-side actions.
5. **AI Unit Economics & Actual-vs-Estimate Separation:** Because output tokens cost 4–6× input tokens (OpenAI), fal.ai bills per generated/regenerated image, ElevenLabs bills per character (`~1,000 chars/min`), FFmpeg bills worker compute runtime, and R2 bills storage + Class A/B operations, the AI Costs console must explicitly tag each line item as **Actual Provider Billing** vs **Calculated Estimate** before computing Contribution Margin.

---

## 3. Next.js 15 App Router + Supabase Admin Security Model (Phase 4 Ready)
Current 2026 Next.js App Router + `@supabase/ssr` best practices dictate:
- **Never trust frontend role checks as authorization.** UI gates only guide presentation; real authorization lives exclusively in Server Components, Route Handlers, Server Actions, and Supabase Postgres RLS policies.
- **Session & Role Verification:** Refresh session cookies in middleware with `supabase.auth.getClaims()` (local JWKS validation) and perform authoritative server verification via `supabase.auth.getUser()` plus role check against `profiles.role = 'admin'` (or verified JWT custom claims hook) before querying admin tables. Never trust `getSession()` server-side.
- **Zero Secret Leakage:** Service-role keys, OpenAI/fal.ai/ElevenLabs/R2 keys, and Razorpay webhook secrets remain strictly server-only (`process.env.*` without `NEXT_PUBLIC_`).
- **Explicit Frontend Resilience States:** Every admin surface is built to gracefully render `401 Unauthorized`, `403 Forbidden`, `Session Expired`, `Permission Failure`, `429 Rate Limit`, `5xx API Error`, loading skeletons, and empty operational states.

---

## 4. Accessible Responsive Tables, Charts & Dialogs (WCAG 2.2 AA)
- **Tables:** Semantic `<table>`, `<caption>` (or `aria-label`), `<th scope="col">`, `aria-sort` on sortable columns, and polite `aria-live="polite"` status announcements. On mobile (`< 768px`), structured `<dl>` operational cards prevent horizontal page overflow while preserving full field context.
- **Charts:** Zero unnecessary charting dependencies (custom lightweight semantic SVG components built natively for React 19 + Next.js 15 with zero peer-dependency conflicts, monochrome charcoal `#1B1916` + warm honey `#D99400` / muted neutral `#6C675E` palette, explicit axis units, actual date range header, keyboard-focusable/hover tooltips, and intentional empty-state panels when no backend series exists).
- **Destructive / Audited Dialogs:** Accessible modal dialogs (`role="alertdialog"`, `aria-modal="true"`, Escape close, focus restore, explicit review summary, and required confirmation/reason inputs).

---

## 5. Sources Referenced
- RapidDevelopers / Supabase Admin RBAC & RLS Guide (2026): `https://www.rapidevelopers.com/supabase-tutorial/how-to-protect-admin-routes-with-supabase`
- Next.js App Router + `@supabase/ssr` `getClaims()` vs `getUser()` Security Patterns (2026): `https://www.letrelay.com/blog/nextjs-app-router-supabase-auth-ssr`, `https://dev.to/anthonypan99/supabase-nextjs-16-authorize-with-getclaims-not-getsession-4423`
- DualEntry / ColorWhistle / Immutable Ledger Design Guides (2026): `https://www.dualentry.com/blog/saas-metrics-dashboard`, `https://colorwhistle.com/saas-credits-system-guide/`, `https://dev.to/programmingcentral/why-your-saas-balance-is-lying-to-you-designing-an-immutable-financial-ledger-in-typescript-and-294j`
- AI Unit Economics & ElevenLabs / OpenAI Per-Unit Metering Benchmarks (2026): `https://spendark.com/blog/ai-cost-per-user/`, `https://www.cartesia.ai/learn/elevenlabs-pricing`
- WCAG 2.2 AA Accessible Tables, Dialogs & Keyboard Navigation (2026): `https://www.thewcag.com/examples/tables`, `https://qapractices.com/checklists/accessibility-testing-checklist/`
