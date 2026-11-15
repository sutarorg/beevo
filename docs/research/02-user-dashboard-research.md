# Beevo Phase 2 — User Dashboard, Creation Studio & Video Workspace Research

**Date:** 2026-11-15  
**Scope:** Master Prompt 02 — User-facing authenticated frontend application (`/login`, `/signup`, `/forgot-password`, `/app/**`)  
**Phase 1 Baseline Inspected:** `docs/beevo-brand-guidelines.md`, `docs/beevo-logo-specification.md`, `docs/beevo-design-system.md`, `docs/beevo-product-contract.md`, `docs/beevo-public-routes.md`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/beevo-data.ts`.

---

## 1. Repository & Phase 1 Continuity Audit

### Verified Reusable Assets & Tokens
- **Brand Mark (`src/components/brand/BeevoLogo.tsx`):** Minimal geometric SVG bee icon (`icon`, `horizontal`, `compact`, `monochrome` variants) + `Sora` 800 lowercase `beevo` wordmark. Reused verbatim across auth screens, desktop sidebar, tablet rail, and mobile header.
- **Typography (`src/app/fonts/` via `next/font/local`):** Self-hosted `Sora` (headings/display) and `Manrope` (UI/body/tabular numerals). Zero external font latency.
- **Color Palette (`src/app/globals.css`):**
  - Warm Canvas `#FFFEFB`, Card White `#FFFFFF`, Warm Cream `#FFF9E9`, Deeper Cream `#FFF4D8`
  - Beevo Honey Yellow `#FFC928`, Hover `#F2B800`, Accessible Honey Text `#B87800`, Display Gold `#DF9E00`
  - Dark Charcoal Feature Surface `#171717` / `#1D1C19` (used deliberately for cinematic video player stages, live caption preview monitor, and focused studio hero/telemetry accents so creative media pops against warm ivory chrome)
  - Hairline warm borders `#ECE7DB` & `#F3DF9E`, shadows `--beevo-shadow`, `--beevo-shadow-card`, `--beevo-shadow-cta`
- **Single Source of Truth Data (`src/lib/beevo-data.ts`):** All 8 visual styles (with all 8 native AI-generated WebP style samples in `public/images/beevo/style-*.webp`), confirmed INR credit packs (`Starter ₹299 / 300cr`, `Creator ₹599 / 800cr`, `Studio ₹899 / 1,500cr`), and credit billing math (`100 credits = 1 min`, `25 credits = 15 sec`, max 10 min/project).
- **Layout Architecture Finding:** Phase 1 placed `<Header />` and `<Footer />` directly in `src/app/layout.tsx`. For Phase 2, we refactor using canonical Next.js App Router **Route Groups** (`src/app/(marketing)/layout.tsx`, `src/app/(auth)/layout.tsx`, and `src/app/app/layout.tsx`) while keeping `src/app/layout.tsx` strictly for `<html>`, `<body>`, fonts, and global styles. This preserves every Phase 1 public URL untouched while keeping marketing chrome completely out of the studio workspace.

---

## 2. Creative Software, Storyboard & AI Video UX Research

Analysis of leading visual-planning, script-to-video, and storyboard creative studios (Storyflow, Descript, Runway, Wonder Unit Storyboarder, Toon Boom Storyboard Pro, CapCut) highlights five core lessons that separate genuine creative tools from generic SaaS dashboards:

1. **Prompt & Script First, Controls Second:** Creative tools open directly onto a spacious writing/creation canvas—never a wall of sales KPI widgets or empty charts. In Beevo, `/app/create` puts the prompt editor ("Bring your idea to life.") front and center, backed by a sticky real-time credit estimator so creators always know exact credit cost before committing.
2. **Grouped Progressive Disclosure Instead of Long Forms:** Combining 14 creation dimensions (prompt, duration, aspect ratio, resolution, style, characters, voice, pacing, camera, transitions, captions, music, SFX, advanced controls) into one flat vertical form overwhelms users. Grouping controls into clear, spacious studio modules with anchor jump navigation and a collapsible **Advanced Controls** drawer keeps 90% of workflows fast while giving power users full technical control.
3. **Dynamic Storyboard Review Before Final Render:** Industry pre-production tools prove that reviewing script + visual beats + character references *before* committing full image/render credits prevents wasted runs. Beevo's `/app/projects/[id]/storyboard` adopts a classic three-pane creative workstation on desktop (Section Navigator | Storyboard Canvas | Scene Properties & Style Bible), collapsing into an inspector drawer on tablet and a focused vertical card list + bottom-sheet editor on mobile.
4. **Honest Real-Time Pipeline Telemetry:** Because Beevo composes multi-minute videos across 10 concrete backend stages (`Script → Storyboard → Character Refs → Images → Narration → Audio Alignment → Dynamic Timeline → FFmpeg Render → Final Export → R2 Upload`), the Generation Workspace (`/app/generations/[id]`) must present factual stage progression, dynamic `X / N` image counts only once `N` exists from the approved storyboard, and transparent credit reservation/deduction accounting—never fabricated spinners or fake percentages.
5. **Dark Charcoal Stage for Media Inspection, Warm Ivory Chrome for Controls:** Video players, live caption previews, and timeline monitors benefit from a calm dark charcoal stage (`#171717` / `#1E1D1A`) so vibrant cartoon colors and white/yellow captions evaluate accurately, while surrounding controls stay in Beevo's signature warm ivory (`#FFFEFB`) and butter cream (`#FFF9E9`).

---

## 3. Current Next.js 15 & Supabase SSR Architecture Alignment

Research against current Next.js App Router and Supabase SSR (`@supabase/ssr`) documentation informs how Phase 2 prepares cleanly for Phase 4 wiring:
- **Route Groups:** `(marketing)`, `(auth)`, and `app/` isolate Server Component layouts cleanly without changing URLs or shipping marketing footer bundles to authenticated pages.
- **Supabase SSR Readiness:** Phase 4 will use `@supabase/ssr` with cookie-based `createServerClient` + Next.js `middleware.ts` calling `supabase.auth.getUser()` (never trusting unverified `getSession()` on the server) and RLS policies bound to `auth.uid()`.
- **No-Demo / Honest Unconnected Boundary:** Until Phase 4 connects Supabase Auth, Postgres, ElevenLabs, fal.ai, OpenAI, FFmpeg workers, and Cloudflare R2, every data-dependent view consumes a typed repository interface (`src/lib/app-api.ts`) that returns honest `unconfigured` / empty states rather than hardcoded fake profiles, balances, voices, music tracks, videos, or transactions.

---

## 4. User Journeys, Screen Layouts & Interaction States

### Primary Creative Journey
1. **Entry & Auth:** `/login`, `/signup`, `/forgot-password` → Clean split/centered warm-ivory auth cards with password visibility toggles, strict client validation, and honest Phase 4 auth status.
2. **Creative Home (`/app`):** Calm dark-charcoal studio greeting banner (`"Welcome back. What are we creating today?"`) + prominent `Create Video` CTA + real Credit Wallet card + genuinely empty states for Recent Projects (`"Every great story starts with an idea."`), Active Generation, and Recent Credit Activity.
3. **Studio Creation (`/app/create`):** 2-column desktop studio (grouped creative controls left + sticky Production Summary & live `ceil(sec/15) × 25` credit estimator right), real interactive caption preview stage, local image upload previews for character references, and collapsible Advanced Controls.
4. **Storyboard Review (`/app/projects/[id]/storyboard`):** 3-pane studio (outline/sections, central script + style bible + dynamic scene board, right scene inspector) with full scene CRUD/reorder interaction on local draft scenes and explicit `Planned · Image pending generation` labels.
5. **Generation Monitor (`/app/generations/[id]`):** 10-stage pipeline stepper, progressive `X / N` image grid (`0 / —` until storyboard exists), Narration status widget, Dynamic Timeline tracks canvas, FFmpeg render/upload telemetry, Credit Reservation ledger, and validated MP4 completion slot.
6. **Media Library & Detail (`/app/videos`, `/app/videos/[id]`):** Search/grid-list/sort/date/status toolbar with clean empty library state; detail page featuring cinematic `<video>` player stage, specs rail, and rename/delete modals.
7. **Wallet & Account (`/app/credits`, `/app/transactions`, `/app/notifications`, `/app/settings`):** Confirmed INR packs (`Starter ₹299`, `Creator ₹599`, `Studio ₹899`), typed transaction ledger table + mobile cards, notification center, and full profile/preferences/security/deletion settings.

---

## 5. Responsive & Accessibility Decisions (320px – 1920px)

| Breakpoint Band | Navigation Pattern | Layout Adaptation | Key Accessibility Guarantees |
| --- | --- | --- | --- |
| **Mobile (`320–767px`)** | Compact 56px top bar (Beevo icon + title + menu drawer trigger) + fixed 64px bottom nav (`Home`, prominent `Create`, `Videos`, `Credits`) | Single-column flow; sticky bottom credit summary bar on `/app/create`; full-screen/bottom-sheet scene editor on Storyboard; card-stacked ledger rows on Transactions | `>= 44×44 px` touch targets; `role="dialog" aria-modal="true"` drawers with `Escape` close; zero horizontal overflow even at `320px`; safe-area bottom spacing |
| **Tablet (`768–1023px`)** | Collapsible compact navigation drawer (`768–1023px`) + uncluttered top bar | 2-column style grids, collapsible inspector drawer on Storyboard, stacked-then-split studio panels | Keyboard focus rings (`2px solid #171717`), `aria-expanded` / `aria-controls` on drawers & accordions |
| **Desktop (`1024–1920px`)** | Persistent `252px` left sidebar with elevated `Create Video` button + sticky 64px top bar (Title, Breadcrumbs, Credits pill, Notifications, Account) | Wide comfortable workspace (max `1320px` inner rail); 2-column `/app/create` with sticky summary rail; 3-pane Storyboard workspace; multi-column Generation telemetry | Semantic `<nav>`, `<aside>`, `<main>`, `<header>`; ARIA live announcements for dynamic credit updates & form validation; full `prefers-reduced-motion` support |
