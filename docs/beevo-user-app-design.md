# Beevo User Application Design Specification

## 1. Visual Continuity With Phase 1
The authenticated Beevo Studio (`/app/**`) and authentication screens (`/login`, `/signup`, `/forgot-password`) extend Phase 1's warm editorial design system directly—zero second design language:
- **Logo:** Exact `BeevoLogo` SVG component (`src/components/brand/BeevoLogo.tsx`).
- **Fonts:** `Sora` (headings, section titles, credit numbers) and `Manrope` (UI controls, descriptions, forms, tabular numerals).
- **Palette:**
  - App background canvas: `#FAF8F2` / `#FFFEFB` (subtle warmth distinguishing workspace chrome from crisp `#FFFFFF` editor panels)
  - Warm cream accent panels: `#FFF9E9` / `#FFF4D8`
  - Dark charcoal feature surfaces: `#171717` / `#1D1C19` (dashboard greeting hero, caption preview monitor, MP4 video stage, generation header badge)
  - Primary creative actions: Beevo Honey Gold gradient (`#FFD347 → #FFC31F`, ink `#171717`)
  - Hairline borders: `#ECE7DB` (neutral), `#F3DF9E` (warm/active honey)

## 2. Application Shell Architecture (`src/components/app/AppShell.tsx`)

### Desktop (`>= 1024px`)
- **Left Sidebar (`252px` fixed width):**
  - Brand lockup (`BeevoLogo` horizontal)
  - Featured primary CTA button: **`Create Video`** (`/app/create`) styled with Beevo primary honey gradient & shadow
  - Primary navigation items with active cream pill + honey indicator:
    1. Dashboard (`/app`)
    2. Create Video (`/app/create`)
    3. My Videos (`/app/videos`)
    4. Credits (`/app/credits`)
    5. Transactions (`/app/transactions`)
    6. Notifications (`/app/notifications`)
    7. Settings (`/app/settings`)
  - Compact footer wallet widget (shows honest unconnected state `— credits` + `Buy Credits` link) + subtle `Public Website` link (`/`)
- **Top Bar (`64px` sticky):**
  - Left: Dynamic Breadcrumbs + Page Title
  - Right: Credit Balance link pill (`— credits`), Notifications icon link (`/app/notifications`), Account trigger (`/app/settings` & `/login`)

### Tablet (`768px – 1023px`)
- Sidebar collapses cleanly into an accessible slide-over navigation drawer triggered by a `44×44 px` menu button in the top bar.
- Top bar displays brand mark, current section title, compact Credits pill, and drawer trigger without crowding.

### Mobile (`320px – 767px`)
- **Compact Top Bar (`58px`):** Geometric Beevo icon mark, concise current page title, and `More / Menu` drawer button (`44×44 px`) providing access to Transactions, Notifications, Settings, and Sign In.
- **Persistent Bottom Navigation (`64px`):**
  1. `Home` (`/app`)
  2. **`Create`** (`/app/create`) — visually elevated golden pill button in the primary thumb zone
  3. `Videos` (`/app/videos`)
  4. `Credits` (`/app/credits`)
- All main content reserves bottom clearance (`pb-24 lg:pb-12`) so fixed bottom chrome never obscures buttons or forms.

## 3. Screen Inventory & Route Map

| Route | Layout Group | Indexing | Primary Purpose |
| --- | --- | --- | --- |
| `/login` | `(auth)` | `noindex` | Email/password sign-in form with password toggle & forgot-password link |
| `/signup` | `(auth)` | `noindex` | Registration form with name, email, password confirmation, terms consent |
| `/forgot-password` | `(auth)` | `noindex` | Password reset request form with clear validation & status feedback |
| `/app` | `app` | `noindex` | Creative home: dark-charcoal greeting hero, wallet summary, empty projects/generations/activity states |
| `/app/create` | `app` | `noindex` | Full video creation studio: prompt editor, duration & credit calculator, aspect ratio, resolution, 8 visual styles, characters, narration, pacing, camera, transitions, live caption preview, music, SFX, collapsible advanced controls |
| `/app/projects/[id]/storyboard` | `app` | `noindex` | 3-pane Storyboard Review Workspace: Script panel, Visual Style Bible, Dynamic Scene Board, Scene Inspector |
| `/app/generations/[id]` | `app` | `noindex` | Live Generation Workspace: 10-stage pipeline, progressive `X / N` image grid, narration/timeline/render widgets, credit reservation ledger |
| `/app/videos` | `app` | `noindex` | Media library with search, grid/list toggle, sort, date/status filters, pagination, empty library state |
| `/app/videos/[id]` | `app` | `noindex` | Cinematic MP4 player stage, metadata specs, original prompt, download/rename/delete actions |
| `/app/credits` | `app` | `noindex` | Real wallet summary + Starter (`₹299`), Creator (`₹599`), Studio (`₹899`) packs & billing rules |
| `/app/transactions` | `app` | `noindex` | Filterable credit ledger (purchases, deductions, reservations, refunds, releases, admin adjustments) |
| `/app/notifications` | `app` | `noindex` | Filterable notifications feed + empty state + preferences shortcut |
| `/app/settings` | `app` | `noindex` | Profile, email notification toggles, password/security, logout, and guarded account deletion |

## 4. Strict No-Demo Design Policy
- Every user-specific data field defaults to an explicit unconfigured/empty state (`null` / `[]` / `—`) until Phase 4 connects Supabase + backend workers.
- Zero hardcoded user names, zero fake credit balances, zero fake videos/thumbnails, zero fake transactions, zero fake voice names or audio previews, zero fictional music track names, and zero fake progress bars.
- Interactive studio tools (duration credit math, style selector, aspect ratio cards, local character image upload preview, live caption style preview, draft storyboard scene editor, modals, filters) remain 100% functional client-side so creators and engineers can validate every interaction cleanly.
