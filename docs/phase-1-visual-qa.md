# Beevo Phase 1 — Real-Browser Visual & Responsive QA Report

**Date:** 2026-11-15  
**Test Harness:** Playwright + `@sparticuz/chromium` running against live Next.js 15.5.29 production build (`next start -H 0.0.0.0 -p 3000`)  
**Script:** `scripts/visual-qa.mjs`  
**Raw Report Artifact:** `qa-screenshots/qa-report.json`  
**Reference Authority:** `google_drive/ChatGPT Image Nov 15, 2026, 08_34_35 PM.png` (`941 × 1,672 px`)

---

## 1. Executive QA Verdict

All Phase 1 quality gates **PASSED** in Pass 2 after fixing every real visual, CSS-cascade, responsive, and WCAG 2.2 touch-target finding caught in Pass 1:

| Check | Pass 1 Result | Pass 2 Result (Verified) |
| --- | --- | --- |
| TypeScript (`npm run typecheck`) | Pass (0 errors) | **Pass (0 errors)** |
| ESLint (`npm run lint`, `next/core-web-vitals`) | Added `.eslintrc.json` | **Pass (0 warnings, 0 errors)** |
| Production Build (`npm run build`) | Pass (20/20 routes) | **Pass (20/20 routes, 127 kB First Load JS on `/`)** |
| Console Errors (App Routes) | 0 app errors (1 expected 404 test) | **0 errors** |
| Uncaught Page Errors | 0 | **0** |
| Routes Returning HTTP 200 (14 routes) | 14/14 | **14/14** |
| Broken Images (14 routes × 14 viewports) | Caught lazy scroll abort on `/` & `600px` | **0 broken images across all 14 routes & 14 viewports** |
| Missing `alt` Attributes | 0 | **0** |
| Horizontal Overflow (`320px`–`1920px`) | 0 | **0 across all 14 viewports** |
| Mobile Touch Targets `< 44×44 px` (`390px`) | 16 caught (header CTA, range sliders, footer links) | **0 undersized visible touch targets** |
| Wooden Signpost HTML Overlay Contrast | Caught dark ink override from unlayered `.font-display` | **Fixed — crisp `#FFFDF7` (`rgb(255, 253, 247)`) + `#FFD859` icons** |
| Tablet `768px` Hero CTA Wrapping | Caught 2-line wrap inside narrow pills | **Fixed — single-line pill buttons with clean wrap** |
| Hero-to-Benefit-Strip Overlap | Slight white gap on desktop | **Fixed — white 4-cell strip cleanly overlaps meadow edge** |
| Technical Endpoints (`/robots.txt`, `/sitemap.xml`, `404`, redirects) | All pass | **All pass** |
| Interactive Flows (6 flows) | All pass | **All pass (6/6)** |

---

## 2. Reference Comparison (`google_drive/ChatGPT Image Nov 15, 2026, 08_34_35 PM.png`)

Screenshots inspected visually via `read_file`:
- `qa-screenshots/home-desktop-1280-top6.png` (top 6 blocks compared side-by-side with reference)
- `qa-screenshots/home-ref-941-fold.png` (`941 × 1,672 px` exact reference viewport)
- `qa-screenshots/home-desktop-1280-styles.png` (Visual Style Showcase — all 8 styles)
- `qa-screenshots/home-desktop-1280-bottom.png` (FAQ, Final CTA cream panel, Footer)
- `qa-screenshots/home-tablet-768-fold.png` (`768 × 1,024 px`)
- `qa-screenshots/home-mobile-390-fold.png` (`390 × 844 px`)
- `qa-screenshots/home-mobile-320-fold.png` (`320 × 640 px`)
- Subpages: `page-pricing-desktop.png`, `page-features-desktop.png`, `page-how-it-works-desktop.png`, `page-faq-desktop.png`, `page-contact-desktop.png`, `page-use-cases-education-desktop.png`

### Verified Visual Alignment Highlights
1. **Header & Minimal Geometric Brand Mark:** Clean sticky `#FFFEFB` bar with the minimal geometric bee icon (distinct from the 3D mascot) + lowercase `beevo`, five calm navigation links (`Features`, `How It Works`, `Examples`, `Pricing`, `FAQ`), `Log in`, and golden pill `Get Started`.
2. **Hero & Signpost Overlays:** Split layout (`Turn your ideas` / `into cartoon videos` / `in minutes.`), dual pill CTAs (`Create Your First Video` + `Watch Demo`), factual two-item reassurance row (`No animation skills required`, `One-time credit purchases`), sunlit 3D Beevo mascot meadow seamlessly dissolving left into `#FFFEFB`, and real semantic HTML white text overlays (`Describe it`, `Generate it`, `Download it`) aligned cleanly on each wooden board with zero baked-in raster text.
3. **Overlapping Benefit Strip:** Floating white 4-cell bar overlapping the grassy bottom edge of the hero meadow, showcasing four factual pillars (`AI storyboards`, `Original illustrations`, `Natural voiceover`, `One-time credits`) with zero invented metrics.
4. **Feature Introduction:** Left intro with hand-drawn honey underline under `powered by AI.` paired with 4 crisp white feature cards (`AI Story & Scenes`, `AI Animation`, `AI Voiceover`, `Music & SFX`).
5. **Warm Cream How It Works Band:** Full-width `#FFF9E9` surface with left heading (`Create in 3 easy steps`), looping dotted flight path + flying 3D bee, and 3 numbered white cards with isolated 3D props (`Describe It`, `Generate It`, `Download It`) joined by dashed arrows.
6. **Example Videos & Pricing:** 4 equal 16:9 illustrative demo cards with HTML play overlays, titles, durations, and interactive preview modal; followed by the split `Choose your credit pack` layout with the confirmed one-time INR credit packs (`Starter ₹299`, `Creator ₹599 Most Popular`, `Studio ₹899`) and transparent billing rule bar below.
7. **Sections 7–16:** Intelligent Storyboard (`Beevo decides how many illustrations your story needs.`), 7-stage Product Pipeline, Why Cartoon Storytelling, 8-Style Comparison Showcase (all 8 visually distinct styles on the same meadow subject), Use Cases, Interactive Controls Schematic, Objective Workflow Comparison, 13-question Accessible FAQ Accordion, Warm Cream Final CTA Panel, and clean Warm-White Footer.

---

## 3. Defects Found in Pass 1 & Verified Fixes Applied

1. **Unlayered `.font-display` CSS Cascade Override (Critical):**
   - *Symptom:* In Pass 1, `home-desktop-1280-fold.png` and `home-mobile-390-fold.png` showed dark brown/black text on the hero wooden planks despite `text-[#FFFDF7]` being present in `HeroSection.tsx`.
   - *Root Cause:* `src/app/globals.css` declared unlayered `.font-display { color: var(--beevo-ink); }` outside `@layer base`, outranking Tailwind utility colors.
   - *Fix:* Moved base `h1, h2, h3, h4` rules into `@layer base` and removed `.font-display` color override. Verified in Pass 2 computed styles (`rgb(255, 253, 247)`) and fresh desktop/tablet/mobile screenshots.
2. **Mobile Touch Targets Below 44×44 px (`390px`):**
   - *Symptom:* 16 targets fell under 44 px (mobile header `Get Started` at `40px`, range `<input>` sliders at `8px`, footer links at `32px`, footer logo link at `25px`).
   - *Fix:* Updated `Header.tsx` (`min-h-[44px]`), `Footer.tsx` (`min-h-[44px] min-w-[44px]` with balanced `space-y-0.5`), and introduced `.beevo-range` (`height: 44px` hit box with crisp 8px visual track) in `globals.css`, `CreativeControlsPreview.tsx`, and `CreditCalculator.tsx`. Pass 2 audit confirmed **0 undersized visible touch targets**.
3. **Tablet `768px` Hero Button Wrapping:**
   - *Symptom:* At `768px`, `"Create Your First Video >"` wrapped onto two lines inside a narrow pill.
   - *Fix:* Added `whitespace-nowrap` and `sm:flex-wrap` in `HeroSection.tsx` and rebalanced tablet column widths (`md:w-[50%]` copy / `md:w-[60%]` art). Verified clean single-line buttons in `home-tablet-768-fold.png`.
4. **Hero-to-Benefit-Strip Vertical Overlap:**
   - *Fix:* Adjusted desktop Hero bottom padding (`md:pb-12 lg:pb-14`) and Section 2 overlap (`md:-mt-14 lg:-mt-[62px]`) so the floating white strip kisses the bottom meadow edge cleanly like the reference.

---

## 4. Full Route & Technical SEO Audit Matrix (14 Routes)

| Route | HTTP | H1 Count | Canonical | Robots | OG Tags | JSON-LD | Broken Imgs | Overflow |
| --- | :---: | :---: | --- | --- | :---: | :---: | :---: | :---: |
| `/` | 200 | 1 | `https://beevo.app` | `index, follow` | Yes | 4 | 0 | No |
| `/features` | 200 | 1 | `https://beevo.app/features` | `index, follow` | Yes | 3 | 0 | No |
| `/how-it-works` | 200 | 1 | `https://beevo.app/how-it-works` | `index, follow` | Yes | 3 | 0 | No |
| `/pricing` | 200 | 1 | `https://beevo.app/pricing` | `index, follow` | Yes | 5 | 0 | No |
| `/use-cases/education` | 200 | 1 | `https://beevo.app/use-cases/education` | `index, follow` | Yes | 3 | 0 | No |
| `/use-cases/content-creators` | 200 | 1 | `https://beevo.app/use-cases/content-creators` | `index, follow` | Yes | 3 | 0 | No |
| `/use-cases/business-explainers` | 200 | 1 | `https://beevo.app/use-cases/business-explainers` | `index, follow` | Yes | 3 | 0 | No |
| `/faq` | 200 | 1 | `https://beevo.app/faq` | `index, follow` | Yes | 4 | 0 | No |
| `/contact` | 200 | 1 | `https://beevo.app/contact` | `index, follow` | Yes | 3 | 0 | No |
| `/privacy` | 200 | 1 | `https://beevo.app/privacy` | `index, follow` | Yes | 3 | 0 | No |
| `/terms` | 200 | 1 | `https://beevo.app/terms` | `index, follow` | Yes | 3 | 0 | No |
| `/refund-policy` | 200 | 1 | `https://beevo.app/refund-policy` | `index, follow` | Yes | 3 | 0 | No |
| `/login` | 200 | 1 | `https://beevo.app/login` | `noindex, nofollow, nocache` | Yes | 2 | 0 | No |
| `/get-started` | 200 | 1 | `https://beevo.app/get-started` | `noindex, nofollow, nocache` | Yes | 2 | 0 | No |

### Technical Endpoints & Redirects
- `/robots.txt` → HTTP `200`, declares `Sitemap: https://beevo.app/sitemap.xml` and disallows `/api/`, `/admin/`, `/dashboard/`, `/projects/`, `/settings/`, `/login`, `/get-started`.
- `/sitemap.xml` → HTTP `200`, includes all 12 indexable public routes and excludes `/login` and `/get-started`.
- `/does-not-exist-404` → HTTP `404`, renders branded warm-white Beevo 404 page with recovery links.
- `/use-cases` → permanent redirect to `/use-cases/education`.
- `/examples` → permanent redirect to `/#examples`.

---

## 5. Responsive Matrix (14 Tested Viewports)

All 14 viewports verified with self-hosted `Sora` (headings) and `Manrope` (body) variable fonts loaded, `0` horizontal overflow, and `0` broken visible images:
- **Mobile:** `320×640`, `360×800`, `375×812`, `390×844`, `430×932` (`header: 65px`, `h1: 33.6px`, `body: 16px`, dedicated portrait mobile hero art active)
- **Tablet:** `600×900`, `768×1024`, `820×1180`, `1024×768` (`header: 71px` from `768px`, split hero active, zero button wrap)
- **Reference Calibration:** `941×1672` (`header: 71px`, `h1: 38.1px`)
- **Desktop:** `1280×900`, `1440×900`, `1600×900`, `1920×1080` (`header: 71px`, `h1: 51.8px–55.2px`, full 5-link center nav + 4-column feature cards + 3-column pricing grid)

---

## 6. Interactive UI Verification

All 6 user interactions verified end-to-end in Chromium:
1. **Watch Demo Modal:** Opens from Hero CTA (`Watch Demo`), traps focus cleanly, closes on `Escape`.
2. **FAQ Accordion:** First item defaults open (`aria-expanded="true"`), toggles closed (`"false"`) on click.
3. **Visual Style Showcase:** Clicking `Comic Book` updates `aria-pressed="true"` and switches the active spotlight frame.
4. **Mobile Navigation Drawer (`390px`):** Opens from header menu button (`#mobile-nav-drawer` visible) and closes on `Escape`.
5. **Pricing Credit Calculator (`/pricing`):** Computes live credit & pack match (`4 projects × 1m 30s = 600 credits → Creator ₹599`).
6. **Contact Form (`/contact`):** Validates inputs and renders accessible confirmation banner (`role="status"`).
