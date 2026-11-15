# Beevo Phase 2 — Visual, Responsive & Functional QA Report

**Date:** 2026-11-15  
**Branch:** `arena/8255eb25-beevo`  
**Audit Harness:** `scripts/phase2-visual-qa.mjs` (Playwright + headless `@sparticuz/chromium`)  
**Target Server:** Production Next.js 15.5.29 build (`next start -H 0.0.0.0 -p 3000`)

---

## 1. Executive Summary

- **Automated Matrix Coverage:** **14 routes × 13 mandatory widths = 182 full viewport audits**
- **Final Matrix Pass Rate:** **182 / 182 (100.0%)** — `0` HTTP errors, `0` horizontal overflows (`scrollWidth <= innerWidth + 1px`), `0` console errors, `0` uncaught page errors, `0` broken images
- **Interactive Functional Suite:** **9 / 9 (100.0%) passed**
- **Static Verification:** `npm run typecheck` (`0` errors), `npm run lint` (`0` warnings/errors), `npm run build` (`31` routes built cleanly)
- **Visual Pixel Inspection:** 28 rendered PNG screenshots captured across mobile (`320px`, `375px`), tablet (`768px`, `1024px`), and desktop (`1440px`, `1920px`) and inspected directly; **3 real visual defects** discovered during screenshot review were fixed, rebuilt, and visually re-verified.

---

## 2. Mandatory Viewport Widths Verified (All 13 Widths)

| Category | Widths Tested (px) | Overflow Status | Notes |
| --- | --- | --- | --- |
| **Mobile** | `320`, `360`, `375`, `390`, `430` | `0px` overflow across all 14 routes | Compact top bar (`BeevoLogo` icon at `<360px`, horizontal wordmark `>=360px`), 4-item fixed bottom nav (`Home`, highlighted `Create`, `Videos`, `Credits`), slide-over drawer for secondary nav |
| **Tablet** | `600`, `768`, `820`, `1024` | `0px` overflow across all 14 routes | Full breadcrumb + title in top bar, collapsible slide-over navigation drawer, collapsible storyboard inspector drawer |
| **Desktop** | `1280`, `1440`, `1600`, `1920` | `0px` overflow across all 14 routes | Permanent `252px` left sidebar with emphasized honey-yellow `Create Video`, 3-pane storyboard workspace, sticky `Production Summary` rail on `/app/create` |

---

## 3. Routes Audited

| Route | Layout Group | Matrix (13 widths) | Key Verification |
| --- | --- | --- | --- |
| `/` | `(marketing)` | 13 / 13 PASS | Phase 1 public homepage zero-regression check after route group refactor |
| `/login` | `(auth)` | 13 / 13 PASS | Clean auth frame, password toggle, honest Phase 4 notice (no simulated auth) |
| `/signup` | `(auth)` | 13 / 13 PASS | Password rules indicator, terms checkbox, confirm toggle, honest Phase 4 notice |
| `/forgot-password` | `(auth)` | 13 / 13 PASS | Email validation + honest reset delivery status |
| `/app` | `app` (`AppShell`) | 13 / 13 PASS | Greeting, wallet card (`—` until connected), Beevo empty projects state, dark credit packs showcase |
| `/app/create` | `app` (`AppShell`) | 13 / 13 PASS | Prompt editor, 15s credit calculator, proportional aspect ratios, all 8 original Phase 1 style WebPs, local ref upload preview, live caption viewport, collapsible advanced panel |
| `/app/projects/draft/storyboard` | `app` (`AppShell`) | 13 / 13 PASS | 3-pane desktop / tablet drawer / mobile bottom-sheet editor, local blank scene add/edit/reorder/delete, honest `Planned Frame` labeling |
| `/app/generations/status` | `app` (`AppShell`) | 13 / 13 PASS | Exact 10 pipeline stages, dynamic image count (`Pending storyboard plan`), narration/timeline/FFmpeg/R2 widgets, zero fake progress |
| `/app/videos` | `app` (`AppShell`) | 13 / 13 PASS | Search, status/date/sort filters, grid/list toggle, empty state without mock videos |
| `/app/videos/sample` | `app` (`AppShell`) | 13 / 13 PASS | Clean real MP4 player scaffold without fake timeline editor; honest empty fallback |
| `/app/credits` | `app` (`AppShell`) | 13 / 13 PASS | Confirmed INR packs (`Starter ₹299/300cr`, highlighted dark `Creator ₹599/800cr`, `Studio ₹899/1500cr`), honest Phase 4 checkout notice |
| `/app/transactions` | `app` (`AppShell`) | 13 / 13 PASS | All 6 confirmed ledger categories (`Purchases`, `Deductions`, `Reservations`, `Refunds`, `Releases`, `Admin adjustments`) + responsive empty state |
| `/app/notifications` | `app` (`AppShell`) | 13 / 13 PASS | Category filters, `Mark All Read`, empty inbox without fake alerts |
| `/app/settings` | `app` (`AppShell`) | 13 / 13 PASS | Profile, password visibility toggles, 4 email preference switches, logout, `DELETE`-guarded account deletion |

---

## 4. Interactive Functional Checks (9 / 9 Passed)

| Check ID | Verified Behavior | Result |
| --- | --- | --- |
| `create-duration-5m-credits-500` | Clicking `5m` preset updates live estimated credits to `500 credits` | PASS |
| `create-duration-10m-credits-1000` | Clicking `10m` preset updates live estimated credits to `1,000 credits` (hard max cap) | PASS |
| `create-caption-live-preview-9-16` | Selecting `9:16 Vertical` updates the live Caption Preview frame to `Viewport 9:16` | PASS |
| `create-advanced-controls-expand` | Clicking `Advanced Studio Controls` reveals `#advanced-studio-controls` | PASS |
| `storyboard-add-blank-scene` | Clicking `Add Blank Scene` adds Scene 1 labeled honestly as `Planned Frame` | PASS |
| `login-no-simulated-auth-success` | Submitting valid login credentials shows honest Phase 4 notice instead of faking a session | PASS |
| `credits-no-fake-purchase` | Clicking `Select Creator (₹599)` shows honest Phase 4 checkout notice without adding fake credits | PASS |
| `settings-guarded-deletion` | `Permanently Delete Account` starts disabled and unlocks only after typing `DELETE` | PASS |
| `mobile-drawer-open-and-escape-close` | At `375px`, opening drawer shows `role="dialog"` `#studio-drawer` and pressing `Escape` closes it | PASS |

---

## 5. Visual Defects Discovered & Fixed During Inspection

1. **Missing `beevo.dark` Tailwind Color Token (`bg-beevo-dark`):**
   - **Found in screenshots:** `app__desktop-1440.png`, `app_credits__desktop-1440.png`, `app_create__desktop-1440__captions.png`, `app_transactions__desktop-1440.png` — dark charcoal surfaces and active filter pills rendered transparent with light cream text.
   - **Fix:** Mapped `dark: "var(--beevo-ink)"` (`#1B1916`) and `"beevo-yellow-sm"` shadow in `tailwind.config.ts`.
   - **Re-verified:** All dark charcoal feature cards (`Creator` pack, Dashboard quick packs card), dark CTAs (`View Credit Packs`), and active pills now render with high-contrast Beevo charcoal `#1B1916` and `#FFFDF7` text.
2. **Mobile Top Bar Title Truncation (`375px`):**
   - **Found in screenshots:** `app__mobile-375.png` and `app_create__mobile-375.png` displayed `"Dash..."` / `"Creat..."` next to the icon because the page `<h1>` already sits directly below.
   - **Fix:** Updated `AppShell` header to display the clean `BeevoLogo` on `< 640px` and the full breadcrumb + route title from `sm:` (`>= 640px`) upward, plus a compact `— cr` wallet badge on `< 640px`.
3. **Ultra-Narrow `320px` Logo Spacing:**
   - **Found in screenshots:** `app__mobile-320.png` showed the horizontal `beevo` wordmark slightly touching the `— cr` pill at `320px`.
   - **Fix:** Switched `< 360px` to geometric `BeevoLogo variant="icon"` (`26px`) and `>= 360px` to `BeevoLogo variant="horizontal"` (`22px`). Re-verified in `app__mobile-320.png` — generous whitespace across all top bar controls with zero overlap.
